Dim http
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
http.Open "POST", "https://xn--jj0b479bhta.kr/wkwhrma/api/initAuthNumber.do", False
http.setRequestHeader "Content-Type", "application/x-www-form-urlencoded; charset=UTF-8"
http.setOption 2, 13056
http.Send "user_name=test" & Chr(38) & "user_hp=01074991011" & Chr(38) & "ref=findid"
WScript.Echo "=== AllHeaders ==="
WScript.Echo http.getAllResponseHeaders()
WScript.Echo "=== Set-Cookie ==="
On Error Resume Next
WScript.Echo http.getResponseHeader("Set-Cookie")
If Err.Number <> 0 Then WScript.Echo "Error: " & Err.Description