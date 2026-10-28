[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
$req = [System.Net.HttpWebRequest]::Create("https://nselfhelptest.edu-ok.co.kr/wkwhrma/login/loginExcute.do")
$req.Method = "POST"
$req.ContentType = "application/x-www-form-urlencoded; charset=UTF-8"
$req.Accept = "application/json, text/plain, */*; charset=UTF-8"
$req.Headers.Add("Accept-Charset", "utf-8")

$body = [System.Text.Encoding]::UTF8.GetBytes("p_empid=cpeach&p_pwd=bhsoft6220!")
$req.ContentLength = $body.Length
$stream = $req.GetRequestStream()
$stream.Write($body, 0, $body.Length)
$stream.Close()

$resp = $req.GetResponse()
$respStream = $resp.GetResponseStream()
$ms = New-Object System.IO.MemoryStream
$respStream.CopyTo($ms)
$bytes = $ms.ToArray()

Write-Output "Response Content-Type:"
Write-Output $resp.ContentType
Write-Output "Raw Bytes as UTF-8:"
Write-Output ([System.Text.Encoding]::UTF8.GetString($bytes))
