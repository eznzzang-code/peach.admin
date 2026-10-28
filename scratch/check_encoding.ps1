[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
$wc = New-Object System.Net.WebClient
$nvc = New-Object System.Collections.Specialized.NameValueCollection
$nvc.Add("p_empid", "peachadmin")
$nvc.Add("p_pwd", "bhsoft6220!")
$bytes = $wc.UploadValues("https://nselfhelptest.edu-ok.co.kr/wkwhrma/login/loginExcute.do", "POST", $nvc)

$utf8Str = [System.Text.Encoding]::UTF8.GetString($bytes)
$euckrStr = [System.Text.Encoding]::GetEncoding("euc-kr").GetString($bytes)

Write-Output "--- UTF8 Output ---"
Write-Output $utf8Str
Write-Output "--- EUCKR Output ---"
Write-Output $euckrStr
