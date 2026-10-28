[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
$wc = New-Object System.Net.WebClient
$wc.Headers.Add("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
$wc.Headers.Add("Accept", "application/json, text/plain, */*; charset=UTF-8")

# UTF-8 URL Encode
$nameEnc = [System.Web.HttpUtility]::UrlEncode("테스트", [System.Text.Encoding]::UTF8)
$postData = "user_name=" + $nameEnc + "&user_hp=01074991011&ref=findid"

try {
    $res = $wc.UploadString("https://xn--jj0b479bhta.kr/wkwhrma/api/initAuthNumber.do", "POST", $postData)
    Write-Output "PROD initAuthNumber RESPONSE:"
    Write-Output $res
}
catch [System.Net.WebException] {
    $errResp = $_.Exception.Response
    $stream = $errResp.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Output "ERROR: $($reader.ReadToEnd())"
}
