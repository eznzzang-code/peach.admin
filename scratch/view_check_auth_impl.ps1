$path = "c:\Workspace\com.bhsoft.nselfhelp\src\main\java\com\bhsoft\nselfhelp\service\impl\LoginOkServiceImpl.java"
Get-Content $path | Select-String "public String checkAuthNumber\(" -Context 2, 30 | ForEach-Object {
    Write-Output $_
}
