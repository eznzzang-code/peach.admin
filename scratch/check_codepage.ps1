$u = New-Object -ComObject TABSUpload4.Upload
Write-Host "Default CodePage: $($u.CodePage)"
$u.CodePage = 65001
Write-Host "Set CodePage to 65001: $($u.CodePage)"
