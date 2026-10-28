<%@ Language="VBScript" CodePage="65001" %>
<!--#include file="inc/common.asp"-->
<%
Dim pageTitle, pageId, currentMenu, currentMenuGroup, extraCss, extraScript
pageTitle = "권한 수정"
pageId = "permissions"
currentMenu = "permissions"
currentMenuGroup = ""
extraCss = ""
%>
<!--#include file="inc/header.asp"-->
<!--#include file="inc/sidebar.asp"-->

<main class="main permissions-page">
        <h1 class="page-title">
          <a href="permissions.asp">운영자·권한 관리</a>
          <span class="page-title__sep">&gt;</span>
          권한 수정
        </h1>

        <div id="permissions-editor" hidden>
          <div class="permissions-toolbar">
            <div class="permissions-picker">
              <span class="permissions-picker__label" id="permissions-operator-label">운영자<span class="required">*</span></span>
              <div class="select" id="permissions-operator" data-select>
                <button type="button" class="select__button" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="permissions-operator-label">
                  <span class="select__label">운영자</span>
                  <svg class="select__chevron" viewBox="0 0 10 10" aria-hidden="true">
                    <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>
                  </svg>
                </button>
                <ul class="select__list" role="listbox" hidden></ul>
                <input type="hidden" name="operator" value="">
              </div>
            </div>
            <button type="button" class="btn" id="permissions-reload">현재 권한 불러오기</button>
          </div>

          <div class="table-wrap">
            <table class="table permissions-table">
              <thead id="permissions-head"></thead>
              <tbody id="permissions-body"></tbody>
            </table>
          </div>

          <p class="permissions-save-note" id="permissions-save-note" hidden role="status"></p>

          <div class="permissions-actions">
            <a class="btn" id="permissions-cancel" href="permissions.asp">취소</a>
            <button type="button" class="btn btn--primary" id="permissions-save">권한 저장</button>
          </div>
        </div>

        <div class="contents-missing" id="permissions-missing" hidden>
          <p>운영자를 찾을 수 없습니다.</p>
          <a class="btn" href="permissions.asp">목록으로</a>
        </div>
      </main>

<div class="modal" id="modal-permissions-confirm" hidden>
    <div class="modal__backdrop" data-modal-close></div>
    <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="permissions-confirm-title">
      <div class="modal__header">
        <h2 class="modal__title" id="permissions-confirm-title">이동 확인</h2>
        <button type="button" class="modal__close" data-modal-close aria-label="닫기">×</button>
      </div>
      <div class="modal__body">
        <p id="permissions-confirm-message"></p>
      </div>
      <div class="modal__footer">
        <button type="button" class="btn" data-modal-close>취소</button>
        <button type="button" class="btn" id="permissions-confirm-ok">이동</button>
      </div>
    </div>
  </div>

<%
extraScript = "<script src=""js/pages/permissions.js?v=" & Timer & """></script>"
%>
<!--#include file="inc/footer.asp"-->