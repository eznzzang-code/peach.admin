<%@ Language="VBScript" CodePage="65001" %>
<%
Option Explicit
Response.CharSet = "UTF-8"
Session.CodePage = 65001
%>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>아이디·비밀번호 찾기 | 복숭아자조금 관리자</title>
  <link rel="stylesheet" href="css/variables.css?v=<%=Timer%>">
  <link rel="stylesheet" href="css/common.css?v=<%=Timer%>">
  <link rel="stylesheet" href="css/layout.css?v=<%=Timer%>">
  <link rel="stylesheet" href="css/components.css?v=<%=Timer%>">
  <link rel="stylesheet" href="css/pages.css?v=<%=Timer%>">
  <link rel="stylesheet" href="css/flow-alignment.css?v=<%=Timer%>">
  <style>
    .auth-panel--password .auth-form {
      width: max-content;
      max-width: 100%;
      margin: 0 auto;
    }
    .auth-panel--password .auth-row {
      justify-content: flex-start;
    }
    .auth-static-id {
      width: 280px;
      font-size: 14px;
      font-weight: 500;
      color: #333;
      line-height: 40px;
      padding: 0 4px;
      letter-spacing: 0.3px;
    }
    .pwd-step[hidden] {
      display: none !important;
    }
  </style>
</head>
<body class="auth-body">
  <main class="auth auth--find">
    <p class="auth__brand">
      <svg class="auth__logo" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path fill="#F6C3B6" d="M15.6 8.4c-5.7.6-9.8 5.2-9.8 10.8 0 5.6 4.4 9.8 10 9.8 1.2 0 2.3-.2 3.4-.6-3.8-1.8-6.2-5.6-6.2-10.2 0-3.6 1.2-6.8 2.6-9.8Z"/>
        <path fill="#EB5C66" d="M16.2 8.2c1.6 3.2 2.6 6.4 2.6 10 0 4.6-2.4 8.4-6.2 10.2 1.1.4 2.2.6 3.4.6 5.6 0 10-4.2 10-9.8 0-5.4-3.8-9.8-9.8-10.8Z"/>
        <path fill="#62B34A" d="M17.2 7.6c.4-2.6 2.6-4.4 5.2-4.2-1.8.6-3 2-3.4 3.6-.4 1.2-.8 1.6-1.8.6Z"/>
        <path fill="#F8E2D4" d="M15.4 9.2c.8 2.4.6 5.2-.4 7.4" stroke="#F8E2D4" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
      복숭아자조금 관리자
    </p>

    <section class="auth-card auth-card--find">
      <div class="auth-tabs" role="tablist" aria-label="계정 찾기">
        <button type="button" class="auth-tabs__item is-active" id="tab-id" role="tab" aria-selected="true" aria-controls="panel-id" data-auth-tab="id">아이디찾기</button>
        <button type="button" class="auth-tabs__item" id="tab-password" role="tab" aria-selected="false" aria-controls="panel-password" data-auth-tab="password" tabindex="-1">비밀번호찾기</button>
      </div>

      <form class="auth-panel" id="panel-id" data-auth="find-id" role="tabpanel" aria-labelledby="tab-id" novalidate>
        <div class="auth-form">
          <div class="auth-row">
            <label class="auth-row__label" for="find-name">이름</label>
            <input class="input auth-input" id="find-name" name="name" autocomplete="name">
          </div>
          <div class="auth-row">
            <label class="auth-row__label" for="find-phone-1">휴대전화</label>
            <div class="auth-phone-group">
              <input class="input auth-phone" id="find-phone-1" name="phone1" inputmode="numeric" autocomplete="tel-national" maxlength="3" aria-label="휴대전화 앞자리">
              <span class="auth-phone__dash" aria-hidden="true">-</span>
              <input class="input auth-phone" id="find-phone-2" name="phone2" inputmode="numeric" maxlength="4" aria-label="휴대전화 중간자리">
              <span class="auth-phone__dash" aria-hidden="true">-</span>
              <input class="input auth-phone" id="find-phone-3" name="phone3" inputmode="numeric" maxlength="4" aria-label="휴대전화 끝자리">
              <button type="button" class="btn auth-verify" data-auth-verify>인증</button>
            </div>
          </div>
          <p class="auth-hint" id="find-phone-hint">휴대전화 : 관리자 등록 시 입력했던 휴대전화번호를 입력합니다.</p>
          <div class="auth-row">
            <label class="auth-row__label" for="find-code">인증번호</label>
            <input class="input auth-input" id="find-code" name="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" aria-describedby="find-phone-hint">
          </div>
          <p class="auth-message" data-auth-message role="alert" hidden></p>
          <p class="auth-result" data-auth-result hidden>회원님의 아이디는 <strong data-found-id></strong> 입니다.</p>
        </div>
        <div class="auth-divider"></div>
        <div class="auth-actions">
          <button type="submit" class="btn btn--primary auth-actions__confirm">확인</button>
          <a class="auth-actions__back" href="login.asp">로그인</a>
        </div>
      </form>

      <form class="auth-panel auth-panel--password" id="panel-password" data-auth="find-password" role="tabpanel" aria-labelledby="tab-password" hidden novalidate>
        <p class="auth-guide" id="pwd-guide">비밀번호를 찾으려고 하는 아이디를 입력해 주세요.</p>
        <div class="auth-form">
          <!-- 1단계: 아이디 입력 -->
          <div class="pwd-step" id="pwd-step-1">
            <div class="auth-row">
              <label class="auth-row__label" for="find-user-id">아이디</label>
              <input class="input auth-input" id="find-user-id" name="userId" autocomplete="username" spellcheck="false" placeholder="아이디를 입력하세요">
            </div>
          </div>

          <!-- 2단계: 휴대전화 인증 (오른쪽 이미지 100% 동일 규격) -->
          <div class="pwd-step" id="pwd-step-2" hidden>
            <div class="auth-row">
              <label class="auth-row__label">아이디</label>
              <div class="auth-static-id" id="pwd-static-id"></div>
            </div>
            <div class="auth-row">
              <label class="auth-row__label" for="pwd-phone-1">휴대전화</label>
              <div class="auth-phone-group">
                <input class="input auth-phone" id="pwd-phone-1" name="pwdPhone1" inputmode="numeric" autocomplete="tel-national" maxlength="3" aria-label="휴대전화 앞자리">
                <span class="auth-phone__dash" aria-hidden="true">-</span>
                <input class="input auth-phone" id="pwd-phone-2" name="pwdPhone2" inputmode="numeric" maxlength="4" aria-label="휴대전화 중간자리">
                <span class="auth-phone__dash" aria-hidden="true">-</span>
                <input class="input auth-phone" id="pwd-phone-3" name="pwdPhone3" inputmode="numeric" maxlength="4" aria-label="휴대전화 끝자리">
                <button type="button" class="btn auth-verify" id="pwd-verify-btn">인증</button>
              </div>
            </div>
            <div class="auth-row">
              <label class="auth-row__label" for="pwd-code">인증번호</label>
              <input class="input auth-input" id="pwd-code" name="pwdCode" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="인증번호 4~6자리 입력">
            </div>
          </div>

          <!-- 3단계: 새 비밀번호 설정 -->
          <div class="pwd-step" id="pwd-step-3" hidden>
            <div class="auth-row">
              <label class="auth-row__label" for="pwd-new-password">새 비밀번호</label>
              <input type="password" class="input auth-input" id="pwd-new-password" name="newPassword" autocomplete="new-password" placeholder="최소 8자 이상, 특수문자 포함">
            </div>
            <div class="auth-row">
              <label class="auth-row__label" for="pwd-new-password-confirm">비밀번호 확인</label>
              <input type="password" class="input auth-input" id="pwd-new-password-confirm" name="newPasswordConfirm" autocomplete="new-password" placeholder="새 비밀번호 재입력">
            </div>
          </div>

          <!-- 4단계: 변경 완료 안내 -->
          <div class="pwd-step" id="pwd-step-4" hidden>
            <div style="text-align:center; padding: 18px 0 10px;">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:10px; display:inline-block;">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
              <p style="font-size:15px; font-weight:700; color:#1f2937; margin:0 0 6px;">비밀번호가 성공적으로 변경되었습니다.</p>
              <p style="font-size:13px; color:#6b7280; margin:0;">새로운 비밀번호로 로그인해 주세요.</p>
            </div>
          </div>

          <p class="auth-message" id="pwd-message" data-auth-message role="alert" hidden></p>
        </div>
        <div class="auth-divider"></div>
        <div class="auth-actions">
          <button type="submit" class="btn btn--primary auth-actions__confirm" id="pwd-submit-btn">확인</button>
          <a class="auth-actions__back" id="pwd-login-link" href="login.asp">로그인</a>
        </div>
      </form>
    </section>
  </main>

  <script src="js/common.js"></script>
  <!-- 기존 login.js는 원본 보존하고, 실서버 연동 전용 분리 스크립트 로드 -->
  <script src="js/auth-custom.js?v=<%=Timer%>"></script>
</body>
</html>
