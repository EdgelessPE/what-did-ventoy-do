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

//utils
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

function parseWinInfo(line:string):_WindowsInfo{
    return {
        version:line.split(":")[1].match(/Windows\s*[\S]*/)[0],
        bits:line.match(/\d+-bit/)[0].split("-")[0],
        build:line.match(/Build \d*/)[0].split(" ")[1]
    }
}
function parseDrivesInfo(lines:Array<string>):Array<NaiveDriveInfo>{
    let hash={}
    let soloParser=function(line:string):NaiveDriveInfo{
        let letter_match=line.match(/LogicalDrive:\\\\.\\[A-Z]/)
        return{
            letter:letter_match.slice(letter_match.length-1)[0],
            index:1,
            capacity:0
        }
    }
    return[soloParser(lines[0])]
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
