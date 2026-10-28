<%@ Language="VBScript" CodePage="65001" %>
<%
' =============================================================
' 홈 대시보드 처리 AJAX API (USP_ADMIN_HOME_DATA 호출)
' 파일 위치: /proc/home_proc.asp
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

Dim curYear, curMonth
curYear = Year(Now())
curMonth = Month(Now())

If Request("year") <> "" And IsNumeric(Request("year")) Then curYear = CInt(Request("year"))
If Request("month") <> "" And IsNumeric(Request("month")) Then curMonth = CInt(Request("month"))

Call OpenDB()

Dim cmd, rs
Set cmd = Server.CreateObject("ADODB.Command")
cmd.ActiveConnection = dbConn
cmd.CommandText = "USP_ADMIN_HOME_DATA"
cmd.CommandType = adCmdStoredProc
cmd.Parameters.Append cmd.CreateParameter("@p_year", adInteger, adParamInput, 4, curYear)
cmd.Parameters.Append cmd.CreateParameter("@p_month", adInteger, adParamInput, 4, curMonth)

Set rs = Server.CreateObject("ADODB.Recordset")
rs.CursorLocation = 3
rs.Open cmd, , 1, 1

Response.Write "{"
Response.Write """success"":true,"

' 1) 이달의 과원관리
Response.Write """orchard"":"
If Not rs.EOF Then
    Response.Write "{"
    Response.Write """id"":" & rs("orchard_id") & ","
    Response.Write """year"":" & rs("target_year") & ","
    Response.Write """month"":" & rs("target_month") & ","
    Response.Write """title"":""" & JsonEscape(rs("title")) & ""","
    Response.Write """image"":""" & JsonEscape(rs("thumbnail_path")) & ""","
    Response.Write """thumbnail"":""" & JsonEscape(rs("thumbnail_path")) & ""","
    Response.Write """published"":" & LCase(CStr(rs("visibility") = "public"))
    Response.Write "},"
Else
    Response.Write "null,"
End If

' 2) 상시 재배력
Set rs = rs.NextRecordset
Response.Write """cultivation"":"
If Not rs.EOF Then
    Response.Write "{"
    Response.Write """id"":" & rs("calendar_id") & ","
    Response.Write """year"":" & rs("target_year") & ","
    Response.Write """title"":""" & JsonEscape(rs("title")) & ""","
    Response.Write """image"":""" & JsonEscape(rs("thumbnail_path")) & ""","
    Response.Write """thumbnail"":""" & JsonEscape(rs("thumbnail_path")) & ""","
    Response.Write """headline"":""한눈에 살펴보는 복숭아의 1년"","
    Response.Write """description"":""월별 생육 단계와 주요 재배관리 정보를 확인하세요."","
    Response.Write """published"":" & LCase(CStr(rs("visibility") = "public"))
    Response.Write "},"
Else
    Response.Write "null,"
End If

' 3) 교육영상 (최대 3건)
Set rs = rs.NextRecordset
Response.Write """videos"":["
Dim first
first = True
Do While Not rs.EOF
    If Not first Then Response.Write ","
    first = False
    Response.Write "{"
    Response.Write """id"":" & rs("video_id") & ","
    Response.Write """youtubeId"":""" & JsonEscape(rs("youtube_id")) & ""","
    Response.Write """title"":""" & JsonEscape(rs("display_title")) & ""","
    Response.Write """image"":""" & JsonEscape(rs("thumbnail_url")) & ""","
    Response.Write """thumbnail"":""" & JsonEscape(rs("thumbnail_url")) & ""","
    Response.Write """category"":""" & JsonEscape(rs("category")) & """"
    Response.Write "}"
    rs.MoveNext
Loop
Response.Write "],"

' 4) 최근 게시글 (최대 3건)
Set rs = rs.NextRecordset
Response.Write """recentPosts"":["
first = True
Do While Not rs.EOF
    If Not first Then Response.Write ","
    first = False
    Response.Write "{"
    Response.Write """id"":" & rs("content_id") & ","
    Response.Write """category"":""" & JsonEscape(rs("category")) & ""","
    Response.Write """title"":""" & JsonEscape(rs("title")) & ""","
    Response.Write """status"":""" & JsonEscape(rs("post_status")) & ""","
    Response.Write """updatedAt"":""" & FormatDotDate(rs("updated_at")) & """"
    Response.Write "}"
    rs.MoveNext
Loop
Response.Write "]"

Response.Write "}"

rs.Close
Set rs = Nothing
Set cmd = Nothing
Call CloseDB()
%>
