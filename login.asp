<%@ Language="VBScript" CodePage="65001" %>
<%
Option Explicit
Response.CharSet = "UTF-8"
Session.CodePage = 65001

' 이미 로그인된 세션이 있는 경우 메인으로 이동
If Session("admin_id") <> "" Or Session("ADMIN_ID") <> "" Then
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
  <link rel="stylesheet" href="css/admin-account.css?v=<%=Timer%>">
  <link rel="icon" type="image/png" href="assets/logo-peach.png?v=20261103.1">
</head>
<body class="auth-body">
  <main class="auth">
    <h1 class="auth__title">
      <img class="auth__logo" src="assets/logo-peach.png?v=20261103.1" alt="">
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
      <button type="button" class="auth-help__link" id="signup-open">회원가입</button>
    </div>
  </main>

  <div class="modal" id="modal-signup-invitation" hidden>
    <div class="modal__backdrop" data-invitation-close></div>
    <div class="modal__dialog account-gate" role="dialog" aria-modal="true" aria-labelledby="invitation-title">
      <div class="modal__header">
        <h2 class="modal__title" id="invitation-title">관리자 가입 인증</h2>
        <button type="button" class="modal__close" data-invitation-close aria-label="닫기">×</button>
      </div>
      <form id="invitation-form" novalidate>
        <div class="modal__body">
          <p class="account-intro">관리자에게 전달받은 가입 인증코드를 입력해 주세요.</p>
          <label class="signup-field__label" for="invitation-code">가입 인증코드</label>
          <input class="input input--block" id="invitation-code" autocomplete="off" maxlength="100" placeholder="가입 인증코드를 입력해 주세요" aria-describedby="invitation-error">
          <p class="signup-error" id="invitation-error" role="alert" hidden></p>
        </div>
        <div class="modal__footer">
          <button type="button" class="btn" data-invitation-close>취소</button>
          <button type="submit" class="btn btn--primary">확인 후 회원가입</button>
        </div>
      </form>
    </div>
  </div>

  <div class="modal" id="modal-signup" hidden>
    <div class="modal__backdrop" data-signup-close></div>
    <div class="modal__dialog signup-dialog" role="dialog" aria-modal="true" aria-labelledby="signup-title">
      <div class="modal__header">
        <h2 class="modal__title" id="signup-title">회원가입</h2>
        <button type="button" class="modal__close" data-signup-close aria-label="닫기">×</button>
      </div>
      <form class="signup-form" id="signup-form" novalidate>
        <div class="modal__body signup-dialog__body">
          <div class="signup-field">
            <label class="signup-field__label" for="signup-name">이름</label>
            <input class="input input--block" id="signup-name" name="name" autocomplete="name" maxlength="40" placeholder="이름을 입력해 주세요" aria-describedby="signup-name-error">
            <p class="signup-error" id="signup-name-error" hidden></p>
          </div>

          <div class="signup-field">
            <label class="signup-field__label" for="signup-phone">휴대폰 번호</label>
            <div class="signup-line">
              <input class="input" id="signup-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="010-0000-0000" maxlength="13" aria-describedby="signup-phone-error">
              <button type="button" class="btn" id="signup-send">인증번호 발송</button>
            </div>
            <p class="signup-error" id="signup-phone-error" hidden></p>
          </div>

          <div class="signup-field">
            <label class="signup-field__label" for="signup-code">SMS 인증번호</label>
            <div class="signup-line">
              <input class="input" id="signup-code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" placeholder="인증번호 4자리" maxlength="6" aria-describedby="signup-code-error signup-code-status">
              <button type="button" class="btn" id="signup-verify">인증확인</button>
            </div>
            <p class="signup-meta" id="signup-code-timer" hidden></p>
            <p class="signup-status" id="signup-code-status" hidden></p>
            <p class="signup-error" id="signup-code-error" hidden></p>
          </div>

          <div class="signup-field">
            <label class="signup-field__label" for="signup-id">아이디</label>
            <div class="signup-line">
              <input class="input" id="signup-id" name="userId" type="text" autocomplete="off" spellcheck="false" maxlength="20" placeholder="아이디" aria-describedby="signup-id-hint signup-id-error">
              <button type="button" class="btn" id="signup-check-id">중복확인</button>
            </div>
            <p class="signup-hint" id="signup-id-hint">영문으로 시작하는 4~20자의 영문과 숫자를 사용할 수 있습니다.</p>
            <p class="signup-status" id="signup-id-status" hidden></p>
            <p class="signup-error" id="signup-id-error" hidden></p>
          </div>

          <div class="signup-field">
            <label class="signup-field__label" for="signup-password">비밀번호</label>
            <input class="input input--block" id="signup-password" name="password" type="password" autocomplete="new-password" maxlength="20" aria-describedby="signup-password-hint signup-password-error">
            <p class="signup-hint" id="signup-password-hint">8~20자이며 영문과 숫자를 모두 포함해야 합니다.</p>
            <p class="signup-error" id="signup-password-error" hidden></p>
          </div>

          <div class="signup-field">
            <label class="signup-field__label" for="signup-password-confirm">비밀번호 확인</label>
            <input class="input input--block" id="signup-password-confirm" name="passwordConfirm" type="password" autocomplete="new-password" maxlength="20" aria-describedby="signup-password-confirm-error">
            <p class="signup-error" id="signup-password-confirm-error" hidden></p>
          </div>

          <p class="signup-error" id="signup-form-error" hidden></p>
        </div>
        <div class="modal__footer">
          <button type="button" class="btn" data-signup-close>취소</button>
          <button type="submit" class="btn btn--primary">가입하기</button>
        </div>
      </form>
    </div>
  </div>

  <script src="js/admin-account-api.js?v=<%=Timer%>"></script>
  <script src="js/common.js?v=<%=Timer%>"></script>
  <script src="js/auth-custom.js?v=<%=Timer%>"></script>
  <script src="js/pages/signup.js?v=<%=Timer%>"></script>
</body>
</html>
