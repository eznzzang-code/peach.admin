[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$client = New-Object System.Net.WebClient
$client.Encoding = [System.Text.Encoding]::UTF8
$str = $client.DownloadString("http://peachlocal.admin.edu-ok.co.kr/proc/board_proc.asp?action=list&category=%EA%B3%B5%EC%A7%80&is_draft=N")
Write-Host $str
