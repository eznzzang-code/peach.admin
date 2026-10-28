Get-ChildItem -Path "c:\Workspace\com.bhsoft.nselfhelp" -Recurse -Include *findPwd* | ForEach-Object {
    Write-Output $_.FullName
}
