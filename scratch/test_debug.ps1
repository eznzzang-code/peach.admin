$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"

$bodyBytes = New-Object System.IO.MemoryStream
$writer = New-Object System.IO.StreamWriter($bodyBytes, [System.Text.Encoding]::UTF8)

function Add-FormField($name, $value) {
    $writer.Write("--$boundary$LF")
    $writer.Write("Content-Disposition: form-data; name=`"$name`"$LF$LF")
    $writer.Write("$value$LF")
}

Add-FormField "action" "save"
Add-FormField "title" "과원관리 요령 - 긴급"
Add-FormField "body" "테스트 본문 내용"

$writer.Write("--$boundary--$LF")
$writer.Flush()

$bytes = $bodyBytes.ToArray()

$req = [System.Net.HttpWebRequest]::Create("http://peachlocal.admin.edu-ok.co.kr/proc/debug_save.asp")
$req.Method = "POST"
$req.ContentType = "multipart/form-data; boundary=$boundary"
$req.ContentLength = $bytes.Length

$reqStream = $req.GetRequestStream()
$reqStream.Write($bytes, 0, $bytes.Length)
$reqStream.Close()

try {
    $res = $req.GetResponse()
    $sr = New-Object System.IO.StreamReader($res.GetResponseStream(), [System.Text.Encoding]::UTF8)
    Write-Host "Response:"
    Write-Host $sr.ReadToEnd()
    $res.Close()
} catch {
    Write-Host "Error: $_"
}
