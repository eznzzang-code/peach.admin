<%@ Language="VBScript" CodePage="65001" %>
<%
' =============================================================
' 상시 재배력 AJAX API (USP_ADMIN_CALENDAR_* 호출 & TABSUpload)
' 파일 위치: /proc/calendar_proc.asp
' =============================================================
Response.CharSet = "UTF-8"
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

' 멀티파트 요청 여부 판단 (파일 업로드 시)
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
        Response.Write "{""success"":false,""message"":""TABSUpload4 컴포넌트 로드 실패: " & JsonEscape(Err.Description) & " (IIS 응용 프로그램 풀에서 32비트 사용 설정을 확인하세요)""}"
        Response.End
    End If
    On Error GoTo 0

    upload.CodePage = 65001

    uploadDir = Server.MapPath("/uploads/calendar")
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

Sub SaveCalendarImage(calendarId, channelType, sortOrder, origName, savedName, filePath)
    Dim imgCmd
    Set imgCmd = Server.CreateObject("ADODB.Command")
    imgCmd.ActiveConnection = dbConn
    imgCmd.CommandText = "USP_ADMIN_CALENDAR_IMAGE_ADD"
    imgCmd.CommandType = adCmdStoredProc
    imgCmd.Parameters.Append imgCmd.CreateParameter("@p_calendar_id", adInteger, adParamInput, 4, calendarId)
    imgCmd.Parameters.Append imgCmd.CreateParameter("@p_channel_type", adVarChar, adParamInput, 10, channelType)
    imgCmd.Parameters.Append imgCmd.CreateParameter("@p_sort_order", adInteger, adParamInput, 4, sortOrder)
    imgCmd.Parameters.Append imgCmd.CreateParameter("@p_original_name", adVarChar, adParamInput, 260, origName)
    imgCmd.Parameters.Append imgCmd.CreateParameter("@p_saved_name", adVarChar, adParamInput, 260, savedName)
    imgCmd.Parameters.Append imgCmd.CreateParameter("@p_file_path", adVarChar, adParamInput, 500, filePath)
    imgCmd.Execute
    Set imgCmd = Nothing
End Sub

Select Case action

    ' ---------------------------------------------------------
    ' [1] 상시 재배력 조회 (USP_ADMIN_CALENDAR_GET)
    ' ---------------------------------------------------------
    Case "get"
        Dim cal_year
        cal_year = Request("year")
        If cal_year = "" Or Not IsNumeric(cal_year) Then cal_year = Year(Now())

        Dim cmd, rs
        Set cmd = Server.CreateObject("ADODB.Command")
        cmd.ActiveConnection = dbConn
        cmd.CommandText = "USP_ADMIN_CALENDAR_GET"
        cmd.CommandType = adCmdStoredProc
        cmd.Parameters.Append cmd.CreateParameter("@p_year", adInteger, adParamInput, 4, CInt(cal_year))

        Set rs = Server.CreateObject("ADODB.Recordset")
        rs.CursorLocation = 3
        rs.Open cmd, , 1, 1

        If rs.EOF Then
            Response.Write "{"
            Response.Write """success"":true,"
            Response.Write """item"":null"
            Response.Write "}"
        Else
            Dim chList
            chList = "["
            If rs("channel_web") = "Y" And rs("channel_app") = "Y" Then
                chList = "[""Web"",""App""]"
            ElseIf rs("channel_web") = "Y" Then
                chList = "[""Web""]"
            ElseIf rs("channel_app") = "Y" Then
                chList = "[""App""]"
            Else
                chList = "[]"
            End If

            Response.Write "{"
            Response.Write """success"":true,"
            Response.Write """item"":{"
            Response.Write """id"":" & rs("calendar_id") & ","
            Response.Write """year"":" & rs("target_year") & ","
            Response.Write """title"":""" & JsonEscape(rs("title")) & ""","
            Response.Write """thumbnail"":""" & JsonEscape(rs("thumbnail_path")) & ""","
            Response.Write """visibility"":""" & JsonEscape(rs("visibility")) & ""","
            Response.Write """channels"":" & chList & ","
            Response.Write """updatedAt"":""" & FormatDotDate(rs("updated_at")) & """"
            Response.Write "},"

            ' 채널별 이미지 목록
            Set rs = rs.NextRecordset
            Response.Write """images"":["
            Dim first
            first = True
            Do While Not (rs Is Nothing)
                If rs.State = 0 Then Exit Do
                If rs.EOF Then Exit Do
                If Not first Then Response.Write ","
                first = False
                Response.Write "{"
                Response.Write """id"":" & rs("image_id") & ","
                Response.Write """channel"":""" & JsonEscape(rs("channel_type")) & ""","
                Response.Write """sortOrder"":" & rs("sort_order") & ","
                Response.Write """name"":""" & JsonEscape(rs("original_name")) & ""","
                Response.Write """path"":""" & JsonEscape(rs("file_path")) & """"
                Response.Write "}"
                rs.MoveNext
            Loop
            Response.Write "]"
            Response.Write "}"
        End If

        If Not rs Is Nothing Then
            If rs.State <> 0 Then rs.Close
            Set rs = Nothing
        End If
        Set cmd = Nothing

    ' ---------------------------------------------------------
    ' [2] 상시 재배력 저장 (USP_ADMIN_CALENDAR_SAVE & 이미지 저장)
    ' ---------------------------------------------------------
    Case "save"
        Dim c_yr, c_ttl, c_thumb, c_vis, c_channels, c_chWeb, c_chApp

        c_yr       = CInt("0" & GetFormField("year"))
        If c_yr = 0 Then c_yr = Year(Now())
        c_ttl      = GetFormField("title")
        c_thumb    = GetFormField("thumbnail")
        c_vis      = GetFormField("visibility")
        c_channels = GetFormField("channels")

        c_chWeb = "N": c_chApp = "N"
        If InStr(c_channels, "Web") > 0 Then c_chWeb = "Y"
        If InStr(c_channels, "App") > 0 Then c_chApp = "Y"

        ' 썸네일 파일 업로드 처리
        If isMultipart Then
            Dim tFile, tExt, tSaved, hasNewThumb, tSize
            hasNewThumb = False
            On Error Resume Next
            Set tFile = upload.Form("thumbnail_file")
            If Not tFile Is Nothing Then
                tSize = tFile.FileSize
                If Err.Number = 0 And tSize > 0 Then hasNewThumb = True
            End If
            On Error GoTo 0

            If hasNewThumb Then
                tExt = Mid(tFile.FileName, InStrRev(tFile.FileName, "."))
                tSaved = "cal_thumb_" & c_yr & "_" & Replace(Replace(Replace(Now(), "-", ""), " ", "_"), ":", "") & "_" & Int(Rnd * 10000) & tExt
                tFile.SaveAs uploadDir & "\" & tSaved, True
                c_thumb = "/uploads/calendar/" & tSaved
            End If
        End If

        Set cmd = Server.CreateObject("ADODB.Command")
        cmd.ActiveConnection = dbConn
        cmd.CommandText = "USP_ADMIN_CALENDAR_SAVE"
        cmd.CommandType = adCmdStoredProc

        cmd.Parameters.Append cmd.CreateParameter("@p_year", adInteger, adParamInput, 4, c_yr)
        cmd.Parameters.Append cmd.CreateParameter("@p_title", adVarChar, adParamInput, 200, c_ttl)
        cmd.Parameters.Append cmd.CreateParameter("@p_thumbnail_path", adVarChar, adParamInput, 500, c_thumb)
        cmd.Parameters.Append cmd.CreateParameter("@p_visibility", adVarChar, adParamInput, 10, c_vis)
        cmd.Parameters.Append cmd.CreateParameter("@p_channel_web", adChar, adParamInput, 1, c_chWeb)
        cmd.Parameters.Append cmd.CreateParameter("@p_channel_app", adChar, adParamInput, 1, c_chApp)
        cmd.Parameters.Append cmd.CreateParameter("@p_author_id", adVarChar, adParamInput, 50, "admin")
        cmd.Parameters.Append cmd.CreateParameter("@r_calendar_id", adInteger, adParamOutput, 4, 0)

        cmd.Execute
        Dim new_cal_id
        new_cal_id = cmd.Parameters("@r_calendar_id").Value
        Set cmd = Nothing

        ' 본문 이미지 목록 저장 (TBL_CALENDAR_IMAGE)
        If new_cal_id > 0 Then
            ' 기존 이미지 일괄 삭제 후 재등록
            Dim clearCmd
            Set clearCmd = Server.CreateObject("ADODB.Command")
            clearCmd.ActiveConnection = dbConn
            clearCmd.CommandText = "USP_ADMIN_CALENDAR_IMAGE_CLEAR"
            clearCmd.CommandType = adCmdStoredProc
            clearCmd.Parameters.Append clearCmd.CreateParameter("@p_calendar_id", adInteger, adParamInput, 4, new_cal_id)
            clearCmd.Execute
            Set clearCmd = Nothing

            ' Web 이미지
            Dim webCount, wIdx, wKind, wFile, wExt, wSaved, wOrig, wPath
            webCount = CInt("0" & GetFormField("web_count"))
            For wIdx = 0 To webCount - 1
                wKind = GetFormField("web_item_kind_" & wIdx)
                If wKind = "new" And isMultipart Then
                    Dim hasNewWeb, wSize
                    hasNewWeb = False
                    On Error Resume Next
                    Set wFile = upload.Form("web_file_" & wIdx)
                    If Not wFile Is Nothing Then
                        wSize = wFile.FileSize
                        If Err.Number = 0 And wSize > 0 Then hasNewWeb = True
                    End If
                    On Error GoTo 0

                    If hasNewWeb Then
                        wExt = Mid(wFile.FileName, InStrRev(wFile.FileName, "."))
                        wSaved = "cal_web_" & new_cal_id & "_" & (wIdx + 1) & "_" & Replace(Replace(Replace(Now(), "-", ""), " ", "_"), ":", "") & "_" & Int(Rnd * 10000) & wExt
                        wFile.SaveAs uploadDir & "\" & wSaved, True
                        Call SaveCalendarImage(new_cal_id, "WEB", (wIdx + 1), wFile.FileName, wSaved, "/uploads/calendar/" & wSaved)
                    End If
                ElseIf wKind = "keep" Then
                    wOrig = GetFormField("web_item_name_" & wIdx)
                    wPath = GetFormField("web_item_path_" & wIdx)
                    wSaved = Mid(wPath, InStrRev(wPath, "/") + 1)
                    Call SaveCalendarImage(new_cal_id, "WEB", (wIdx + 1), wOrig, wSaved, wPath)
                End If
            Next

            ' App 이미지
            Dim appCount, aIdx, aKind, aFile, aExt, aSaved, aOrig, aPath
            appCount = CInt("0" & GetFormField("app_count"))
            For aIdx = 0 To appCount - 1
                aKind = GetFormField("app_item_kind_" & aIdx)
                If aKind = "new" And isMultipart Then
                    Dim hasNewApp, aSize
                    hasNewApp = False
                    On Error Resume Next
                    Set aFile = upload.Form("app_file_" & aIdx)
                    If Not aFile Is Nothing Then
                        aSize = aFile.FileSize
                        If Err.Number = 0 And aSize > 0 Then hasNewApp = True
                    End If
                    On Error GoTo 0

                    If hasNewApp Then
                        aExt = Mid(aFile.FileName, InStrRev(aFile.FileName, "."))
                        aSaved = "cal_app_" & new_cal_id & "_" & (aIdx + 1) & "_" & Replace(Replace(Replace(Now(), "-", ""), " ", "_"), ":", "") & "_" & Int(Rnd * 10000) & aExt
                        aFile.SaveAs uploadDir & "\" & aSaved, True
                        Call SaveCalendarImage(new_cal_id, "APP", (aIdx + 1), aFile.FileName, aSaved, "/uploads/calendar/" & aSaved)
                    End If
                ElseIf aKind = "keep" Then
                    aOrig = GetFormField("app_item_name_" & aIdx)
                    aPath = GetFormField("app_item_path_" & aIdx)
                    aSaved = Mid(aPath, InStrRev(aPath, "/") + 1)
                    Call SaveCalendarImage(new_cal_id, "APP", (aIdx + 1), aOrig, aSaved, aPath)
                End If
            Next
        End If

        Response.Write "{""success"":true,""id"":" & new_cal_id & "}"

    Case Else
        Response.Write "{""success"":false,""message"":""알 수 없는 요청입니다.""}"
End Select

Call CloseDB()
%>
