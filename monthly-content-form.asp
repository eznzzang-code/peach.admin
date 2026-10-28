<%@ Language="VBScript" CodePage="65001" %>
<!--#include file="inc/common.asp"-->
<%
Dim pageTitle, pageId, currentMenu, currentMenuGroup, extraCss, extraScript
pageTitle = "월별 콘텐츠"
pageId = "orchard-content"
currentMenu = "orchard-content"
currentMenuGroup = "content-hub"
extraCss = ""
%>
<!--#include file="inc/header.asp"-->
<!--#include file="inc/sidebar.asp"-->

<main class="main">
        <h1 class="page-title" id="monthly-heading">
          <a href="orchard-content.asp" id="monthly-heading-list">월별 과원관리</a>
          <span class="page-title__sep">&gt;</span>
          <span id="monthly-heading-label">월별 콘텐츠</span>
          <span class="page-title__sep" id="monthly-heading-sep" hidden>&gt;</span>
          <span id="monthly-heading-when" hidden></span>
        </h1>

        <div class="monthly-form__gate" id="monthly-gate" hidden>
          <p id="monthly-gate-message"></p>
          <div class="monthly-form__gate-actions" id="monthly-gate-actions"></div>
        </div>

        <form id="monthly-form" class="form monthly-form" novalidate hidden>
          <section class="monthly-section" aria-labelledby="monthly-basic-title">
            <h2 class="monthly-section__title" id="monthly-basic-title">기본 정보</h2>

            <div class="form-row">
              <label class="form-row__label" for="monthly-visibility-button">노출 상태</label>
              <div class="form-row__controls">
                <div class="select monthly-visibility" id="monthly-visibility-select" data-select>
                  <button type="button" class="select__button" id="monthly-visibility-button" aria-haspopup="listbox" aria-expanded="false">
                    <span class="select__label" id="monthly-visibility-label">공개</span>
                    <svg class="select__chevron" viewBox="0 0 10 10" aria-hidden="true">
                      <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>
                    </svg>
                  </button>
                  <ul class="select__list" id="monthly-visibility-list" role="listbox" hidden>
                    <li><button type="button" class="select__option is-selected" data-value="공개">공개</button></li>
                    <li><button type="button" class="select__option" data-value="비공개">비공개</button></li>
                  </ul>
                  <input type="hidden" id="monthly-visibility" name="monthly-visibility" value="공개">
                </div>
              </div>
            </div>

            <div class="form-row" id="monthly-channel-row">
              <span class="form-row__label">노출 채널<span class="required">*</span></span>
              <div class="form-row__controls">
                <label class="checkbox">
                  <input type="checkbox" id="monthly-channel-web">
                  <span class="checkbox__box" aria-hidden="true"></span>
                  <span class="checkbox__text">Web (홈페이지)</span>
                </label>
                <label class="checkbox">
                  <input type="checkbox" id="monthly-channel-app">
                  <span class="checkbox__box" aria-hidden="true"></span>
                  <span class="checkbox__text">App</span>
                </label>
              </div>
            </div>

            <div class="form-row">
              <label class="form-row__label" for="monthly-title">콘텐츠 제목<span class="required">*</span></label>
              <div class="form-row__controls">
                <input class="input input--block" id="monthly-title" type="text" name="title">
              </div>
            </div>

            <div class="form-row">
              <label class="form-row__label" for="monthly-thumb">썸네일</label>
              <div class="form-row__controls">
                <div class="resource-thumb">
                  <input class="resource-thumb__input" id="monthly-thumb" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" aria-describedby="monthly-thumb-name">
                  <button type="button" class="btn resource-thumb__pick" id="monthly-thumb-pick">파일 선택</button>
                  <span class="resource-thumb__name is-empty" id="monthly-thumb-name">선택된 파일이 없습니다.</span>
                  <button type="button" class="resource-thumb__clear" id="monthly-thumb-clear" hidden aria-label="첨부 파일 삭제">×</button>
                </div>
              </div>
            </div>
          </section>

          <section class="monthly-section" aria-labelledby="monthly-images-title">
            <h2 class="monthly-section__title" id="monthly-images-title">콘텐츠 이미지</h2>
            <div class="monthly-channels">
              <div class="monthly-gallery is-disabled" id="monthly-web-section" aria-disabled="true">
                <div class="monthly-gallery__head">
                  <h3 class="monthly-gallery__title">Web 과원관리 콘텐츠 이미지<span class="required">*</span></h3>
                  <span class="monthly-gallery__count" id="monthly-web-count">0장</span>
                </div>
                <div class="monthly-gallery__drop" id="monthly-web-drop">
                  <input class="monthly-gallery__input" id="monthly-web-input" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple>
                  <span>이미지를 선택하거나 이 곳에 끌어 놓으세요.</span>
                  <button type="button" class="monthly-gallery__pick" id="monthly-web-pick">이미지 선택</button>
                </div>
                <div class="monthly-gallery__list" id="monthly-web-grid"></div>
              </div>

              <div class="monthly-gallery is-disabled" id="monthly-app-section" aria-disabled="true">
                <div class="monthly-gallery__head">
                  <h3 class="monthly-gallery__title">App 과원관리 콘텐츠 이미지<span class="required">*</span></h3>
                  <span class="monthly-gallery__count" id="monthly-app-count">0장</span>
                </div>
                <div class="monthly-gallery__drop" id="monthly-app-drop">
                  <input class="monthly-gallery__input" id="monthly-app-input" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple>
                  <span>이미지를 선택하거나 이 곳에 끌어 놓으세요.</span>
                  <button type="button" class="monthly-gallery__pick" id="monthly-app-pick">이미지 선택</button>
                </div>
                <div class="monthly-gallery__list" id="monthly-app-grid"></div>
              </div>
            </div>
          </section>

          <div class="contents-actions">
            <div class="contents-actions__group">
              <button type="button" class="btn" id="monthly-list">목록</button>
              <button type="button" class="btn btn--danger" id="monthly-delete" hidden>삭제</button>
            </div>
            <div class="contents-actions__group">
              <button type="button" class="btn btn--secondary" id="monthly-preview-open">미리보기</button>
              <button type="button" class="btn btn--primary" id="monthly-submit">등록</button>
            </div>
          </div>
        </form>
      </main>

<div class="modal" id="modal-monthly-preview" hidden>
    <div class="modal__backdrop" data-modal-close></div>
    <div class="modal__dialog modal__dialog--lg monthly-preview" role="dialog" aria-modal="true" aria-labelledby="monthly-preview-heading">
      <div class="modal__header">
        <h2 class="modal__title" id="monthly-preview-heading">미리보기</h2>
        <button type="button" class="modal__close" data-modal-close aria-label="닫기">×</button>
      </div>
      <div class="modal__body">
        <p class="monthly-preview__line">콘텐츠 유형: <span id="monthly-preview-type"></span></p>
        <p class="monthly-preview__line">연도·월: <span id="monthly-preview-when"></span></p>
        <p class="monthly-preview__line">제목: <span id="monthly-preview-title"></span></p>
        <p class="monthly-preview__line">노출 상태: <span id="monthly-preview-visibility"></span></p>
        <div class="monthly-preview__tabs" id="monthly-preview-tabs" hidden>
          <button type="button" class="btn" id="monthly-preview-web">Web 미리보기</button>
          <button type="button" class="btn" id="monthly-preview-app">App 미리보기</button>
        </div>
        <p class="monthly-preview__note">관리자 검수용 미리보기입니다. 홈페이지와 앱 화면에는 아직 반영되지 않습니다.</p>
        <div id="monthly-preview-stage"></div>
      </div>
      <div class="modal__footer">
        <button type="button" class="btn" data-modal-close>닫기</button>
      </div>
    </div>
  </div>

  <div class="modal" id="modal-monthly-leave" hidden>
    <div class="modal__backdrop" data-modal-close></div>
    <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="monthly-leave-title">
      <div class="modal__header">
        <h2 class="modal__title" id="monthly-leave-title">이동 확인</h2>
        <button type="button" class="modal__close" data-modal-close aria-label="닫기">×</button>
      </div>
      <div class="modal__body">
        <p>입력한 내용을 저장하지 않고 목록으로 이동하시겠습니까?</p>
      </div>
      <div class="modal__footer">
        <button type="button" class="btn" data-modal-close>취소</button>
        <button type="button" class="btn" id="monthly-leave-confirm">이동</button>
      </div>
    </div>
  </div>

  <div class="modal" id="modal-monthly-delete" hidden>
    <div class="modal__backdrop" data-modal-close></div>
    <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="monthly-delete-title">
      <div class="modal__header">
        <h2 class="modal__title" id="monthly-delete-title">삭제</h2>
        <button type="button" class="modal__close" data-modal-close aria-label="닫기">×</button>
      </div>
      <div class="modal__body">
        <p>이 과원관리 콘텐츠를 삭제하시겠습니까?</p>
      </div>
      <div class="modal__footer">
        <button type="button" class="btn" data-modal-close>취소</button>
        <button type="button" class="btn btn--danger" id="monthly-delete-confirm">삭제</button>
      </div>
    </div>
  </div>

  <div class="modal" id="modal-monthly-notice" hidden>
    <div class="modal__backdrop" data-modal-close></div>
    <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="monthly-notice-title">
      <div class="modal__header">
        <h2 class="modal__title" id="monthly-notice-title">안내</h2>
        <button type="button" class="modal__close" data-modal-close aria-label="닫기">×</button>
      </div>
      <div class="modal__body">
        <p id="monthly-notice"></p>
      </div>
      <div class="modal__footer">
        <button type="button" class="btn" data-modal-close>확인</button>
      </div>
    </div>
  </div>

<%
extraScript = "<script src=""js/orchard-source.js""></script>" & vbCrLf & _
              "<script src=""js/pages/monthly-content-form.js?v=" & Timer & """></script>"
%>
<!--#include file="inc/footer.asp"-->