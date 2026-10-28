<%@ Language="VBScript" CodePage="65001" %>
<%
' =============================================================
' 게시글 처리 AJAX API (Classic ASP -> MSSQL Stored Procedures & TABSUpload)
' 파일 위치: /proc/board_proc.asp
' =============================================================
Response.CharSet = "UTF-8"
Response.ContentType = "application/json"
Response.Buffer = True
Response.Expires = -1
Response.AddHeader "pragma", "no-cache"
Response.AddHeader "cache-control", "private, no-cache, must-revalidate"
Session.CodePage = 65001
%>
<!--#include virtual="/inc/dbconn.asp"-->
<%
' JSON 특수문자 이스케이프 함수
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

Function SafeStr(val)
    If IsNull(val) Or IsEmpty(val) Then
        SafeStr = ""
    Else
        SafeStr = CStr(val)
    End If
End Function

Function SafeBool(val, trueVal)
    If IsNull(val) Or IsEmpty(val) Then
        SafeBool = "false"
    ElseIf CStr(val) = trueVal Then
        SafeBool = "true"
    Else
        SafeBool = "false"
    End If
End Function

' 날짜 포맷 (YYYY.MM.DD)
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
        Response.Write "{""success"":false,""message"":""TABSUpload4 컴포넌트 로드 실패: " & JsonEscape(Err.Description) & " (IIS 응용 프로그램 풀 32비트 설정을 확인하세요)""}"
        Response.End
    End If
    On Error GoTo 0

    upload.CodePage = 65001

    uploadDir = Server.MapPath("/uploads/board")
    Set fso = Server.CreateObject("Scripting.FileSystemObject")
    If Not fso.FolderExists(Server.MapPath("/uploads")) Then
        fso.CreateFolder(Server.MapPath("/uploads"))
    End If
    If Not fso.FolderExists(uploadDir) Then
        fso.CreateFolder(uploadDir)
    End If
    Set fso = Nothing

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

Call OpenDB()

Select Case action

    ' ---------------------------------------------------------
    ' [1] 게시글 전체 목록 또는 조건별 목록 조회
    ' ---------------------------------------------------------
    Case "list"
        Dim category, is_draft
        category = Request("category")
        is_draft = Request("is_draft")
        If is_draft = "" Then is_draft = "N"

        Dim p_type, p_start, p_end, p_status, p_field, p_keyword
        p_type = Request("period_type")
        If p_type = "" Then p_type = "all"
        p_start = Request("period_start")
        If p_start = "" Then p_start = Null Else p_start = Replace(p_start, ".", "-")
        p_end = Request("period_end")
        If p_end = "" Then p_end = Null Else p_end = Replace(p_end, ".", "-")
        p_status = Request("status")
        If p_status = "" Then p_status = Null
        p_field = Request("field")
        If p_field = "" Then p_field = "titleBody"
        p_keyword = Request("keyword")
        If p_keyword = "" Then p_keyword = Null

        Dim cmd, rs
        Set cmd = Server.CreateObject("ADODB.Command")
        cmd.ActiveConnection = dbConn
        cmd.CommandText = "USP_ADMIN_BOARD_LIST"
        cmd.CommandType = adCmdStoredProc

        If category = "" Then
            cmd.Parameters.Append cmd.CreateParameter("@p_category", adVarWChar, adParamInput, 30, Null)
        Else
            cmd.Parameters.Append cmd.CreateParameter("@p_category", adVarWChar, adParamInput, 30, category)
        End If
        cmd.Parameters.Append cmd.CreateParameter("@p_is_draft", adChar, adParamInput, 1, is_draft)
        cmd.Parameters.Append cmd.CreateParameter("@p_period_type", adVarChar, adParamInput, 20, p_type)
        cmd.Parameters.Append cmd.CreateParameter("@p_period_start", adVarChar, adParamInput, 10, p_start)
        cmd.Parameters.Append cmd.CreateParameter("@p_period_end", adVarChar, adParamInput, 10, p_end)
        cmd.Parameters.Append cmd.CreateParameter("@p_status", adVarWChar, adParamInput, 20, p_status)
        cmd.Parameters.Append cmd.CreateParameter("@p_field", adVarChar, adParamInput, 20, p_field)
        cmd.Parameters.Append cmd.CreateParameter("@p_keyword", adVarWChar, adParamInput, 100, p_keyword)
        cmd.Parameters.Append cmd.CreateParameter("@p_page", adInteger, adParamInput, 4, 1)
        cmd.Parameters.Append cmd.CreateParameter("@p_page_size", adInteger, adParamInput, 4, 1000)

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

            Dim chWeb, chApp, channelsJson
            chWeb = SafeStr(rs("channel_web"))
            chApp = SafeStr(rs("channel_app"))
            channelsJson = "["
            If chWeb = "Y" And chApp = "Y" Then
                channelsJson = "[""Web"",""App""]"
            ElseIf chWeb = "Y" Then
                channelsJson = "[""Web""]"
            ElseIf chApp = "Y" Then
                channelsJson = "[""App""]"
            Else
                channelsJson = "[]"
            End If

            Response.Write "{"
            Response.Write """id"":" & rs("content_id") & ","
            Response.Write """category"":""" & JsonEscape(rs("category")) & ""","
            Response.Write """title"":""" & JsonEscape(rs("title")) & ""","
            Response.Write """visibility"":""" & JsonEscape(rs("visibility")) & ""","
            Response.Write """isDraft"":" & SafeBool(rs("is_draft"), "Y") & ","
            Response.Write """pinned"":" & SafeBool(rs("is_pinned"), "Y") & ","
            Response.Write """channels"":" & channelsJson & ","
            Response.Write """publishStart"":""" & FormatDotDate(rs("period_start")) & ""","
            Response.Write """publishEnd"":""" & FormatDotDate(rs("period_end")) & ""","
            Response.Write """noEnd"":" & SafeBool(rs("has_end_date"), "N") & ","
            Response.Write """urgentUse"":" & SafeBool(rs("is_urgent"), "Y") & ","
            Response.Write """status"":""" & JsonEscape(rs("post_status")) & ""","
            Response.Write """author"":""" & JsonEscape(rs("author_name")) & ""","
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
    ' [2] 단건 게시글 상세 조회
    ' ---------------------------------------------------------
    Case "get"
        Dim id
        id = Request("id")
        If id = "" Or Not IsNumeric(id) Then
            Response.Write "{""success"":false,""message"":""유효하지 않은 ID입니다.""}"
        Else
            Set cmd = Server.CreateObject("ADODB.Command")
            cmd.ActiveConnection = dbConn
            cmd.CommandText = "USP_ADMIN_BOARD_GET"
            cmd.CommandType = adCmdStoredProc
            cmd.Parameters.Append cmd.CreateParameter("@p_content_id", adInteger, adParamInput, 4, CLng(id))

            Set rs = Server.CreateObject("ADODB.Recordset")
            rs.CursorLocation = 3
            rs.Open cmd, , 1, 1

            If rs.EOF Then
                Response.Write "{""success"":false,""message"":""게시글을 찾을 수 없습니다.""}"
            Else
                chWeb = SafeStr(rs("channel_web"))
                chApp = SafeStr(rs("channel_app"))
                channelsJson = "["
                If chWeb = "Y" And chApp = "Y" Then
                    channelsJson = "[""Web"",""App""]"
                ElseIf chWeb = "Y" Then
                    channelsJson = "[""Web""]"
                ElseIf chApp = "Y" Then
                    channelsJson = "[""App""]"
                Else
                    channelsJson = "[]"
                End If

                Dim relType, relTarget, relatedTargetJson
                relType = SafeStr(rs("related_type"))
                relTarget = SafeStr(rs("related_target_id"))
                If relType <> "" Then
                    Dim yrPart, moPart
                    yrPart = ""
                    moPart = ""
                    If InStr(relTarget, ":") > 0 Then
                        yrPart = Split(relTarget, ":")(0)
                        moPart = Split(relTarget, ":")(1)
                    End If
                    relatedTargetJson = "{""kind"":""" & JsonEscape(relType) & """,""type"":""" & JsonEscape(relType) & """,""id"":""" & JsonEscape(relTarget) & """"
                    If yrPart <> "" Then
                        relatedTargetJson = relatedTargetJson & ",""year"":" & yrPart & ",""month"":" & moPart
                    End If
                    relatedTargetJson = relatedTargetJson & "}"
                Else
                    relatedTargetJson = "null"
                End If

                Response.Write "{"
                Response.Write """success"":true,"
                Response.Write """item"":{"
                Response.Write """id"":" & rs("content_id") & ","
                Response.Write """category"":""" & JsonEscape(rs("category")) & ""","
                Response.Write """title"":""" & JsonEscape(rs("title")) & ""","
                Response.Write """body"":""" & JsonEscape(rs("body_html")) & ""","
                Response.Write """visibility"":""" & JsonEscape(rs("visibility")) & ""","
                Response.Write """isDraft"":" & SafeBool(rs("is_draft"), "Y") & ","
                Response.Write """pinned"":" & SafeBool(rs("is_pinned"), "Y") & ","
                Response.Write """channels"":" & channelsJson & ","
                Response.Write """publishStart"":""" & FormatDotDate(rs("period_start")) & ""","
                Response.Write """publishEnd"":""" & FormatDotDate(rs("period_end")) & ""","
                Response.Write """noEnd"":" & SafeBool(rs("has_end_date"), "N") & ","
                Response.Write """urgentUse"":" & SafeBool(rs("is_urgent"), "Y") & ","
                Response.Write """urgentStart"":""" & FormatDotDate(rs("urgent_start")) & ""","
                Response.Write """urgentEnd"":""" & FormatDotDate(rs("urgent_end")) & ""","
                Response.Write """relatedTarget"":" & relatedTargetJson & ","
                Response.Write """author"":""" & JsonEscape(rs("author_name")) & ""","
                Response.Write """updatedAt"":""" & FormatDotDate(rs("updated_at")) & """"
                Response.Write "},"

                ' 첨부파일 목록 (NextRecordset)
                Set rs = rs.NextRecordset
                Response.Write """attachments"":["
                first = True
                If Not (rs Is Nothing) Then
                    Do While Not rs.EOF
                        If Not first Then Response.Write ","
                        first = False
                        Response.Write "{"
                        Response.Write """id"":" & rs("attach_id") & ","
                        Response.Write """name"":""" & JsonEscape(rs("original_name")) & ""","
                        Response.Write """size"":" & rs("file_size") & ","
                        Response.Write """path"":""" & JsonEscape(rs("file_path")) & """"
                        Response.Write "}"
                        rs.MoveNext
                    Loop
                End If
                Response.Write "]"
                Response.Write "}"
            End If

            If Not (rs Is Nothing) Then
                If rs.State = 1 Then rs.Close
                Set rs = Nothing
            End If
            Set cmd = Nothing
        End If

    ' ---------------------------------------------------------
    ' [3] 게시글 등록 / 수정 저장 (USP_ADMIN_BOARD_SAVE & TABSUpload)
    ' ---------------------------------------------------------
    Case "save"
        Dim s_id, s_cat, s_title, s_body, s_vis, s_draft, s_pin
        Dim s_chWeb, s_chApp, s_pStart, s_pEnd, s_noEnd
        Dim s_urgUse, s_urgStart, s_urgEnd, s_relType, s_relTarget
        Dim s_author, s_channels

        s_id       = GetFormField("id")
        s_cat      = GetFormField("category")
        s_title    = GetFormField("title")
        s_body     = GetFormField("body")
        s_vis      = GetFormField("visibility")
        s_draft    = GetFormField("isDraft")
        s_pin      = GetFormField("pinned")
        s_channels = GetFormField("channels")
        s_pStart   = GetFormField("publishStart")
        s_pEnd     = GetFormField("publishEnd")
        s_noEnd    = GetFormField("noEnd")
        s_urgUse   = GetFormField("urgentUse")
        s_urgStart = GetFormField("urgentStart")
        s_urgEnd   = GetFormField("urgentEnd")
        s_relType  = GetFormField("relatedType")
        s_relTarget= GetFormField("relatedTarget")
        s_author   = GetFormField("author")

        If s_id = "" Or Not IsNumeric(s_id) Then s_id = 0 Else s_id = CLng(s_id)
        If s_vis = "" Then s_vis = "public"
        If s_draft = "true" Or s_draft = "Y" Then s_draft = "Y" Else s_draft = "N"
        If s_pin = "true" Or s_pin = "Y" Then s_pin = "Y" Else s_pin = "N"

        s_chWeb = "N"
        s_chApp = "N"
        If InStr(s_channels, "Web") > 0 Then s_chWeb = "Y"
        If InStr(s_channels, "App") > 0 Then s_chApp = "Y"

        Dim hasEnd
        If s_noEnd = "true" Or s_pEnd = "" Then
            hasEnd = "N"
            s_pEnd = Null
        Else
            hasEnd = "Y"
            s_pEnd = Replace(s_pEnd, ".", "-")
        End If

        If s_pStart <> "" Then s_pStart = Replace(s_pStart, ".", "-") Else s_pStart = FormatDotDate(Now())
        
        Dim isUrg
        If s_urgUse = "true" Or s_urgUse = "Y" Then
            isUrg = "Y"
            If s_urgStart <> "" Then s_urgStart = Replace(s_urgStart, ".", "-") Else s_urgStart = Null
            If s_urgEnd <> "" Then s_urgEnd = Replace(s_urgEnd, ".", "-") Else s_urgEnd = Null
        Else
            isUrg = "N"
            s_urgStart = Null
            s_urgEnd = Null
        End If

        If s_relType = "" Or IsEmpty(s_relType) Then s_relType = Null
        If s_relTarget = "" Or IsEmpty(s_relTarget) Then s_relTarget = Null
        If s_body = "" Or IsEmpty(s_body) Then s_body = " "
        If s_author = "" Or IsEmpty(s_author) Then s_author = "관리자"

        Set cmd = Server.CreateObject("ADODB.Command")
        cmd.ActiveConnection = dbConn
        cmd.CommandText = "USP_ADMIN_BOARD_SAVE"
        cmd.CommandType = adCmdStoredProc

        cmd.Parameters.Append cmd.CreateParameter("@p_content_id", adInteger, adParamInput, 4, s_id)
        cmd.Parameters.Append cmd.CreateParameter("@p_category", adVarWChar, adParamInput, 30, s_cat)
        cmd.Parameters.Append cmd.CreateParameter("@p_title", adVarWChar, adParamInput, 200, s_title)
        cmd.Parameters.Append cmd.CreateParameter("@p_body_html", adLongVarWChar, adParamInput, 1073741823, s_body)
        cmd.Parameters.Append cmd.CreateParameter("@p_visibility", adVarChar, adParamInput, 10, s_vis)
        cmd.Parameters.Append cmd.CreateParameter("@p_is_draft", adChar, adParamInput, 1, s_draft)
        cmd.Parameters.Append cmd.CreateParameter("@p_is_pinned", adChar, adParamInput, 1, s_pin)
        cmd.Parameters.Append cmd.CreateParameter("@p_channel_web", adChar, adParamInput, 1, s_chWeb)
        cmd.Parameters.Append cmd.CreateParameter("@p_channel_app", adChar, adParamInput, 1, s_chApp)
        cmd.Parameters.Append cmd.CreateParameter("@p_period_start", adDBTimeStamp, adParamInput, 8, CDate(s_pStart))
        If IsNull(s_pEnd) Or s_pEnd = "" Then
            cmd.Parameters.Append cmd.CreateParameter("@p_period_end", adDBTimeStamp, adParamInput, 8, Null)
        Else
            cmd.Parameters.Append cmd.CreateParameter("@p_period_end", adDBTimeStamp, adParamInput, 8, CDate(s_pEnd))
        End If
        cmd.Parameters.Append cmd.CreateParameter("@p_has_end_date", adChar, adParamInput, 1, hasEnd)
        cmd.Parameters.Append cmd.CreateParameter("@p_is_urgent", adChar, adParamInput, 1, isUrg)
        If IsNull(s_urgStart) Or s_urgStart = "" Then
            cmd.Parameters.Append cmd.CreateParameter("@p_urgent_start", adDBTimeStamp, adParamInput, 8, Null)
        Else
            cmd.Parameters.Append cmd.CreateParameter("@p_urgent_start", adDBTimeStamp, adParamInput, 8, CDate(s_urgStart))
        End If
        If IsNull(s_urgEnd) Or s_urgEnd = "" Then
            cmd.Parameters.Append cmd.CreateParameter("@p_urgent_end", adDBTimeStamp, adParamInput, 8, Null)
        Else
            cmd.Parameters.Append cmd.CreateParameter("@p_urgent_end", adDBTimeStamp, adParamInput, 8, CDate(s_urgEnd))
        End If
        cmd.Parameters.Append cmd.CreateParameter("@p_related_type", adVarChar, adParamInput, 30, s_relType)
        cmd.Parameters.Append cmd.CreateParameter("@p_related_target_id", adVarChar, adParamInput, 100, s_relTarget)
        cmd.Parameters.Append cmd.CreateParameter("@p_author_id", adVarChar, adParamInput, 50, "admin")
        cmd.Parameters.Append cmd.CreateParameter("@p_author_name", adVarWChar, adParamInput, 50, s_author)
        cmd.Parameters.Append cmd.CreateParameter("@r_new_id", adInteger, adParamOutput, 4, 0)

        cmd.Execute
        Dim savedId
        savedId = cmd.Parameters("@r_new_id").Value
        Set cmd = Nothing

        ' [3-1] 수정 시 기존 첨부파일 정리 (제거된 파일 디스크 및 DB 삭제)
        If s_id > 0 Then
            Dim keepIds, delSql, delRs, delFso
            keepIds = GetFormField("keep_attach_ids")
            
            Set delFso = Server.CreateObject("Scripting.FileSystemObject")
            Set delRs = Server.CreateObject("ADODB.Recordset")
            
            delSql = "SELECT attach_id, file_path FROM dbo.TBL_BOARD_ATTACH WHERE content_id = " & CLng(s_id)
            If keepIds <> "" Then
                Dim safeKeepIds, idItem, arrIds
                arrIds = Split(keepIds, ",")
                safeKeepIds = ""
                For Each idItem In arrIds
                    If IsNumeric(Trim(idItem)) Then
                        If safeKeepIds <> "" Then safeKeepIds = safeKeepIds & ","
                        safeKeepIds = safeKeepIds & CLng(Trim(idItem))
                    End If
                Next
                If safeKeepIds <> "" Then
                    delSql = delSql & " AND attach_id NOT IN (" & safeKeepIds & ")"
                End If
            End If
            
            delRs.Open delSql, dbConn, 1, 1
            Do While Not delRs.EOF
                Dim pPath
                pPath = Server.MapPath(delRs("file_path"))
                If delFso.FileExists(pPath) Then
                    On Error Resume Next
                    delFso.DeleteFile pPath, True
                    On Error GoTo 0
                End If
                dbConn.Execute "DELETE FROM dbo.TBL_BOARD_ATTACH WHERE attach_id = " & delRs("attach_id")
                delRs.MoveNext
            Loop
            delRs.Close
            Set delRs = Nothing
            Set delFso = Nothing
        End If

        ' [3-2] 새 첨부파일 저장 처리
        If isMultipart And savedId > 0 Then
            Dim attachCount, aIdx, aFile, aExt, aSavedName
            attachCount = CInt("0" & GetFormField("attach_count"))
            For aIdx = 0 To attachCount - 1
                Set aFile = upload.Form("attach_file_" & aIdx)
                If Not aFile Is Nothing Then
                    If aFile.FileSize > 0 Then
                        aExt = Mid(aFile.FileName, InStrRev(aFile.FileName, "."))
                        aSavedName = "board_" & savedId & "_" & (aIdx + 1) & "_" & Replace(Replace(Replace(Now(), "-", ""), " ", "_"), ":", "") & "_" & Int(Rnd * 10000) & aExt
                        aFile.SaveAs uploadDir & "\" & aSavedName, True

                        Dim attCmd
                        Set attCmd = Server.CreateObject("ADODB.Command")
                        attCmd.ActiveConnection = dbConn
                        attCmd.CommandText = "USP_ADMIN_BOARD_ATTACH_ADD"
                        attCmd.CommandType = adCmdStoredProc
                        attCmd.Parameters.Append attCmd.CreateParameter("@p_content_id", adInteger, adParamInput, 4, savedId)
                        attCmd.Parameters.Append attCmd.CreateParameter("@p_original_name", adVarChar, adParamInput, 260, aFile.FileName)
                        attCmd.Parameters.Append attCmd.CreateParameter("@p_saved_name", adVarChar, adParamInput, 260, aSavedName)
                        attCmd.Parameters.Append attCmd.CreateParameter("@p_file_path", adVarChar, adParamInput, 500, "/uploads/board/" & aSavedName)
                        attCmd.Parameters.Append attCmd.CreateParameter("@p_file_size", adBigInt, adParamInput, 8, aFile.FileSize)
                        attCmd.Execute
                        Set attCmd = Nothing
                    End If
                End If
            Next
        End If

        Response.Write "{""success"":true,""id"":" & savedId & "}"

    ' ---------------------------------------------------------
    ' [4] 게시글 삭제 (다중/단건)
    ' ---------------------------------------------------------
    Case "delete"
        Dim delIds
        delIds = GetFormField("ids")

        If delIds = "" Then
            Response.Write "{""success"":false,""message"":""삭제할 대상이 없습니다.""}"
        Else
            Set cmd = Server.CreateObject("ADODB.Command")
            cmd.ActiveConnection = dbConn
            cmd.CommandText = "USP_ADMIN_BOARD_DELETE"
            cmd.CommandType = adCmdStoredProc
            cmd.Parameters.Append cmd.CreateParameter("@p_content_ids", adVarWChar, adParamInput, Len(delIds) + 10, delIds)
            cmd.Execute
            Set cmd = Nothing
            Response.Write "{""success"":true}"
        End If

    ' ---------------------------------------------------------
    ' [5] 임시저장 건수 조회
    ' ---------------------------------------------------------
    Case "draft_count"
        Dim cat
        cat = Request("category")
        Set cmd = Server.CreateObject("ADODB.Command")
        cmd.ActiveConnection = dbConn
        cmd.CommandText = "USP_ADMIN_BOARD_DRAFT_COUNT"
        cmd.CommandType = adCmdStoredProc
        cmd.Parameters.Append cmd.CreateParameter("@p_category", adVarWChar, adParamInput, 30, cat)
        
        Set rs = cmd.Execute
        Dim count
        count = 0
        If Not rs.EOF Then count = rs("draft_count")
        rs.Close
        Set rs = Nothing
        Set cmd = Nothing

        Response.Write "{""success"":true,""count"":" & count & "}"

    Case Else
        Response.Write "{""success"":false,""message"":""알 수 없는 요청입니다.""}"
End Select

Call CloseDB()
Set upload = Nothing
%>
