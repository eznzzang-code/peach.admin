<%@ Language="VBScript" CodePage="65001" %>
<%
Option Explicit
Response.CharSet = "UTF-8"
Session.CodePage = 65001

' 이미 로그인된 세션이 있는 경우 메인으로 이동
If Session("admin_id") <> "" Then
    Response.Redirect "index.asp"
    Response.End
End If
%>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>로그인 | 복숭아자조금 관리자</title>
  <link rel="stylesheet" href="css/variables.css?v=<%=Timer%>">
  <link rel="stylesheet" href="css/common.css?v=<%=Timer%>">
  <link rel="stylesheet" href="css/layout.css?v=<%=Timer%>">
  <link rel="stylesheet" href="css/components.css?v=<%=Timer%>">
  <link rel="stylesheet" href="css/pages.css?v=<%=Timer%>">
  <link rel="stylesheet" href="css/flow-alignment.css?v=<%=Timer%>">
</head>
<body class="auth-body">
  <main class="auth">
    <h1 class="auth__title">
      <svg class="auth__logo" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path fill="#F6C3B6" d="M15.6 8.4c-5.7.6-9.8 5.2-9.8 10.8 0 5.6 4.4 9.8 10 9.8 1.2 0 2.3-.2 3.4-.6-3.8-1.8-6.2-5.6-6.2-10.2 0-3.6 1.2-6.8 2.6-9.8Z"/>
        <path fill="#EB5C66" d="M16.2 8.2c1.6 3.2 2.6 6.4 2.6 10 0 4.6-2.4 8.4-6.2 10.2 1.1.4 2.2.6 3.4.6 5.6 0 10-4.2 10-9.8 0-5.4-3.8-9.8-9.8-10.8Z"/>
        <path fill="#62B34A" d="M17.2 7.6c.4-2.6 2.6-4.4 5.2-4.2-1.8.6-3 2-3.4 3.6-.4 1.2-.8 1.6-1.8.6Z"/>
        <path fill="#F8E2D4" d="M15.4 9.2c.8 2.4.6 5.2-.4 7.4" stroke="#F8E2D4" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
      복숭아자조금 관리자 로그인
    </h1>

    <form class="auth-card auth-card--login" data-auth="login" novalidate>
      <div class="auth-card__tools">
        <label class="checkbox">
          <input type="checkbox" name="autoLogin">
          <span class="checkbox__box" aria-hidden="true"></span>
          <span class="checkbox__text">자동로그인</span>
        </label>
      </div>

      <div class="auth-login">
        <div class="auth-fields">
          <label class="auth-line">
            <span class="auth-line__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"></circle>
                <path d="M5.2 19.2c1.1-3.2 3.4-4.8 6.8-4.8s5.7 1.6 6.8 4.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
              </svg>
            </span>
            <span class="sr-only">아이디</span>
            <input class="input auth-line__input" name="userId" autocomplete="username" placeholder="아이디" spellcheck="false">
          </label>
          <label class="auth-line">
            <span class="auth-line__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="5" y="10.5" width="14" height="9" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"></rect>
                <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
              </svg>
            </span>
            <span class="sr-only">비밀번호</span>
            <input class="input auth-line__input" type="password" name="password" autocomplete="current-password" placeholder="비밀번호">
          </label>
        </div>
        <button type="submit" class="btn btn--primary auth-submit">로그인</button>
      </div>
      <p class="auth-message" data-auth-message role="alert" hidden></p>
    </form>

    <div class="auth-help">
      <p class="auth-help__text">아이디 또는 비밀번호를 잊으셨나요?</p>
      <a class="auth-help__link" href="find-account.asp#id">아이디찾기</a>
      <a class="auth-help__link" href="find-account.asp#password">비밀번호찾기</a>
    </div>
  </main>

  <script src="js/common.js"></script>
  <!-- 기존 login.js는 원본 보존하고, 실서버 연동 전용 분리 스크립트 로드 -->
  <script src="js/auth-custom.js?v=<%=Timer%>"></script>
</body>
</html>
