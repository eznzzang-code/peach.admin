[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
$wc = New-Object System.Net.WebClient
$nvc = New-Object System.Collections.Specialized.NameValueCollection
$nvc.Add("p_empid", "test0001")
$nvc.Add("p_pwd", "1111")
$nvc.Add("auto_login", "false")

try {
    $b = $wc.UploadValues("https://xn--jj0b479bhta.kr/wkwhrma/login/loginExcute.do", "POST", $nvc)
    Write-Output "loginExcute result:"
    Write-Output ([System.Text.Encoding]::UTF8.GetString($b))
} catch {
    Write-Output "Error: $($_.Exception.Message)"
}
