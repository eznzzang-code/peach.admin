<%@ Language="VBScript" CodePage="65001" %>
<%
Option Explicit
Response.CharSet = "UTF-8"
Session.CodePage = 65001
Response.ContentType = "application/json; charset=UTF-8"

Response.Expires = -1
Response.AddHeader "pragma", "no-cache"
Response.AddHeader "cache-control", "private, no-cache, must-revalidate"

' 자조금 Spring Boot 백엔드 서버 Base URL (운영 서버 연동 - 실제 SMS 문자 발송)
Const BACKEND_BASE = "https://xn--jj0b479bhta.kr/wkwhrma"
Const SMS_GATEWAY_URL = "https://selfhelp.edu-ok.co.kr/selfhelpAPI/send_sms.asp"

Dim action, userId, password, autoLogin, name, phone, code
action    = Trim(Request("action"))
userId    = Trim(Request("userId"))
password  = Trim(Request("password"))
autoLogin = Trim(Request("autoLogin"))
name      = Trim(Request("name"))
phone     = Trim(Request("phone"))
code      = Trim(Request("code"))

Function CleanPhone(num)
    If IsNull(num) Then
        CleanPhone = ""
        Exit Function
    End If
    Dim i, ch, res
    res = ""
    For i = 1 To Len(num)
        ch = Mid(num, i, 1)
        If ch >= "0" And ch <= "9" Then
            res = res & ch
        End If
    Next
    CleanPhone = res
End Function

Function JsonEscape(str)
    If IsNull(str) Or str = "" Then
        JsonEscape = ""
        Exit Function
    End If
    Dim s
    s = Replace(CStr(str), "\", "\\")
    s = Replace(s, """", "\""")
    s = Replace(s, vbCrLf, "\n")
    s = Replace(s, vbCr, "\n")
    s = Replace(s, vbLf, "\n")
    JsonEscape = s
End Function

Dim g_LastJSessionId
g_LastJSessionId = ""

' HTTP GET 요청 전송 함수 (외부 SMS 게이트웨이 호출용)
Function HttpGet(targetUrl)
    Dim http
    On Error Resume Next
    Set http = Server.CreateObject("MSXML2.ServerXMLHTTP.6.0")
    If Err.Number <> 0 Then
        Set http = Server.CreateObject("MSXML2.ServerXMLHTTP")
    End If
    On Error GoTo 0

    http.Open "GET", targetUrl, False
    http.setRequestHeader "User-Agent", "PeachAdmin-Server/1.0"
    http.setOption 2, 13056 ' SSL 인증서 오류 무시

    On Error Resume Next
    http.Send
    If Err.Number <> 0 Then
        HttpGet = "{""resultCode"":""-999"",""error"":""" & JsonEscape(Err.Description) & """}"
        Set http = Nothing
        Exit Function
    End If
    On Error GoTo 0

    Dim stm, resText
    On Error Resume Next
    Set stm = Server.CreateObject("ADODB.Stream")
    stm.Type = 1 ' adTypeBinary
    stm.Open
    stm.Write http.responseBody
    stm.Position = 0
    stm.Type = 2 ' adTypeText
    stm.Charset = "UTF-8"
    resText = stm.ReadText
    stm.Close
    Set stm = Nothing
    On Error GoTo 0

    If resText = "" Then
        resText = http.responseText
    End If

    Set http = Nothing
    HttpGet = resText
End Function

' HTTP POST 요청 전송 함수 (쿠키 지정 가능)
Function HttpPostWithCookie(targetUrl, postData, customCookie)
    Dim http
    On Error Resume Next
    Set http = Server.CreateObject("MSXML2.ServerXMLHTTP.6.0")
    If Err.Number <> 0 Then
        Set http = Server.CreateObject("MSXML2.ServerXMLHTTP")
    End If
    On Error GoTo 0

    http.Open "POST", targetUrl, False
    http.setRequestHeader "Content-Type", "application/x-www-form-urlencoded; charset=UTF-8"
    http.setRequestHeader "Accept", "application/json, text/plain, */*; charset=UTF-8"
    http.setRequestHeader "Accept-Charset", "utf-8"
    http.setRequestHeader "User-Agent", "PeachAdmin-Server/1.0"
    http.setOption 2, 13056 ' SSL 인증서 오류 무시

    ' 전달할 세션 쿠키 결정: 파라미터 customCookie 우선 -> 없으면 Classic ASP Session
    Dim useCookie
    useCookie = customCookie
    If useCookie = "" Then
        useCookie = Session("SPRING_JSESSIONID")
    End If

    If useCookie <> "" Then
        http.setRequestHeader "Cookie", "JSESSIONID=" & useCookie
    End If

    On Error Resume Next
    http.Send postData
    If Err.Number <> 0 Then
        HttpPostWithCookie = "{""resultcode"":-999,""error"":""" & JsonEscape(Err.Description) & """}"
        Set http = Nothing
        Exit Function
    End If
    On Error GoTo 0

    ' 응답 헤더에서 Set-Cookie 추출하여 JSESSIONID 저장
    On Error Resume Next
    Dim cookieHeader, regCookie, cMatches
    cookieHeader = http.getResponseHeader("Set-Cookie")
    If cookieHeader <> "" Then
        Set regCookie = Server.CreateObject("VBScript.RegExp")
        regCookie.Pattern = "JSESSIONID=([^;]+)"
        regCookie.IgnoreCase = True
        If regCookie.Test(cookieHeader) Then
            Set cMatches = regCookie.Execute(cookieHeader)
            Dim extractedId
            extractedId = cMatches(0).SubMatches(0)
            Session("SPRING_JSESSIONID") = extractedId
            g_LastJSessionId = extractedId
            Set cMatches = Nothing
        End If
        Set regCookie = Nothing
    End If
    On Error GoTo 0

    ' 응답 텍스트 바이트 스트림 UTF-8 변환
    Dim stm, resText
    On Error Resume Next
    Set stm = Server.CreateObject("ADODB.Stream")
    stm.Type = 1 ' adTypeBinary
    stm.Open
    stm.Write http.responseBody
    stm.Position = 0
    stm.Type = 2 ' adTypeText
    stm.Charset = "UTF-8"
    resText = stm.ReadText
    stm.Close
    Set stm = Nothing
    On Error GoTo 0

    If resText = "" Then
        resText = http.responseText
    End If

    Set http = Nothing
    HttpPostWithCookie = resText
End Function

Function HttpPost(targetUrl, postData)
    HttpPost = HttpPostWithCookie(targetUrl, postData, "")
End Function

' 간단한 JSON 값 추출 헬퍼 (유니코드/한글 완벽 지원)
Function ExtractJsonValue(json, key)
    Dim pattern, regEx, matches
    Set regEx = Server.CreateObject("VBScript.RegExp")
    regEx.Pattern = """" & key & """\s*:\s*""?([^"",}\]]+)""?"
    regEx.IgnoreCase = True
    regEx.Global = False

    If regEx.Test(json) Then
        Set matches = regEx.Execute(json)
        ExtractJsonValue = matches(0).SubMatches(0)
    Else
        ExtractJsonValue = ""
    End If
    Set regEx = Nothing
End Function

Select Case action
    Case "login"
        If userId = "" Or password = "" Then
            Response.Write "{""success"":false,""message"":""아이디와 비밀번호를 모두 입력해 주세요.""}"
            Response.End
        End If

        Dim postBody, jsonRes, resCode, empId, empName, branchName
        postBody = "p_empid=" & Server.URLEncode(userId) & "&p_pwd=" & Server.URLEncode(password)
        If autoLogin = "1" Or LCase(autoLogin) = "true" Then
            postBody = postBody & "&auto_login=true"
        Else
            postBody = postBody & "&auto_login=false"
        End If

        jsonRes = HttpPost(BACKEND_BASE & "/login/loginExcute.do", postBody)
        resCode = ExtractJsonValue(jsonRes, "resultcode")

        If resCode = "200" Then
            empId = ExtractJsonValue(jsonRes, "empid")
            If empId = "" Then empId = userId
            ' 자조금 API 응답 JSON에서 실제 직원 이름을 직접 추출
            empName = ExtractJsonValue(jsonRes, "empname")
            If empName = "" Then empName = empId
            branchName = ExtractJsonValue(jsonRes, "branchname")

            ' Classic ASP 세션 저장 (새로 추가되는 어떤 직원이라도 자조금 시스템의 실제 이름 그대로 저장)
            Session("ADMIN_ID")     = empId
            Session("ADMIN_NAME")   = empName
            Session("ADMIN_BRANCH") = branchName

            ' 자동 로그인 쿠키 저장 (선택)
            If autoLogin = "1" Or LCase(autoLogin) = "true" Then
                Response.Cookies("peach_auto_id") = empId
                Response.Cookies("peach_auto_id").Expires = Date + 30
                Response.Cookies("peach_auto_id").Path = "/"
            Else
                Response.Cookies("peach_auto_id") = ""
                Response.Cookies("peach_auto_id").Expires = Date - 1
                Response.Cookies("peach_auto_id").Path = "/"
            End If

            Response.Write "{""success"":true,""message"":""로그인 성공"",""name"":""" & JsonEscape(empName) & """,""redirectUrl"":""index.asp""}"
        ElseIf resCode = "-10" Then
            Response.Write "{""success"":false,""message"":""등록되지 않은 아이디입니다."",""resultcode"":-10}"
        ElseIf resCode = "-60" Then
            Response.Write "{""success"":false,""message"":""비밀번호가 일치하지 않습니다."",""resultcode"":-60}"
        ElseIf resCode = "-30" Then
            Response.Write "{""success"":false,""message"":""비밀번호 5회 이상 오류로 계정이 휴면 처리되었습니다. 관리자에게 문의하세요."",""resultcode"":-30}"
        ElseIf resCode = "-90" Then
            Response.Write "{""success"":false,""message"":""새벽 점검시간(00:00~06:00)에는 로그인이 제한됩니다."",""resultcode"":-90}"
        Else
            Response.Write "{""success"":false,""message"":""아이디 또는 비밀번호가 올바르지 않습니다."",""resultcode"":""" & resCode & """}"
        End If

    ' 2. 아이디 찾기: 1단계 WAS 인증번호 생성 + 2단계 SMS 게이트웨이 실제 발송
    Case "send_auth_find_id"
        Dim rawPhone, sendRes, encText, ivVal, smsGatewayRes, gatewayCode
        rawPhone = CleanPhone(phone)
        If name = "" Or rawPhone = "" Then
            Response.Write "{""success"":false,""message"":""이름과 휴대전화번호를 모두 입력해 주세요.""}"
            Response.End
        End If

        ' [1단계] 자조금 WAS에서 인증번호 생성 및 발송 토큰(encryptedText, iv) 획득
        postBody = "user_name=" & Server.URLEncode(name) & "&user_hp=" & Server.URLEncode(rawPhone) & "&ref=findid"
        sendRes = HttpPost(BACKEND_BASE & "/api/initAuthNumber.do", postBody)
        resCode = ExtractJsonValue(sendRes, "resultcode")

        If resCode = "200" Or InStr(sendRes, """resultcode"":200") > 0 Then
            encText = ExtractJsonValue(sendRes, "encryptedText")
            ivVal   = ExtractJsonValue(sendRes, "iv")

            If encText <> "" And ivVal <> "" Then
                ' [2단계] 외부 SMS 중계 게이트웨이로 2차 GET 호출 (실제 통신사 문자 발송 트리거)
                Dim gatewayUrl
                gatewayUrl = SMS_GATEWAY_URL & "?encryptedText=" & Server.URLEncode(encText) & "&iv=" & Server.URLEncode(ivVal)
                smsGatewayRes = HttpGet(gatewayUrl)
                gatewayCode = ExtractJsonValue(smsGatewayRes, "resultCode")

                If gatewayCode = "200" Or InStr(smsGatewayRes, """resultCode"":""200""") > 0 Or InStr(smsGatewayRes, """resultCode"":200") > 0 Then
                    Response.Write "{""success"":true,""message"":""인증번호가 발송되었습니다."",""springSessionId"":""" & JsonEscape(g_LastJSessionId) & """}"
                Else
                    Dim gwMsg
                    gwMsg = ExtractJsonValue(smsGatewayRes, "resultMsg")
                    If gwMsg = "" Then gwMsg = "SMS 발송 게이트웨이 호출에 실패했습니다."
                    Response.Write "{""success"":false,""message"":""" & JsonEscape(gwMsg) & """}"
                End If
            Else
                Response.Write "{""success"":false,""message"":""인증 토큰 생성에 실패했습니다.""}"
            End If
        Else
            Dim sendMsg
            sendMsg = ExtractJsonValue(sendRes, "message")
            If sendMsg = "" Then sendMsg = "일치하는 회원 정보가 없거나 인증번호 생성에 실패했습니다."
            Response.Write "{""success"":false,""message"":""" & JsonEscape(sendMsg) & """}"
        End If

    ' 3. 아이디 찾기: 2단계 인증번호 확인 및 아이디 조회
    Case "find_id_verify"
        rawPhone = CleanPhone(phone)
        If name = "" Or rawPhone = "" Or code = "" Then
            Response.Write "{""success"":false,""message"":""이름, 휴대전화번호, 인증번호를 모두 입력해 주세요.""}"
            Response.End
        End If

        Dim clientSessionId
        clientSessionId = Trim(Request("springSessionId"))
        If clientSessionId = "" Then
            clientSessionId = Session("SPRING_JSESSIONID")
        End If

        ' Spring Boot GetEmpidVO & SmsAuthNumberVO 파라미터 규격 완벽 대응
        ' 복숭아 지부코드(branchid=2020) 및 VO 프로퍼티 변수명 변종(camelCase, snake_case, lowercase) 모두 전송
        postBody = "authNumber=" & Server.URLEncode(code) & _
                   "&p_empname=" & Server.URLEncode(name) & _
                   "&pEmpname=" & Server.URLEncode(name) & _
                   "&pempname=" & Server.URLEncode(name) & _
                   "&empname=" & Server.URLEncode(name) & _
                   "&user_name=" & Server.URLEncode(name) & _
                   "&p_mobile=" & Server.URLEncode(rawPhone) & _
                   "&pMobile=" & Server.URLEncode(rawPhone) & _
                   "&pmobile=" & Server.URLEncode(rawPhone) & _
                   "&mobile=" & Server.URLEncode(rawPhone) & _
                   "&branchid=2020&branchId=2020&p_branchid=2020&pBranchid=2020"

        jsonRes = HttpPostWithCookie(BACKEND_BASE & "/login/findIdExcute.do", postBody, clientSessionId)
        resCode = ExtractJsonValue(jsonRes, "resultcode")

        ' 디버그 로그 기록
        On Error Resume Next
        Dim fso, logFile
        Set fso = Server.CreateObject("Scripting.FileSystemObject")
        Set logFile = fso.OpenTextFile(Server.MapPath("/scratch/debug_findid.log"), 8, True)
        logFile.WriteLine "[" & Now() & "] clientSessionId: " & clientSessionId
        logFile.WriteLine "[" & Now() & "] postBody: " & postBody
        logFile.WriteLine "[" & Now() & "] jsonRes: " & jsonRes
        logFile.Close
        Set logFile = Nothing
        Set fso = Nothing
        On Error GoTo 0

        If resCode = "200" Or InStr(jsonRes, """resultcode"":200") > 0 Then
            empId = ExtractJsonValue(jsonRes, "empid")
            Response.Write "{""success"":true,""foundId"":""" & JsonEscape(empId) & """}"
        ElseIf resCode = "400" Then
            Response.Write "{""success"":false,""message"":""인증 세션이 만료되었습니다. 인증번호를 다시 발송해 주세요."",""resultcode"":400}"
        ElseIf resCode = "404" Then
            Response.Write "{""success"":false,""message"":""인증번호가 일치하지 않습니다. 다시 확인해 주세요."",""resultcode"":404}"
        Else
            Dim verifyErrMsg
            verifyErrMsg = ExtractJsonValue(jsonRes, "message")
            If verifyErrMsg = "" Then verifyErrMsg = "일치하는 회원 정보를 찾을 수 없습니다."
            Response.Write "{""success"":false,""message"":""" & JsonEscape(verifyErrMsg) & """,""resultcode"":""" & resCode & """,""raw"":""" & JsonEscape(jsonRes) & """}"
        End If

    ' 4. 비밀번호 찾기: 1단계 아이디 확인
    Case "check_pwd_id"
        If userId = "" Then
            Response.Write "{""success"":false,""message"":""아이디를 입력해 주세요.""}"
            Response.End
        End If

        postBody = "empid=" & Server.URLEncode(userId)
        jsonRes = HttpPost(BACKEND_BASE & "/login/checkIdExcute.do", postBody)
        resCode = ExtractJsonValue(jsonRes, "resultcode")

        If resCode = "200" Or InStr(jsonRes, """resultcode"":200") > 0 Then
            Dim regEmpid, regBranchid, regMobile, regName
            regEmpid    = ExtractJsonValue(jsonRes, "empid")
            regBranchid = ExtractJsonValue(jsonRes, "branchid")
            regMobile   = ExtractJsonValue(jsonRes, "pmobile")
            regName     = ExtractJsonValue(jsonRes, "pempname")
            If regEmpid = "" Then regEmpid = userId
            If regBranchid = "" Then regBranchid = "2020"

            Session("PWD_EMPID")        = regEmpid
            Session("PWD_BRANCHID")     = regBranchid
            Session("PWD_MOBILE")       = regMobile
            Session("PWD_EMPNAME")      = regName
            Session("PWD_AUTH_CONFIRMED") = ""

            Response.Write "{""success"":true,""userId"":""" & JsonEscape(regEmpid) & """}"
        Else
            Response.Write "{""success"":false,""message"":""등록되지 않은 아이디입니다."",""resultcode"":""" & resCode & """}"
        End If

    ' 5. 비밀번호 찾기: 2단계 휴대전화 인증번호 발송 (initAuthNumber + send_sms.asp)
    Case "send_auth_find_pwd"
        rawPhone = CleanPhone(phone)
        If userId = "" Or rawPhone = "" Then
            Response.Write "{""success"":false,""message"":""아이디와 휴대전화번호를 모두 입력해 주세요.""}"
            Response.End
        End If

        ' 세션에 저장된 회원정보 확인 및 없을 시 재조회
        Dim chkName, chkMobile, chkBranch
        chkName   = Session("PWD_EMPNAME")
        chkMobile = Session("PWD_MOBILE")
        chkBranch = Session("PWD_BRANCHID")

        If chkName = "" Or chkMobile = "" Then
            postBody = "empid=" & Server.URLEncode(userId)
            jsonRes = HttpPost(BACKEND_BASE & "/login/checkIdExcute.do", postBody)
            chkName   = ExtractJsonValue(jsonRes, "pempname")
            chkMobile = ExtractJsonValue(jsonRes, "pmobile")
            chkBranch = ExtractJsonValue(jsonRes, "branchid")
            Session("PWD_EMPID")    = userId
            Session("PWD_EMPNAME")  = chkName
            Session("PWD_MOBILE")   = chkMobile
            Session("PWD_BRANCHID") = chkBranch
        End If

        ' 등록된 전화번호와 입력한 번호 일치 확인
        If CleanPhone(chkMobile) <> rawPhone Then
            Response.Write "{""success"":false,""message"":""회원정보에 등록된 휴대전화와 일치하지 않습니다.""}"
            Response.End
        End If

        ' [1단계] 자조금 WAS에서 인증번호 생성 및 발송 토큰(encryptedText, iv) 획득
        postBody = "user_name=" & Server.URLEncode(chkName) & "&user_hp=" & Server.URLEncode(rawPhone) & "&ref=findpwd"
        sendRes = HttpPost(BACKEND_BASE & "/api/initAuthNumber.do", postBody)
        resCode = ExtractJsonValue(sendRes, "resultcode")

        If resCode = "200" Or InStr(sendRes, """resultcode"":200") > 0 Then
            encText = ExtractJsonValue(sendRes, "encryptedText")
            ivVal   = ExtractJsonValue(sendRes, "iv")

            If encText <> "" And ivVal <> "" Then
                ' [2단계] 외부 SMS 중계 게이트웨이 호출
                gatewayUrl = SMS_GATEWAY_URL & "?encryptedText=" & Server.URLEncode(encText) & "&iv=" & Server.URLEncode(ivVal)
                smsGatewayRes = HttpGet(gatewayUrl)
                gatewayCode = ExtractJsonValue(smsGatewayRes, "resultCode")

                If gatewayCode = "200" Or InStr(smsGatewayRes, """resultCode"":""200""") > 0 Or InStr(smsGatewayRes, """resultCode"":200") > 0 Then
                    Session("PWD_SPRING_SESSIONID") = g_LastJSessionId
                    Response.Write "{""success"":true,""message"":""인증번호가 발송되었습니다."",""springSessionId"":""" & JsonEscape(g_LastJSessionId) & """}"
                Else
                    gwMsg = ExtractJsonValue(smsGatewayRes, "resultMsg")
                    If gwMsg = "" Then gwMsg = "SMS 발송 게이트웨이 호출에 실패했습니다."
                    Response.Write "{""success"":false,""message"":""" & JsonEscape(gwMsg) & """}"
                End If
            Else
                Response.Write "{""success"":false,""message"":""인증 토큰 생성에 실패했습니다.""}"
            End If
        Else
            sendMsg = ExtractJsonValue(sendRes, "message")
            If sendMsg = "" Then sendMsg = "인증번호 생성에 실패했습니다."
            Response.Write "{""success"":false,""message"":""" & JsonEscape(sendMsg) & """}"
        End If

    ' 6. 비밀번호 찾기: 3단계 인증번호 검증 (/api/checkAuthNumber.do)
    Case "verify_code_find_pwd"
        rawPhone = CleanPhone(phone)
        If rawPhone = "" Or code = "" Then
            Response.Write "{""success"":false,""message"":""휴대전화번호와 인증번호를 모두 입력해 주세요.""}"
            Response.End
        End If

        clientSessionId = Trim(Request("springSessionId"))
        If clientSessionId = "" Then
            clientSessionId = Session("PWD_SPRING_SESSIONID")
        End If

        postBody = "user_hp=" & Server.URLEncode(rawPhone) & "&authNumber=" & Server.URLEncode(code)
        jsonRes = HttpPostWithCookie(BACKEND_BASE & "/api/checkAuthNumber.do", postBody, clientSessionId)
        resCode = ExtractJsonValue(jsonRes, "resultcode")

        If resCode = "200" Or InStr(jsonRes, """resultcode"":200") > 0 Then
            Session("PWD_AUTH_CONFIRMED") = "Y"
            Response.Write "{""success"":true,""message"":""휴대전화 인증이 완료되었습니다.""}"
        ElseIf resCode = "400" Then
            Response.Write "{""success"":false,""message"":""인증 세션이 만료되었습니다. 인증번호를 다시 발송해 주세요."",""resultcode"":400}"
        Else
            Response.Write "{""success"":false,""message"":""인증번호가 일치하지 않습니다. 다시 확인해 주세요."",""resultcode"":""" & resCode & """}"
        End If

    ' 7. 비밀번호 찾기: 4단계 새 비밀번호 재설정 (/login/pwdReset.do)
    Case "reset_password"
        Dim newPw, newPwConfirm, rBranch, rEmpid, rMobile
        newPw        = Trim(Request("newPassword"))
        newPwConfirm = Trim(Request("newPasswordConfirm"))

        If newPw = "" Then
            Response.Write "{""success"":false,""message"":""새 비밀번호를 입력해 주세요.""}"
            Response.End
        End If
        If newPw <> newPwConfirm Then
            Response.Write "{""success"":false,""message"":""비밀번호 확인이 일치하지 않습니다.""}"
            Response.End
        End If
        If Len(newPw) < 4 Then
            Response.Write "{""success"":false,""message"":""비밀번호를 더 길게 설정해 주세요.""}"
            Response.End
        End If

        If Session("PWD_AUTH_CONFIRMED") <> "Y" Then
            Response.Write "{""success"":false,""message"":""휴대전화 인증이 완료되지 않았습니다.""}"
            Response.End
        End If

        rBranch = Session("PWD_BRANCHID")
        If rBranch = "" Then rBranch = "2020"
        rEmpid  = Session("PWD_EMPID")
        If rEmpid = "" Then rEmpid = userId
        rMobile = Session("PWD_MOBILE")
        If rMobile = "" Then rMobile = CleanPhone(phone)

        postBody = "pBranchid=" & Server.URLEncode(rBranch) & _
                   "&pEmpid=" & Server.URLEncode(rEmpid) & _
                   "&pEmppwd=" & Server.URLEncode(newPw) & _
                   "&pMobile=" & Server.URLEncode(CleanPhone(rMobile)) & _
                   "&pIp=" & Server.URLEncode(Request.ServerVariables("REMOTE_ADDR")) & _
                   "&pUptid=bhsoft"

        jsonRes = HttpPost(BACKEND_BASE & "/login/pwdReset.do", postBody)
        resCode = ExtractJsonValue(jsonRes, "resultcode")

        If resCode = "200" Or InStr(jsonRes, """resultcode"":200") > 0 Then
            Session("PWD_AUTH_CONFIRMED") = ""
            Response.Write "{""success"":true,""message"":""비밀번호가 성공적으로 변경되었습니다."",""userId"":""" & JsonEscape(rEmpid) & """}"
        Else
            Dim resetErrMsg
            resetErrMsg = ExtractJsonValue(jsonRes, "message")
            If resetErrMsg = "" Then resetErrMsg = "비밀번호 변경에 실패했습니다."
            Response.Write "{""success"":false,""message"":""" & JsonEscape(resetErrMsg) & """}"
        End If

    Case Else
        Response.Write "{""success"":false,""message"":""잘못된 요청입니다.""}"
End Select
%>
