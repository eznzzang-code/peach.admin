<%@ Language="VBScript" CodePage="65001" %>
<%
' =============================================================
' 교육영상 관리 AJAX API (USP_ADMIN_VIDEO_* 호출 & TABSUpload)
' 파일 위치: /proc/video_proc.asp
' =============================================================
Response.Charset = "UTF-8"
Response.ContentType = "application/json"
Response.Buffer = True
Response.Expires = -1
%>
<!--#include virtual="/inc/dbconn.asp"-->
<%
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

Function FormatDotDate(dt)
  If IsNull(dt) Or Not IsDate(dt) Then
    FormatDotDate = ""
    Exit Function
  End If
  Dim y, m, d
  y = Year(dt)
  m = Month(dt)
  d = Day(dt)
  If m < 10 Then m = "0" & m
  If d < 10 Then d = "0" & d
  FormatDotDate = y & "." & m & "." & d
End Function

Dim isMultipart
isMultipart = False
If InStr(LCase(Request.ServerVariables("CONTENT_TYPE")), "multipart/form-data") > 0 Then
  isMultipart = True
End If

Dim upload, uploadDir, fso, action
Set upload = Nothing

If isMultipart Then
  On Error Resume Next
  Set upload = Server.CreateObject("TABSUpload4.Upload")
  If Err.Number <> 0 Then
    Response.Write "{""success"":false,""message"":""TABSUpload4 컴포넌트 로드 실패: " & JsonEscape(Err.Description) & """}"
    Response.End
  End If
  On Error GoTo 0

  upload.CodePage = 65001

  uploadDir = Server.MapPath("/uploads/videos")
  Set fso = Server.CreateObject("Scripting.FileSystemObject")
  If Not fso.FolderExists(Server.MapPath("/uploads")) Then
    fso.CreateFolder(Server.MapPath("/uploads"))
  End If
  If Not fso.FolderExists(uploadDir) Then
    fso.CreateFolder(uploadDir)
  End If
  Set fso = Nothing

  upload.Start uploadDir
  action = CStr(upload.Form("action"))
Else
  action = CStr(Request("action"))
  If action = "" Then action = CStr(Request.Form("action"))
End If
action = LCase(Trim(action))

Function GetFormField(name)
  If isMultipart Then
    GetFormField = upload.Form(name)
  Else
    GetFormField = Request.Form(name)
    If GetFormField = "" Then GetFormField = Request(name)
  End If
End Function

Call OpenDB()

Select Case action

  ' ---------------------------------------------------------
  ' [1] 교육영상 목록 조회
  ' ---------------------------------------------------------
  Case "list"
    Dim category, keyword
    category = Request("category")
    keyword = Request("keyword")

    Dim cmd, rs
    Set cmd = Server.CreateObject("ADODB.Command")
    cmd.ActiveConnection = dbConn
    cmd.CommandText = "USP_ADMIN_VIDEO_LIST"
    cmd.CommandType = adCmdStoredProc
    cmd.Parameters.Append cmd.CreateParameter("@p_category", adVarChar, adParamInput, 50, category)
    cmd.Parameters.Append cmd.CreateParameter("@p_keyword", adVarChar, adParamInput, 100, keyword)

    Set rs = Server.CreateObject("ADODB.Recordset")
    rs.CursorLocation = 3
    rs.Open cmd, , 1, 1

    Response.Write "{"
    Response.Write """success"":true,"
    Response.Write """items"":["

    Dim first
    first = True
    Do While Not rs.EOF
      If Not first Then Response.Write ","
      first = False

      Dim channelsJson, homesJson, isMainBool
      If rs("channel_web") = "Y" And rs("channel_app") = "Y" Then
        channelsJson = "[""Web"",""App""]"
      ElseIf rs("channel_web") = "Y" Then
        channelsJson = "[""Web""]"
      ElseIf rs("channel_app") = "Y" Then
        channelsJson = "[""App""]"
      Else
        channelsJson = "[]"
      End If

      isMainBool = (rs("is_home_web") = "Y" Or rs("is_home_app") = "Y")
      If isMainBool Then
        homesJson = "[""Web"",""App""]"
      Else
        homesJson = "[]"
      End If

      Response.Write "{"
      Response.Write """id"":" & rs("video_id") & ","
      Response.Write """youtubeId"":""" & JsonEscape(rs("youtube_id")) & ""","
      Response.Write """originalId"":""" & JsonEscape(rs("youtube_id")) & ""","
      Response.Write """originalUrl"":""" & JsonEscape(rs("source_url")) & ""","
      Response.Write """displayTitle"":""" & JsonEscape(rs("display_title")) & ""","
      Response.Write """originalTitle"":""" & JsonEscape(rs("original_title")) & ""","
      Response.Write """category"":""" & JsonEscape(rs("category")) & ""","
      Response.Write """thumbnail"":""" & JsonEscape(rs("thumbnail_url")) & ""","
      Response.Write """duration"":""" & JsonEscape(rs("duration_text")) & ""","
      Response.Write """playable"":" & LCase(CStr(rs("is_playable") = "Y")) & ","
      Response.Write """visibility"":""" & JsonEscape(rs("visibility")) & ""","
      Response.Write """channels"":" & channelsJson & ","
      Response.Write """homeChannels"":" & homesJson & ","
      Response.Write """mainSelected"":" & LCase(CStr(isMainBool)) & ","
      Response.Write """publishStart"":""" & FormatDotDate(rs("period_start")) & ""","
      Response.Write """publishEnd"":""" & FormatDotDate(rs("period_end")) & ""","
      Response.Write """noEnd"":" & LCase(CStr(rs("has_end_date") = "N")) & ","
      Response.Write """collectedAt"":""" & FormatDotDate(rs("updated_at")) & ""","
      Response.Write """collectionStatus"":""직접 등록"""
      Response.Write "}"

      rs.MoveNext
    Loop

    Response.Write "]"
    Response.Write "}"

    rs.Close
    Set rs = Nothing
    Set cmd = Nothing

  ' ---------------------------------------------------------
  ' [2] 교육영상 단건 상세 조회
  ' ---------------------------------------------------------
  Case "get"
    Dim id
    id = Request("id")
    Set cmd = Server.CreateObject("ADODB.Command")
    cmd.ActiveConnection = dbConn
    cmd.CommandText = "USP_ADMIN_VIDEO_GET"
    cmd.CommandType = adCmdStoredProc
    cmd.Parameters.Append cmd.CreateParameter("@p_video_id", adInteger, adParamInput, 4, CLng(id))

    Set rs = Server.CreateObject("ADODB.Recordset")
    rs.CursorLocation = 3
    rs.Open cmd, , 1, 1

    If rs.EOF Then
      Response.Write "{""success"":false,""message"":""영상을 찾을 수 없습니다.""}"
    Else
      If rs("channel_web") = "Y" And rs("channel_app") = "Y" Then
        channelsJson = "[""Web"",""App""]"
      ElseIf rs("channel_web") = "Y" Then
        channelsJson = "[""Web""]"
      ElseIf rs("channel_app") = "Y" Then
        channelsJson = "[""App""]"
      Else
        channelsJson = "[]"
      End If

      isMainBool = (rs("is_home_web") = "Y" Or rs("is_home_app") = "Y")
      If isMainBool Then
        homesJson = "[""Web"",""App""]"
      Else
        homesJson = "[]"
      End If

      Dim attachJson
      If CStr(rs("attach_name") & "") <> "" Then
        attachJson = "{""name"":""" & JsonEscape(rs("attach_name")) & """,""path"":""" & JsonEscape(rs("attach_path")) & """}"
      Else
        attachJson = "null"
      End If

      Response.Write "{"
      Response.Write """success"":true,"
      Response.Write """item"":{"
      Response.Write """id"":" & rs("video_id") & ","
      Response.Write """youtubeId"":""" & JsonEscape(rs("youtube_id")) & ""","
      Response.Write """originalId"":""" & JsonEscape(rs("youtube_id")) & ""","
      Response.Write """originalUrl"":""" & JsonEscape(rs("source_url")) & ""","
      Response.Write """displayTitle"":""" & JsonEscape(rs("display_title")) & ""","
      Response.Write """originalTitle"":""" & JsonEscape(rs("original_title")) & ""","
      Response.Write """category"":""" & JsonEscape(rs("category")) & ""","
      Response.Write """description"":""" & JsonEscape(rs("description")) & ""","
      Response.Write """thumbnail"":""" & JsonEscape(rs("thumbnail_url")) & ""","
      Response.Write """duration"":""" & JsonEscape(rs("duration_text")) & ""","
      Response.Write """playable"":" & LCase(CStr(rs("is_playable") = "Y")) & ","
      Response.Write """visibility"":""" & JsonEscape(rs("visibility")) & ""","
      Response.Write """channels"":" & channelsJson & ","
      Response.Write """homeChannels"":" & homesJson & ","
      Response.Write """mainSelected"":" & LCase(CStr(isMainBool)) & ","
      Response.Write """publishStart"":""" & FormatDotDate(rs("period_start")) & ""","
      Response.Write """publishEnd"":""" & FormatDotDate(rs("period_end")) & ""","
      Response.Write """noEnd"":" & LCase(CStr(rs("has_end_date") = "N")) & ","
      Response.Write """collectedAt"":""" & FormatDotDate(rs("updated_at")) & ""","
      Response.Write """collectionStatus"":""직접 등록"","
      Response.Write """attachment"":" & attachJson
      Response.Write "}"
      Response.Write "}"
    End If

    rs.Close
    Set rs = Nothing
    Set cmd = Nothing

  ' ---------------------------------------------------------
  ' [3] 교육영상 등록/수정 (USP_ADMIN_VIDEO_SAVE)
  ' ---------------------------------------------------------
  Case "save"
    Dim v_id, v_ytId, v_url, v_title, v_origTitle, v_cat, v_desc, v_thumb, v_dur, v_vis
    Dim v_chWeb, v_chApp, v_hWeb, v_hApp, v_mainSelected
    Dim v_pStart, v_pEnd, v_noEnd
    Dim v_attName, v_attPath

    Dim rawId
    rawId = Trim(CStr(GetFormField("id") & ""))
    If rawId = "" Or Not IsNumeric(rawId) Then
      v_id = 0
    Else
      v_id = CLng(rawId)
    End If

    v_ytId = Trim(CStr(GetFormField("youtubeId") & ""))
    v_url = Trim(CStr(GetFormField("originalUrl") & ""))
    v_title = Trim(CStr(GetFormField("displayTitle") & ""))
    v_origTitle = Trim(CStr(GetFormField("originalTitle") & ""))
    If v_origTitle = "" Then v_origTitle = v_title
    v_cat = Trim(CStr(GetFormField("category") & ""))
    v_desc = CStr(GetFormField("description") & "")
    v_thumb = Trim(CStr(GetFormField("thumbnail") & ""))
    If v_thumb = "" And v_ytId <> "" Then
      v_thumb = "https://i.ytimg.com/vi/" & v_ytId & "/hqdefault.jpg"
    End If
    v_dur = Trim(CStr(GetFormField("duration") & ""))
    v_vis = Trim(CStr(GetFormField("visibility") & ""))
    If v_vis = "" Then v_vis = "public"
    v_mainSelected = LCase(Trim(CStr(GetFormField("mainSelected") & "")))
    v_pStart = Trim(CStr(GetFormField("publishStart") & ""))
    v_pEnd = Trim(CStr(GetFormField("publishEnd") & ""))
    v_noEnd = LCase(Trim(CStr(GetFormField("noEnd") & "")))
    v_attName = Trim(CStr(GetFormField("attachmentName") & ""))
    v_attPath = Trim(CStr(GetFormField("attachmentPath") & ""))

    If isMultipart Then
      Dim attFile, attExt, attSaved, hasNewAtt, attSize
      hasNewAtt = False
      On Error Resume Next
      Set attFile = upload.Form("attachment_file")
      If Not attFile Is Nothing Then
        attSize = attFile.FileSize
        If Err.Number = 0 And attSize > 0 Then hasNewAtt = True
      End If
      On Error GoTo 0

      If hasNewAtt Then
        attExt = Mid(attFile.FileName, InStrRev(attFile.FileName, "."))
        attSaved = "video_" & v_id & "_" & Replace(Replace(Replace(Now(), "-", ""), " ", "_"), ":", "") & "_" & Int(Rnd * 10000) & attExt
        attFile.SaveAs uploadDir & "\" & attSaved, True
        v_attName = attFile.FileName
        v_attPath = "/uploads/videos/" & attSaved
      End If
    End If

    v_chWeb = "Y": v_chApp = "Y"
    If v_mainSelected = "true" Or v_mainSelected = "1" Or v_mainSelected = "y" Then
      v_hWeb = "Y"
      v_hApp = "Y"
    Else
      v_hWeb = "N"
      v_hApp = "N"
    End If

    Dim v_hasEnd
    If v_noEnd = "true" Or v_pEnd = "" Then
      v_hasEnd = "N"
      v_pEnd = Null
    Else
      v_hasEnd = "Y"
      v_pEnd = Replace(v_pEnd, ".", "-")
    End If
    v_pStart = Replace(v_pStart, ".", "-")

    Set cmd = Server.CreateObject("ADODB.Command")
    cmd.ActiveConnection = dbConn
    cmd.CommandText = "USP_ADMIN_VIDEO_SAVE"
    cmd.CommandType = adCmdStoredProc

    cmd.Parameters.Append cmd.CreateParameter("@p_video_id", adInteger, adParamInput, 4, v_id)
    cmd.Parameters.Append cmd.CreateParameter("@p_youtube_id", adVarChar, adParamInput, 50, v_ytId)
    cmd.Parameters.Append cmd.CreateParameter("@p_source_url", adVarWChar, adParamInput, 500, v_url)
    cmd.Parameters.Append cmd.CreateParameter("@p_display_title", adVarWChar, adParamInput, 200, v_title)
    cmd.Parameters.Append cmd.CreateParameter("@p_original_title", adVarWChar, adParamInput, 200, v_origTitle)
    cmd.Parameters.Append cmd.CreateParameter("@p_category", adVarWChar, adParamInput, 50, v_cat)
    cmd.Parameters.Append cmd.CreateParameter("@p_description", adLongVarWChar, adParamInput, Len(v_desc) + 1, v_desc)
    cmd.Parameters.Append cmd.CreateParameter("@p_thumbnail_url", adVarWChar, adParamInput, 500, v_thumb)
    cmd.Parameters.Append cmd.CreateParameter("@p_duration_text", adVarChar, adParamInput, 20, v_dur)
    cmd.Parameters.Append cmd.CreateParameter("@p_is_playable", adChar, adParamInput, 1, "Y")
    cmd.Parameters.Append cmd.CreateParameter("@p_visibility", adVarChar, adParamInput, 10, v_vis)
    cmd.Parameters.Append cmd.CreateParameter("@p_channel_web", adChar, adParamInput, 1, v_chWeb)
    cmd.Parameters.Append cmd.CreateParameter("@p_channel_app", adChar, adParamInput, 1, v_chApp)
    cmd.Parameters.Append cmd.CreateParameter("@p_is_home_web", adChar, adParamInput, 1, v_hWeb)
    cmd.Parameters.Append cmd.CreateParameter("@p_is_home_app", adChar, adParamInput, 1, v_hApp)
    cmd.Parameters.Append cmd.CreateParameter("@p_period_start", adDate, adParamInput, 8, CDate(v_pStart))
    If IsNull(v_pEnd) Then
      cmd.Parameters.Append cmd.CreateParameter("@p_period_end", adDate, adParamInput, 8, Null)
    Else
      cmd.Parameters.Append cmd.CreateParameter("@p_period_end", adDate, adParamInput, 8, CDate(v_pEnd))
    End If
    cmd.Parameters.Append cmd.CreateParameter("@p_has_end_date", adChar, adParamInput, 1, v_hasEnd)
    If v_attName = "" Then
      cmd.Parameters.Append cmd.CreateParameter("@p_attach_name", adVarWChar, adParamInput, 260, Null)
      cmd.Parameters.Append cmd.CreateParameter("@p_attach_path", adVarWChar, adParamInput, 500, Null)
    Else
      cmd.Parameters.Append cmd.CreateParameter("@p_attach_name", adVarWChar, adParamInput, 260, v_attName)
      cmd.Parameters.Append cmd.CreateParameter("@p_attach_path", adVarWChar, adParamInput, 500, v_attPath)
    End If
    cmd.Parameters.Append cmd.CreateParameter("@r_video_id", adInteger, adParamOutput, 4)

    cmd.Execute
    Dim savedVideoId
    savedVideoId = cmd.Parameters("@r_video_id").Value
    Set cmd = Nothing

    Response.Write "{""success"":true,""id"":" & CLng(savedVideoId) & "}"

  ' ---------------------------------------------------------
  ' [4] 교육영상 삭제 (USP_ADMIN_VIDEO_DELETE)
  ' ---------------------------------------------------------
  Case "delete"
    Dim del_id
    del_id = CLng(GetFormField("id"))

    Set cmd = Server.CreateObject("ADODB.Command")
    cmd.ActiveConnection = dbConn
    cmd.CommandText = "USP_ADMIN_VIDEO_DELETE"
    cmd.CommandType = adCmdStoredProc
    cmd.Parameters.Append cmd.CreateParameter("@p_video_id", adInteger, adParamInput, 4, del_id)
    cmd.Execute
    Set cmd = Nothing

    Response.Write "{""success"":true}"

  Case Else
    Response.Write "{""success"":false,""message"":""알 수 없는 요청입니다.""}"
End Select

Call CloseDB()
%>
