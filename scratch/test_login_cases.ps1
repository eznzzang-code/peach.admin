[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
$wc = New-Object System.Net.WebClient

# 1. peachadmin / 1111
$nvc1 = New-Object System.Collections.Specialized.NameValueCollection
$nvc1.Add("p_empid", "peachadmin")
$nvc1.Add("p_pwd", "1111")
$b1 = $wc.UploadValues("https://nselfhelptest.edu-ok.co.kr/wkwhrma/login/loginExcute.do", "POST", $nvc1)
Write-Output "--- peachadmin / 1111 ---"
Write-Output ([System.Text.Encoding]::UTF8.GetString($b1))

# 2. nonexist / 1111
$nvc2 = New-Object System.Collections.Specialized.NameValueCollection
$nvc2.Add("p_empid", "nonexist")
$nvc2.Add("p_pwd", "1111")
$b2 = $wc.UploadValues("https://nselfhelptest.edu-ok.co.kr/wkwhrma/login/loginExcute.do", "POST", $nvc2)
Write-Output "--- nonexist / 1111 ---"
Write-Output ([System.Text.Encoding]::UTF8.GetString($b2))

# 3. cpeach / 1111
$nvc3 = New-Object System.Collections.Specialized.NameValueCollection
$nvc3.Add("p_empid", "cpeach")
$nvc3.Add("p_pwd", "1111")
$b3 = $wc.UploadValues("https://nselfhelptest.edu-ok.co.kr/wkwhrma/login/loginExcute.do", "POST", $nvc3)
Write-Output "--- cpeach / 1111 ---"
Write-Output ([System.Text.Encoding]::UTF8.GetString($b3))
