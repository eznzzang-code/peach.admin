<%
' =============================================================
' 데이터베이스 연결 및 프로시저 실행 공통 모듈 (MSSQL Server)
' 파일 위치: /inc/dbconn.asp
' =============================================================

' [1] DB 연결 정보 설정 (화면 캡처의 KSERVER131-15 서버 기준)
Dim db_server, db_name, db_user, db_pass, db_conn_str
Dim dbConn

db_server = "121.78.131.15" ' 서버명 (로컬인 경우 "127.0.0.1" 또는 "(local)")
db_name = "peach" ' 생성하신 데이터베이스 명
db_user = "peach" ' DB 접속 계정 (또는 "sa")
db_pass = "qhrtnddk2024!@" ' 해당 계정의 비밀번호를 입력해 주세요!

' [2] 연결 문자열 (OLEDB / SQLOLEDB)
' 1순위: 표준 SQLOLEDB (Windows IIS 기본 제공)
db_conn_str = "Provider=SQLOLEDB;Data Source=" & db_server & ";Initial Catalog=" & db_name & ";User ID=" & db_user & ";Password=" & db_pass & ";"

' 만약 Windows 통합 인증(Windows Authentication)을 쓰신다면 아래 사용:
' db_conn_str = "Provider=SQLOLEDB;Data Source=" & db_server & ";Initial Catalog=" & db_name & ";Integrated Security=SSPI;"

' [3] DB 연결 열기 / 닫기
Sub OpenDB()
  If IsObject(dbConn) Then
    If dbConn.State = 1 Then Exit Sub
  End If

  On Error Resume Next
  Set dbConn = Server.CreateObject("ADODB.Connection")
  dbConn.Open db_conn_str

  If Err.Number <> 0 Then
    Response.Write "<div style='color:red;padding:15px;background:#ffebeb;border:1px solid #f5c2c7;margin:10px;font-family:sans-serif;'>"
    Response.Write "<strong>[DB 연결 오류]</strong><br>"
    Response.Write "서버: " & db_server & " | DB: " & db_name & "<br>"
    Response.Write "오류 번호: " & Err.Number & "<br>"
    Response.Write "오류 내용: " & Err.Description & "<br>"
    Response.Write "<small>inc/dbconn.asp 파일의 DB 계정/비밀번호 설정을 확인해 주세요.</small>"
    Response.Write "</div>"
    Response.End
  End If
  On Error GoTo 0
End Sub

Sub CloseDB()
  On Error Resume Next
  If IsObject(dbConn) Then
    If dbConn.State = 1 Then dbConn.Close
    Set dbConn = Nothing
  End If
  Err.Clear
  On Error GoTo 0
End Sub

' =============================================================
' [4] 저장 프로시저(SP) 실행 헬퍼 함수
' =============================================================

' ADO 상수 정의
Const adCmdStoredProc = 4
Const adParamInput = 1
Const adParamOutput = 2
Const adInteger = 3
Const adBigInt = 20
Const adChar = 129
Const adVarChar = 200
Const adLongVarChar = 201
Const adVarWChar = 202
Const adLongVarWChar = 203
Const adDate = 135
Const adDBTimeStamp = 135

' -------------------------------------------------------------
' 1) 조회용 프로시저 실행 (Recordset 반환)
'    사용예: Set rs = GetRecordsetSP("USP_ADMIN_OPERATOR_LIST", Nothing)
' -------------------------------------------------------------
Function GetRecordsetSP(spName, params)
  Call OpenDB()

  Dim cmd, rs, i
  Set cmd = Server.CreateObject("ADODB.Command")
  cmd.ActiveConnection = dbConn
  cmd.CommandText = spName
  cmd.CommandType = adCmdStoredProc

  If IsArray(params) Then
    For i = 0 To UBound(params)
      cmd.Parameters.Append params(i)
    Next
  End If

  Set rs = Server.CreateObject("ADODB.Recordset")
  rs.CursorLocation = 3 ' adUseClient
  rs.Open cmd, , 1, 1 ' adOpenKeyset, adLockReadOnly

  Set GetRecordsetSP = rs
  Set cmd = Nothing
End Function

' -------------------------------------------------------------
' 2) 실행용 프로시저 실행 (INSERT, UPDATE, DELETE 등)
'    사용예: Call ExecuteSP("USP_ADMIN_BOARD_DELETE", Array(cmd.CreateParameter(...)))
' -------------------------------------------------------------
Function ExecuteSP(spName, params)
  Call OpenDB()

  Dim cmd, i
  Set cmd = Server.CreateObject("ADODB.Command")
  cmd.ActiveConnection = dbConn
  cmd.CommandText = spName
  cmd.CommandType = adCmdStoredProc

  If IsArray(params) Then
    For i = 0 To UBound(params)
      cmd.Parameters.Append params(i)
    Next
  End If

  cmd.Execute
  Set ExecuteSP = cmd
End Function
%>
