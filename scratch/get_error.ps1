try {
    $r = Invoke-WebRequest -Uri "http://peachlocal.admin.edu-ok.co.kr/proc/board_proc.asp?action=get&id=1" -UseBasicParsing
    Write-Host $r.Content
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $errHtml = $reader.ReadToEnd()
    Write-Host "500 Error Body:"
    Write-Host $errHtml
}
