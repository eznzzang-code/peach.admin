$body = @{ action = 'delete'; ids = '999999' }
$res = Invoke-RestMethod -Uri 'http://peachlocal.admin.edu-ok.co.kr/proc/board_proc.asp' -Method Post -Body $body
Write-Host "Delete response: $($res | ConvertTo-Json)"
