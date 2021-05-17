# What did Ventoy do ?

## Introduction
[Ventoy](https://www.ventoy.net/) is an open source tool to create bootable USB drive for ISO/WIM/IMG/VHD(x)/EFI files

[Edgeless Hub](https://github.com/EdgelessPE/edgeless-hub) uses Ventoy to create bootable USB drive,while the Windows version of Ventoy2Disk hasn't prove command line interface to allow an other application interact with Ventoy installer

This module can help get the status of Ventoy installing or updating process via analyzing the `log.txt` created by `Ventoy2Disk.exe`,this can help your applications know the status of Ventoy2Disk then do some further jobs,without changing the source code of Ventoy2Disk

## Usage
```typescript
import {getVentoyStatus,getDriveList,VentoyStatus,DriveList} from 'what-did-ventoy-do'
import fs from 'fs'

let log:string=fs.readFileSync("./log.txt").toString()

try{
    let status:VentoyStatus=getVentoyStatus(log)
    let list:DriveList=getDriveList(log)
}catch(err){
    console.log(err)
}
```

## Used by
[Edgeless/Edgeless Hub](https://github.com/EdgelessPE/edgeless-hub)