<%@ Language="VBScript" CodePage="65001" %>
<%
' =============================================================
' 월별 과원관리 AJAX API (USP_ADMIN_ORCHARD_* 호출 & TABSUpload)
' 파일 위치: /proc/orchard_proc.asp
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

Dim upload, uploadDir, fso
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

    uploadDir = Server.MapPath("/uploads/orchard")
    Set fso = Server.CreateObject("Scripting.FileSystemObject")
    If Not fso.FolderExists(Server.MapPath("/uploads")) Then
        fso.CreateFolder(Server.MapPath("/uploads"))
    End If
    If Not fso.FolderExists(uploadDir) Then
        fso.CreateFolder(uploadDir)
    End If
    Set fso = Nothing

    ' 임시 업로드 시작
    upload.Start uploadDir

    action = upload.Form("action")
Else
    action = Request("action")
    If action = "" Then action = Request.Form("action")
End If

Function GetFormField(name)
    If isMultipart Then
        GetFormField = upload.Form(name)
    Else
        GetFormField = Request.Form(name)
        If GetFormField = "" Then GetFormField = Request(name)
    End If
End Function

Sub SaveOrchardImage(orchardId, channelType, sortOrder, origName, savedName, filePath)
    Dim imgCmd
    Set imgCmd = Server.CreateObject("ADODB.Command")
    imgCmd.ActiveConnection = dbConn
    imgCmd.CommandText = "USP_ADMIN_ORCHARD_IMAGE_ADD"
    imgCmd.CommandType = adCmdStoredProc

    imgCmd.Parameters.Append imgCmd.CreateParameter("@p_orchard_id", adInteger, adParamInput, 4, orchardId)
    imgCmd.Parameters.Append imgCmd.CreateParameter("@p_channel_type", adVarChar, adParamInput, 10, channelType)
    imgCmd.Parameters.Append imgCmd.CreateParameter("@p_sort_order", adInteger, adParamInput, 4, sortOrder)
    imgCmd.Parameters.Append imgCmd.CreateParameter("@p_original_name", adVarChar, adParamInput, 260, origName)
    imgCmd.Parameters.Append imgCmd.CreateParameter("@p_saved_name", adVarChar, adParamInput, 260, savedName)
    imgCmd.Parameters.Append imgCmd.CreateParameter("@p_file_path", adVarChar, adParamInput, 500, filePath)

    imgCmd.Execute
    Set imgCmd = Nothing
End Sub

Call OpenDB()

Select Case action

    ' ---------------------------------------------------------
    ' [1] 연도별 1~12월 목록 조회 (USP_ADMIN_ORCHARD_LIST)
    ' ---------------------------------------------------------
    Case "list"
        Dim target_year
        target_year = Request("year")
        If target_year = "" Or Not IsNumeric(target_year) Then target_year = Year(Now())

        Dim cmd, rs
        Set cmd = Server.CreateObject("ADODB.Command")
        cmd.ActiveConnection = dbConn
        cmd.CommandText = "USP_ADMIN_ORCHARD_LIST"
        cmd.CommandType = adCmdStoredProc
        cmd.Parameters.Append cmd.CreateParameter("@p_year", adInteger, adParamInput, 4, CInt(target_year))

        Set rs = Server.CreateObject("ADODB.Recordset")
        rs.CursorLocation = 3
        rs.Open cmd, , 1, 1

        Response.Write "{"
        Response.Write """success"":true,"
        Response.Write """year"":" & target_year & ","
        Response.Write """items"":["

        Dim first
        first = True
        Do While Not rs.EOF
            If Not first Then Response.Write ","
            first = False

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
            Response.Write """month"":" & rs("target_month") & ","
            Response.Write """id"":" & (rs("orchard_id") & "") & ","
            Response.Write """title"":""" & JsonEscape(rs("title")) & ""","
            Response.Write """thumbnail"":""" & JsonEscape(rs("thumbnail_path")) & ""","
            Response.Write """visibility"":""" & JsonEscape(rs("visibility")) & ""","
            Response.Write """channels"":" & chList & ","
            Response.Write """status"":""" & JsonEscape(rs("status")) & ""","
            Response.Write """updatedAt"":""" & FormatDotDate(rs("updated_at")) & """"
            Response.Write "}"

            rs.MoveNext
        Loop

        Response.Write "]"
        Response.Write "}"

        rs.Close
        Set rs = Nothing
        Set cmd = Nothing

    ' ---------------------------------------------------------
    ' [2] 단건 상세 조회 (USP_ADMIN_ORCHARD_GET)
    ' ---------------------------------------------------------
    Case "get"
        Dim g_year, g_month
        g_year = Request("year")
        g_month = Request("month")

        Set cmd = Server.CreateObject("ADODB.Command")
        cmd.ActiveConnection = dbConn
        cmd.CommandText = "USP_ADMIN_ORCHARD_GET"
        cmd.CommandType = adCmdStoredProc
        cmd.Parameters.Append cmd.CreateParameter("@p_year", adInteger, adParamInput, 4, CInt(g_year))
        cmd.Parameters.Append cmd.CreateParameter("@p_month", adInteger, adParamInput, 4, CInt(g_month))

        Set rs = Server.CreateObject("ADODB.Recordset")
        rs.CursorLocation = 3
        rs.Open cmd, , 1, 1

        If rs.EOF Then
            Response.Write "{""success"":false,""message"":""해당 월의 자료가 없습니다.""}"
        Else
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
            Response.Write """id"":" & rs("orchard_id") & ","
            Response.Write """year"":" & rs("target_year") & ","
            Response.Write """month"":" & rs("target_month") & ","
            Response.Write """title"":""" & JsonEscape(rs("title")) & ""","
            Response.Write """thumbnail"":""" & JsonEscape(rs("thumbnail_path")) & ""","
            Response.Write """visibility"":""" & JsonEscape(rs("visibility")) & ""","
            Response.Write """channels"":" & chList & ","
            Response.Write """updatedAt"":""" & FormatDotDate(rs("updated_at")) & """"
            Response.Write "},"

            ' 채널별 이미지 목록
            Set rs = rs.NextRecordset
            Response.Write """images"":["
            first = True
            Do While Not rs.EOF
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

        rs.Close
        Set rs = Nothing
        Set cmd = Nothing

    ' ---------------------------------------------------------
    ' [3] 과원관리 저장 (USP_ADMIN_ORCHARD_SAVE & TABSUpload)
    ' ---------------------------------------------------------
    Case "save"
        Dim s_yr, s_mo, s_ttl, s_thumb, s_vis, s_channels, s_chWeb, s_chApp

        s_yr       = CInt(GetFormField("year"))
        s_mo       = CInt(GetFormField("month"))
        s_ttl      = GetFormField("title")
        s_thumb    = GetFormField("thumbnail_existing")
        s_vis      = GetFormField("visibility")
        s_channels = GetFormField("channels")

        s_chWeb = "N": s_chApp = "N"
        If InStr(s_channels, "Web") > 0 Then s_chWeb = "Y"
        If InStr(s_channels, "App") > 0 Then s_chApp = "Y"

        ' 신규 썸네일 업로드 처리
        If isMultipart Then
            On Error Resume Next
            Dim thumbFile, tExt, tSavedName
            Set thumbFile = upload.Form("thumbnail_file")
            If Not thumbFile Is Nothing Then
                If thumbFile.FileSize > 0 Then
                    tExt = Mid(thumbFile.FileName, InStrRev(thumbFile.FileName, "."))
                    tSavedName = "thumb_" & s_yr & "_" & s_mo & "_" & Replace(Replace(Replace(Now(), "-", ""), " ", "_"), ":", "") & "_" & Int(Rnd * 10000) & tExt
                    thumbFile.SaveAs uploadDir & "\" & tSavedName, True
                    s_thumb = "/uploads/orchard/" & tSavedName
                End If
            End If
            On Error GoTo 0
        End If

        ' 1) 기본정보 저장
        Set cmd = Server.CreateObject("ADODB.Command")
        cmd.ActiveConnection = dbConn
        cmd.CommandText = "USP_ADMIN_ORCHARD_SAVE"
        cmd.CommandType = adCmdStoredProc

        cmd.Parameters.Append cmd.CreateParameter("@p_year", adInteger, adParamInput, 4, s_yr)
        cmd.Parameters.Append cmd.CreateParameter("@p_month", adInteger, adParamInput, 4, s_mo)
        cmd.Parameters.Append cmd.CreateParameter("@p_title", adVarChar, adParamInput, 200, s_ttl)
        cmd.Parameters.Append cmd.CreateParameter("@p_thumbnail_path", adVarChar, adParamInput, 500, s_thumb)
        cmd.Parameters.Append cmd.CreateParameter("@p_visibility", adVarChar, adParamInput, 10, s_vis)
        cmd.Parameters.Append cmd.CreateParameter("@p_channel_web", adChar, adParamInput, 1, s_chWeb)
        cmd.Parameters.Append cmd.CreateParameter("@p_channel_app", adChar, adParamInput, 1, s_chApp)
        cmd.Parameters.Append cmd.CreateParameter("@p_author_id", adVarChar, adParamInput, 50, "admin")
        cmd.Parameters.Append cmd.CreateParameter("@r_orchard_id", adInteger, adParamOutput, 4, 0)

        cmd.Execute
        Dim new_orchard_id
        new_orchard_id = cmd.Parameters("@r_orchard_id").Value
        Set cmd = Nothing

        ' 2) 본문 이미지 목록 저장 (TBL_ORCHARD_IMAGE)
        If new_orchard_id > 0 Then
            ' 기존 이미지 일괄 삭제 후 순서대로 재등록
            Dim clearCmd
            Set clearCmd = Server.CreateObject("ADODB.Command")
            clearCmd.ActiveConnection = dbConn
            clearCmd.CommandText = "USP_ADMIN_ORCHARD_IMAGE_CLEAR"
            clearCmd.CommandType = adCmdStoredProc
            clearCmd.Parameters.Append clearCmd.CreateParameter("@p_orchard_id", adInteger, adParamInput, 4, new_orchard_id)
            clearCmd.Execute
            Set clearCmd = Nothing

            ' Web 채널 이미지 처리
            Dim webCount, wIdx, wKind, wFile, wExt, wSaved, wOrig, wPath
            webCount = CInt("0" & GetFormField("web_count"))
            For wIdx = 0 To webCount - 1
                wKind = GetFormField("web_item_kind_" & wIdx)
                If wKind = "new" And isMultipart Then
                    Set wFile = upload.Form("web_file_" & wIdx)
                    If Not wFile Is Nothing Then
                        If wFile.FileSize > 0 Then
                            wExt = Mid(wFile.FileName, InStrRev(wFile.FileName, "."))
                            wSaved = "web_" & new_orchard_id & "_" & (wIdx + 1) & "_" & Replace(Replace(Replace(Now(), "-", ""), " ", "_"), ":", "") & "_" & Int(Rnd * 10000) & wExt
                            wFile.SaveAs uploadDir & "\" & wSaved, True
                            Call SaveOrchardImage(new_orchard_id, "WEB", (wIdx + 1), wFile.FileName, wSaved, "/uploads/orchard/" & wSaved)
                        End If
                    End If
                ElseIf wKind = "keep" Then
                    wOrig = GetFormField("web_item_name_" & wIdx)
                    wPath = GetFormField("web_item_path_" & wIdx)
                    wSaved = Mid(wPath, InStrRev(wPath, "/") + 1)
                    Call SaveOrchardImage(new_orchard_id, "WEB", (wIdx + 1), wOrig, wSaved, wPath)
                End If
            Next

            ' App 채널 이미지 처리
            Dim appCount, aIdx, aKind, aFile, aExt, aSaved, aOrig, aPath
            appCount = CInt("0" & GetFormField("app_count"))
            For aIdx = 0 To appCount - 1
                aKind = GetFormField("app_item_kind_" & aIdx)
                If aKind = "new" And isMultipart Then
                    Set aFile = upload.Form("app_file_" & aIdx)
                    If Not aFile Is Nothing Then
                        If aFile.FileSize > 0 Then
                            aExt = Mid(aFile.FileName, InStrRev(aFile.FileName, "."))
                            aSaved = "app_" & new_orchard_id & "_" & (aIdx + 1) & "_" & Replace(Replace(Replace(Now(), "-", ""), " ", "_"), ":", "") & "_" & Int(Rnd * 10000) & aExt
                            aFile.SaveAs uploadDir & "\" & aSaved, True
                            Call SaveOrchardImage(new_orchard_id, "APP", (aIdx + 1), aFile.FileName, aSaved, "/uploads/orchard/" & aSaved)
                        End If
                    End If
                ElseIf aKind = "keep" Then
                    aOrig = GetFormField("app_item_name_" & aIdx)
                    aPath = GetFormField("app_item_path_" & aIdx)
                    aSaved = Mid(aPath, InStrRev(aPath, "/") + 1)
                    Call SaveOrchardImage(new_orchard_id, "APP", (aIdx + 1), aOrig, aSaved, aPath)
                End If
            Next
        End If

        Response.Write "{""success"":true,""id"":" & new_orchard_id & "}"

    ' ---------------------------------------------------------
    ' [4] 과원관리 삭제 (USP_ADMIN_ORCHARD_DELETE)
    ' ---------------------------------------------------------
    Case "delete"
        Dim d_yr, d_mo
        d_yr = CInt(GetFormField("year"))
        d_mo = CInt(GetFormField("month"))

        Set cmd = Server.CreateObject("ADODB.Command")
        cmd.ActiveConnection = dbConn
        cmd.CommandText = "USP_ADMIN_ORCHARD_DELETE"
        cmd.CommandType = adCmdStoredProc
        cmd.Parameters.Append cmd.CreateParameter("@p_year", adInteger, adParamInput, 4, d_yr)
        cmd.Parameters.Append cmd.CreateParameter("@p_month", adInteger, adParamInput, 4, d_mo)
        cmd.Execute
        Set cmd = Nothing

        Response.Write "{""success"":true}"

    Case Else
        Response.Write "{""success"":false,""message"":""알 수 없는 요청입니다.""}"
End Select

Call CloseDB()
Set upload = Nothing
%>
