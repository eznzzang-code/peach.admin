<%@ Language="VBScript" CodePage="65001" %>
<!--#include file="inc/common.asp"-->
<%
Dim pageTitle, pageId, currentMenu, currentMenuGroup, extraCss, extraScript
pageTitle = "게시글 수정"
pageId = "contents"
currentMenu = "contents-notice"
currentMenuGroup = "contents"
extraCss = ""
%>
<!--#include file="inc/header.asp"-->
<!--#include file="inc/sidebar.asp"-->

<main class="main contents-page contents-create contents-edit">
        <h1 class="page-title" id="contents-page-title">게시글 수정</h1>

        <div class="contents-storage" id="contents-storage" hidden>
          <p id="contents-storage-message"></p>
        </div>
        <div class="contents-missing" id="contents-board" hidden>
          <p id="contents-board-message"></p>
          <a class="btn" id="contents-board-back" href="contents-list.asp">게시글 목록으로 이동</a>
        </div>

        <div class="contents-missing" id="contents-missing" hidden>
          <p>게시글을 찾을 수 없습니다.</p>
          <a class="btn" href="contents-list.asp">목록으로 돌아가기</a>
        </div>

        <div class="contents-missing" id="contents-orchard" hidden>
          <p>과원관리 게시글은 현재 게시글 관리에서 수정할 수 없습니다.</p>
          <a class="btn" href="contents-list.asp">게시글 목록으로 이동</a>
        </div>

        <p class="flow-guide">공지 원문은 공개 게시판에 표시합니다. 개인 납부 안내는 본인 알림과 납부현황으로 연결합니다. 공지 저장과 알림 발송은 별도입니다. 홈 긴급 안내는 지정 순서로 수동 전환하며 기간 종료·비공개 자료는 제외합니다.</p><form id="contents-form" class="form" data-mode="edit" novalidate hidden>
          <div class="form-row">
            <span class="form-row__label">게시글</span>
            <div class="form-row__controls">
              <div class="form-cluster">
                <div class="select select--open" data-select>
                  <button type="button" class="select__button" aria-haspopup="listbox" aria-expanded="false">
                    <span class="select__label">공개</span>
                    <svg class="select__chevron" viewBox="0 0 10 10" aria-hidden="true">
                      <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>
                    </svg>
                  </button>
                  <ul class="select__list" role="listbox" hidden>
                    <li><button type="button" class="select__option is-selected" data-value="public">공개</button></li>
                    <li><button type="button" class="select__option" data-value="private">비공개</button></li>
                  </ul>
                  <input type="hidden" name="visibility" value="public">
                </div>
                <span class="form-cluster__label">긴급설정</span>
                <label class="checkbox">
                  <input type="checkbox" id="urgent-use" checked>
                  <span class="checkbox__box" aria-hidden="true"></span>
                  <span class="checkbox__text">사용</span>
                </label>
                <label class="checkbox">
                  <input type="checkbox" id="urgent-unused">
                  <span class="checkbox__box" aria-hidden="true"></span>
                  <span class="checkbox__text">미사용</span>
                </label>
                <span class="urgent-period" id="urgent-period">
                  <span class="form-cluster__label">긴급기간</span>
                  <div class="range">
                    <div class="datepicker" data-datepicker>
                      <input class="input input--date datepicker__input" id="urgent-start" type="text" value="2026.10.31" readonly aria-label="긴급 시작일">
                    </div>
                    <span class="range__sep">~</span>
                    <div class="datepicker" data-datepicker>
                      <input class="input input--date datepicker__input" id="urgent-end" type="text" value="2026.12.31" readonly aria-label="긴급 종료일">
                    </div>
                  </div>
                  <span class="urgent-state" id="urgent-state" hidden></span>
                </span>
              </div>
            </div>
          </div>

          <div class="form-row">
            <span class="form-row__label" id="channel-label">노출채널<span class="required">*</span></span>
            <div class="form-row__controls">
              <div class="form-cluster">
                <input type="hidden" name="category" id="contents-category" value="">
                <div id="channel-field">
                  <label class="checkbox">
                    <input type="checkbox" id="channel-web" checked>
                    <span class="checkbox__box" aria-hidden="true"></span>
                    <span class="checkbox__text">Web(홈페이지)</span>
                  </label>
                  <label class="checkbox">
                    <input type="checkbox" id="channel-app">
                    <span class="checkbox__box" aria-hidden="true"></span>
                    <span class="checkbox__text">App</span>
                  </label>
                </div>
                <span class="form-cluster__label">시작일</span>
                <div class="datepicker" data-datepicker>
                  <input class="input input--date datepicker__input" id="publish-start" type="text" value="2026.10.31" readonly aria-label="게시 시작일">
                </div>
                <span class="range__sep">~</span>
                <span class="form-cluster__label">종료일</span>
                <div class="datepicker" data-datepicker>
                  <input class="input input--date datepicker__input" id="publish-end" type="text" value="2026.12.31" readonly aria-label="게시 종료일">
                </div>
                <label class="checkbox">
                  <input type="checkbox" id="publish-no-end" data-toggle-disable="publish-end">
                  <span class="checkbox__box" aria-hidden="true"></span>
                  <span class="checkbox__text">종료일 없음</span>
                </label>
              </div>
            </div>
          </div>

          <div class="form-row" id="contents-pin-row" hidden>
            <span class="form-row__label" id="contents-pin-label">상단 고정</span>
            <div class="form-row__controls">
              <label class="checkbox">
                <input type="checkbox" id="contents-pin">
                <span class="checkbox__box" aria-hidden="true"></span>
                <span class="checkbox__text">홈페이지 공지사항 목록 상단에 고정합니다.</span>
              </label>
            </div>
          </div>

          <div class="form-row">
            <label class="form-row__label" for="contents-title">제목<span class="required">*</span></label>
            <div class="form-row__controls">
              <input class="input input--block" id="contents-title" type="text" name="title">
            </div>
          </div>

          <div class="form-row" id="contents-related-row">
            <span class="form-row__label" id="contents-related-label">연결 자료</span>
            <div class="form-row__controls">
              <div class="contents-related">
                <div class="select contents-related__type" data-select>
                  <button type="button" class="select__button" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="contents-related-label contents-related-type-label">
                    <span class="select__label" id="contents-related-type-label">자료 유형</span>
                    <svg class="select__chevron" viewBox="0 0 10 10" aria-hidden="true">
                      <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>
                    </svg>
                  </button>
                  <ul class="select__list" id="contents-related-type-list" role="listbox" hidden>
                    <li><button type="button" class="select__option is-selected" data-value="">자료 유형</button></li>
                    <li><button type="button" class="select__option" data-value="video">영상</button></li>
                    <li><button type="button" class="select__option" data-value="post">게시글</button></li>
                    <li><button type="button" class="select__option" data-value="orchard">월별 과원관리</button></li>
                    <li><button type="button" class="select__option" data-value="calendar">상시 재배력</button></li>
                  </ul>
                  <input type="hidden" id="contents-related-kind" value="">
                </div>
                <div class="select contents-related__board" data-select hidden>
                  <button type="button" class="select__button" id="contents-related-board-button" aria-haspopup="listbox" aria-expanded="false" disabled aria-labelledby="contents-related-label contents-related-board-label">
                    <span class="select__label" id="contents-related-board-label">게시판</span>
                    <svg class="select__chevron" viewBox="0 0 10 10" aria-hidden="true">
                      <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>
                    </svg>
                  </button>
                  <ul class="select__list" id="contents-related-board-list" role="listbox" hidden>
                    <li><button type="button" class="select__option is-selected" data-value="">게시판</button></li>
                    <li><button type="button" class="select__option" data-value="공지">공지사항</button></li>
                    <li><button type="button" class="select__option" data-value="복숭아정보">복숭아정보</button></li>
                    <li><button type="button" class="select__option" data-value="재배자료">재배자료</button></li>
                  </ul>
                  <input type="hidden" id="contents-related-board" value="">
                </div>
                <div class="select contents-related__target" data-select>
                  <button type="button" class="select__button" id="contents-related-target-button" aria-haspopup="listbox" aria-expanded="false" disabled aria-labelledby="contents-related-label contents-related-target-label">
                    <span class="select__label" id="contents-related-target-label">연결 대상</span>
                    <svg class="select__chevron" viewBox="0 0 10 10" aria-hidden="true">
                      <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>
                    </svg>
                  </button>
                  <ul class="select__list" id="contents-related-target-list" role="listbox" hidden></ul>
                  <input type="hidden" id="contents-related-target" value="">
                </div>
              </div>
              <p class="flow-guide" id="contents-related-guide">자료의 상세 이동만 설정합니다. 공지 저장과 알림 발송은 별도입니다. 알림 작성·대상 선택·발송·결과 확인은 자조금 통합 시스템에서 운영합니다. 비공개·삭제 자료는 앱에서 열리지 않습니다.</p>
            </div>
          </div>

          <div class="form-row form-row--top">
            <span class="form-row__label">본문<span class="required">*</span></span>
            <div class="form-row__controls">
              <!-- TODO: 본문 에디터 라이브러리 연동 -->
              <div class="editor" data-editor>
                <!-- TODO: 상단 아이콘 줄은 디자인 재현용입니다. 실제 에디터 연동 시 교체합니다. -->
                <div class="editor__bar editor__bar--icons" aria-hidden="true">
                  <span class="editor__glyph">
                    <svg viewBox="0 0 16 16"><path d="M4 2.5h5.2L12 5.2V13.5H4z" fill="none" stroke="currentColor" stroke-width="1.2"></path><path d="M9 2.5V5.5h3" fill="none" stroke="currentColor" stroke-width="1.2"></path></svg>
                  </span>
                  <span class="editor__glyph">
                    <svg viewBox="0 0 16 16"><path d="M6 4 3 7l3 3" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3.5 7H9a3 3 0 0 1 0 6H7" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path></svg>
                  </span>
                  <span class="editor__glyph">
                    <svg viewBox="0 0 16 16"><path d="M10 4l3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12.5 7H7a3 3 0 0 0 0 6h2" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path></svg>
                  </span>
                  <span class="editor__glyph">
                    <svg viewBox="0 0 16 16"><path d="M5 3.5h6l1.5 2H13v7H3v-7h1.5z" fill="none" stroke="currentColor" stroke-width="1.2"></path></svg>
                  </span>
                  <span class="editor__glyph">
                    <svg viewBox="0 0 16 16"><rect x="3" y="5" width="7" height="8" fill="none" stroke="currentColor" stroke-width="1.2"></rect><path d="M6 5V3.5h7V11h-1.5" fill="none" stroke="currentColor" stroke-width="1.2"></path></svg>
                  </span>
                  <span class="editor__glyph">
                    <svg viewBox="0 0 16 16"><path d="M4 3h5.5L12 5.5V13H4z" fill="none" stroke="currentColor" stroke-width="1.2"></path><path d="M6.2 8.2h3.6M8 6.4v3.6" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path></svg>
                  </span>
                  <span class="editor__glyph">
                    <svg viewBox="0 0 16 16"><path d="M3 4h10M3 8h10M3 12h10" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path></svg>
                  </span>
                  <span class="editor__glyph">
                    <svg viewBox="0 0 16 16"><rect x="2.5" y="4" width="11" height="8" fill="none" stroke="currentColor" stroke-width="1.2"></rect><path d="M2.5 7h11M6 7v5M10 7v5" fill="none" stroke="currentColor" stroke-width="1.2"></path></svg>
                  </span>
                  <span class="editor__glyph">
                    <svg viewBox="0 0 16 16"><rect x="2.5" y="3.5" width="11" height="9" fill="none" stroke="currentColor" stroke-width="1.2"></rect><circle cx="6" cy="6.5" r="1" fill="currentColor"></circle><path d="M3.5 11 6.5 8l2 1.6 1.4-1.2 2.6 2.6" fill="none" stroke="currentColor" stroke-width="1.1"></path></svg>
                  </span>
                  <span class="editor__glyph">
                    <svg viewBox="0 0 16 16"><path d="M4 12c2-6 6-6 8 0" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path><circle cx="8" cy="5" r="1.2" fill="none" stroke="currentColor" stroke-width="1.2"></circle></svg>
                  </span>
                </div>
                <div class="editor__bar" role="toolbar" aria-label="본문 서식">
                  <select class="editor__select" data-editor-block aria-label="문단 서식">
                    <option value="p">기본서식</option>
                    <option value="h2">제목</option>
                    <option value="h3">소제목</option>
                  </select>
                  <select class="editor__select" data-editor-font aria-label="글꼴">
                    <option value="Malgun Gothic">맑은 고딕</option>
                    <option value="Dotum">돋움</option>
                    <option value="Gulim">굴림</option>
                  </select>
                  <select class="editor__select" data-editor-size aria-label="글자 크기">
                    <option value="13px">10pt</option>
                    <option value="16px">12pt</option>
                    <option value="19px">14pt</option>
                  </select>
                  <select class="editor__select" data-editor-line aria-label="줄간격">
                    <option value="1.5">1.5</option>
                    <option value="1">1.0</option>
                    <option value="1.8">1.8</option>
                    <option value="2">2.0</option>
                  </select>
                  <button type="button" class="editor__tool" data-command="bold" aria-label="굵게">B</button>
                  <button type="button" class="editor__tool editor__tool--italic" data-command="italic" aria-label="기울임">I</button>
                  <button type="button" class="editor__tool editor__tool--underline" data-command="underline" aria-label="밑줄">U</button>
                  <button type="button" class="editor__tool" data-command="insertUnorderedList" aria-label="목록">
                    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                      <path d="M2 4h2M6 4h8M2 8h2M6 8h8M2 12h2M6 12h8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>
                    </svg>
                  </button>
                  <button type="button" class="editor__tool" data-command="link" aria-label="링크">
                    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                      <path d="M6.5 9.5 9.5 6.5M7 4.5 8.2 3.3a2.2 2.2 0 0 1 3.1 3.1L10 7.7M9 11.5 7.8 12.7a2.2 2.2 0 0 1-3.1-3.1L6 8.3" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>
                    </svg>
                  </button>
                </div>
                <div class="editor__canvas" data-editor-canvas contenteditable="true" role="textbox" aria-multiline="true" aria-label="본문"></div>
                <textarea class="editor__source" data-editor-source hidden aria-label="본문 HTML"></textarea>
                <div class="editor__foot">
                  <button type="button" class="editor__mode is-active" data-editor-mode="design">디자인</button>
                  <button type="button" class="editor__mode" data-editor-mode="html">HTML</button>
                </div>
              </div>
            </div>
          </div>

          <div class="form-row">
            <span class="form-row__label">파일첨부</span>
            <div class="form-row__controls">
              <div class="upload upload--files" id="file-upload" data-upload>
                <input class="upload__input" type="file" multiple aria-label="파일첨부">
                <div class="upload__empty">
                  <svg class="upload__icon" viewBox="0 0 18 18" aria-hidden="true">
                    <path d="M5 8.5 9 4.5l4 4" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M9 5v7.2" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>
                    <path d="M4 13.5h10" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>
                  </svg>
                  <span class="upload__hint">이 곳에 파일을 드래그 하세요, 또는 <button type="button" class="upload__pick">파일선택</button></span>
                  <span class="upload__ext">여러 파일을 선택할 수 있습니다.</span>
                </div>
              </div>
              <ul class="upload-list" id="file-upload-list"></ul>
              <p class="form-help">첨부파일은 서버(/uploads/board/) 및 데이터베이스에 안전하게 업로드됩니다.</p>
              <p class="upload-note" id="file-upload-note" hidden></p>
              <p class="field-error" id="file-upload-error" hidden></p>
            </div>
          </div>

          <div class="contents-actions">
            <div class="contents-actions__group">
              <button type="button" class="btn" id="contents-cancel">취소</button>
              <button type="button" class="btn btn--danger" id="contents-delete">삭제</button>
            </div>
            <div class="contents-actions__group">
              <button type="button" class="btn btn--secondary" id="contents-preview">미리보기</button>
              <button type="button" class="btn" id="contents-draft">임시저장</button>
              <button type="button" class="btn btn--primary" id="contents-submit">등록</button>
            </div>
          </div>
        </form>
      </main>

<div class="modal" id="modal-contents-edit-delete" hidden>
    <div class="modal__backdrop" data-modal-close></div>
    <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="contents-edit-delete-title">
      <div class="modal__header">
        <h2 class="modal__title" id="contents-edit-delete-title">삭제</h2>
        <button type="button" class="modal__close" data-modal-close aria-label="닫기">×</button>
      </div>
      <div class="modal__body">
        <p>이 게시글을 삭제하시겠습니까?</p>
      </div>
      <div class="modal__footer">
        <button type="button" class="btn" data-modal-close>취소</button>
        <button type="button" class="btn btn--danger" id="contents-edit-delete-confirm">삭제</button>
      </div>
    </div>
  </div>

  <div class="modal" id="modal-contents-cancel" hidden>
    <div class="modal__backdrop" data-modal-close></div>
    <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="contents-cancel-title">
      <div class="modal__header">
        <h2 class="modal__title" id="contents-cancel-title">이동 확인</h2>
        <button type="button" class="modal__close" data-modal-close aria-label="닫기">×</button>
      </div>
      <div class="modal__body">
        <p>입력한 내용을 저장하지 않고 목록으로 이동하시겠습니까?</p>
      </div>
      <div class="modal__footer">
        <button type="button" class="btn" data-modal-close>취소</button>
        <button type="button" class="btn" id="contents-cancel-confirm">이동</button>
      </div>
    </div>
  </div>

  <div class="modal" id="modal-contents-preview" hidden>
    <div class="modal__backdrop" data-modal-close></div>
    <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="contents-preview-title">
      <div class="modal__header">
        <h2 class="modal__title" id="contents-preview-title">미리보기</h2>
        <button type="button" class="modal__close" data-modal-close aria-label="닫기">×</button>
      </div>
      <div class="modal__body">
        <img class="preview__image" id="preview-image" alt="" hidden>
        <h3 class="preview__title" id="preview-title"></h3>
        <div class="preview__body" id="preview-body"></div>
      </div>
      <div class="modal__footer">
        <button type="button" class="btn" data-modal-close>닫기</button>
      </div>
    </div>
  </div>

  <div class="modal" id="modal-contents-done" hidden>
    <div class="modal__backdrop" data-modal-close></div>
    <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="contents-done-title">
      <div class="modal__header">
        <h2 class="modal__title" id="contents-done-title">등록 완료</h2>
        <button type="button" class="modal__close" data-modal-close aria-label="닫기">×</button>
      </div>
      <div class="modal__body">
        <p id="contents-done-message">게시글이 시연용 데이터에 등록되었습니다.</p>
      </div>
      <div class="modal__footer">
        <button type="button" class="btn" id="contents-done-confirm">확인</button>
      </div>
    </div>
  </div>

<%
extraScript = "<script src=""js/pages/contents.js?v=" & Timer & """></script>" & vbCrLf & _
              "<script src=""js/content-links.js?v=" & Timer & """></script>" & vbCrLf & _
              "<script src=""js/app-preview.js""></script>"
%>
<!--#include file="inc/footer.asp"-->