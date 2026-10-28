[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
$wc = New-Object System.Net.WebClient
$wc.Headers.Add("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
$wc.Headers.Add("Accept", "application/json, text/plain, */*; charset=UTF-8")

$postData = "p_mobile=01074991011&authNumber=123456"

try {
    $res = $wc.UploadString("https://nselfhelptest.edu-ok.co.kr/wkwhrma/login/findIdExcute.do", "POST", $postData)
    Write-Output "findIdExcute RESPONSE:"
    Write-Output $res
} catch [System.Net.WebException] {
    Write-Output "ERROR: $($_.Exception.Message)"
}
