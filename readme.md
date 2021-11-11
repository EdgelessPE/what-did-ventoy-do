# What did Ventoy do ?

## Introduction
[Ventoy](https://www.ventoy.net/) is an open source tool to create bootable USB flash device for ISO/WIM/IMG/VHD(x)/EFI files

[Edgeless Hub](https://github.com/EdgelessPE/edgeless-hub) uses Ventoy to create bootable USB drive,while the Windows version of Ventoy2Disk hasn't provide any interface to allow an other application interact with Ventoy2Disk

This module can help get the status of Ventoy installing or updating process via analyzing the `log.txt` created by `Ventoy2Disk.exe`,this can help your applications know the status of Ventoy2Disk then do some further jobs,without changing the source code of Ventoy2Disk so that you could keep update to the official release still.

## Up-to-date ONLY !!!
This parser only accept logs created by the latest Ventoy2Disk X86 program,we won't care about outdated logs.

## Usage
```typescript
import fs from 'fs'
import ventoyAnalyser from './what-did-ventoy-do'

let log:string=fs.readFileSync("./examples/log_install.txt").toString()

try{
    let ventoyStatus=ventoyAnalyser(log)
    console.log(JSON.stringify(ventoyStatus))
}catch(err){
    console.log(err)
}
```

## Result Demo
```json
{
  "systemInfo": {
    "drives": [
      {
        "index": 3,
        "letter": "F",
        "capacity": 32051822592,
        "removable": true,
        "flag": "Samsung Flash Drive",
        "ventoyStatus": {
          "installed": true,
          "updated": true,
          "secureBoot": false,
          "version": "1.0.59",
          "success": true
        },
        "busType": "USB"
      },
      {
        "index": 0,
        "letter": "E",
        "capacity": 2011474724352,
        "removable": false,
        "flag": " WDC WD30EFRX-68EUZNO  1",
        "ventoyStatus": {
          "installed": false,
          "updated": false,
          "version": "0.0.0",
          "secureBoot": false
        },
        "busType": "SATA"
      },
      {
        "index": 1,
        "letter": "D",
        "capacity": 120034086400,
        "removable": false,
        "flag": " GALAX TA1D0120A",
        "ventoyStatus": {
          "installed": false,
          "updated": false,
          "version": "0.0.0",
          "secureBoot": false
        },
        "busType": "SATA"
      },
      {
        "index": 2,
        "letter": "C",
        "capacity": 1023495907840,
        "removable": false,
        "flag": " KXG60ZNV1T02 TOSHIBA",
        "ventoyStatus": {
          "installed": false,
          "updated": false,
          "version": "0.0.0",
          "secureBoot": false
        },
        "busType": "Nvme"
      }
    ],
    "windows": { "version": "Windows 10", "bits": "64", "build": "19043" }
  },
  "ventoy2DiskInfo": { "version": "1.0.0.3", "ventoy_version": "1.0.59" },
  "ventoyOperationLog": [
    { "success": true, "upgrade": true, "secureBoot": false, "targetDrive": 3 }
  ]
}


```