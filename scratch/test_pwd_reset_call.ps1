[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
$wc = New-Object System.Net.WebClient
$nvc = New-Object System.Collections.Specialized.NameValueCollection
$nvc.Add("pBranchid", "2020")
$nvc.Add("pEmpid", "test0001")
$nvc.Add("pEmppwd", "1111")
$nvc.Add("pMobile", "01074991011")
$nvc.Add("pIp", "127.0.0.1")
$nvc.Add("pUptid", "bhsoft")

try {
    $b = $wc.UploadValues("https://xn--jj0b479bhta.kr/wkwhrma/login/pwdReset.do", "POST", $nvc)
    Write-Output "pwdReset result:"
    Write-Output ([System.Text.Encoding]::UTF8.GetString($b))
} catch {
    Write-Output "Error: $($_.Exception.Message)"
}
