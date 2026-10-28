Get-Content "c:\Workspace\com.bhsoft.nselfhelp\src\main\java\com\bhsoft\nselfhelp\web\LoginController.java" | Select-String "pwdReset" -Context 5, 25 | ForEach-Object {
    Write-Output $_
}
