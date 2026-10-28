<%@ Language="VBScript" CodePage="65001" %>
<!--#include file="inc/common.asp"-->
<%
Dim pageTitle, pageId, currentMenu, currentMenuGroup, extraCss, extraScript
pageTitle = "영상 상세"
pageId = "videos"
currentMenu = "videos"
currentMenuGroup = ""
extraCss = ""
%>
<!--#include file="inc/header.asp"-->
<!--#include file="inc/sidebar.asp"-->

<main class="main videos-page videos-detail">
  <h1 class="page-title">
    <a href="videos-list.asp" data-video-leave>영상 관리</a>
    <span class="page-title__sep">&gt;</span>
    영상 상세
  </h1>

  <div class="contents-missing" id="video-missing" hidden>
    <p>영상을 찾을 수 없습니다.</p>
    <a class="btn" href="videos-list.asp">목록으로 돌아가기</a>
  </div>

  <form id="video-form" class="form" novalidate hidden>
    <div class="form-line" data-video-admin>
      <span class="form-line__label" id="video-visibility-label"
        >노출 상태</span
      >
      <div class="select" data-select>
        <span class="sr-only" id="video-visibility-name">공개 상태:</span>
        <button
          type="button"
          class="select__button"
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-labelledby="video-visibility-name video-visibility-value"
        >
          <span class="select__label" id="video-visibility-value">공개</span>
          <svg class="select__chevron" viewBox="0 0 10 10" aria-hidden="true">
            <path
              d="M2 3.5 5 6.5 8 3.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
            ></path>
          </svg>
        </button>
        <ul class="select__list" role="listbox" hidden>
          <li>
            <button
              type="button"
              class="select__option is-selected"
              data-value="public"
            >
              공개
            </button>
          </li>
          <li>
            <button type="button" class="select__option" data-value="private">
              비공개
            </button>
          </li>
        </ul>
        <input
          type="hidden"
          id="video-visibility"
          name="visibility"
          value="public"
        />
      </div>
    </div>

    <div class="form-line videos-detail__channels" data-video-admin>
      <span class="form-line__label" id="video-channel-label"
        >노출채널<span class="required">*</span></span
      >
      <div
        class="videos-channel-groups"
        role="group"
        aria-labelledby="video-channel-label"
      >
        <div class="videos-channel">
          <label class="checkbox">
            <input
              type="checkbox"
              id="video-channel-web"
              name="channels"
              value="Web"
              checked
            />
            <span class="checkbox__box" aria-hidden="true"></span>
            <span class="checkbox__text">Web (홈페이지)</span>
          </label>
          <label class="checkbox videos-channel__main" id="video-main-web-row">
            <input
              type="checkbox"
              id="video-main-web"
              name="mainWeb"
              value="true"
            />
            <span class="checkbox__box" aria-hidden="true"></span>
            <span class="checkbox__text">Web 메인 노출</span>
          </label>
        </div>
        <div class="videos-channel">
          <label class="checkbox">
            <input
              type="checkbox"
              id="video-channel-app"
              name="channels"
              value="App"
            />
            <span class="checkbox__box" aria-hidden="true"></span>
            <span class="checkbox__text">App</span>
          </label>
          <label class="checkbox videos-channel__main" id="video-main-app-row">
            <input
              type="checkbox"
              id="video-main-app"
              name="mainApp"
              disabled
            />
            <span class="checkbox__box" aria-hidden="true"></span>
            <span class="checkbox__text">App 메인 노출</span>
          </label>
        </div>
      </div>
    </div>

    <div class="form-line" data-video-admin>
      <span class="form-line__label">시작일</span>
      <div class="datepicker" data-datepicker>
        <input
          class="input input--date datepicker__input"
          id="video-publish-start"
          name="publishStart"
          type="text"
          value="2026.10.31"
          readonly
          aria-label="게시 시작일"
        />
      </div>
      <span class="range__sep">~</span>
      <span class="form-line__label">종료일</span>
      <div class="datepicker" data-datepicker>
        <input
          class="input input--date datepicker__input"
          id="video-publish-end"
          name="publishEnd"
          type="text"
          value=""
          readonly
          aria-label="게시 종료일"
        />
      </div>
      <label class="checkbox">
        <input
          type="checkbox"
          id="video-no-end"
          name="noEnd"
          value="true"
          data-toggle-disable="video-publish-end"
        />
        <span class="checkbox__box" aria-hidden="true"></span>
        <span class="checkbox__text">종료일 없음</span>
      </label>
    </div>

    <div class="videos-detail__body">
      <div class="videos-source" data-video-source>
        <div class="videos-thumb">
          <div
            class="videos-thumb__frame"
            id="video-thumbnail"
            role="img"
            aria-label="영상 썸네일"
          ></div>
          <span class="videos-thumb__time" id="video-duration"></span>
        </div>
        <button type="button" class="btn" id="video-original-open">
          원본영상 보러가기
        </button>
      </div>

      <div class="videos-detail__fields">
        <p class="videos-original" data-video-source>
          <span class="videos-original__label">원본 ID :</span>
          <span id="video-original-id"></span>
          <span aria-hidden="true">/</span>
          <span id="video-playable"></span>
          <span id="video-original-title" hidden></span>
        </p>

        <div class="videos-detail__field" data-video-admin>
          <span class="videos-detail__label" id="video-category-label"
            >분류<span class="required">*</span></span
          >
          <div class="select" data-select>
            <span class="sr-only" id="video-category-name">분류:</span>
            <button
              type="button"
              class="select__button"
              aria-haspopup="listbox"
              aria-expanded="false"
              aria-labelledby="video-category-name video-category-value"
            >
              <span class="select__label" id="video-category-value">선택</span>
              <svg
                class="select__chevron"
                viewBox="0 0 10 10"
                aria-hidden="true"
              >
                <path
                  d="M2 3.5 5 6.5 8 3.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.2"
                  stroke-linecap="round"
                ></path>
              </svg>
            </button>
            <ul class="select__list" role="listbox" hidden>
              <li>
                <button
                  type="button"
                  class="select__option is-selected"
                  data-value=""
                >
                  선택
                </button>
              </li>
              <li>
                <button
                  type="button"
                  class="select__option"
                  data-value="재배기술"
                >
                  재배기술
                </button>
              </li>
              <li>
                <button
                  type="button"
                  class="select__option"
                  data-value="생육단계"
                >
                  생육단계
                </button>
              </li>
            </ul>
            <input type="hidden" id="video-category" name="category" value="" />
          </div>
        </div>

        <div class="videos-detail__field" data-video-admin>
          <label class="videos-detail__label" for="video-display-title"
            >표시 제목<span class="required">*</span></label
          >
          <input
            class="input input--block"
            id="video-display-title"
            name="displayTitle"
            type="text"
          />
        </div>

        <div class="videos-detail__field" data-video-admin>
          <label class="videos-detail__label" for="video-description"
            >설명</label
          >
          <textarea
            class="input input--block"
            id="video-description"
            name="description"
            rows="1"
          ></textarea>
        </div>

        <div
          class="videos-detail__field videos-detail__field--attach"
          data-video-admin
        >
          <span class="videos-detail__label" id="video-attachment-label"
            >관련자료</span
          >
          <div class="videos-detail__attachment">
            <div
              class="upload upload--files"
              id="video-attachment-zone"
              data-upload
            >
              <input
                class="upload__input"
                id="video-attachment"
                type="file"
                accept=".pdf,image/png,image/jpeg"
                aria-labelledby="video-attachment-label"
              />
              <div class="upload__empty">
                <svg
                  class="upload__icon"
                  viewBox="0 0 18 18"
                  aria-hidden="true"
                >
                  <path
                    d="M5 8.5 9 4.5l4 4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                  <path
                    d="M9 5v7.2"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.2"
                    stroke-linecap="round"
                  ></path>
                  <path
                    d="M4 13.5h10"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.2"
                    stroke-linecap="round"
                  ></path>
                </svg>
                <span class="upload__hint"
                  >이 곳에 파일을 드래그 하세요, 또는
                  <button type="button" class="upload__pick">
                    파일선택
                  </button></span
                >
                <span class="upload__ext">PDF, PNG, JPG</span>
              </div>
            </div>
            <ul class="upload-list" id="video-attachment-list"></ul>
          </div>
        </div>
      </div>
    </div>
    <p class="flow-guide">
      앱 홈에는 대표 영상 한 개를 표시합니다. 선택하면 기존 대표 영상을 교체하며
      최신순 정렬은 바뀌지 않습니다. 비공개·기간 종료 시 홈에서 숨기고 자동
      대체하지 않습니다. Web 홈 설정은 별도입니다.
    </p>
    <div class="videos-detail__actions">
      <div class="contents-actions__group">
        <a class="btn" id="video-list" href="videos-list.asp" data-video-leave
          >목록</a
        >
        <button type="button" class="btn btn--danger" id="video-delete">
          삭제
        </button>
      </div>
      <div class="contents-actions__group">
        <button type="button" class="btn btn--secondary" id="video-preview">
          App 미리보기
        </button>
        <button type="button" class="btn btn--primary" id="video-save">
          저장
        </button>
      </div>
    </div>
  </form>
</main>

<div class="modal" id="modal-video-delete" hidden>
  <div class="modal__backdrop" data-modal-close></div>
  <div
    class="modal__dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="video-delete-title"
  >
    <div class="modal__header">
      <h2 class="modal__title" id="video-delete-title">삭제</h2>
      <button
        type="button"
        class="modal__close"
        data-modal-close
        aria-label="닫기"
      >
        ×
      </button>
    </div>
    <div class="modal__body">
      <p>이 교육영상을 삭제하시겠습니까?</p>
    </div>
    <div class="modal__footer">
      <button type="button" class="btn" data-modal-close>취소</button>
      <button type="button" class="btn btn--danger" id="video-delete-confirm">
        삭제
      </button>
    </div>
  </div>
</div>

<div class="modal" id="modal-video-notice" hidden>
  <div class="modal__backdrop" data-modal-close></div>
  <div
    class="modal__dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="video-notice-title"
  >
    <div class="modal__header">
      <h2 class="modal__title" id="video-notice-title">안내</h2>
      <button
        type="button"
        class="modal__close"
        data-modal-close
        aria-label="닫기"
      >
        ×
      </button>
    </div>
    <div class="modal__body">
      <p id="video-notice-message"></p>
    </div>
    <div class="modal__footer">
      <button type="button" class="btn" data-modal-close>확인</button>
    </div>
  </div>
</div>

<div class="modal" id="modal-video-leave" hidden>
  <div class="modal__backdrop" data-modal-close></div>
  <div
    class="modal__dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="video-leave-title"
  >
    <div class="modal__header">
      <h2 class="modal__title" id="video-leave-title">안내</h2>
      <button
        type="button"
        class="modal__close"
        data-modal-close
        aria-label="닫기"
      >
        ×
      </button>
    </div>
    <div class="modal__body">
      <p>변경한 내용이 저장되지 않았습니다.<br />목록으로 이동하시겠습니까?</p>
    </div>
    <div class="modal__footer">
      <button type="button" class="btn" data-modal-close>취소</button>
      <button type="button" class="btn" id="video-leave-confirm">확인</button>
    </div>
  </div>
</div>

<%
extraScript = "<script src=""js/pages/videos.js?v=" & Timer & """></script>"
%>
<!--#include file="inc/footer.asp"-->
