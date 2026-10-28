$path = "c:\Workspace\com.bhsoft.nselfhelp\src\main\java\com\bhsoft\nselfhelp\web\ApiRestController.java"
Get-Content $path | Select-String "checkAuthNumber.do" -Context 3, 15 | ForEach-Object {
    Write-Output $_
}
