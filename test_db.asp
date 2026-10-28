<%@ Language="VBScript" CodePage="65001" %>
<!--#include file="inc/common.asp"-->
<%
' DB 연결 테스트 및 생성된 프로시저 동작 테스트 페이지
Response.ContentType = "text/html; charset=UTF-8"
%>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>DB 연결 및 프로시저 테스트 | 복숭아자조금 관리자</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; line-height: 1.6; background: #f8fafc; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; max-width: 800px; margin: 0 auto; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { font-size: 20px; margin-top: 0; color: #1e293b; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 13px; }
    .badge--success { background: #dcfce7; color: #166534; }
    .badge--danger { background: #fee2e2; color: #991b1b; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 14px; }
    th { background: #f1f5f9; }
    .info { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 12px; border-radius: 6px; margin: 16px 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🍑 MSSQL (peach) 연결 및 프로시저 테스트</h1>

    <%
    Call OpenDB()
    If IsObject(dbConn) And dbConn.State = 1 Then
    %>
      <p>DB 연결 상태: <span class="badge badge--success">성공 (Connected)</span></p>
      <div class="info">
        <strong>연결 정보:</strong> 서버: <%=db_server%> | 데이터베이스: <%=db_name%> | 계정: <%=db_user%>
      </div>

      <h3>1. 운영자 목록 프로시저 테스트 (USP_ADMIN_OPERATOR_LIST)</h3>
      <%
      Dim rs
      On Error Resume Next
      Set rs = GetRecordsetSP("USP_ADMIN_OPERATOR_LIST", Nothing)
      If Err.Number <> 0 Then
          Response.Write "<p class='badge badge--danger'>프로시저 실행 오류: " & Err.Description & "</p>"
          Err.Clear
      Else
          If Not rs.EOF Then
      %>
            <table>
              <thead>
                <tr>
                  <th>아이디</th>
                  <th>이름</th>
                  <th>계정</th>
                  <th>상태</th>
                  <th>공지권한(작성/게시)</th>
                  <th>과원관리권한(작성/게시)</th>
                </tr>
              </thead>
              <tbody>
                <% Do While Not rs.EOF %>
                <tr>
                  <td><%=rs("operator_id")%></td>
                  <td><%=rs("operator_name")%></td>
                  <td><%=rs("operator_account")%></td>
                  <td><%=rs("status")%></td>
                  <td><%=rs("perm_notice_write")%> / <%=rs("perm_notice_post")%></td>
                  <td><%=rs("perm_orchard_write")%> / <%=rs("perm_orchard_post")%></td>
                </tr>
                <% 
                    rs.MoveNext 
                Loop 
                %>
              </tbody>
            </table>
      <%
          Else
              Response.Write "<p>등록된 운영자 데이터가 없습니다.</p>"
          End If
          rs.Close
          Set rs = Nothing
      End If
      On Error GoTo 0
      %>

      <p style="margin-top: 24px;"><a href="index.asp" style="color: #2563eb; text-decoration: underline;">관리자 홈(index.asp)으로 이동 &rarr;</a></p>

    <%
    Else
    %>
      <p>DB 연결 상태: <span class="badge badge--danger">실패 (Disconnected)</span></p>
    <%
    End If
    Call CloseDB()
    %>
  </div>
</body>
</html>
