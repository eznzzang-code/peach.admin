<%@ Language="VBScript" CodePage="65001" %>
<!--#include file="inc/common.asp"-->
<%
Dim pageTitle, pageId, currentMenu, currentMenuGroup, extraCss, extraScript
pageTitle = "내 관리자 정보"
pageId = "admin-account"
currentMenu = ""
currentMenuGroup = ""
extraCss = ""
%>
<!--#include file="inc/header.asp"-->
<!--#include file="inc/sidebar.asp"-->

      <main class="main">
        <div class="account-page">
          <h1 class="page-title">내 관리자 정보</h1>
          <p class="account-intro">본인의 관리자 정보를 확인하고 수정합니다.</p>
          <div id="account-load-error" class="account-message" role="alert" hidden></div>
          <section class="account-section" aria-labelledby="account-basic-title">
            <h2 id="account-basic-title">기본정보</h2>
            <form id="account-basic-form" novalidate>
              <div class="account-row">
                <label for="account-id">아이디</label>
                <div>
                  <input class="input" id="account-id" readonly>
                  <p class="account-help">가입한 아이디는 변경할 수 없습니다.</p>
                </div>
              </div>
              <div class="account-row">
                <label for="account-name">이름</label>
                <input class="input" id="account-name" autocomplete="name" maxlength="40" required>
              </div>
              <div class="account-row">
                <span>휴대폰 번호</span>
                <div>
                  <strong id="account-current-phone">—</strong>
                  <button type="button" class="btn" data-account-open="phone">휴대폰 번호 변경</button>
                </div>
              </div>
              <div class="account-row">
                <span>비밀번호</span>
                <div>
                  <span>비밀번호는 표시하지 않습니다.</span>
                  <button type="button" class="btn" data-account-open="password">비밀번호 변경</button>
                </div>
              </div>
              <p id="account-basic-message" class="account-message" role="status" hidden></p>
              <div class="account-actions">
                <button type="submit" class="btn btn--primary">정보 저장</button>
              </div>
            </form>
          </section>
          <section class="account-section" aria-labelledby="account-invitation-title">
            <h2 id="account-invitation-title">가입 인증코드 관리</h2>
            <p class="account-intro">관리자 가입에 사용하는 공통 코드입니다. 유효기간 없이 사용하며 재발행하면 기존 코드는 즉시 사용할 수 없습니다.</p>
            <div class="account-code-line">
              <input class="input" id="account-invitation-code" aria-label="현재 가입 인증코드" readonly placeholder="아직 발행된 코드가 없습니다.">
              <button type="button" class="btn" id="account-invitation-copy" hidden>인증코드 복사하기</button>
              <button type="button" class="btn" id="account-invitation-issue">인증코드 발행하기</button>
            </div>
            <p id="account-invitation-message" class="account-message" role="status" hidden></p>
          </section>
        </div>
      </main>

<%
extraScript = "<script src=""js/admin-account-api.js?v=" & Timer & """></script>" & vbCrLf & _
              "<script src=""js/pages/admin-account.js?v=" & Timer & """></script>"
%>
<!--#include file="inc/footer.asp"-->

