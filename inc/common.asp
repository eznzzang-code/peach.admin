<%
' UTF-8 인코딩 및 캐시 방지 설정
Session.CodePage = 65001
Response.CharSet = "UTF-8"
Response.Buffer = True
Response.Expires = -1
Response.ExpiresAbsolute = Now() - 1
Response.AddHeader "pragma", "no-cache"
Response.AddHeader "cache-control", "private, no-cache, must-revalidate"

' 로그인 세션 체크: 미로그인 시 login.asp로 리다이렉트
Dim currentScriptName
currentScriptName = LCase(Request.ServerVariables("SCRIPT_NAME"))

Dim loginUserName, loginUserId
loginUserName = Trim(Session("ADMIN_NAME"))
loginUserId   = Trim(Session("ADMIN_ID"))

If loginUserName = "" Then
    loginUserName = loginUserId
End If

If loginUserId = "" Then
    ' 인증/로그아웃 페이지가 아닌 경우 로그인 화면으로 이동
    If InStr(currentScriptName, "login.asp") = 0 And InStr(currentScriptName, "find-account.asp") = 0 And InStr(currentScriptName, "logout.asp") = 0 Then
        Response.Redirect "login.asp"
        Response.End
    End If
End If
%>
<!--#include file="dbconn.asp"-->
