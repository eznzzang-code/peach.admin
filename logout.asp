<%@ Language="VBScript" CodePage="65001" %>
<%
Option Explicit
Response.CharSet = "UTF-8"
Session.CodePage = 65001

' 세션 완전 종료 및 초기화
Session.Contents.RemoveAll()
Session.Abandon

' 필요 시 쿠키 만료 처리
Response.Cookies("peach_admin_id") = ""
Response.Cookies("peach_admin_id").Expires = Date - 1
Response.Cookies("peach_admin_id").Path = "/"

' 로그인 화면으로 이동
Response.Redirect "login.asp"
Response.End
%>
