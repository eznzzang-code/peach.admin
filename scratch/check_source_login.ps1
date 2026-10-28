$path = "c:\Workspace\com.bhsoft.nselfhelp\src\main\java\com\bhsoft\nselfhelp\web\LoginController.java"
if (Test-Path $path) {
    Get-Content $path | Select-String 'findPwdResetExcute' -Context 5, 20 | ForEach-Object {
        Write-Output $_
    }
} else {
    Write-Output "Path does not exist"
}
