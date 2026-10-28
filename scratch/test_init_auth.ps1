[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
$wc = New-Object System.Net.WebClient
$wc.Headers.Add("Accept", "application/json, text/plain, */*; charset=UTF-8")
$nvc = New-Object System.Collections.Specialized.NameValueCollection
$nvc.Add("user_name", "김종식")
$nvc.Add("user_hp", "01074991011")
$nvc.Add("ref", "findid")

try {
    $bytes = $wc.UploadValues("https://nselfhelptest.edu-ok.co.kr/wkwhrma/api/initAuthNumber.do", "POST", $nvc)
    Write-Output "Response from initAuthNumber:"
    Write-Output ([System.Text.Encoding]::UTF8.GetString($bytes))
} catch {
    Write-Output "Error: $($_.Exception.Message)"
}
