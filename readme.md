# What did Ventoy do ?

## Introduction
[Ventoy](https://www.ventoy.net/) is an open source tool to create bootable USB drive for ISO/WIM/IMG/VHD(x)/EFI files

[Edgeless Hub](https://github.com/EdgelessPE/edgeless-hub) uses Ventoy to create bootable USB drive,while the Windows version of Ventoy2Disk hasn't prove command line interface to allow an other application interact with Ventoy installer

This module can help get the status of Ventoy installing or updating process via analyzing the `log.txt` created by `Ventoy2Disk.exe`,this can help your applications know the status of Ventoy2Disk then do some further jobs,without changing the source code of Ventoy2Disk

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

## Result demo
```json
{
  "systemInfo": {
    "drives": [
      {
        "index": 0,
        "letter": "D",
        "capacity": 119323532800,
        "removable": false,
        "flag": "LogicalDrive",
        "ventoyStatus": {
          "installed": false,
          "updated": false,
          "version": "0.0.0",
          "secureBoot": false
        }
      },
      {
        "index": 1,
        "letter": "C",
        "capacity": 1023499047424,
        "removable": false,
        "flag": "LogicalDrive",
        "ventoyStatus": {
          "installed": false,
          "updated": false,
          "version": "0.0.0",
          "secureBoot": false
        }
      },
      {
        "index": 2,
        "letter": "E",
        "capacity": 30717394944,
        "removable": true,
        "flag": "SanDisk Ultra Fit",
        "ventoyStatus": {
          "installed": true,
          "updated": false,
          "version": "1.0.36",
          "secureBoot": false
        }
      }
    ],
    "windows": { "version": "Windows 10", "bits": "64", "build": "19042" }
  },
  "ventoy2DiskInfo": { "version": "1.0.0.2" },
  "ventoyOperationLog": [
    {
      "success": false,
      "upgrade": true,
      "secureBoot": false,
      "targetDrive": 2
    },
    { "success": false, "upgrade": true, "secureBoot": false, "targetDrive": 2 }
  ]
}

```

## Used by
[EdgelessPE/edgeless-hub](https://github.com/EdgelessPE/edgeless-hub)