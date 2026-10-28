<%@ Language="VBScript" CodePage="65001" %>
<!--#include file="inc/common.asp"-->
<%
Dim pageTitle, pageId, currentMenu, currentMenuGroup, extraCss, extraScript
pageTitle = "게시글 관리"
pageId = "contents"
currentMenu = "contents-notice"
currentMenuGroup = "contents"
extraCss = ""
%>
<!--#include file="inc/header.asp"-->
<!--#include file="inc/sidebar.asp"-->

      <main class="main contents-page">
        <h1 class="page-title" id="contents-page-title">게시글 관리</h1>
        <div class="contents-storage" id="contents-storage" hidden>
          <p id="contents-storage-message"></p>
        </div>

        <p class="contents-board-note" id="contents-board-note" hidden>왼쪽 메뉴에서 게시판을 선택해 주세요.</p>

        <div class="list-filters">
          <div class="select select--period" data-select>
            <button type="button" class="select__button" aria-haspopup="listbox" aria-expanded="false">
              <span class="select__label">전체기간</span>
              <svg class="select__chevron" viewBox="0 0 10 10" aria-hidden="true">
                <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>
              </svg>
            </button>
            <ul class="select__list" role="listbox" hidden>
              <li><button type="button" class="select__option is-selected" data-value="all">전체기간</button></li>
              <li><button type="button" class="select__option" data-value="1">최근 1개월</button></li>
              <li><button type="button" class="select__option" data-value="3">최근 3개월</button></li>
              <li><button type="button" class="select__option" data-value="6">최근 6개월</button></li>
              <li><button type="button" class="select__option" data-value="custom">기간선택</button></li>
            </ul>
            <input type="hidden" name="period" value="all">
          </div>

          <div class="contents-custom-period" id="contents-custom-period" hidden>
            <div class="datepicker" data-datepicker>
              <input class="input input--date datepicker__input" id="contents-period-start" name="periodStart" type="text" readonly aria-label="검색 시작일">
            </div>
            <span class="range__sep">~</span>
            <div class="datepicker" data-datepicker>
              <input class="input input--date datepicker__input" id="contents-period-end" name="periodEnd" type="text" readonly aria-label="검색 종료일">
            </div>
          </div>

          <div class="select select--status" data-select>
            <button type="button" class="select__button" aria-haspopup="listbox" aria-expanded="false">
              <span class="select__label">상태</span>
              <svg class="select__chevron" viewBox="0 0 10 10" aria-hidden="true">
                <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>
              </svg>
            </button>
            <ul class="select__list" role="listbox" hidden>
              <li><button type="button" class="select__option is-selected" data-value="">상태</button></li>
              <li><button type="button" class="select__option" data-value="게시예정">게시예정</button></li>
              <li><button type="button" class="select__option" data-value="게시중">게시중</button></li>
              <li><button type="button" class="select__option" data-value="게시종료">게시종료</button></li>
              <li><button type="button" class="select__option" data-value="비공개">비공개</button></li>
            </ul>
            <input type="hidden" name="status" value="">
          </div>

          <div class="select select--field" data-select>
            <button type="button" class="select__button" aria-haspopup="listbox" aria-expanded="false">
              <span class="select__label">제목+내용</span>
              <svg class="select__chevron" viewBox="0 0 10 10" aria-hidden="true">
                <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>
              </svg>
            </button>
            <ul class="select__list" role="listbox" hidden>
              <li><button type="button" class="select__option is-selected" data-value="titleBody">제목+내용</button></li>
              <li><button type="button" class="select__option" data-value="title">제목</button></li>
              <li><button type="button" class="select__option" data-value="author">작성자</button></li>
            </ul>
            <input type="hidden" name="field" value="titleBody">
          </div>

          <input class="input input--search" type="search" name="keyword" aria-label="검색어">
          <button type="button" class="btn" id="contents-search">검색</button>

          <div class="list-actions">
            <button type="button" class="btn" id="contents-delete" data-require-check="#contents-table" data-modal-open="modal-contents-delete" disabled>삭제</button>
            <button type="button" class="btn" id="contents-drafts" aria-pressed="false">임시저장(0)</button>
            <a class="btn btn--primary is-disabled" id="contents-create" href="contents-create.asp" aria-disabled="true" tabindex="-1">+ 신규등록</a>
          </div>
        </div>
        <p class="contents-period-error" id="contents-period-error" hidden></p>

        <div class="table-wrap">
          <table class="table contents-table" id="contents-table">
            <colgroup>
              <col class="col-check">
              <col class="col-no">
              <col>
              <col class="col-channel">
              <col class="col-status">
              <col class="col-author">
              <col class="col-date">
            </colgroup>
            <thead>
              <tr>
                <th class="table__check" scope="col">
                  <label class="checkbox">
                    <input type="checkbox" data-check-all>
                    <span class="checkbox__box" aria-hidden="true"></span>
                    <span class="sr-only">전체 선택</span>
                  </label>
                </th>
                <th scope="col">No</th>
                <th scope="col">제목</th>
                <th scope="col">채널</th>
                <th scope="col">상태</th>
                <th scope="col">작성자</th>
                <th scope="col">수정·등록일</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>

        <nav class="pagination" data-pagination data-current="1" data-total="1" aria-label="페이지"></nav>
      </main>

  <div class="modal" id="modal-contents-delete" hidden>
    <div class="modal__backdrop" data-modal-close></div>
    <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="contents-delete-title">
      <div class="modal__header">
        <h2 class="modal__title" id="contents-delete-title">삭제</h2>
        <button type="button" class="modal__close" data-modal-close aria-label="닫기">×</button>
      </div>
      <div class="modal__body">
        <p>선택한 항목을 삭제하시겠습니까?</p>
      </div>
      <div class="modal__footer">
        <button type="button" class="btn" data-modal-close>취소</button>
        <button type="button" class="btn" id="contents-delete-confirm">삭제</button>
      </div>
    </div>
  </div>

  <div class="modal" id="modal-contents-deleted" hidden>
    <div class="modal__backdrop" data-modal-close></div>
    <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="contents-deleted-title">
      <div class="modal__header">
        <h2 class="modal__title" id="contents-deleted-title">삭제 완료</h2>
        <button type="button" class="modal__close" data-modal-close aria-label="닫기">×</button>
      </div>
      <div class="modal__body">
        <p>선택한 게시글이 삭제되었습니다.</p>
      </div>
      <div class="modal__footer">
        <button type="button" class="btn" data-modal-close>확인</button>
      </div>
    </div>
  </div>

<%
extraScript = "<script src=""js/pages/contents.js?v=" & Timer & """></script>"
%>
<!--#include file="inc/footer.asp"-->
