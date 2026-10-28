<%@ Language="VBScript" CodePage="65001" %>
<!--#include file="inc/common.asp"-->
<%
Dim pageTitle, pageId, currentMenu, currentMenuGroup, extraCss, extraScript
pageTitle = "운영자·권한 관리"
pageId = "permissions"
currentMenu = "permissions"
currentMenuGroup = ""
extraCss = ""
%>
<!--#include file="inc/header.asp"-->
<!--#include file="inc/sidebar.asp"-->

<main class="main permissions-page">
        <h1 class="page-title">운영자·권한 관리</h1>

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
          <span class="permissions-picker__label" id="permissions-status-label">상태</span>
          <span class="permissions-status" id="permissions-status" aria-labelledby="permissions-status-label"></span>
        </div>

        <div class="table-wrap">
          <table class="table permissions-table">
            <thead id="permissions-head"></thead>
            <tbody id="permissions-body"></tbody>
          </table>
        </div>

        <div class="permissions-actions permissions-actions--end">
          <a class="btn" id="permissions-edit" href="permissions-edit.asp">권한 수정</a>
        </div>
      </main>

<%
extraScript = "<script src=""js/pages/permissions.js?v=" & Timer & """></script>"
%>
<!--#include file="inc/footer.asp"-->