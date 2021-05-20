class _DriveInfo{
    index:number
    capacity:number
    letter:string
    removable:boolean
    flag:string
    ventoyStatus:_VentoyInfo
}
class _VentoyInfo{
    installed:boolean
    updated:boolean
    version:string
    secureBoot:boolean
}
class _Ventoy2DiskInfo{
    version:string
}
class _VentoyOperationStatus {
    success:boolean
    upgrade:boolean
    secureBoot:boolean
    targetDrive:number
}
class _SystemInfo{
    windows:_WindowsInfo
    drives:Array<_DriveInfo>
}
class _WindowsInfo{
    version:string
    bits:string
    build:string
}
class VentoyStatus {
    systemInfo:_SystemInfo
    ventoy2DiskInfo:_Ventoy2DiskInfo
    ventoyOperationLog:Array<_VentoyOperationStatus>
}

interface matchNode{
    exp:RegExp
    handler?: (array:RegExpMatchArray) => string
}
class NaiveDriveInfo{
    letter:string
    capacity:number
    index:number
}

let log:string=""
let operation_log:Array<_VentoyOperationStatus>=[]


//match util
const regexTable:any={
    Ventoy2Disk_Version:{
        exp:/Ventoy2Disk \d(.+)/,
        handler:(r:RegExpMatchArray):string=>{
            return r[0].match(/\d+.\d+(.\d+)*/)[0]
        }
    },
    Win_line:{
        exp:/Windows Version : [^\n]*/,
        handler:(r:RegExpMatchArray):string=>{
            return r[0]
        }
    },
    Drive_lines:{
        exp:/LogicalDrive:\\\\.\\[^\n]*/g
    }
}
function match(key:string):RegExpMatchArray|string{
    if(!regexTable.hasOwnProperty(key)){
        throw "QUERY_REGEX_TABLE_ERROR:"+key
    }
    let mn:matchNode=regexTable[key]
    let r:RegExpMatchArray=log.match(mn.exp)
    if(mn.handler){
        return mn.handler(r)
    }else{
        return r
    }
}

//finder
function findVentoyExisted():any {
    //查找存在语句
    let exist_lines=log.match(/PhyDrive \d+ is Ventoy Disk[^\n\r]*/g)
    //分析语句
    let found:any={}
    for(let i=0;i<exist_lines.length;i++){
        let line:string=exist_lines[i]
        let index:string=line.match(/PhyDrive \d+/)[0].split(" ")[1]
        found[index]={
            installed:true,
            updated:false,
            version:line.match(/ver:\d+.\d+(.\d+)*/)[0].split(":")[1],
            secureBoot:line.match(/SecureBoot:\d/)[0].split(":")[1]!="0"
        }
    }

    return found
}
function findVentoyInstalledOrUpdated(install:boolean):any{
    //计算token
    let token:string=install?"InstallVentoy2PhyDrive":"UpdateVentoy2PhyDrive"
    //查找安装语句
    let r_str="/"+token+"[^\\n\\r]*/g"
    let installTargetLines:RegExpMatchArray=log.match(eval(r_str))
    if(installTargetLines==null) return {}

    //安装语句分段
    let installBlocks:Array<string>=log.split(token).splice(1)

    if(installBlocks.length!==installTargetLines.length) throw "ParseVentoyInstalled_FAILED-"+installBlocks.length+":"+installTargetLines.length

    //收集安装目标信息
    let found:any={}
    for (let i=0;i<installTargetLines.length;i++) {
        //获取当前行
        let line:string=installTargetLines[i]
        //匹配index
        let index=line.match(/PhyDrive\d+/)[0].split("PhyDrive")[1]
        //获取当前安装信息对应的块
        let block:string=installBlocks[i]
        //匹配安全启动
        let secureBoot_match:any=block.match(/VentoyProcSecureBoot \d/)
        if(secureBoot_match) secureBoot_match=secureBoot_match[0]
        else secureBoot_match="0"
        let secureBoot:boolean=secureBoot_match[secureBoot_match.length-1]!="0"
        //匹配是否成功
        let success_match=block.match(/]\s*OK[\n\r]/)
        let success=false
        if(success_match) success=true

        //推入found
        found[index]={
            installed:install&&success,
            updated:!install&&success,
            secureBoot,
            version:"Unknown"
        }

        //记录到ventoy操作日志
        operation_log.push({
            success,
            upgrade:!install,
            secureBoot,
            targetDrive:Number(index)
        })
    }

    return found
}

//parser
function parseWinInfo(line:string):_WindowsInfo{
    return {
        version:line.split(":")[1].match(/Windows\s*[\S]*/)[0],
        bits:line.match(/\d+-bit/)[0].split("-")[0],
        build:line.match(/Build \d*/)[0].split(" ")[1]
    }
}
function parseDrivesInfo(lines:Array<string>):Array<_DriveInfo>{
    let hash={}

    //定义解析函数
    let soloParser=function(line:string):NaiveDriveInfo{
        let letter_match=line.match(/LogicalDrive:\\\\.\\[A-Z]/)[0]
        return{
            letter:letter_match[letter_match.length-1],
            index:Number(line.match(/PhyDrive:\d+/)[0].split(":")[1]),
            capacity:Number(line.match(/ExtentLength:\d+/)[0].split(":")[1])
        }
    }
    let matchRemovableLineWithIndex=function (index:number):string|void {
        let regex_str="/PhyDrv:"+index+" BusType:USB[^\\n\\r]*/"
        let regex:RegExp=eval(regex_str)
        let result:Array<string>=log.match(regex)
        if(result){
            return result[0]
        }else{
            return null
        }
    }

    //去重
    for(let i=0;i<lines.length;i++){
        let result=soloParser(lines[i])
        if(!hash.hasOwnProperty(result.index)){
            hash[result.index]=result
        }
    }
    //获取Ventoy安装状态
    let ventoyExisted:any=findVentoyExisted()
    let ventoyInstalled:any=findVentoyInstalledOrUpdated(true)
    let ventoyUpdated:any=findVentoyInstalledOrUpdated(false)

    //综合信息
    let result:Array<_DriveInfo>=[]
    for (let index in hash) {
        //获取Naive描述
        let n:NaiveDriveInfo=hash[index]
        //获取Ventoy信息
        let ventoyInfo:_VentoyInfo={
            installed:false,
            updated:false,
            version:"0.0.0",
            secureBoot:false
        }
        if(ventoyExisted.hasOwnProperty(index)){
            ventoyInfo=ventoyExisted[index]
        }
        if(ventoyInstalled.hasOwnProperty(index)){
            ventoyInfo=ventoyInstalled[index]
        }
        if(ventoyUpdated.hasOwnProperty(index)&&ventoyUpdated[index].success){
            ventoyInfo=ventoyUpdated[index]
        }
        //匹配可移动设备的描述行
        let rline=matchRemovableLineWithIndex(Number(index))

        //填充信息
        if(rline){
            //设备是可移动设备，匹配详细描述
            let name_match:string=rline.match(/Name:[^\n]+/)[0]
            let removable_match:string=rline.match(/Removable:[^\n]+/)[0]
            result.push({
                index:Number(index),
                letter:n.letter,
                capacity:n.capacity,
                removable:removable_match[removable_match.length - 1] != "0",
                flag:name_match.split(":")[1],
                ventoyStatus:ventoyInfo
            })
        }else{
            //设备为本地磁盘，填充缺省值
            result.push({
                index:Number(index),
                letter:n.letter,
                capacity:n.capacity,
                removable:false,
                flag:"LogicalDrive",
                ventoyStatus:ventoyInfo
            })
        }
    }

    return result
}

export default function (input_log:string):VentoyStatus{
    //配置全局log
    log=input_log

    //检查是否为Ventoy2Disk日志
    let v2dVer=match("Ventoy2Disk_Version") as string
    if(!v2dVer){
        throw "INPUT_INVALID_LOG"
    }

    //匹配Windows信息
    let w_line=match("Win_line") as string
    let winInfo=parseWinInfo(w_line)
    
    //匹配磁盘驱动器信息
    let d_lines=match("Drive_lines") as Array<string>
    let driveInfo=parseDrivesInfo(d_lines)

    //组装信息
    let systemInfo:_SystemInfo={
        drives:driveInfo,
        windows:winInfo
    }

    let ventoy2DiskInfo:_Ventoy2DiskInfo={
        version:v2dVer
    }

    return {
        systemInfo,
        ventoy2DiskInfo,
        ventoyOperationLog:operation_log
    }
}