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
Add-FormField "id" "1"
Add-FormField "category" "공지"
Add-FormField "title" "과원관리 요령 - 긴급"
Add-FormField "body" "<p>가을철 과원관리 요령 긴급 공지사항입니다.</p>"
Add-FormField "visibility" "public"
Add-FormField "isDraft" "false"
Add-FormField "pinned" "true"
Add-FormField "channels" "Web,App"
Add-FormField "publishStart" "2026-01-01"
Add-FormField "noEnd" "true"
Add-FormField "urgentUse" "true"
Add-FormField "urgentStart" "2026-01-01"
Add-FormField "urgentEnd" "2027-12-31"
Add-FormField "author" "김복숭"
Add-FormField "attach_count" "1"

# Fake file
$writer.Write("--$boundary$LF")
$writer.Write("Content-Disposition: form-data; name=`"attach_file_0`"; filename=`"test.txt`"$LF")
$writer.Write("Content-Type: text/plain$LF$LF")
$writer.Write("hello world$LF")
$writer.Write("--$boundary--$LF")
$writer.Flush()

$bytes = $bodyBytes.ToArray()

$req = [System.Net.HttpWebRequest]::Create("http://peachlocal.admin.edu-ok.co.kr/proc/board_proc.asp")
$req.Method = "POST"
$req.ContentType = "multipart/form-data; boundary=$boundary"
$req.ContentLength = $bytes.Length

$reqStream = $req.GetRequestStream()
$reqStream.Write($bytes, 0, $bytes.Length)
$reqStream.Close()

try {
    $res = $req.GetResponse()
    $resStream = $res.GetResponseStream()
    $sr = New-Object System.IO.StreamReader($resStream, [System.Text.Encoding]::UTF8)
    $respText = $sr.ReadToEnd()
    Write-Host "Response: $respText"
    $res.Close()
} catch {
    $errStream = $_.Exception.Response.GetResponseStream()
    $errSr = New-Object System.IO.StreamReader($errStream, [System.Text.Encoding]::UTF8)
    Write-Host "Error Body: $($errSr.ReadToEnd())"
}
