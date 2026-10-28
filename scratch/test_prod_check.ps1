[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
$wc = New-Object System.Net.WebClient
$wc.Headers.Add("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
$wc.Headers.Add("Accept", "application/json, text/plain, */*; charset=UTF-8")

try {
    $res = $wc.UploadString("https://xn--jj0b479bhta.kr/wkwhrma/login/checkIdExcute.do", "POST", "empid=peachadmin")
    Write-Output "PRODUCTION RESPONSE:"
    Write-Output $res
} catch {
    Write-Output "PROD ERROR: $($_.Exception.Message)"
}
