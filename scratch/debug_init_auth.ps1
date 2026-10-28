[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
$wc = New-Object System.Net.WebClient
$wc.Headers.Add("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
$wc.Headers.Add("Accept", "application/json, text/plain, */*; charset=UTF-8")

$nameEnc = [System.Web.HttpUtility]::UrlEncode("김종식", [System.Text.Encoding]::UTF8)
$postData = "user_name=" + $nameEnc + "&user_hp=01074991011&ref=findid"

try {
    $res = $wc.UploadString("https://nselfhelptest.edu-ok.co.kr/wkwhrma/api/initAuthNumber.do", "POST", $postData)
    Write-Output "SUCCESS RESPONSE:"
    Write-Output $res
} catch [System.Net.WebException] {
    $errResp = $_.Exception.Response
    $stream = $errResp.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Output "ERROR STATUS: $($errResp.StatusCode)"
    Write-Output "ERROR BODY:"
    Write-Output ($reader.ReadToEnd())
}
