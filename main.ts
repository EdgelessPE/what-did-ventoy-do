import {_DriveInfo,_SystemInfo,_Ventoy2DiskInfo,_VentoyInfo,_VentoyInstallationStatus,_WindowsInfo} from './src/class'

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



//match utils
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
function matchVentoy(index:number):_VentoyInfo|void {

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
    let matchVentoyDetectedLineWithIndex=function (index:number):string|void {
        let regex_str="/PhyDrive "+index+" is Ventoy Disk[^\\n\\r]*/"
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

    //hash转换为数组，获得Array<NaiveDriveInfo>
    let result:Array<_DriveInfo>=[]
    for (let index in hash) {
        //获取Naive描述
        let n:NaiveDriveInfo=hash[index]
        //获取检测到Ventoy信息
        let ventoyDetected_match=matchVentoyDetectedLineWithIndex(Number(index))
        //
        //匹配可移动设备的描述行
        let line=matchRemovableLineWithIndex(Number(index))
        if(line){
            //设备是可移动设备，匹配详细描述
            let name_match:string=line.match(/Name:[^\n]+/)[0]
            let removable_match:string=line.match(/Removable:[^\n]+/)[0]
            result.push({
                index:Number(index),
                letter:n.letter,
                capacity:n.capacity,
                removable:removable_match[removable_match.length - 1] != "0",
                flag:name_match.split(":")[1],
                ventoyStatus:{
                    installed:false,
                    version:"0.0.0",
                    secureBoot:false
                }
            })
        }else{
            //设备为本地磁盘，填充缺省值
            result.push({
                index:Number(index),
                letter:n.letter,
                capacity:n.capacity,
                removable:false,
                flag:"LogicalDrive",
                ventoyStatus:{
                    installed:false,
                    version:"0.0.0",
                    secureBoot:false
                }
            })
        }
    }

    return result
}

function main(input_log:string){
    //配置全局log
    log=input_log
    //检查是否为Ventoy2Disk日志
    let v2dVer=match("Ventoy2Disk_Version")
    if(!v2dVer){
        throw "INPUT_INVALID_LOG"
    }
    //匹配Windows版本
    let winVer=match("Win_Version")
    
    
}


log=require('fs').readFileSync("./examples/log.txt").toString()
let lines=match("Drive_lines") as Array<string>
console.log(parseDrivesInfo(lines))
