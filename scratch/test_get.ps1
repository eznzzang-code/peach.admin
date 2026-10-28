[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$client = New-Object System.Net.WebClient
$client.Encoding = [System.Text.Encoding]::UTF8
$str = $client.DownloadString("http://peachlocal.admin.edu-ok.co.kr/proc/board_proc.asp?action=get&id=1")
Write-Host "action=get id=1 response:"
Write-Host $str
