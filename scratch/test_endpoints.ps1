$r = Invoke-WebRequest -Uri "http://peachlocal.admin.edu-ok.co.kr/proc/board_proc.asp?action=draft_count&category=%EA%B3%B5%EC%A7%80" -UseBasicParsing
Write-Host "draft_count response:"
Write-Host $r.Content

$r2 = Invoke-WebRequest -Uri "http://peachlocal.admin.edu-ok.co.kr/proc/board_proc.asp?action=list&category=%EA%B3%B5%EC%A7%80&is_draft=N" -UseBasicParsing
Write-Host "list response (is_draft=N):"
Write-Host $r2.Content

$r3 = Invoke-WebRequest -Uri "http://peachlocal.admin.edu-ok.co.kr/proc/board_proc.asp?action=list&category=%EA%B3%B5%EC%A7%80&is_draft=Y" -UseBasicParsing
Write-Host "list response (is_draft=Y):"
Write-Host $r3.Content
