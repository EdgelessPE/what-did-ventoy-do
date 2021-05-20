import {_DriveInfo,_SystemInfo,_Ventoy2DiskInfo,_VentoyInfo,_VentoyInstallationStatus,_WindowsInfo} from './src/class'

interface matchNode{
    exp:RegExp
    handler?: (array:RegExpMatchArray) => string
}

let log:string=""
const regexTable:any={
    Ventoy2Disk_Version:{
        exp:/Ventoy2Disk \d(.+)/,
        handler:(r:RegExpMatchArray):string=>{
            return r[0].match(/\d+(.\d+)*/)[0]
        }
    }
}

//utils
function match(key:string):RegExpMatchArray|string{
    if(!regexTable.hasOwnProperty(key)){
        throw "QUERY_REGEX_TABLE_ERROR"
    }
    let mn:matchNode=regexTable[key]
    let r:RegExpMatchArray=log.match(mn.exp)
    if(mn.handler){
        return mn.handler(r)
    }else{
        return r
    }
}

function main(input_log:string){
    //配置全局log
    log=input_log
    //检查是否为Ventoy2Disk日志
    let v2dVer=match("Ventoy2Disk_Version")
    if(!v2dVer){
        throw "INPUT_INVALID_LOG"
    }
}

main("[2021/05/18 01:42:52.936] \n################################ Ventoy2Disk 1.0.0.2 ################################\n[2021/05/18 01:42:52.936] Control Flag: 0 1 1\n[2021/05/18 01:42:52.937] Windows Version : Windows 10 64-bit (Build 19042)\n[2021/05/18 01:42:52.937] ")