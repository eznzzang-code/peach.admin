[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
$wc = New-Object System.Net.WebClient
$nvc = New-Object System.Collections.Specialized.NameValueCollection
$nvc.Add("empid", "peachadmin")
$b = $wc.UploadValues("https://nselfhelptest.edu-ok.co.kr/wkwhrma/login/checkIdExcute.do", "POST", $nvc)
Write-Output "checkIdExcute result:"
Write-Output ([System.Text.Encoding]::UTF8.GetString($b))
