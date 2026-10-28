Get-ChildItem -Path "c:\Workspace\com.bhsoft.nselfhelp" -Recurse -Include *.java,*.jsp,*.xml | Select-String "findPwdResetExcute" | ForEach-Object {
    Write-Output "$($_.Path):$($_.LineNumber)"
    Write-Output $_.Line
}
