<%@ Language="VBScript" CodePage="65001" %>
<%
Option Explicit
Response.CharSet = "UTF-8"
Session.CodePage = 65001
Response.Buffer = True
Response.Expires = -1
Response.AddHeader "pragma", "no-cache"
Response.AddHeader "cache-control", "private, no-cache, must-revalidate"
%>
<!--#include virtual="/inc/dbconn.asp"-->
<%
' =============================================================
' 설문조사 관리 / 행사·교육참여 관리 통합 백엔드 API
' 파일 위치: /proc/participation_proc.asp
' 연동 프로시저:
'   - dbo.USP_ADMIN_PARTICIPATION_LIST
'   - dbo.USP_ADMIN_PARTICIPATION_GET
'   - dbo.USP_ADMIN_PARTICIPATION_SAVE
'   - dbo.USP_ADMIN_PARTICIPATION_DELETE
'   - dbo.USP_ADMIN_PARTICIPATION_SUBMIT
'   - dbo.USP_ADMIN_PARTICIPATION_MEMBER_HISTORY
' =============================================================

Function JsonEscape(val)
  If IsNull(val) Or IsEmpty(val) Then
    JsonEscape = ""
    Exit Function
  End If
  Dim s
  s = CStr(val)
  s = Replace(s, "\", "\\")
  s = Replace(s, """", "\""")
  s = Replace(s, vbCrLf, "\n")
  s = Replace(s, vbCr, "\n")
  s = Replace(s, vbLf, "\n")
  s = Replace(s, vbTab, "\t")
  JsonEscape = s
End Function

Function JsonStrOrNull(val)
  If IsNull(val) Or IsEmpty(val) Then
    JsonStrOrNull = "null"
    Exit Function
  End If
  Dim s
  s = Trim(CStr(val))
  If s = "" Then
    JsonStrOrNull = "null"
  Else
    JsonStrOrNull = """" & JsonEscape(s) & """"
  End If
End Function

Function JsonRawOrDefault(val, defJson)
  If IsNull(val) Or IsEmpty(val) Then
    JsonRawOrDefault = defJson
    Exit Function
  End If
  Dim s
  s = Trim(CStr(val))
  If s = "" Then
    JsonRawOrDefault = defJson
  Else
    JsonRawOrDefault = s
  End If
End Function

Function SafeLng(val, defVal)
  If IsNull(val) Or IsEmpty(val) Then
    SafeLng = defVal
    Exit Function
  End If
  Dim s
  s = Trim(CStr(val))
  If s = "" Then
    SafeLng = defVal
  ElseIf IsNumeric(s) Then
    SafeLng = CLng(s)
  Else
    SafeLng = defVal
  End If
End Function

Function CleanDigits(strVal)
  If IsNull(strVal) Or IsEmpty(strVal) Then
    CleanDigits = ""
    Exit Function
  End If
  Dim i, ch, outStr
  outStr = ""
  For i = 1 To Len(strVal)
    ch = Mid(strVal, i, 1)
    If ch >= "0" And ch <= "9" Then
      outStr = outStr & ch
    End If
  Next
  CleanDigits = outStr
End Function

Function FormatHyphenPhone(digits)
  If Len(digits) = 11 Then
    FormatHyphenPhone = Left(digits, 3) & "-" & Mid(digits, 4, 4) & "-" & Right(digits, 4)
  ElseIf Len(digits) = 10 Then
    FormatHyphenPhone = Left(digits, 3) & "-" & Mid(digits, 4, 3) & "-" & Right(digits, 4)
  Else
    FormatHyphenPhone = digits
  End If
End Function

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

Function ParamVarChar(cmd, pName, maxLen, val)
  Dim v
  If IsNull(val) Or IsEmpty(val) Then
    v = Null
  Else
    v = CStr(val)
  End If
  Set ParamVarChar = cmd.CreateParameter(pName, adVarChar, adParamInput, maxLen, v)
End Function

Function ParamNVarChar(cmd, pName, maxLen, val)
  Dim v
  If IsNull(val) Or IsEmpty(val) Then
    v = Null
  Else
    v = CStr(val)
  End If
  Set ParamNVarChar = cmd.CreateParameter(pName, adVarWChar, adParamInput, maxLen, v)
End Function

Function ParamNVarCharMax(cmd, pName, val)
  Dim v, sz
  If IsNull(val) Or IsEmpty(val) Then
    v = Null
    sz = 1
  Else
    v = CStr(val)
    sz = Len(v)
    If sz < 1 Then sz = 1
  End If
  Set ParamNVarCharMax = cmd.CreateParameter(pName, adLongVarWChar, adParamInput, sz, v)
End Function

Function BuildListJson()
  Call OpenDB()

  Dim cmd, rs
  Set cmd = Server.CreateObject("ADODB.Command")
  cmd.ActiveConnection = dbConn
  cmd.CommandText = "dbo.USP_ADMIN_PARTICIPATION_LIST"
  cmd.CommandType = adCmdStoredProc
  cmd.Parameters.Append ParamVarChar(cmd, "@p_form_kind", 20, Null)
  cmd.Parameters.Append ParamNVarChar(cmd, "@p_keyword", 100, Null)
  cmd.Parameters.Append ParamVarChar(cmd, "@p_from_date", 10, Null)
  cmd.Parameters.Append ParamVarChar(cmd, "@p_to_date", 10, Null)

  Set rs = Server.CreateObject("ADODB.Recordset")
  rs.CursorLocation = 3
  rs.Open cmd, , 1, 1

  Dim formOrder, formPrefixDict, respDict
  Set formOrder = Server.CreateObject("Scripting.Dictionary")
  Set formPrefixDict = Server.CreateObject("Scripting.Dictionary")
  Set respDict = Server.CreateObject("Scripting.Dictionary")

  Dim idx
  idx = 0

  ' [ResultSet 1] 설문조사 / 행사·교육 마스터 목록
  Do While Not rs.EOF
    Dim fId, fKind, fTitle, fDesc, fStatus, fRev, fIsPub, fPubIso, fClsIso, fToken
    Dim pStart, pEnd, endMode, compMsg, evType, schMode, evDate, evEndDate, evPlace
    Dim capOn, capLimit, waitOn, conInc, conTitle, conPurpose, conItems, conRetention, qJson, updIso

    fId          = CStr(rs("form_id") & "")
    fKind        = CStr(rs("form_kind") & "")
    fTitle       = CStr(rs("title") & "")
    fDesc        = CStr(rs("description") & "")
    fStatus      = CStr(rs("status") & "")
    fRev         = SafeLng(rs("revision"), 1)
    If fRev < 1 Then fRev = 1
    fIsPub       = (UCase(Trim(CStr(rs("is_public") & ""))) = "Y")
    fPubIso      = rs("published_at_iso")
    fClsIso      = rs("closed_at_iso")
    fToken       = rs("participation_token")
    pStart       = CStr(rs("period_start") & "")
    pEnd         = CStr(rs("period_end") & "")
    endMode      = CStr(rs("end_mode") & "")
    If endMode = "" Then endMode = "auto"
    compMsg      = CStr(rs("completion_msg") & "")
    evType       = CStr(rs("event_type") & "")
    If evType = "" Then evType = "교육"
    schMode      = CStr(rs("schedule_mode") & "")
    If schMode = "" Then schMode = "single"
    evDate       = CStr(rs("event_date") & "")
    evEndDate    = CStr(rs("event_end_date") & "")
    evPlace      = CStr(rs("event_place") & "")
    capOn        = (UCase(Trim(CStr(rs("capacity_enabled") & ""))) = "Y")
    capLimit     = SafeLng(rs("capacity_limit"), 30)
    If capLimit < 1 Then capLimit = 30
    waitOn       = (UCase(Trim(CStr(rs("waitlist_enabled") & ""))) = "Y")
    conInc       = (UCase(Trim(CStr(rs("consent_included") & ""))) <> "N")
    conTitle     = CStr(rs("consent_title") & "")
    If conTitle = "" Then conTitle = "개인정보 수집·이용 동의"
    conPurpose   = CStr(rs("consent_purpose") & "")
    conItems     = CStr(rs("consent_items") & "")
    conRetention = CStr(rs("consent_retention") & "")
    qJson        = JsonRawOrDefault(rs("questions_json"), "[]")
    updIso       = CStr(rs("updated_at_iso") & "")

    Dim fPrefix
    fPrefix = "{" & _
      """id"":""" & JsonEscape(fId) & """," & _
      """kind"":""" & JsonEscape(fKind) & """," & _
      """title"":""" & JsonEscape(fTitle) & """," & _
      """description"":""" & JsonEscape(fDesc) & """," & _
      """status"":""" & JsonEscape(fStatus) & """," & _
      """revision"":" & fRev & "," & _
      """isPublic"":" & LCase(CStr(fIsPub)) & "," & _
      """publishedAt"":" & JsonStrOrNull(fPubIso) & "," & _
      """closedAt"":" & JsonStrOrNull(fClsIso) & "," & _
      """participationToken"":" & JsonStrOrNull(fToken) & "," & _
      """updated"":""" & JsonEscape(updIso) & """," & _
      """settings"":{" & _
        """start"":""" & JsonEscape(pStart) & """," & _
        """end"":""" & JsonEscape(pEnd) & """," & _
        """endMode"":""" & JsonEscape(endMode) & """," & _
        """completion"":""" & JsonEscape(compMsg) & """," & _
        """eventType"":""" & JsonEscape(evType) & """," & _
        """scheduleMode"":""" & JsonEscape(schMode) & """," & _
        """date"":""" & JsonEscape(evDate) & """," & _
        """eventEnd"":""" & JsonEscape(evEndDate) & """," & _
        """place"":""" & JsonEscape(evPlace) & """," & _
        """capacityEnabled"":" & LCase(CStr(capOn)) & "," & _
        """capacity"":" & capLimit & "," & _
        """waitlistEnabled"":" & LCase(CStr(waitOn)) & _
      "}," & _
      """consent"":{" & _
        """included"":" & LCase(CStr(conInc)) & "," & _
        """title"":""" & JsonEscape(conTitle) & """," & _
        """purpose"":""" & JsonEscape(conPurpose) & """," & _
        """items"":""" & JsonEscape(conItems) & """," & _
        """retention"":""" & JsonEscape(conRetention) & """" & _
      "}," & _
      """questions"":" & qJson & "," & _
      """responses"":["

    If Not formPrefixDict.Exists(fId) Then
      idx = idx + 1
      formOrder.Add CStr(idx), fId
      formPrefixDict.Add fId, fPrefix
      respDict.Add fId, ""
    End If

    rs.MoveNext
  Loop

  ' [ResultSet 2] 응답/신청 내역
  Dim isAdminSession
  isAdminSession = (Trim(CStr(Session("ADMIN_ID") & "")) <> "")
  Set rs = rs.NextRecordset
  If Not (rs Is Nothing) Then
    Do While Not rs.EOF
      Dim rFormId, subId, fRevision, srcType, memId, memName, memPhone, respId, enrollSt, ansJson, pathJson, conSnap, subIso
      rFormId   = CStr(rs("form_id") & "")
      subId     = CStr(rs("submission_id") & "")
      fRevision = SafeLng(rs("form_revision"), 1)
      If fRevision < 1 Then fRevision = 1
      srcType   = CStr(rs("source_type") & "")
      If srcType = "" Then srcType = "participation"
      memId     = rs("member_id")
      memName   = rs("member_name")
      If isAdminSession And CStr(rs("member_phone") & "") <> "" Then
        memPhone = FormatHyphenPhone(CleanDigits(CStr(rs("member_phone") & "")))
      Else
        memPhone = Null
      End If
      respId    = rs("respondent_id")
      enrollSt  = rs("enrollment_status")
      ansJson   = JsonRawOrDefault(rs("answers_json"), "{}")
      pathJson  = JsonRawOrDefault(rs("path_json"), "[]")
      conSnap   = JsonRawOrDefault(rs("consent_snapshot_json"), "null")
      subIso    = CStr(rs("submitted_at_iso") & "")

      Dim rJson
      rJson = "{" & _
        """id"":""" & JsonEscape(subId) & """," & _
        """submissionId"":""" & JsonEscape(subId) & """," & _
        """formRevision"":" & fRevision & "," & _
        """source"":""" & JsonEscape(srcType) & """," & _
        """memberId"":" & JsonStrOrNull(memId) & "," & _
        """memberName"":" & JsonStrOrNull(memName) & "," & _
        """memberPhone"":" & JsonStrOrNull(memPhone) & "," & _
        """respondentId"":" & JsonStrOrNull(respId) & "," & _
        """enrollment"":" & JsonStrOrNull(enrollSt) & "," & _
        """at"":""" & JsonEscape(subIso) & """," & _
        """answers"":" & ansJson & "," & _
        """path"":" & pathJson & "," & _
        """consent"":" & conSnap & _
      "}"

      If respDict.Exists(rFormId) Then
        If respDict(rFormId) = "" Then
          respDict(rFormId) = rJson
        Else
          respDict(rFormId) = respDict(rFormId) & "," & rJson
        End If
      End If

      rs.MoveNext
    Loop
  End If

  ' [ResultSet 3] 개인정보 동의 기본값 설정
  Dim defTitle, defPurpose, defItems, defRetention
  defTitle     = "개인정보 수집·이용 동의"
  defPurpose   = "설문조사 및 행사·교육 참여 접수, 운영 안내와 결과 분석"
  defItems     = "성명, 연락처, 설문 응답 및 신청 내용"
  defRetention = "수집·이용 목적 달성 후 지체 없이 파기"

  Set rs = rs.NextRecordset
  If Not (rs Is Nothing) Then
    If Not rs.EOF Then
      If Trim(CStr(rs("consent_title") & "")) <> "" Then defTitle = CStr(rs("consent_title"))
      If Trim(CStr(rs("consent_purpose") & "")) <> "" Then defPurpose = CStr(rs("consent_purpose"))
      If Trim(CStr(rs("consent_items") & "")) <> "" Then defItems = CStr(rs("consent_items"))
      If Trim(CStr(rs("consent_retention") & "")) <> "" Then defRetention = CStr(rs("consent_retention"))
    End If
  End If

  On Error Resume Next
  If Not (rs Is Nothing) Then
    If rs.State = 1 Then rs.Close
    Set rs = Nothing
  End If
  Set cmd = Nothing
  On Error GoTo 0

  Dim k, curId, formsJson
  formsJson = ""
  For k = 1 To idx
    curId = formOrder(CStr(k))
    If formsJson <> "" Then formsJson = formsJson & ","
    formsJson = formsJson & formPrefixDict(curId) & respDict(curId) & "]}"
  Next

  BuildListJson = "{" & _
    """ok"":true," & _
    """version"":4," & _
    """consentDefaults"":{" & _
      """included"":true," & _
      """title"":""" & JsonEscape(defTitle) & """," & _
      """purpose"":""" & JsonEscape(defPurpose) & """," & _
      """items"":""" & JsonEscape(defItems) & """," & _
      """retention"":""" & JsonEscape(defRetention) & """" & _
    "}," & _
    """forms"":[" & formsJson & "]" & _
  "}"
End Function

Function TryMatchFarmerFromNselfhelp(branchId, userName, userHp)
  TryMatchFarmerFromNselfhelp = ""
  On Error Resume Next
  Dim http, postBody, htmlText, allHeaders, jsessionCookie
  Dim reCookie, mCookie, regEx, matches, foundId

  Set http = Server.CreateObject("MSXML2.ServerXMLHTTP.6.0")
  If Err.Number <> 0 Then
    Err.Clear
    Set http = Server.CreateObject("MSXML2.ServerXMLHTTP")
  End If
  http.setTimeouts 4000, 4000, 5000, 5000

  ' 1단계: consentBillForm.do 호출로 CONSENT_BILL_SESSION 수립 및 JSESSIONID 쿠키 획득
  jsessionCookie = ""
  http.Open "GET", "https://xn--jj0b479bhta.kr/consentBillForm.do?pBranchID=" & Server.URLEncode(branchId), False
  http.Send
  If Err.Number = 0 And http.Status = 200 Then
    allHeaders = CStr(http.getAllResponseHeaders() & "")
    Set reCookie = New RegExp
    reCookie.IgnoreCase = True
    reCookie.Global = False
    reCookie.Pattern = "JSESSIONID=([^;\r\n]+)"
    Set mCookie = reCookie.Execute(allHeaders)
    If mCookie.Count > 0 Then
      jsessionCookie = "JSESSIONID=" & Trim(mCookie(0).SubMatches(0))
    End If
    Set reCookie = Nothing
  End If
  Err.Clear

  ' 2단계: 동일 세션으로 consentBillStep2.do 호출하여 이름 + 휴대폰 번호 + 재회원(statecode='0101') 일치 검증
  http.Open "POST", "https://xn--jj0b479bhta.kr/consentBillStep2.do", False
  http.setRequestHeader "Content-Type", "application/x-www-form-urlencoded; charset=UTF-8"
  If jsessionCookie <> "" Then
    http.setRequestHeader "Cookie", jsessionCookie
  End If
  postBody = "pBranchID=" & Server.URLEncode(branchId) & _
             "&userName=" & Server.URLEncode(userName) & _
             "&userHp=" & Server.URLEncode(userHp)
  http.Send postBody

  If Err.Number = 0 And http.Status = 200 Then
    htmlText = CStr(http.responseText & "")
    If InStr(htmlText, "alert(") = 0 And (InStr(htmlText, "납부내역(고지)서") > 0 Or InStr(htmlText, "id=""subcon""") > 0) Then
      foundId = ""

      ' HTML 내 회원번호 추출 시도
      Set regEx = New RegExp
      regEx.IgnoreCase = True
      regEx.Global = False
      regEx.Pattern = "회원번호</th>[\s\S]*?<td[^>]*>\s*([0-9A-Za-z_-]+)\s*</td>"
      Set matches = regEx.Execute(htmlText)
      If matches.Count > 0 Then
        foundId = Trim(matches(0).SubMatches(0))
        If foundId = "-" Then foundId = ""
      End If

      ' HTML에 회원번호가 표출되지 않은 경우 회원번호 조회 API로 회원번호(studentno) 획득
      If foundId = "" Then
        Err.Clear
        http.Open "GET", "https://xn--jj0b479bhta.kr/wkwhrma/api/getStudentnoForReceipt.do?branchId=" & Server.URLEncode(branchId) & "&customerName=" & Server.URLEncode(userName), False
        http.Send
        If Err.Number = 0 And http.Status = 200 Then
          Dim jsonText
          jsonText = CStr(http.responseText & "")
          regEx.Pattern = """studentno""\s*:\s*""([^""]+)"""
          Set matches = regEx.Execute(jsonText)
          If matches.Count > 0 Then
            foundId = Trim(matches(0).SubMatches(0))
          End If
        End If
      End If
      Set regEx = Nothing

      ' 동명이인 등으로 studentno 단건 반환이 비어있을 경우 지점코드+휴대폰번호로 고유 식별자 보장
      If foundId = "" Then
        foundId = branchId & "-" & CleanDigits(userHp)
      End If
      TryMatchFarmerFromNselfhelp = foundId
    End If
  End If

  Set http = Nothing
  Err.Clear
  On Error GoTo 0
End Function

Dim action
action = LCase(Trim(Request("action") & ""))

If action = "bootstrap_js" Then
  Response.ContentType = "application/javascript; charset=UTF-8"
  Response.Write "window.__PEACH_PARTICIPATION_BOOTSTRAP__ = " & BuildListJson() & ";"
  Call CloseDB()
  Response.End
End If

Response.ContentType = "application/json; charset=UTF-8"

If action = "list" Or action = "" Then
  Response.Write BuildListJson()
  Call CloseDB()
  Response.End
End If

If action = "save" Then
  Dim adminId
  adminId = Trim(CStr(Session("ADMIN_ID") & ""))
  If adminId = "" Then
    Response.Write "{""ok"":false,""code"":""AUTH_REQUIRED"",""message"":""로그인 세션이 만료되었습니다. 새 창에서 다시 로그인한 뒤 저장해 주세요.""}"
    Call CloseDB()
    Response.End
  End If

  Dim pFormId, pFormKind, pTitle, pDesc, pStatus, pRevision, pIsPublic, pPubAt, pClsAt, pToken
  Dim pStart2, pEnd2, pEndMode, pCompMsg, pEvType, pSchMode, pEvDate, pEvEndDate, pEvPlace
  Dim pCapOn, pCapLimit, pWaitOn, pConInc, pConTitle, pConPurpose, pConItems, pConRet, pQJson, pSaveDef

  pFormId     = Trim(Request.Form("form_id") & "")
  pFormKind   = Trim(Request.Form("form_kind") & "")
  pTitle      = Request.Form("title") & ""
  pDesc       = Request.Form("description") & ""
  pStatus     = Trim(Request.Form("status") & "")
  pRevision   = SafeLng(Request.Form("revision"), 1)
  If pRevision < 1 Then pRevision = 1
  pIsPublic   = Trim(Request.Form("is_public") & "")
  If pIsPublic <> "Y" Then pIsPublic = "N"
  pPubAt      = Trim(Request.Form("published_at") & "")
  pClsAt      = Trim(Request.Form("closed_at") & "")
  pToken      = Trim(Request.Form("participation_token") & "")
  pStart2     = Trim(Request.Form("period_start") & "")
  pEnd2       = Trim(Request.Form("period_end") & "")
  pEndMode    = Trim(Request.Form("end_mode") & "")
  If pEndMode = "" Then pEndMode = "auto"
  pCompMsg    = Request.Form("completion_msg") & ""
  pEvType     = Trim(Request.Form("event_type") & "")
  If pEvType = "" Then pEvType = "교육"
  pSchMode    = Trim(Request.Form("schedule_mode") & "")
  If pSchMode = "" Then pSchMode = "single"
  pEvDate     = Trim(Request.Form("event_date") & "")
  pEvEndDate  = Trim(Request.Form("event_end_date") & "")
  pEvPlace    = Request.Form("event_place") & ""
  pCapOn      = Trim(Request.Form("capacity_enabled") & "")
  If pCapOn <> "Y" Then pCapOn = "N"
  pCapLimit   = SafeLng(Request.Form("capacity_limit"), 30)
  If pCapLimit < 1 Then pCapLimit = 30
  pWaitOn     = Trim(Request.Form("waitlist_enabled") & "")
  If pWaitOn <> "Y" Then pWaitOn = "N"
  pConInc     = Trim(Request.Form("consent_included") & "")
  If pConInc <> "N" Then pConInc = "Y"
  pConTitle   = Request.Form("consent_title") & ""
  pConPurpose = Request.Form("consent_purpose") & ""
  pConItems   = Request.Form("consent_items") & ""
  pConRet     = Request.Form("consent_retention") & ""
  pQJson      = Request.Form("questions_json") & ""
  pSaveDef    = Trim(Request.Form("save_consent_def") & "")
  If pSaveDef <> "Y" Then pSaveDef = "N"

  If pFormId = "" Then
    Response.Write "{""ok"":false,""message"":""문서 식별자(form_id)가 누락되었습니다.""}"
    Call CloseDB()
    Response.End
  End If

  Call OpenDB()
  On Error Resume Next
  Dim cmdSave
  Set cmdSave = Server.CreateObject("ADODB.Command")
  cmdSave.ActiveConnection = dbConn
  cmdSave.CommandText = "dbo.USP_ADMIN_PARTICIPATION_SAVE"
  cmdSave.CommandType = adCmdStoredProc

  cmdSave.Parameters.Append ParamVarChar(cmdSave, "@p_form_id", 64, pFormId)
  cmdSave.Parameters.Append ParamVarChar(cmdSave, "@p_form_kind", 20, pFormKind)
  cmdSave.Parameters.Append ParamNVarChar(cmdSave, "@p_title", 200, pTitle)
  cmdSave.Parameters.Append ParamNVarCharMax(cmdSave, "@p_description", pDesc)
  cmdSave.Parameters.Append ParamVarChar(cmdSave, "@p_status", 20, pStatus)
  cmdSave.Parameters.Append cmdSave.CreateParameter("@p_revision", adInteger, adParamInput, 4, pRevision)
  cmdSave.Parameters.Append cmdSave.CreateParameter("@p_is_public", adChar, adParamInput, 1, pIsPublic)
  cmdSave.Parameters.Append ParamVarChar(cmdSave, "@p_published_at", 30, pPubAt)
  cmdSave.Parameters.Append ParamVarChar(cmdSave, "@p_closed_at", 30, pClsAt)
  cmdSave.Parameters.Append ParamVarChar(cmdSave, "@p_participation_token", 64, pToken)
  cmdSave.Parameters.Append ParamVarChar(cmdSave, "@p_period_start", 20, pStart2)
  cmdSave.Parameters.Append ParamVarChar(cmdSave, "@p_period_end", 20, pEnd2)
  cmdSave.Parameters.Append ParamVarChar(cmdSave, "@p_end_mode", 10, pEndMode)
  cmdSave.Parameters.Append ParamNVarChar(cmdSave, "@p_completion_msg", 1000, pCompMsg)
  cmdSave.Parameters.Append ParamNVarChar(cmdSave, "@p_event_type", 20, pEvType)
  cmdSave.Parameters.Append ParamVarChar(cmdSave, "@p_schedule_mode", 10, pSchMode)
  cmdSave.Parameters.Append ParamVarChar(cmdSave, "@p_event_date", 20, pEvDate)
  cmdSave.Parameters.Append ParamVarChar(cmdSave, "@p_event_end_date", 20, pEvEndDate)
  cmdSave.Parameters.Append ParamNVarChar(cmdSave, "@p_event_place", 200, pEvPlace)
  cmdSave.Parameters.Append cmdSave.CreateParameter("@p_capacity_enabled", adChar, adParamInput, 1, pCapOn)
  cmdSave.Parameters.Append cmdSave.CreateParameter("@p_capacity_limit", adInteger, adParamInput, 4, pCapLimit)
  cmdSave.Parameters.Append cmdSave.CreateParameter("@p_waitlist_enabled", adChar, adParamInput, 1, pWaitOn)
  cmdSave.Parameters.Append cmdSave.CreateParameter("@p_consent_included", adChar, adParamInput, 1, pConInc)
  cmdSave.Parameters.Append ParamNVarChar(cmdSave, "@p_consent_title", 200, pConTitle)
  cmdSave.Parameters.Append ParamNVarChar(cmdSave, "@p_consent_purpose", 1000, pConPurpose)
  cmdSave.Parameters.Append ParamNVarChar(cmdSave, "@p_consent_items", 1000, pConItems)
  cmdSave.Parameters.Append ParamNVarChar(cmdSave, "@p_consent_retention", 1000, pConRet)
  cmdSave.Parameters.Append ParamNVarCharMax(cmdSave, "@p_questions_json", pQJson)
  cmdSave.Parameters.Append ParamVarChar(cmdSave, "@p_author_id", 50, adminId)
  cmdSave.Parameters.Append cmdSave.CreateParameter("@p_save_consent_def", adChar, adParamInput, 1, pSaveDef)

  cmdSave.Execute
  If Err.Number <> 0 Then
    Response.Write "{""ok"":false,""message"":""" & JsonEscape(Err.Description) & """}"
    Err.Clear
  Else
    Response.Write "{""ok"":true}"
  End If
  Set cmdSave = Nothing
  On Error GoTo 0
  Call CloseDB()
  Response.End
End If

If action = "delete" Then
  If Trim(CStr(Session("ADMIN_ID") & "")) = "" Then
    Response.Write "{""ok"":false,""code"":""AUTH_REQUIRED"",""message"":""로그인 세션이 만료되었습니다. 다시 로그인해 주세요.""}"
    Call CloseDB()
    Response.End
  End If
  Dim delFormId
  delFormId = Trim(Request.Form("form_id") & "")
  If delFormId = "" Then delFormId = Trim(Request("form_id") & "")
  If delFormId = "" Then
    Response.Write "{""ok"":false,""message"":""문서 식별자(form_id)가 누락되었습니다.""}"
    Call CloseDB()
    Response.End
  End If

  Call OpenDB()
  On Error Resume Next
  Dim cmdDel
  Set cmdDel = Server.CreateObject("ADODB.Command")
  cmdDel.ActiveConnection = dbConn
  cmdDel.CommandText = "dbo.USP_ADMIN_PARTICIPATION_DELETE"
  cmdDel.CommandType = adCmdStoredProc
  cmdDel.Parameters.Append ParamVarChar(cmdDel, "@p_form_id", 64, delFormId)
  cmdDel.Parameters.Append cmdDel.CreateParameter("@r_code", adInteger, adParamOutput, 4)
  cmdDel.Parameters.Append cmdDel.CreateParameter("@r_message", adVarWChar, adParamOutput, 200)
  cmdDel.Execute

  If Err.Number <> 0 Then
    Response.Write "{""ok"":false,""message"":""" & JsonEscape(Err.Description) & """}"
    Err.Clear
  Else
    Dim delCode, delMsg
    delCode = SafeLng(cmdDel.Parameters("@r_code").Value, -1)
    delMsg  = CStr(cmdDel.Parameters("@r_message").Value & "")
    If delCode = 0 Then
      Response.Write "{""ok"":true,""message"":""" & JsonEscape(delMsg) & """}"
    Else
      Response.Write "{""ok"":false,""message"":""" & JsonEscape(delMsg) & """}"
    End If
  End If
  Set cmdDel = Nothing
  On Error GoTo 0
  Call CloseDB()
  Response.End
End If

If action = "submit" Then
  Dim sSubId, sFormId, sRev, sMemId, sMemName, sMemPhone, sRespId, sAttChoice, sAnsJson, sPathJson, sConAgreed, sConSnap
  sSubId     = Trim(Request.Form("submission_id") & "")
  sFormId    = Trim(Request.Form("form_id") & "")
  sRev       = SafeLng(Request.Form("form_revision"), 1)
  If sRev < 1 Then sRev = 1
  sMemId     = Trim(Request.Form("member_id") & "")
  sMemName   = Trim(Request.Form("member_name") & "")
  sMemPhone  = CleanDigits(Request.Form("member_phone") & "")
  sRespId    = Trim(Request.Form("respondent_id") & "")
  sAttChoice = Trim(Request.Form("attendance_choice") & "")
  sAnsJson   = Request.Form("answers_json") & ""
  If sAnsJson = "" Then sAnsJson = "{}"
  sPathJson  = Request.Form("path_json") & ""
  If sPathJson = "" Then sPathJson = "[]"
  sConAgreed = Trim(Request.Form("consent_agreed") & "")
  If sConAgreed <> "N" Then sConAgreed = "Y"
  sConSnap   = Request.Form("consent_snapshot_json") & ""

  If sSubId = "" Or sFormId = "" Then
    Response.Write "{""ok"":false,""message"":""필수 제출 정보가 누락되었습니다.""}"
    Call CloseDB()
    Response.End
  End If

  Call OpenDB()
  On Error Resume Next
  Dim cmdSub
  Set cmdSub = Server.CreateObject("ADODB.Command")
  cmdSub.ActiveConnection = dbConn
  cmdSub.CommandText = "dbo.USP_ADMIN_PARTICIPATION_SUBMIT"
  cmdSub.CommandType = adCmdStoredProc
  cmdSub.Parameters.Append ParamVarChar(cmdSub, "@p_submission_id", 64, sSubId)
  cmdSub.Parameters.Append ParamVarChar(cmdSub, "@p_form_id", 64, sFormId)
  cmdSub.Parameters.Append cmdSub.CreateParameter("@p_form_revision", adInteger, adParamInput, 4, sRev)
  cmdSub.Parameters.Append ParamVarChar(cmdSub, "@p_member_id", 64, sMemId)
  cmdSub.Parameters.Append ParamNVarChar(cmdSub, "@p_member_name", 50, sMemName)
  cmdSub.Parameters.Append ParamVarChar(cmdSub, "@p_member_phone", 20, sMemPhone)
  cmdSub.Parameters.Append ParamVarChar(cmdSub, "@p_respondent_id", 64, sRespId)
  cmdSub.Parameters.Append ParamVarChar(cmdSub, "@p_attendance_choice", 20, sAttChoice)
  cmdSub.Parameters.Append ParamNVarCharMax(cmdSub, "@p_answers_json", sAnsJson)
  cmdSub.Parameters.Append ParamNVarCharMax(cmdSub, "@p_path_json", sPathJson)
  cmdSub.Parameters.Append cmdSub.CreateParameter("@p_consent_agreed", adChar, adParamInput, 1, sConAgreed)
  cmdSub.Parameters.Append ParamNVarCharMax(cmdSub, "@p_consent_snapshot_json", sConSnap)
  cmdSub.Parameters.Append cmdSub.CreateParameter("@r_code", adInteger, adParamOutput, 4)
  cmdSub.Parameters.Append cmdSub.CreateParameter("@r_enrollment", adVarChar, adParamOutput, 20)
  cmdSub.Parameters.Append cmdSub.CreateParameter("@r_message", adVarWChar, adParamOutput, 200)
  cmdSub.Execute

  If Err.Number <> 0 Then
    Response.Write "{""ok"":false,""message"":""" & JsonEscape(Err.Description) & """}"
    Err.Clear
  Else
    Dim subCode, subEnroll, subMsg
    subCode   = SafeLng(cmdSub.Parameters("@r_code").Value, -1)
    subEnroll = Trim(CStr(cmdSub.Parameters("@r_enrollment").Value & ""))
    subMsg    = CStr(cmdSub.Parameters("@r_message").Value & "")
    If subCode >= 0 Then
      Response.Write "{""ok"":true,""replayed"":" & LCase(CStr(subCode = 1)) & ",""enrollment"":""" & JsonEscape(subEnroll) & """,""message"":""" & JsonEscape(subMsg) & """}"
    Else
      Response.Write "{""ok"":false,""message"":""" & JsonEscape(subMsg) & """}"
    End If
  End If
  Set cmdSub = Nothing
  On Error GoTo 0
  Call CloseDB()
  Response.End
End If

If action = "match_member" Then
  Dim mName, mPhone, branchId, matchedStudentNo
  mName  = Trim(Request.Form("name") & "")
  If mName = "" Then mName = Trim(Request("name") & "")
  mPhone = CleanDigits(Request.Form("phone") & "")
  If mPhone = "" Then mPhone = CleanDigits(Request("phone") & "")

  If mName = "" Or Len(mPhone) < 10 Then
    Response.Write "{""verified"":false,""message"":""이름과 휴대폰 번호를 확인해 주세요.""}"
    Response.End
  End If

  branchId = GetDefaultBranchId()
  matchedStudentNo = TryMatchFarmerFromNselfhelp(branchId, mName, mPhone)
  If matchedStudentNo = "" Then
    matchedStudentNo = TryMatchFarmerFromNselfhelp(branchId, mName, FormatHyphenPhone(mPhone))
  End If

  If matchedStudentNo <> "" Then
    Response.Write "{""verified"":true,""member"":{""id"":""" & JsonEscape(matchedStudentNo) & """,""name"":""" & JsonEscape(mName) & """}}"
  Else
    Response.Write "{""verified"":false,""message"":""일치하는 회원 정보가 없습니다. 이름과 휴대폰 번호를 확인해 주세요.""}"
  End If
  Response.End
End If

Response.Write "{""ok"":false,""message"":""알 수 없는 요청입니다.""}"
Call CloseDB()
%>
