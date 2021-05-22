interface _DriveInfo{
    index:number
    capacity:number
    letter:string
    removable:boolean
    flag:string
    ventoyStatus:_VentoyInfo
}
interface _VentoyInfo{
    installed:boolean
    updated:boolean
    version:string
    secureBoot:boolean
}
interface _Ventoy2DiskInfo{
    version:string
}
interface _VentoyOperationStatus {
    success:boolean
    upgrade:boolean
    secureBoot:boolean
    targetDrive:number
}
interface _SystemInfo{
    windows:_WindowsInfo
    drives:Array<_DriveInfo>
}
interface _WindowsInfo{
    version:string
    bits:string
    build:string
}
interface VentoyStatus {
    systemInfo:_SystemInfo
    ventoy2DiskInfo:_Ventoy2DiskInfo
    ventoyOperationLog:Array<_VentoyOperationStatus>
}

interface matchNode{
    exp:RegExp
    handler?: (array:RegExpMatchArray) => string
}
interface NaiveDriveInfo{
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
    },
    Installed_string:{
        exp:/Logical drive letter after write ventoy: <[A-Z]*/g,
        handler:(r:RegExpMatchArray):string=>{
            if(r){
                //取最后一条结果
                return r[r.length-1].split("<")[1]
            }else{
                return ""
            }
        }
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
    let found:any={}
    if(exist_lines){
        //分析语句
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
function findLetterRemoved():Array<string> {
    let result:Array<string>=[]
    //匹配语句
    let lines=log.match(/[A-Z]:\\ is ventoy part2, delete mountpoint/)
    if(lines){
        //推入结果数组
        for(let i=0;i<lines.length;i++){
            result.push(lines[i][0])
        }
    }

    return result
}
function findLetterWithVentoyInstalled():string {
    let finalLetter:string=""
    //匹配所有Logical drive letter after write ventoy: <>，读取最后一条的<>内容
    let letters:string=match("Installed_string") as string
    //处理空串情况
    if(letters.length==0){
        //查询Ventoy2Disk为其挂载的位置
        let m=log.match(/SetVolumeMountPoint <[A-Z]/)
        if(m){
            let line=m[m.length-1]
            finalLetter=line[line.length-1]
        }else{
            return ""
        }
    }else{
        //检查被确认的盘符
        let matchLines=log.match(/[A-Z]:\\ is ventoy part1, already mounted/)
        let targetLetter=matchLines[matchLines.length-1][0]

        if(letters.includes(targetLetter)){
            finalLetter=targetLetter
        }else{
            return ""
        }
    }

    return finalLetter
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
            index:Number(line.match(/PhyDrive:-*\d+/)[0].split(":")[1]),
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

    //获取Ventoy安装状态
    let ventoyExisted:any=findVentoyExisted()
    let ventoyInstalled:any=findVentoyInstalledOrUpdated(true)
    let ventoyUpdated:any=findVentoyInstalledOrUpdated(false)

    //lines倒序，保证信息都是最新的
    lines=lines.reverse()

    //使用hash表忽略已被移除的盘符
    let removedLetters=findLetterRemoved()
    removedLetters.forEach((item)=>{
        hash[item]=true
    })

    //综合信息
    let result:Array<_DriveInfo>=[]
    let installedLetter=findLetterWithVentoyInstalled()
    for (let i=0;i<lines.length;i++) {
        //获取Naive描述
        let n:NaiveDriveInfo=soloParser(lines[i])
        let index=n.index
        //根据盘符去重
        if(hash.hasOwnProperty(n.letter)){
            continue
        }else{
            hash[n.letter]=true
        }
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
        //校验Ventoy写入的目标盘的VentoyStatus是否正确
        if(installedLetter==n.letter&&!ventoyInfo.installed){
            throw "VENTOY_TARGET_LETTER_CHANGED"
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
    //使用最后一次分割作为全局log
    let spt=input_log.split(/################################ Ventoy2Disk/)
    log="################################ Ventoy2Disk"+spt[spt.length-1]

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