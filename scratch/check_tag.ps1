$html = (Invoke-WebRequest -Uri "http://peachlocal.admin.edu-ok.co.kr/contents-list.asp#notice" -UseBasicParsing).Content
$lines = $html -split "`n"
foreach ($line in $lines) {
    if ($line -like "*contents.js*") {
        Write-Host "Found line: $line"
    }
}
