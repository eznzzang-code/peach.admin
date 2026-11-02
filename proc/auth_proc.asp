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

Function GetDefaultBranchId()
    Dim hostName, remoteAddr
    hostName = LCase(Trim(Request.ServerVariables("HTTP_HOST") & ""))
    remoteAddr = Trim(Request.ServerVariables("REMOTE_ADDR") & "")
    If remoteAddr = "115.95.86.155" Or remoteAddr = "127.0.0.1" Or remoteAddr = "::1" Or Left(remoteAddr, 8) = "192.168." Or Left(remoteAddr, 11) = "121.78.131." Then
        GetDefaultBranchId = "2028"
    ElseIf InStr(hostName, "ko-peach.kr") > 0 Then
        GetDefaultBranchId = "2020"
    Else
        GetDefaultBranchId = "2028"
    End If
End Function

Dim g_AesInit, g_SBox(255), g_InvSBox(255), g_Rcon(10)
g_AesInit = False

Sub InitAesTables()
    If g_AesInit Then Exit Sub
    Dim sHex, i
    sHex = "637c777bf26b6fc53001672bfed7ab76ca82c97dfa5947f0add4a2af9ca472c0" & _
           "b7fd9326363ff7cc34a5e5f171d8311504c723c31896059a071280e2eb27b275" & _
           "09832c1a1b6e5aa0523bd6b329e32f8453d100ed20fcb15b6acbbe394a4c58cf" & _
           "d0efaafb434d338545f9027f503c9fa851a3408f929d38f5bcb6da2110fff3d2" & _
           "cd0c13ec5f974417c4a77e3d645d197360814fdc222a908846eeb814de5e0bdb" & _
           "e0323a0a4906245cc2d3ac629195e479e7c8376d8dd54ea96c56f4ea657aae08" & _
           "ba78252e1ca6b4c6e8dd741f4bbd8b8a703eb5664803f60e613557b986c11d9e" & _
           "e1f8981169d98e949b1e87e9ce5528df8ca1890dbfe6426841992d0fb054bb16"
    For i = 0 To 255
        g_SBox(i) = CLng("&H" & Mid(sHex, i * 2 + 1, 2))
        g_InvSBox(g_SBox(i)) = i
    Next
    g_Rcon(1) = 1 : g_Rcon(2) = 2 : g_Rcon(3) = 4 : g_Rcon(4) = 8
    g_Rcon(5) = 16 : g_Rcon(6) = 32 : g_Rcon(7) = 64 : g_Rcon(8) = 128
    g_Rcon(9) = 27 : g_Rcon(10) = 54
    g_AesInit = True
End Sub

Function GFMult(ByVal a, ByVal b)
    Dim p, counter, hiBit
    p = 0
    For counter = 0 To 7
        If (b And 1) <> 0 Then p = p Xor a
        hiBit = (a And 128)
        a = (a * 2) And 255
        If hiBit <> 0 Then a = a Xor 27
        b = Int(b / 2)
    Next
    GFMult = p
End Function

Function ExpandKey256(keyBytes)
    Call InitAesTables()
    Dim w(239), i, t0, t1, t2, t3, temp
    For i = 0 To 31
        w(i) = keyBytes(i)
    Next
    For i = 8 To 59
        t0 = w((i - 1) * 4)
        t1 = w((i - 1) * 4 + 1)
        t2 = w((i - 1) * 4 + 2)
        t3 = w((i - 1) * 4 + 3)
        If (i Mod 8) = 0 Then
            temp = t0
            t0 = g_SBox(t1) Xor g_Rcon(Int(i / 8))
            t1 = g_SBox(t2)
            t2 = g_SBox(t3)
            t3 = g_SBox(temp)
        ElseIf (i Mod 8) = 4 Then
            t0 = g_SBox(t0)
            t1 = g_SBox(t1)
            t2 = g_SBox(t2)
            t3 = g_SBox(t3)
        End If
        w(i * 4)     = w((i - 8) * 4)     Xor t0
        w(i * 4 + 1) = w((i - 8) * 4 + 1) Xor t1
        w(i * 4 + 2) = w((i - 8) * 4 + 2) Xor t2
        w(i * 4 + 3) = w((i - 8) * 4 + 3) Xor t3
    Next
    ExpandKey256 = w
End Function

Sub AesEncryptBlock(ByRef s, w)
    Dim r, i, c, t, s0, s1, s2, s3
    For i = 0 To 15
        s(i) = s(i) Xor w(i)
    Next
    For r = 1 To 14
        For i = 0 To 15
            s(i) = g_SBox(s(i))
        Next
        t = s(1) : s(1) = s(5) : s(5) = s(9) : s(9) = s(13) : s(13) = t
        t = s(2) : s(2) = s(10) : s(10) = t : t = s(6) : s(6) = s(14) : s(14) = t
        t = s(15) : s(15) = s(11) : s(11) = s(7) : s(7) = s(3) : s(3) = t
        If r < 14 Then
            For c = 0 To 12 Step 4
                s0 = s(c) : s1 = s(c + 1) : s2 = s(c + 2) : s3 = s(c + 3)
                s(c)     = GFMult(s0, 2) Xor GFMult(s1, 3) Xor s2 Xor s3
                s(c + 1) = s0 Xor GFMult(s1, 2) Xor GFMult(s2, 3) Xor s3
                s(c + 2) = s0 Xor s1 Xor GFMult(s2, 2) Xor GFMult(s3, 3)
                s(c + 3) = GFMult(s0, 3) Xor s1 Xor s2 Xor GFMult(s3, 2)
            Next
        End If
        For i = 0 To 15
            s(i) = s(i) Xor w(r * 16 + i)
        Next
    Next
End Sub

Sub AesDecryptBlock(ByRef s, w)
    Dim r, i, c, t, s0, s1, s2, s3
    For i = 0 To 15
        s(i) = s(i) Xor w(14 * 16 + i)
    Next
    For r = 13 To 0 Step -1
        t = s(13) : s(13) = s(9) : s(9) = s(5) : s(5) = s(1) : s(1) = t
        t = s(2) : s(2) = s(10) : s(10) = t : t = s(6) : s(6) = s(14) : s(14) = t
        t = s(3) : s(3) = s(7) : s(7) = s(11) : s(11) = s(15) : s(15) = t
        For i = 0 To 15
            s(i) = g_InvSBox(s(i))
        Next
        For i = 0 To 15
            s(i) = s(i) Xor w(r * 16 + i)
        Next
        If r > 0 Then
            For c = 0 To 12 Step 4
                s0 = s(c) : s1 = s(c + 1) : s2 = s(c + 2) : s3 = s(c + 3)
                s(c)     = GFMult(s0, 14) Xor GFMult(s1, 11) Xor GFMult(s2, 13) Xor GFMult(s3, 9)
                s(c + 1) = GFMult(s0, 9)  Xor GFMult(s1, 14) Xor GFMult(s2, 11) Xor GFMult(s3, 13)
                s(c + 2) = GFMult(s0, 13) Xor GFMult(s1, 9)  Xor GFMult(s2, 14) Xor GFMult(s3, 11)
                s(c + 3) = GFMult(s0, 11) Xor GFMult(s1, 13) Xor GFMult(s2, 9)  Xor GFMult(s3, 14)
            Next
        End If
    Next
End Sub

Function Base64ToBytes(b64Str)
    Dim cleanStr, i, c, v, acc, bits, outLen, arr()
    Const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
    cleanStr = Replace(Replace(Replace(Trim(b64Str), vbCr, ""), vbLf, ""), " ", "")
    ReDim arr(Len(cleanStr) - 1)
    outLen = 0 : acc = 0 : bits = 0
    For i = 1 To Len(cleanStr)
        c = Mid(cleanStr, i, 1)
        If c = "=" Then Exit For
        v = InStr(1, B64, c, 0) - 1
        If v >= 0 Then
            acc = (acc * 64) + v
            bits = bits + 6
            If bits >= 8 Then
                bits = bits - 8
                arr(outLen) = Int(acc / (2 ^ bits)) And 255
                acc = acc And ((2 ^ bits) - 1)
                outLen = outLen + 1
            End If
        End If
    Next
    If outLen > 0 Then
        ReDim Preserve arr(outLen - 1)
    Else
        ReDim arr(0)
    End If
    Base64ToBytes = arr
End Function

Function BytesToBase64(b)
    Const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
    Dim i, n, v, b0, b1, b2, out
    n = UBound(b)
    out = ""
    For i = 0 To n Step 3
        b0 = b(i)
        If i + 1 <= n Then b1 = b(i + 1) Else b1 = 0
        If i + 2 <= n Then b2 = b(i + 2) Else b2 = 0
        v = (b0 * 65536) + (b1 * 256) + b2
        out = out & Mid(B64, (Int(v / 262144) And 63) + 1, 1)
        out = out & Mid(B64, (Int(v / 4096) And 63) + 1, 1)
        If i + 1 <= n Then out = out & Mid(B64, (Int(v / 64) And 63) + 1, 1) Else out = out & "="
        If i + 2 <= n Then out = out & Mid(B64, (v And 63) + 1, 1) Else out = out & "="
    Next
    BytesToBase64 = out
End Function

Function Utf8BytesToString(b)
    Dim i, n, c, c2, c3, cp, out
    n = UBound(b)
    out = ""
    i = 0
    Do While i <= n
        c = b(i)
        If c < 128 Then
            out = out & ChrW(c)
            i = i + 1
        ElseIf (c And 224) = 192 And i + 1 <= n Then
            c2 = b(i + 1)
            cp = ((c And 31) * 64) + (c2 And 63)
            out = out & ChrW(cp)
            i = i + 2
        ElseIf (c And 240) = 224 And i + 2 <= n Then
            c2 = b(i + 1) : c3 = b(i + 2)
            cp = ((c And 15) * 4096) + ((c2 And 63) * 64) + (c3 And 63)
            If cp > 32767 Then cp = cp - 65536
            out = out & ChrW(cp)
            i = i + 3
        Else
            i = i + 1
        End If
    Loop
    Utf8BytesToString = out
End Function

Function StringToUtf8Bytes(s)
    Dim i, cp, arr(), idx
    ReDim arr(Len(s) * 3)
    idx = 0
    For i = 1 To Len(s)
        cp = AscW(Mid(s, i, 1))
        If cp < 0 Then cp = cp + 65536
        If cp < 128 Then
            arr(idx) = cp : idx = idx + 1
        ElseIf cp < 2048 Then
            arr(idx) = 192 Or Int(cp / 64)
            arr(idx + 1) = 128 Or (cp And 63)
            idx = idx + 2
        Else
            arr(idx) = 224 Or Int(cp / 4096)
            arr(idx + 1) = 128 Or (Int(cp / 64) And 63)
            arr(idx + 2) = 128 Or (cp And 63)
            idx = idx + 3
        End If
    Next
    If idx > 0 Then ReDim Preserve arr(idx - 1) Else ReDim arr(0)
    StringToUtf8Bytes = arr
End Function

Function PureAesDecrypt(b64Cipher, keyStr, b64Iv)
    Dim keyBytes, ivBytes, cipherBytes, w, n, i, j, blk(15), prev(15), plainBytes(), padLen, plainLen
    keyBytes = StringToUtf8Bytes(Left(keyStr, 32))
    ivBytes = Base64ToBytes(b64Iv)
    cipherBytes = Base64ToBytes(b64Cipher)
    w = ExpandKey256(keyBytes)
    n = UBound(cipherBytes) + 1
    If n < 16 Or (n Mod 16) <> 0 Then PureAesDecrypt = "" : Exit Function
    ReDim plainBytes(n - 1)
    For j = 0 To 15 : prev(j) = ivBytes(j) : Next
    For i = 0 To n - 16 Step 16
        For j = 0 To 15 : blk(j) = cipherBytes(i + j) : Next
        Call AesDecryptBlock(blk, w)
        For j = 0 To 15
            plainBytes(i + j) = blk(j) Xor prev(j)
            prev(j) = cipherBytes(i + j)
        Next
    Next
    padLen = plainBytes(n - 1)
    If padLen >= 1 And padLen <= 16 Then
        plainLen = n - padLen
    Else
        plainLen = n
    End If
    If plainLen <= 0 Then PureAesDecrypt = "" : Exit Function
    ReDim Preserve plainBytes(plainLen - 1)
    PureAesDecrypt = Utf8BytesToString(plainBytes)
End Function

Function PureAesEncrypt(plainStr, keyStr, b64Iv)
    Dim keyBytes, ivBytes, rawBytes, w, rawLen, padLen, totalLen, padded(), i, j, blk(15), prev(15), outBytes()
    keyBytes = StringToUtf8Bytes(Left(keyStr, 32))
    ivBytes = Base64ToBytes(b64Iv)
    rawBytes = StringToUtf8Bytes(plainStr)
    w = ExpandKey256(keyBytes)
    rawLen = UBound(rawBytes) + 1
    padLen = 16 - (rawLen Mod 16)
    totalLen = rawLen + padLen
    ReDim padded(totalLen - 1)
    For i = 0 To rawLen - 1 : padded(i) = rawBytes(i) : Next
    For i = rawLen To totalLen - 1 : padded(i) = padLen : Next
    ReDim outBytes(totalLen - 1)
    For j = 0 To 15 : prev(j) = ivBytes(j) : Next
    For i = 0 To totalLen - 16 Step 16
        For j = 0 To 15 : blk(j) = padded(i + j) Xor prev(j) : Next
        Call AesEncryptBlock(blk, w)
        For j = 0 To 15
            outBytes(i + j) = blk(j)
            prev(j) = blk(j)
        Next
    Next
    PureAesEncrypt = BytesToBase64(outBytes)
End Function

Function BuildDirectSmsPayload(targetPhone, recipientName, authCode)
    On Error Resume Next
    Dim targetBranchId, targetBranchName, targetSender
    targetBranchId = GetDefaultBranchId()
    If targetBranchId = "2020" Then
        targetBranchName = "(사)한국복숭아생산자협의회"
        targetSender = "0432317774"
    Else
        targetBranchName = "자조금통합지원센터"
        targetSender = "0448654942"
    End If

    ' com.bhsoft.nselfhelp (https://xn--jj0b479bhta.kr/sideform.do) 에서 실시간 단체명 및 대표번호 조회
    Dim sideHtml, regBr, matchesBr
    sideHtml = HttpGet("https://xn--jj0b479bhta.kr/sideform.do")
    If sideHtml <> "" Then
        Set regBr = Server.CreateObject("VBScript.RegExp")
        regBr.Pattern = "<option\s+value=""([^""]*)""\s+data-branchid=""" & targetBranchId & """\s*>([^<]+)</option>"
        regBr.IgnoreCase = True
        If regBr.Test(sideHtml) Then
            Set matchesBr = regBr.Execute(sideHtml)
            If Trim(matchesBr(0).SubMatches(1)) <> "" Then targetBranchName = Trim(matchesBr(0).SubMatches(1))
            If CleanPhone(matchesBr(0).SubMatches(0)) <> "" Then targetSender = CleanPhone(matchesBr(0).SubMatches(0))
            Set matchesBr = Nothing
        End If
        Set regBr = Nothing
    End If
    Err.Clear

    Dim smsMsg, plainJson
    smsMsg = "자조금 인증번호는 [" & authCode & "] 입니다."
    plainJson = "{""targets"":[{""Mobile"":[""" & JsonEscape(targetPhone) & """],""studentname"":""" & JsonEscape(recipientName) & """}]," & _
                """branchId"":""" & JsonEscape(targetBranchId) & """," & _
                """branchid"":""" & JsonEscape(targetBranchId) & """," & _
                """branchName"":""" & JsonEscape(targetBranchName) & """," & _
                """branchname"":""" & JsonEscape(targetBranchName) & """," & _
                """sender"":""" & JsonEscape(targetSender) & """," & _
                """title"":""인증번호""," & _
                """msg"":""" & JsonEscape(smsMsg) & """," & _
                """ref"":""""}"
    On Error GoTo 0
    BuildDirectSmsPayload = plainJson
End Function

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
        Dim dbConnAuth, cmdAuth, rsAuth, dbLoginOk, dbUserFound
        dbLoginOk = False
        dbUserFound = False
        On Error Resume Next
        Set dbConnAuth = Server.CreateObject("ADODB.Connection")
        dbConnAuth.Open "Provider=SQLOLEDB;Data Source=121.78.131.15;Initial Catalog=peach;User ID=peach;Password=qhrtnddk2024!@;"
        If Err.Number = 0 Then
            Set cmdAuth = Server.CreateObject("ADODB.Command")
            cmdAuth.ActiveConnection = dbConnAuth
            cmdAuth.CommandText = "SELECT TOP 1 operator_id, operator_name, operator_password, LOWER(CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', CAST(? AS VARCHAR(200))), 2)) AS input_hash FROM dbo.TBL_OPERATOR WHERE (operator_id = ? OR operator_account = ?) AND status = 'ACTIVE'"
            cmdAuth.CommandType = 1
            cmdAuth.Parameters.Append cmdAuth.CreateParameter("@p0", 200, 1, 200, password)
            cmdAuth.Parameters.Append cmdAuth.CreateParameter("@p1", 200, 1, 50, userId)
            cmdAuth.Parameters.Append cmdAuth.CreateParameter("@p2", 200, 1, 50, userId)
            Set rsAuth = cmdAuth.Execute
            If Not rsAuth.EOF Then
                Dim dbStoredPw, inputHash
                dbStoredPw = CStr(rsAuth("operator_password") & "")
                inputHash = CStr(rsAuth("input_hash") & "")
                If dbStoredPw <> "" Then
                    dbUserFound = True
                    If LCase(dbStoredPw) = LCase(inputHash) Or dbStoredPw = password Then
                        empId = CStr(rsAuth("operator_id"))
                        empName = CStr(rsAuth("operator_name"))
                        branchName = "복숭아자조금"
                        dbLoginOk = True
                    End If
                End If
            End If
            rsAuth.Close
            Set rsAuth = Nothing
            Set cmdAuth = Nothing
        End If
        On Error GoTo 0

        If dbLoginOk Then
            resCode = "200"
        ElseIf dbUserFound Then
            resCode = "-60"
        Else
            resCode = "-10"
        End If

        If resCode = "200" Then
            On Error Resume Next
            If Not dbConnAuth Is Nothing Then
                If dbConnAuth.State = 1 Then dbConnAuth.Close
                Set dbConnAuth = Nothing
            End If
            On Error GoTo 0

            ' Classic ASP 세션 저장 (대소문자 모두 호환)
            Session("ADMIN_ID")     = empId
            Session("admin_id")     = empId
            Session("ADMIN_NAME")   = empName
            Session("admin_name")   = empName
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
        Else
            Response.Write "{""success"":false,""message"":""아이디 또는 비밀번호가 올바르지 않습니다."",""resultcode"":""" & resCode & """}"
        End If
        On Error Resume Next
        If Not dbConnAuth Is Nothing Then
            If dbConnAuth.State = 1 Then dbConnAuth.Close
            Set dbConnAuth = Nothing
        End If
        On Error GoTo 0

    ' 2. 아이디 찾기: 1단계 DB 회원 확인 + SMS 게이트웨이 실제 발송
    Case "send_auth_find_id"
        Dim rawPhone, encText, ivVal, smsGatewayRes, gatewayCode, findAuthCode, findPayload
        rawPhone = CleanPhone(phone)
        If name = "" Or rawPhone = "" Then
            Response.Write "{""success"":false,""message"":""이름과 휴대전화번호를 모두 입력해 주세요.""}"
            Response.End
        End If

        Dim idExists
        idExists = False
        On Error Resume Next
        Set dbConnAuth = Server.CreateObject("ADODB.Connection")
        dbConnAuth.Open "Provider=SQLOLEDB;Data Source=121.78.131.15;Initial Catalog=peach;User ID=peach;Password=qhrtnddk2024!@;"
        If Err.Number = 0 Then
            Set cmdAuth = Server.CreateObject("ADODB.Command")
            cmdAuth.ActiveConnection = dbConnAuth
            cmdAuth.CommandText = "SELECT TOP 1 operator_id FROM dbo.TBL_OPERATOR WHERE operator_name = ? AND REPLACE(ISNULL(operator_phone,''),'-','') = ? AND status = 'ACTIVE'"
            cmdAuth.CommandType = 1
            cmdAuth.Parameters.Append cmdAuth.CreateParameter("@p1", 202, 1, 50, name)
            cmdAuth.Parameters.Append cmdAuth.CreateParameter("@p2", 200, 1, 20, rawPhone)
            Set rsAuth = cmdAuth.Execute
            If Not rsAuth.EOF Then idExists = True
            rsAuth.Close
            Set rsAuth = Nothing
            Set cmdAuth = Nothing
            dbConnAuth.Close
            Set dbConnAuth = Nothing
        End If
        On Error GoTo 0

        If Not idExists Then
            Response.Write "{""success"":false,""message"":""일치하는 관리자 회원 정보가 없습니다.""}"
            Response.End
        End If

        Randomize
        findAuthCode = CStr(Int((9999 - 1000 + 1) * Rnd + 1000))
        ivVal = "VGhpc0lzMTZCeXRlSVYhIQ=="
        findPayload = BuildDirectSmsPayload(rawPhone, name, findAuthCode)
        encText = PureAesEncrypt(findPayload, "G7hQ4vL9pZ2dX5kC8bT1eS3yR4mW6qJ3", ivVal)

        Dim gatewayUrl
        gatewayUrl = SMS_GATEWAY_URL & "?encryptedText=" & Server.URLEncode(encText) & "&iv=" & Server.URLEncode(ivVal)
        smsGatewayRes = HttpGet(gatewayUrl)
        gatewayCode = ExtractJsonValue(smsGatewayRes, "resultCode")

        If gatewayCode = "200" Or InStr(smsGatewayRes, """resultCode"":""200""") > 0 Or InStr(smsGatewayRes, """resultCode"":200") > 0 Then
            Session("FIND_ID_AUTH_PHONE") = rawPhone
            Session("FIND_ID_AUTH_CODE")  = findAuthCode
            Response.Write "{""success"":true,""message"":""인증번호가 발송되었습니다."",""springSessionId"":""LOCAL""}"
        Else
            Dim gwMsg
            gwMsg = ExtractJsonValue(smsGatewayRes, "resultMsg")
            If gwMsg = "" Then gwMsg = "SMS 발송 게이트웨이 호출에 실패했습니다."
            Response.Write "{""success"":false,""message"":""" & JsonEscape(gwMsg) & """}"
        End If

    ' 3. 아이디 찾기: 2단계 인증번호 확인 및 아이디 조회
    Case "find_id_verify"
        rawPhone = CleanPhone(phone)
        If name = "" Or rawPhone = "" Or code = "" Then
            Response.Write "{""success"":false,""message"":""이름, 휴대전화번호, 인증번호를 모두 입력해 주세요.""}"
            Response.End
        End If

        If CStr(Session("FIND_ID_AUTH_PHONE") & "") <> rawPhone Or CStr(Session("FIND_ID_AUTH_CODE") & "") = "" Or CStr(Session("FIND_ID_AUTH_CODE") & "") <> code Then
            Response.Write "{""success"":false,""message"":""인증번호가 일치하지 않습니다. 다시 확인해 주세요."",""resultcode"":404}"
            Response.End
        End If

        Dim dbFoundEmpId
        dbFoundEmpId = ""
        On Error Resume Next
        Set dbConnAuth = Server.CreateObject("ADODB.Connection")
        dbConnAuth.Open "Provider=SQLOLEDB;Data Source=121.78.131.15;Initial Catalog=peach;User ID=peach;Password=qhrtnddk2024!@;"
        If Err.Number = 0 Then
            Set cmdAuth = Server.CreateObject("ADODB.Command")
            cmdAuth.ActiveConnection = dbConnAuth
            cmdAuth.CommandText = "SELECT TOP 1 operator_id FROM dbo.TBL_OPERATOR WHERE operator_name = ? AND REPLACE(ISNULL(operator_phone,''),'-','') = ? AND status = 'ACTIVE'"
            cmdAuth.CommandType = 1
            cmdAuth.Parameters.Append cmdAuth.CreateParameter("@p1", 202, 1, 50, name)
            cmdAuth.Parameters.Append cmdAuth.CreateParameter("@p2", 200, 1, 20, rawPhone)
            Set rsAuth = cmdAuth.Execute
            If Not rsAuth.EOF Then
                dbFoundEmpId = CStr(rsAuth("operator_id") & "")
            End If
            rsAuth.Close
            Set rsAuth = Nothing
            Set cmdAuth = Nothing
            dbConnAuth.Close
            Set dbConnAuth = Nothing
        End If
        On Error GoTo 0

        If dbFoundEmpId <> "" Then
            Session("FIND_ID_AUTH_CODE") = ""
            Response.Write "{""success"":true,""foundId"":""" & JsonEscape(dbFoundEmpId) & """}"
        Else
            Response.Write "{""success"":false,""message"":""일치하는 회원 정보를 찾을 수 없습니다."",""resultcode"":404}"
        End If

    ' 4. 비밀번호 찾기: 1단계 아이디 확인
    Case "check_pwd_id"
        If userId = "" Then
            Response.Write "{""success"":false,""message"":""아이디를 입력해 주세요.""}"
            Response.End
        End If

        Dim regEmpid, regBranchid, regMobile, regName, foundInDb
        foundInDb = False
        On Error Resume Next
        Set dbConnAuth = Server.CreateObject("ADODB.Connection")
        dbConnAuth.Open "Provider=SQLOLEDB;Data Source=121.78.131.15;Initial Catalog=peach;User ID=peach;Password=qhrtnddk2024!@;"
        If Err.Number = 0 Then
            Set cmdAuth = Server.CreateObject("ADODB.Command")
            cmdAuth.ActiveConnection = dbConnAuth
            cmdAuth.CommandText = "SELECT TOP 1 operator_id, operator_name, operator_phone FROM dbo.TBL_OPERATOR WHERE (operator_id = ? OR operator_account = ?) AND status = 'ACTIVE'"
            cmdAuth.CommandType = 1
            cmdAuth.Parameters.Append cmdAuth.CreateParameter("@p1", 200, 1, 50, userId)
            cmdAuth.Parameters.Append cmdAuth.CreateParameter("@p2", 200, 1, 50, userId)
            Set rsAuth = cmdAuth.Execute
            If Not rsAuth.EOF Then
                regEmpid = CStr(rsAuth("operator_id") & "")
                regName = CStr(rsAuth("operator_name") & "")
                regMobile = CStr(rsAuth("operator_phone") & "")
                regBranchid = GetDefaultBranchId()
                foundInDb = True
            End If
            rsAuth.Close
            Set rsAuth = Nothing
            Set cmdAuth = Nothing
            dbConnAuth.Close
            Set dbConnAuth = Nothing
        End If
        On Error GoTo 0

        If foundInDb Then
            Session("PWD_EMPID")          = regEmpid
            Session("PWD_BRANCHID")       = regBranchid
            Session("PWD_MOBILE")         = regMobile
            Session("PWD_EMPNAME")        = regName
            Session("PWD_IS_DB")          = "Y"
            Session("PWD_AUTH_CONFIRMED") = ""
            Response.Write "{""success"":true,""userId"":""" & JsonEscape(regEmpid) & """}"
        Else
            Response.Write "{""success"":false,""message"":""등록되지 않은 아이디입니다."",""resultcode"":""-10""}"
        End If

    ' 5. 비밀번호 찾기: 2단계 휴대전화 인증번호 발송
    Case "send_auth_find_pwd"
        rawPhone = CleanPhone(phone)
        If userId = "" Or rawPhone = "" Then
            Response.Write "{""success"":false,""message"":""아이디와 휴대전화번호를 모두 입력해 주세요.""}"
            Response.End
        End If

        Dim chkName, chkMobile
        chkName   = CStr(Session("PWD_EMPNAME") & "")
        chkMobile = CStr(Session("PWD_MOBILE") & "")

        If chkMobile = "" Then
            On Error Resume Next
            Set dbConnAuth = Server.CreateObject("ADODB.Connection")
            dbConnAuth.Open "Provider=SQLOLEDB;Data Source=121.78.131.15;Initial Catalog=peach;User ID=peach;Password=qhrtnddk2024!@;"
            If Err.Number = 0 Then
                Set cmdAuth = Server.CreateObject("ADODB.Command")
                cmdAuth.ActiveConnection = dbConnAuth
                cmdAuth.CommandText = "SELECT TOP 1 operator_name, operator_phone FROM dbo.TBL_OPERATOR WHERE (operator_id = ? OR operator_account = ?) AND status = 'ACTIVE'"
                cmdAuth.CommandType = 1
                cmdAuth.Parameters.Append cmdAuth.CreateParameter("@p1", 200, 1, 50, userId)
                cmdAuth.Parameters.Append cmdAuth.CreateParameter("@p2", 200, 1, 50, userId)
                Set rsAuth = cmdAuth.Execute
                If Not rsAuth.EOF Then
                    chkName   = CStr(rsAuth("operator_name") & "")
                    chkMobile = CStr(rsAuth("operator_phone") & "")
                    Session("PWD_EMPID")   = userId
                    Session("PWD_EMPNAME") = chkName
                    Session("PWD_MOBILE")  = chkMobile
                End If
                rsAuth.Close
                Set rsAuth = Nothing
                Set cmdAuth = Nothing
                dbConnAuth.Close
                Set dbConnAuth = Nothing
            End If
            On Error GoTo 0
        End If

        If CleanPhone(chkMobile) = "" Or CleanPhone(chkMobile) <> rawPhone Then
            Response.Write "{""success"":false,""message"":""회원정보에 등록된 휴대전화와 일치하지 않습니다.""}"
            Response.End
        End If

        Randomize
        Dim pwdAuthCode, pwdPayload
        pwdAuthCode = CStr(Int((9999 - 1000 + 1) * Rnd + 1000))
        ivVal = "VGhpc0lzMTZCeXRlSVYhIQ=="
        If chkName = "" Then chkName = "관리자"
        pwdPayload = BuildDirectSmsPayload(rawPhone, chkName, pwdAuthCode)
        encText = PureAesEncrypt(pwdPayload, "G7hQ4vL9pZ2dX5kC8bT1eS3yR4mW6qJ3", ivVal)

        gatewayUrl = SMS_GATEWAY_URL & "?encryptedText=" & Server.URLEncode(encText) & "&iv=" & Server.URLEncode(ivVal)
        smsGatewayRes = HttpGet(gatewayUrl)
        gatewayCode = ExtractJsonValue(smsGatewayRes, "resultCode")

        If gatewayCode = "200" Or InStr(smsGatewayRes, """resultCode"":""200""") > 0 Or InStr(smsGatewayRes, """resultCode"":200") > 0 Then
            Session("PWD_AUTH_PHONE") = rawPhone
            Session("PWD_AUTH_CODE")  = pwdAuthCode
            Response.Write "{""success"":true,""message"":""인증번호가 발송되었습니다."",""springSessionId"":""LOCAL""}"
        Else
            gwMsg = ExtractJsonValue(smsGatewayRes, "resultMsg")
            If gwMsg = "" Then gwMsg = "SMS 발송 게이트웨이 호출에 실패했습니다."
            Response.Write "{""success"":false,""message"":""" & JsonEscape(gwMsg) & """}"
        End If

    ' 6. 비밀번호 찾기: 3단계 인증번호 검증
    Case "verify_code_find_pwd"
        rawPhone = CleanPhone(phone)
        If rawPhone = "" Or code = "" Then
            Response.Write "{""success"":false,""message"":""휴대전화번호와 인증번호를 모두 입력해 주세요.""}"
            Response.End
        End If

        If CStr(Session("PWD_AUTH_PHONE") & "") = rawPhone And CStr(Session("PWD_AUTH_CODE") & "") <> "" And CStr(Session("PWD_AUTH_CODE") & "") = code Then
            Session("PWD_AUTH_CONFIRMED") = "Y"
            Session("PWD_AUTH_CODE") = ""
            Response.Write "{""success"":true,""message"":""휴대전화 인증이 완료되었습니다.""}"
        Else
            Response.Write "{""success"":false,""message"":""인증번호가 일치하지 않습니다. 다시 확인해 주세요."",""resultcode"":""404""}"
        End If

    ' 7. 비밀번호 찾기: 4단계 새 비밀번호 재설정
    Case "reset_password"
        Dim newPw, newPwConfirm, rEmpid
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

        rEmpid = CStr(Session("PWD_EMPID") & "")
        If rEmpid = "" Then rEmpid = userId

        Dim dbPwUpdated
        dbPwUpdated = False
        On Error Resume Next
        Set dbConnAuth = Server.CreateObject("ADODB.Connection")
        dbConnAuth.Open "Provider=SQLOLEDB;Data Source=121.78.131.15;Initial Catalog=peach;User ID=peach;Password=qhrtnddk2024!@;"
        If Err.Number = 0 Then
            Dim rowsAffected
            rowsAffected = 0
            Set cmdAuth = Server.CreateObject("ADODB.Command")
            cmdAuth.ActiveConnection = dbConnAuth
            cmdAuth.CommandText = "UPDATE dbo.TBL_OPERATOR SET operator_password = LOWER(CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', CAST(? AS VARCHAR(200))), 2)), updated_at = GETDATE() WHERE (operator_id = ? OR operator_account = ?) AND status = 'ACTIVE'"
            cmdAuth.CommandType = 1
            cmdAuth.Parameters.Append cmdAuth.CreateParameter("@p1", 200, 1, 200, newPw)
            cmdAuth.Parameters.Append cmdAuth.CreateParameter("@p2", 200, 1, 50, rEmpid)
            cmdAuth.Parameters.Append cmdAuth.CreateParameter("@p3", 200, 1, 50, rEmpid)
            cmdAuth.Execute rowsAffected
            If rowsAffected > 0 Then dbPwUpdated = True
            Set cmdAuth = Nothing
            dbConnAuth.Close
            Set dbConnAuth = Nothing
        End If
        On Error GoTo 0

        If dbPwUpdated Then
            Session("PWD_AUTH_CONFIRMED") = ""
            Response.Write "{""success"":true,""message"":""비밀번호가 성공적으로 변경되었습니다."",""userId"":""" & JsonEscape(rEmpid) & """}"
        Else
            Response.Write "{""success"":false,""message"":""비밀번호 변경에 실패했습니다.""}"
        End If

    Case Else
        Response.Write "{""success"":false,""message"":""잘못된 요청입니다.""}"
End Select
%>
