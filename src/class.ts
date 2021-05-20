class _DriveInfo{
    index:number
    capability:number
    letter:string
    removable:boolean
    flag:string
    ventoyStatus:_VentoyInfo
}

class _VentoyInfo{
    installed:boolean
    version:string
    secureBoot:boolean
}

class _Ventoy2DiskInfo{
    version:string
}

class _VentoyInstallationStatus{
    success:boolean
    upgrade:boolean
    secureBoot:boolean
    targetDrive:_DriveInfo
}

class _SystemInfo{
    windows:_WindowsInfo
    drives:Array<_DriveInfo>
}

class _WindowsInfo{
    version:string
    bits:number
    build:string
}

export{
    _DriveInfo,
    _Ventoy2DiskInfo,
    _VentoyInfo,
    _VentoyInstallationStatus,
    _SystemInfo,
    _WindowsInfo
}