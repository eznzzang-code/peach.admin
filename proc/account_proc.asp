<%@ Language="VBScript" CodePage="65001" %>
<%
Option Explicit
Response.CharSet = "UTF-8"
Session.CodePage = 65001
Response.ContentType = "application/json; charset=UTF-8"
Response.Expires = -1
Response.AddHeader "pragma", "no-cache"
Response.AddHeader "cache-control", "private, no-cache, must-revalidate"
%>
<!--#include virtual="/inc/dbconn.asp"-->
<%
Const BACKEND_BASE = "https://xn--jj0b479bhta.kr/wkwhrma"
Const SMS_GATEWAY_URL = "https://selfhelp.edu-ok.co.kr/selfhelpAPI/send_sms.asp"

Function JsonEscape(str)
  If IsNull(str) Or IsEmpty(str) Then
    JsonEscape = ""
    Exit Function
  End If
  Dim s
  s = CStr(str)
  s = Replace(s, "\", "\\")
  s = Replace(s, """", "\""")
  s = Replace(s, vbCrLf, "\n")
  s = Replace(s, vbCr, "\n")
  s = Replace(s, vbLf, "\n")
  JsonEscape = s
End Function

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

Function GenerateRandomCode(length)
  Dim chars, i, idx, outStr
  chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  Randomize
  outStr = ""
  For i = 1 To length
    idx = Int(Rnd * Len(chars)) + 1
    outStr = outStr & Mid(chars, idx, 1)
  Next
  GenerateRandomCode = outStr
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

Function HttpGet(targetUrl)
  Dim http
  On Error Resume Next
  Set http = Server.CreateObject("MSXML2.ServerXMLHTTP.6.0")
  If Err.Number <> 0 Then Set http = Server.CreateObject("MSXML2.ServerXMLHTTP")
  On Error GoTo 0
  http.Open "GET", targetUrl, False
  http.setRequestHeader "User-Agent", "PeachAdmin-Server/1.0"
  http.setOption 2, 13056
  On Error Resume Next
  http.Send
  If Err.Number <> 0 Then
    HttpGet = "{""resultCode"":""-999""}"
    Set http = Nothing
    Exit Function
  End If
  On Error GoTo 0
  Dim stm, resText
  On Error Resume Next
  Set stm = Server.CreateObject("ADODB.Stream")
  stm.Type = 1
  stm.Open
  stm.Write http.responseBody
  stm.Position = 0
  stm.Type = 2
  stm.Charset = "UTF-8"
  resText = stm.ReadText
  stm.Close
  Set stm = Nothing
  On Error GoTo 0
  If resText = "" Then resText = http.responseText
  Set http = Nothing
  HttpGet = resText
End Function

Function HttpPostWithCookie(targetUrl, postData, customCookie)
  Dim http
  On Error Resume Next
  Set http = Server.CreateObject("MSXML2.ServerXMLHTTP.6.0")
  If Err.Number <> 0 Then Set http = Server.CreateObject("MSXML2.ServerXMLHTTP")
  On Error GoTo 0
  http.Open "POST", targetUrl, False
  http.setRequestHeader "Content-Type", "application/x-www-form-urlencoded; charset=UTF-8"
  http.setRequestHeader "Accept", "application/json, text/plain, */*; charset=UTF-8"
  http.setRequestHeader "User-Agent", "PeachAdmin-Server/1.0"
  http.setOption 2, 13056
  If customCookie <> "" Then
    http.setRequestHeader "Cookie", "JSESSIONID=" & customCookie
  End If
  On Error Resume Next
  http.Send postData
  If Err.Number <> 0 Then
    HttpPostWithCookie = "{""resultcode"":-999}"
    Set http = Nothing
    Exit Function
  End If
  On Error GoTo 0
  On Error Resume Next
  Dim cookieHeader, regCookie, cMatches
  cookieHeader = http.getResponseHeader("Set-Cookie")
  If cookieHeader <> "" Then
    Set regCookie = Server.CreateObject("VBScript.RegExp")
    regCookie.Pattern = "JSESSIONID=([^;]+)"
    regCookie.IgnoreCase = True
    If regCookie.Test(cookieHeader) Then
      Set cMatches = regCookie.Execute(cookieHeader)
      g_LastJSessionId = cMatches(0).SubMatches(0)
      Set cMatches = Nothing
    End If
    Set regCookie = Nothing
  End If
  On Error GoTo 0
  Dim stm, resText
  On Error Resume Next
  Set stm = Server.CreateObject("ADODB.Stream")
  stm.Type = 1
  stm.Open
  stm.Write http.responseBody
  stm.Position = 0
  stm.Type = 2
  stm.Charset = "UTF-8"
  resText = stm.ReadText
  stm.Close
  Set stm = Nothing
  On Error GoTo 0
  If resText = "" Then resText = http.responseText
  Set http = Nothing
  HttpPostWithCookie = resText
End Function

Function ExtractJsonValue(json, key)
  Dim regEx, matches
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

Function CurrentAdminId()
  Dim uid
  uid = Trim(CStr(Session("admin_id") & ""))
  If uid = "" Then uid = Trim(CStr(Session("ADMIN_ID") & ""))
  CurrentAdminId = uid
End Function

Function CurrentAdminName()
  Dim uname
  uname = Trim(CStr(Session("admin_name") & ""))
  If uname = "" Then uname = Trim(CStr(Session("ADMIN_NAME") & ""))
  CurrentAdminName = uname
End Function

Sub RequireAuth()
  If CurrentAdminId() = "" Then
    Response.Write "{""success"":false,""code"":""AUTH"",""message"":""로그인 후 이용해 주세요.""}"
    Call CloseDB()
    Response.End
  End If
End Sub

Call OpenDB()

Dim action, cmd, rs
action = LCase(Trim(Request("action")))

Select Case action

  ' 1. 내 관리자 정보 조회
  Case "get_profile"
    Call RequireAuth()
    Dim myId, myName, myPhone
    myId = CurrentAdminId()
    myName = CurrentAdminName()
    If myName = "" Then myName = myId
    myPhone = ""

    Set cmd = Server.CreateObject("ADODB.Command")
    cmd.ActiveConnection = dbConn
    cmd.CommandText = "SELECT TOP 1 operator_id, operator_name, operator_phone FROM dbo.TBL_OPERATOR WHERE operator_id = ? OR operator_account = ?"
    cmd.CommandType = 1
    cmd.Parameters.Append cmd.CreateParameter("@p1", 200, 1, 50, myId)
    cmd.Parameters.Append cmd.CreateParameter("@p2", 200, 1, 50, myId)
    Set rs = cmd.Execute

    If Not rs.EOF Then
      myName = CStr(rs("operator_name") & "")
      myPhone = CStr(rs("operator_phone") & "")
    End If
    rs.Close
    Set rs = Nothing
    Set cmd = Nothing

    Response.Write "{""success"":true,""id"":""" & JsonEscape(myId) & """,""name"":""" & JsonEscape(myName) & """,""phone"":""" & JsonEscape(myPhone) & """}"

  ' 2. 기본정보(이름) 저장
  Case "update_profile"
    Call RequireAuth()
    myId = CurrentAdminId()
    Dim newName
    newName = Trim(Request("name"))
    If newName = "" Or Len(newName) > 40 Then
      Response.Write "{""success"":false,""message"":""이름을 1~40자로 입력해 주세요.""}"
      Call CloseDB()
      Response.End
    End If

    Set cmd = Server.CreateObject("ADODB.Command")
    cmd.ActiveConnection = dbConn
    cmd.CommandText = "UPDATE dbo.TBL_OPERATOR SET operator_name = ?, updated_at = GETDATE() WHERE operator_id = ? OR operator_account = ?"
    cmd.CommandType = 1
    cmd.Parameters.Append cmd.CreateParameter("@p1", 202, 1, 50, newName)
    cmd.Parameters.Append cmd.CreateParameter("@p2", 200, 1, 50, myId)
    cmd.Parameters.Append cmd.CreateParameter("@p3", 200, 1, 50, myId)
    cmd.Execute
    Set cmd = Nothing

    Session("ADMIN_NAME") = newName
    Session("admin_name") = newName

    ' 조회하여 반환
    Set cmd = Server.CreateObject("ADODB.Command")
    cmd.ActiveConnection = dbConn
    cmd.CommandText = "SELECT TOP 1 operator_phone FROM dbo.TBL_OPERATOR WHERE operator_id = ? OR operator_account = ?"
    cmd.CommandType = 1
    cmd.Parameters.Append cmd.CreateParameter("@p1", 200, 1, 50, myId)
    cmd.Parameters.Append cmd.CreateParameter("@p2", 200, 1, 50, myId)
    Set rs = cmd.Execute
    myPhone = ""
    If Not rs.EOF Then myPhone = CStr(rs("operator_phone") & "")
    rs.Close
    Set rs = Nothing
    Set cmd = Nothing

    Response.Write "{""success"":true,""id"":""" & JsonEscape(myId) & """,""name"":""" & JsonEscape(newName) & """,""phone"":""" & JsonEscape(myPhone) & """}"

  ' 3. 가입 인증코드 조회
  Case "get_invitation"
    Call RequireAuth()
    Set cmd = Server.CreateObject("ADODB.Command")
    cmd.ActiveConnection = dbConn
    cmd.CommandText = "SELECT TOP 1 inv_code, inv_version, CONVERT(VARCHAR(19), issued_at, 126) AS issued_at FROM dbo.TBL_ADMIN_INVITATION WHERE inv_id = 1"
    cmd.CommandType = 1
    Set rs = cmd.Execute
    If rs.EOF Then
      Response.Write "{""success"":true,""invitation"":null}"
    Else
      Response.Write "{""success"":true,""invitation"":{""code"":""" & JsonEscape(rs("inv_code")) & """,""version"":""" & JsonEscape(rs("inv_version")) & """,""issuedAt"":""" & JsonEscape(rs("issued_at")) & """}}"
    End If
    rs.Close
    Set rs = Nothing
    Set cmd = Nothing

  ' 4. 가입 인증코드 발행/재발행
  Case "issue_invitation"
    Call RequireAuth()
    Dim expectedVersion, curVersion, newCode, newVer
    expectedVersion = Trim(Request("expectedVersion"))

    Set cmd = Server.CreateObject("ADODB.Command")
    cmd.ActiveConnection = dbConn
    cmd.CommandText = "SELECT TOP 1 inv_version FROM dbo.TBL_ADMIN_INVITATION WHERE inv_id = 1"
    cmd.CommandType = 1
    Set rs = cmd.Execute
    curVersion = ""
    If Not rs.EOF Then curVersion = CStr(rs("inv_version") & "")
    rs.Close
    Set rs = Nothing
    Set cmd = Nothing

    If curVersion <> expectedVersion Then
      Response.Write "{""success"":false,""code"":""STALE"",""message"":""다른 화면에서 가입코드가 변경되었습니다. 다시 확인해 주세요.""}"
      Call CloseDB()
      Response.End
    End If

    newCode = GenerateRandomCode(16)
    newVer = GenerateRandomCode(16)

    Set cmd = Server.CreateObject("ADODB.Command")
    cmd.ActiveConnection = dbConn
    cmd.CommandText = "IF EXISTS (SELECT 1 FROM dbo.TBL_ADMIN_INVITATION WHERE inv_id = 1) UPDATE dbo.TBL_ADMIN_INVITATION SET inv_code = ?, inv_version = ?, issued_by = ?, issued_at = GETDATE() WHERE inv_id = 1 ELSE INSERT INTO dbo.TBL_ADMIN_INVITATION (inv_id, inv_code, inv_version, issued_by, issued_at) VALUES (1, ?, ?, ?, GETDATE())"
    cmd.CommandType = 1
    cmd.Parameters.Append cmd.CreateParameter("@p1", 200, 1, 50, newCode)
    cmd.Parameters.Append cmd.CreateParameter("@p2", 200, 1, 50, newVer)
    cmd.Parameters.Append cmd.CreateParameter("@p3", 200, 1, 50, CurrentAdminId())
    cmd.Parameters.Append cmd.CreateParameter("@p4", 200, 1, 50, newCode)
    cmd.Parameters.Append cmd.CreateParameter("@p5", 200, 1, 50, newVer)
    cmd.Parameters.Append cmd.CreateParameter("@p6", 200, 1, 50, CurrentAdminId())
    cmd.Execute
    Set cmd = Nothing

    Response.Write "{""success"":true,""invitation"":{""code"":""" & JsonEscape(newCode) & """,""version"":""" & JsonEscape(newVer) & """,""issuedAt"":""" & JsonEscape(Now()) & """}}"

  ' 5. 회원가입 시 가입 인증코드 검증
  Case "verify_invitation"
    Dim inputCode, dbInvCode, validVer
    inputCode = Trim(Request("code"))
    dbInvCode = ""
    validVer = ""
    Set cmd = Server.CreateObject("ADODB.Command")
    cmd.ActiveConnection = dbConn
    cmd.CommandText = "SELECT TOP 1 inv_code, inv_version FROM dbo.TBL_ADMIN_INVITATION WHERE inv_id = 1"
    cmd.CommandType = 1
    Set rs = cmd.Execute
    If Not rs.EOF Then
      dbInvCode = CStr(rs("inv_code") & "")
      validVer = CStr(rs("inv_version") & "")
    End If
    rs.Close
    Set rs = Nothing
    Set cmd = Nothing
    If inputCode = "" Or dbInvCode = "" Or UCase(dbInvCode) <> UCase(inputCode) Then
      Response.Write "{""success"":false,""code"":""INVITATION"",""message"":""가입 인증코드가 올바르지 않습니다. 관리자에게 현재 코드를 확인해 주세요.""}"
      Call CloseDB()
      Response.End
    End If
    Response.Write "{""success"":true,""token"":""" & JsonEscape(validVer) & """,""version"":""" & JsonEscape(validVer) & """}"

  ' 6. 가입 인증코드 토큰 유효성 재검증
  Case "validate_invitation"
    Dim grantToken, dbInvVer
    grantToken = Trim(Request("token"))
    dbInvVer = ""
    Set cmd = Server.CreateObject("ADODB.Command")
    cmd.ActiveConnection = dbConn
    cmd.CommandText = "SELECT TOP 1 inv_version FROM dbo.TBL_ADMIN_INVITATION WHERE inv_id = 1"
    cmd.CommandType = 1
    Set rs = cmd.Execute
    If Not rs.EOF Then
      dbInvVer = CStr(rs("inv_version") & "")
    End If
    rs.Close
    Set rs = Nothing
    Set cmd = Nothing
    If grantToken = "" Or dbInvVer = "" Or dbInvVer <> grantToken Then
      Response.Write "{""success"":false,""code"":""INVITATION"",""message"":""가입 인증코드가 변경되었습니다. 새 코드로 다시 확인해 주세요.""}"
      Call CloseDB()
      Response.End
    End If
    Response.Write "{""success"":true}"

  ' 7. 휴대폰 인증번호 발송 (내 정보 휴대폰 변경 & 회원가입 공통)
  Case "send_phone_code"
    Dim targetPhone, authCode, plainPayload, encText, ivVal, gwRes, gwCode, challengeId
    targetPhone = CleanPhone(Request("phone"))
    If Len(targetPhone) < 10 Then
      Response.Write "{""success"":false,""message"":""휴대폰 번호 형식을 확인해 주세요.""}"
      Call CloseDB()
      Response.End
    End If

    Randomize
    authCode = CStr(Int((9999 - 1000 + 1) * Rnd + 1000))
    challengeId = GenerateRandomCode(20)
    ivVal = "VGhpc0lzMTZCeXRlSVYhIQ=="
    plainPayload = BuildDirectSmsPayload(targetPhone, "관리자", authCode)
    encText = PureAesEncrypt(plainPayload, "G7hQ4vL9pZ2dX5kC8bT1eS3yR4mW6qJ3", ivVal)

    gwRes = HttpGet(SMS_GATEWAY_URL & "?encryptedText=" & Server.URLEncode(encText) & "&iv=" & Server.URLEncode(ivVal))
    gwCode = ExtractJsonValue(gwRes, "resultCode")
    If gwCode = "200" Or InStr(gwRes, "200") > 0 Then
      Session("SMS_CHALLENGE_ID") = challengeId
      Session("SMS_CHALLENGE_PHONE") = targetPhone
      Session("SMS_CHALLENGE_CODE") = authCode
      Response.Write "{""success"":true,""challengeId"":""" & JsonEscape(challengeId) & """,""expiresIn"":180,""retryAfter"":60}"
    Else
      Response.Write "{""success"":false,""message"":""SMS 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.""}"
    End If

  ' 8. 휴대폰 인증번호 검증
  Case "verify_phone_code"
    Dim vPhone, vCode, vChallenge, proofToken
    vPhone = CleanPhone(Request("phone"))
    vCode = Trim(Request("code"))
    vChallenge = Trim(Request("challengeId"))

    If vPhone <> "" And vCode <> "" And CStr(Session("SMS_CHALLENGE_PHONE") & "") = vPhone And CStr(Session("SMS_CHALLENGE_CODE") & "") = vCode Then
      proofToken = GenerateRandomCode(24)
      Session("SMS_VERIFIED_PHONE") = vPhone
      Session("SMS_VERIFIED_PROOF") = proofToken
      Session("SMS_CHALLENGE_CODE") = ""
      Response.Write "{""success"":true,""verified"":true,""proof"":""" & JsonEscape(proofToken) & """,""expiresIn"":300}"
    Else
      Response.Write "{""success"":false,""verified"":false,""message"":""인증번호가 일치하지 않습니다. 다시 확인해 주세요.""}"
    End If

  ' 9. 내 정보 휴대폰 번호 변경 저장
  Case "update_phone"
    Call RequireAuth()
    myId = CurrentAdminId()
    Dim uPhone, uProof
    uPhone = CleanPhone(Request("phone"))
    uProof = Trim(Request("verificationProof"))

    If uPhone = "" Or uProof = "" Or CStr(Session("SMS_VERIFIED_PHONE") & "") <> uPhone Or CStr(Session("SMS_VERIFIED_PROOF") & "") <> uProof Then
      Response.Write "{""success"":false,""message"":""변경할 새 휴대폰 번호의 인증을 완료해 주세요.""}"
      Call CloseDB()
      Response.End
    End If

    Set cmd = Server.CreateObject("ADODB.Command")
    cmd.ActiveConnection = dbConn
    cmd.CommandText = "UPDATE dbo.TBL_OPERATOR SET operator_phone = ?, updated_at = GETDATE() WHERE operator_id = ? OR operator_account = ?"
    cmd.CommandType = 1
    cmd.Parameters.Append cmd.CreateParameter("@p1", 200, 1, 20, uPhone)
    cmd.Parameters.Append cmd.CreateParameter("@p2", 200, 1, 50, myId)
    cmd.Parameters.Append cmd.CreateParameter("@p3", 200, 1, 50, myId)
    cmd.Execute
    Set cmd = Nothing

    Session("SMS_VERIFIED_PROOF") = ""

    Set cmd = Server.CreateObject("ADODB.Command")
    cmd.ActiveConnection = dbConn
    cmd.CommandText = "SELECT TOP 1 operator_name FROM dbo.TBL_OPERATOR WHERE operator_id = ? OR operator_account = ?"
    cmd.CommandType = 1
    cmd.Parameters.Append cmd.CreateParameter("@p1", 200, 1, 50, myId)
    cmd.Parameters.Append cmd.CreateParameter("@p2", 200, 1, 50, myId)
    Set rs = cmd.Execute
    myName = CurrentAdminName()
    If Not rs.EOF Then myName = CStr(rs("operator_name") & "")
    rs.Close
    Set rs = Nothing
    Set cmd = Nothing

    Response.Write "{""success"":true,""id"":""" & JsonEscape(myId) & """,""name"":""" & JsonEscape(myName) & """,""phone"":""" & JsonEscape(uPhone) & """}"

  ' 10. 비밀번호 변경
  Case "change_password"
    Call RequireAuth()
    myId = CurrentAdminId()
    Dim curPw, nextPw
    curPw = Request("currentPassword")
    nextPw = Request("newPassword")

    If curPw = "" Or nextPw = "" Then
      Response.Write "{""success"":false,""message"":""비밀번호를 입력해 주세요.""}"
      Call CloseDB()
      Response.End
    End If

    ' 1) TBL_OPERATOR 비밀번호 확인 또는 WAS 로그인 확인
    Dim pwValid
    pwValid = False

    Set cmd = Server.CreateObject("ADODB.Command")
    cmd.ActiveConnection = dbConn
    cmd.CommandText = "SELECT TOP 1 operator_password, operator_phone, LOWER(CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', CAST(? AS VARCHAR(200))), 2)) AS cur_hash FROM dbo.TBL_OPERATOR WHERE operator_id = ? OR operator_account = ?"
    cmd.CommandType = 1
    cmd.Parameters.Append cmd.CreateParameter("@p0", 200, 1, 200, curPw)
    cmd.Parameters.Append cmd.CreateParameter("@p1", 200, 1, 50, myId)
    cmd.Parameters.Append cmd.CreateParameter("@p2", 200, 1, 50, myId)
    Set rs = cmd.Execute
    Dim dbPw, dbPhone, curHash
    dbPw = ""
    dbPhone = ""
    curHash = ""
    If Not rs.EOF Then
      dbPw = CStr(rs("operator_password") & "")
      dbPhone = CStr(rs("operator_phone") & "")
      curHash = CStr(rs("cur_hash") & "")
    End If
    rs.Close
    Set rs = Nothing
    Set cmd = Nothing

    If dbPw <> "" And (LCase(dbPw) = LCase(curHash) Or dbPw = curPw) Then
      pwValid = True
    End If

    If Not pwValid Then
      Response.Write "{""success"":false,""message"":""현재 비밀번호가 일치하지 않습니다.""}"
      Call CloseDB()
      Response.End
    End If

    ' TBL_OPERATOR 비밀번호 업데이트 (SHA-256 단방향 해시 저장)
    Set cmd = Server.CreateObject("ADODB.Command")
    cmd.ActiveConnection = dbConn
    cmd.CommandText = "UPDATE dbo.TBL_OPERATOR SET operator_password = LOWER(CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', CAST(? AS VARCHAR(200))), 2)), updated_at = GETDATE() WHERE operator_id = ? OR operator_account = ?"
    cmd.CommandType = 1
    cmd.Parameters.Append cmd.CreateParameter("@p1", 200, 1, 200, nextPw)
    cmd.Parameters.Append cmd.CreateParameter("@p2", 200, 1, 50, myId)
    cmd.Parameters.Append cmd.CreateParameter("@p3", 200, 1, 50, myId)
    cmd.Execute
    Set cmd = Nothing

    Response.Write "{""success"":true,""changed"":true}"

  ' 11. 회원가입 아이디 중복 확인
  Case "check_id"
    Dim checkUserId
    checkUserId = Trim(Request("id"))
    If checkUserId = "" Then
      Response.Write "{""success"":false,""available"":false,""message"":""아이디를 입력해 주세요.""}"
      Call CloseDB()
      Response.End
    End If

    Set cmd = Server.CreateObject("ADODB.Command")
    cmd.ActiveConnection = dbConn
    cmd.CommandText = "SELECT COUNT(*) AS cnt FROM dbo.TBL_OPERATOR WHERE operator_id = ? OR operator_account = ?"
    cmd.CommandType = 1
    cmd.Parameters.Append cmd.CreateParameter("@p1", 200, 1, 50, checkUserId)
    cmd.Parameters.Append cmd.CreateParameter("@p2", 200, 1, 50, checkUserId)
    Set rs = cmd.Execute
    Dim existsCnt
    existsCnt = CLng(rs("cnt"))
    rs.Close
    Set rs = Nothing
    Set cmd = Nothing

    If existsCnt > 0 Then
      Response.Write "{""success"":true,""available"":false}"
    Else
      Response.Write "{""success"":true,""available"":true}"
    End If

  ' 12. 회원가입 계정 생성
  Case "create_account"
    Dim sName, sPhone, sId, sPw, sProof, sGrant
    sName = Trim(Request("name"))
    sPhone = CleanPhone(Request("phone"))
    sId = Trim(Request("id"))
    sPw = Request("password")
    sProof = Trim(Request("phoneVerificationProof"))
    sGrant = Trim(Request("invitationToken"))

    ' 가입코드 확인
    Dim createInvVer
    createInvVer = ""
    Set cmd = Server.CreateObject("ADODB.Command")
    cmd.ActiveConnection = dbConn
    cmd.CommandText = "SELECT TOP 1 inv_version FROM dbo.TBL_ADMIN_INVITATION WHERE inv_id = 1"
    cmd.CommandType = 1
    Set rs = cmd.Execute
    If Not rs.EOF Then
      createInvVer = CStr(rs("inv_version") & "")
    End If
    rs.Close
    Set rs = Nothing
    Set cmd = Nothing
    If sGrant = "" Or createInvVer = "" Or createInvVer <> sGrant Then
      Response.Write "{""success"":false,""code"":""INVITATION"",""message"":""가입 인증코드가 변경되었습니다. 새 코드로 다시 확인해 주세요.""}"
      Call CloseDB()
      Response.End
    End If

    ' 휴대폰 인증 확인
    If sPhone = "" Or sProof = "" Or CStr(Session("SMS_VERIFIED_PHONE") & "") <> sPhone Or CStr(Session("SMS_VERIFIED_PROOF") & "") <> sProof Then
      Response.Write "{""success"":false,""message"":""휴대폰 인증을 완료해 주세요.""}"
      Call CloseDB()
      Response.End
    End If

    ' 중복 확인
    Set cmd = Server.CreateObject("ADODB.Command")
    cmd.ActiveConnection = dbConn
    cmd.CommandText = "SELECT COUNT(*) AS cnt FROM dbo.TBL_OPERATOR WHERE operator_id = ? OR operator_account = ?"
    cmd.CommandType = 1
    cmd.Parameters.Append cmd.CreateParameter("@p1", 200, 1, 50, sId)
    cmd.Parameters.Append cmd.CreateParameter("@p2", 200, 1, 50, sId)
    Set rs = cmd.Execute
    If CLng(rs("cnt")) > 0 Then
      rs.Close
      Set rs = Nothing
      Set cmd = Nothing
      Response.Write "{""success"":false,""message"":""이미 사용 중인 아이디입니다.""}"
      Call CloseDB()
      Response.End
    End If
    rs.Close
    Set rs = Nothing
    Set cmd = Nothing

    ' TBL_OPERATOR에 신규 관리자 등록 (SHA-256 단방향 해시 저장)
    Set cmd = Server.CreateObject("ADODB.Command")
    cmd.ActiveConnection = dbConn
    cmd.CommandText = "INSERT INTO dbo.TBL_OPERATOR (operator_id, operator_name, operator_account, operator_password, operator_phone, status, perm_notice_write, perm_notice_post, perm_video_write, perm_video_post, perm_cal_write, perm_cal_post, perm_orchard_write, perm_orchard_post, created_at, updated_at) VALUES (?, ?, ?, LOWER(CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', CAST(? AS VARCHAR(200))), 2)), ?, 'ACTIVE', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', GETDATE(), GETDATE())"
    cmd.CommandType = 1
    cmd.Parameters.Append cmd.CreateParameter("@p1", 200, 1, 50, sId)
    cmd.Parameters.Append cmd.CreateParameter("@p2", 202, 1, 50, sName)
    cmd.Parameters.Append cmd.CreateParameter("@p3", 200, 1, 50, sId)
    cmd.Parameters.Append cmd.CreateParameter("@p4", 200, 1, 200, sPw)
    cmd.Parameters.Append cmd.CreateParameter("@p5", 200, 1, 20, sPhone)
    cmd.Execute
    Set cmd = Nothing

    Session("SMS_VERIFIED_PROOF") = ""
    Response.Write "{""success"":true,""id"":""" & JsonEscape(sId) & """}"

  Case Else
    Response.Write "{""success"":false,""message"":""알 수 없는 요청입니다.""}"
End Select

Call CloseDB()
%>

