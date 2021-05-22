import fs from 'fs'
import ventoyAnalyser from './what-did-ventoy-do'

let log:string=fs.readFileSync("./examples/log_nothing2.txt").toString()

try{
    let ventoyStatus=ventoyAnalyser(log)
    fs.writeFileSync('./out.json',JSON.stringify(ventoyStatus))
}catch(err){
    console.log(err)
}