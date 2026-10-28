<%@ Language="VBScript" CodePage="65001" %>
<%
' =============================================================
' 운영자 및 권한 관리 AJAX API (USP_ADMIN_OPERATOR_* 호출)
' 파일 위치: /proc/operator_proc.asp
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

Dim action
action = Request("action")
If action = "" Then action = Request.Form("action")

Call OpenDB()

Select Case action

    ' ---------------------------------------------------------
    ' [1] 운영자 목록 및 권한 조회 (USP_ADMIN_OPERATOR_LIST)
    ' ---------------------------------------------------------
    Case "list"
        Dim cmd, rs
        Set cmd = Server.CreateObject("ADODB.Command")
        cmd.ActiveConnection = dbConn
        cmd.CommandText = "USP_ADMIN_OPERATOR_LIST"
        cmd.CommandType = adCmdStoredProc

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

            Response.Write "{"
            Response.Write """id"":""" & JsonEscape(rs("operator_id")) & ""","
            Response.Write """name"":""" & JsonEscape(rs("operator_name")) & ""","
            Response.Write """account"":""" & JsonEscape(rs("operator_account")) & ""","
            Response.Write """status"":""" & JsonEscape(rs("status")) & ""","
            Response.Write """permissions"":{"
            Response.Write """content"":{""write"":" & LCase(CStr(rs("perm_notice_write") = "Y")) & ",""publish"":" & LCase(CStr(rs("perm_notice_post") = "Y")) & "},"
            Response.Write """video"":{""write"":" & LCase(CStr(rs("perm_video_write") = "Y")) & ",""publish"":" & LCase(CStr(rs("perm_video_post") = "Y")) & "},"
            Response.Write """calendar"":{""write"":" & LCase(CStr(rs("perm_cal_write") = "Y")) & ",""publish"":" & LCase(CStr(rs("perm_cal_post") = "Y")) & "},"
            Response.Write """orchard"":{""write"":" & LCase(CStr(rs("perm_orchard_write") = "Y")) & ",""publish"":" & LCase(CStr(rs("perm_orchard_post") = "Y")) & "}"
            Response.Write "}"
            Response.Write "}"

            rs.MoveNext
        Loop

        Response.Write "]"
        Response.Write "}"

        rs.Close
        Set rs = Nothing
        Set cmd = Nothing

    ' ---------------------------------------------------------
    ' [2] 운영자 권한 수정 저장 (USP_ADMIN_OPERATOR_SAVE)
    ' ---------------------------------------------------------
    Case "save"
        Dim op_id, op_status
        Dim p_nw, p_np, p_vw, p_vp, p_cw, p_cp, p_ow, p_op

        op_id     = Request.Form("operator_id")
        op_status = Request.Form("status")
        If op_status = "" Then op_status = "ACTIVE"

        p_nw = Request.Form("perm_notice_write")
        p_np = Request.Form("perm_notice_post")
        p_vw = Request.Form("perm_video_write")
        p_vp = Request.Form("perm_video_post")
        p_cw = Request.Form("perm_cal_write")
        p_cp = Request.Form("perm_cal_post")
        p_ow = Request.Form("perm_orchard_write")
        p_op = Request.Form("perm_orchard_post")

        If p_nw <> "Y" Then p_nw = "N"
        If p_np <> "Y" Then p_np = "N"
        If p_vw <> "Y" Then p_vw = "N"
        If p_vp <> "Y" Then p_vp = "N"
        If p_cw <> "Y" Then p_cw = "N"
        If p_cp <> "Y" Then p_cp = "N"
        If p_ow <> "Y" Then p_ow = "N"
        If p_op <> "Y" Then p_op = "N"

        Set cmd = Server.CreateObject("ADODB.Command")
        cmd.ActiveConnection = dbConn
        cmd.CommandText = "USP_ADMIN_OPERATOR_SAVE"
        cmd.CommandType = adCmdStoredProc

        cmd.Parameters.Append cmd.CreateParameter("@p_operator_id", adVarChar, adParamInput, 50, op_id)
        cmd.Parameters.Append cmd.CreateParameter("@p_status", adVarChar, adParamInput, 10, op_status)
        cmd.Parameters.Append cmd.CreateParameter("@p_notice_write", adChar, adParamInput, 1, p_nw)
        cmd.Parameters.Append cmd.CreateParameter("@p_notice_post", adChar, adParamInput, 1, p_np)
        cmd.Parameters.Append cmd.CreateParameter("@p_video_write", adChar, adParamInput, 1, p_vw)
        cmd.Parameters.Append cmd.CreateParameter("@p_video_post", adChar, adParamInput, 1, p_vp)
        cmd.Parameters.Append cmd.CreateParameter("@p_cal_write", adChar, adParamInput, 1, p_cw)
        cmd.Parameters.Append cmd.CreateParameter("@p_cal_post", adChar, adParamInput, 1, p_cp)
        cmd.Parameters.Append cmd.CreateParameter("@p_orchard_write", adChar, adParamInput, 1, p_ow)
        cmd.Parameters.Append cmd.CreateParameter("@p_orchard_post", adChar, adParamInput, 1, p_op)

        cmd.Execute
        Set cmd = Nothing

        Response.Write "{""success"":true}"

    Case Else
        Response.Write "{""success"":false,""message"":""알 수 없는 요청입니다.""}"
End Select

Call CloseDB()
%>
