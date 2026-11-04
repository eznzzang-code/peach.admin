<%@ Language="VBScript" CodePage="65001" %>
<!--#include file="inc/common.asp"-->
<%
Dim pageTitle, pageId, currentMenu, currentMenuGroup, extraCss, extraScript
pageTitle = "교육영상 관리"
pageId = "videos"
currentMenu = "videos"
currentMenuGroup = ""
extraCss = ""
%>
<!--#include file="inc/header.asp"-->
<!--#include file="inc/sidebar.asp"-->

      <main class="main videos-page">
        <h1 class="page-title">교육영상 관리</h1>

        <div class="list-filters">
          <div class="select" data-select>
            <button type="button" class="select__button" aria-haspopup="listbox" aria-expanded="false">
              <span class="select__label">홈 노출</span>
              <svg class="select__chevron" viewBox="0 0 10 10" aria-hidden="true">
                <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>
              </svg>
            </button>
            <ul class="select__list" role="listbox" hidden>
              <li><button type="button" class="select__option is-selected" data-value="">홈 노출</button></li>
              <li><button type="button" class="select__option" data-value="노출">노출</button></li>
              <li><button type="button" class="select__option" data-value="미노출">미노출</button></li>
            </ul>
            <input type="hidden" name="mainExposure" value="">
          </div>

          <div class="select" data-select>
            <button type="button" class="select__button" aria-haspopup="listbox" aria-expanded="false">
              <span class="select__label">분류</span>
              <svg class="select__chevron" viewBox="0 0 10 10" aria-hidden="true">
                <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>
              </svg>
            </button>
            <ul class="select__list" role="listbox" hidden>
              <li><button type="button" class="select__option is-selected" data-value="">분류</button></li>
              <li><button type="button" class="select__option" data-value="재배기술">재배기술</button></li>
              <li><button type="button" class="select__option" data-value="생육단계">생육단계</button></li>
              <li><button type="button" class="select__option" data-value="미분류">미분류</button></li>
            </ul>
            <input type="hidden" name="category" value="">
          </div>

          <input class="input input--search" type="search" name="keyword" placeholder="영상제목" aria-label="영상제목">
          <button type="button" class="btn" id="videos-search">검색</button>

          <div class="videos-collect">
            <span id="videos-main-count">메인 노출 0/3개</span>
            <a class="btn btn--primary" href="videos-detail.asp?new=1">영상 등록</a>
          </div>
        </div>

        <div class="table-wrap">
          <table class="table videos-table" id="videos-table">
            <colgroup>
              <col class="col-no">
              <col class="col-category">
              <col>
              <col class="col-main">
              <col class="col-duration">
            </colgroup>
            <thead>
              <tr>
                <th scope="col">No</th>
                <th scope="col">분류</th>
                <th scope="col">영상 제목</th>
                <th scope="col">메인 노출</th>
                <th scope="col">영상길이</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>

        <nav class="pagination" data-pagination data-current="1" data-total="5" aria-label="페이지"></nav>
      </main>

<%
extraScript = "<script src=""js/pages/videos.js?v=" & Timer & """></script>"
%>
<!--#include file="inc/footer.asp"-->
