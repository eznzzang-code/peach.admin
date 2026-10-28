<%@ Language="VBScript" CodePage="65001" %>
<!--#include file="inc/common.asp"-->
<%
Dim pageTitle, pageId, currentMenu, currentMenuGroup, extraCss, extraScript
pageTitle = "영상 관리"
pageId = "videos"
currentMenu = "videos"
currentMenuGroup = ""
extraCss = ""
%>
<!--#include file="inc/header.asp"-->
<!--#include file="inc/sidebar.asp"-->

<main class="main videos-page">
        <h1 class="page-title">영상 관리</h1>

        <div class="list-filters">
          <div class="select" data-select>
            <button type="button" class="select__button" aria-haspopup="listbox" aria-expanded="false">
              <span class="select__label">수집상태</span>
              <svg class="select__chevron" viewBox="0 0 10 10" aria-hidden="true">
                <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>
              </svg>
            </button>
            <ul class="select__list" role="listbox" hidden>
              <li><button type="button" class="select__option is-selected" data-value="">수집상태</button></li>
              <li><button type="button" class="select__option" data-value="정상">정상</button></li>
              <li><button type="button" class="select__option" data-value="실패">실패</button></li>
              <li><button type="button" class="select__option" data-value="원본 없음">원본 없음</button></li>
            </ul>
            <input type="hidden" name="collectionStatus" value="">
          </div>

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
            <!-- TODO: 최근 수집 시각은 수집 API 응답 또는 서버 기록을 기준으로 표시합니다. -->
            <span id="videos-collected-at">최근 수집 26.10.01 09:00</span>
            <span class="videos-collect__status" id="videos-collect-status" role="status" aria-live="polite"></span>
            <button type="button" class="btn videos-refresh" id="videos-refresh">
              <svg class="videos-refresh__icon" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M13.2 8a5.2 5.2 0 1 1-1.5-3.6" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>
                <path d="M13.5 2.6V6H10" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              목록 새로고침
            </button>
          </div>
        </div>

        <div class="table-wrap">
          <table class="table videos-table" id="videos-table">
            <colgroup>
              <col class="col-no">
              <col class="col-category">
              <col>
              <col class="col-channel">
              <col class="col-duration">
              <col class="col-status">
            </colgroup>
            <thead>
              <tr>
                <th scope="col">No</th>
                <th scope="col">분류</th>
                <th scope="col">영상 제목</th>
                <th scope="col">채널</th>
                <th scope="col">영상길이</th>
                <th scope="col">수집 상태</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>

        <nav class="pagination" data-pagination data-current="1" data-total="5" aria-label="페이지"></nav>
      </main>

<div class="modal" id="modal-video-collect" hidden>
    <div class="modal__backdrop" data-modal-close></div>
    <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="video-collect-title">
      <div class="modal__header">
        <h2 class="modal__title" id="video-collect-title">안내</h2>
        <button type="button" class="modal__close" data-modal-close aria-label="닫기">×</button>
      </div>
      <div class="modal__body">
        <p id="video-collect-message"></p>
      </div>
      <div class="modal__footer">
        <button type="button" class="btn" data-modal-close>확인</button>
      </div>
    </div>
  </div>

<%
extraScript = "<script src=""js/pages/videos.js?v=" & Timer & """></script>"
%>
<!--#include file="inc/footer.asp"-->