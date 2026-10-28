<%@ Language="VBScript" CodePage="65001" %>
<!--#include file="inc/common.asp"-->
<%
Dim pageTitle, pageId, currentMenu, currentMenuGroup, extraCss, extraScript, pageResource
pageTitle = "상시 재배력"
pageId = "cultivation-content"
pageResource = "calendar"
currentMenu = "cultivation-content"
currentMenuGroup = "content-hub"
extraCss = ""
%>
<!--#include file="inc/header.asp"-->
<!--#include file="inc/sidebar.asp"-->

<main class="main"><h1 class="page-title" id="resource-heading">상시 재배력</h1><p class="flow-guide">자료 저장·공개 설정과 회원 알림 발송은 별도 업무입니다. 저장은 브라우저 시연용입니다. 통합 검수 주소에서는 앱에서 저장값을 확인할 수 있으며 실제 서버 연동은 별도입니다.</p><p class="flow-status" id="resource-status" role="status" aria-live="polite"></p><form id="resource-form" hidden><div id="resource-fields"></div><section class="monthly-form" id="calendar-contents" aria-labelledby="calendar-images-title"><h2 class="monthly-section__title" id="calendar-images-title">콘텐츠 이미지</h2><div class="monthly-channels"><div class="monthly-gallery is-disabled" id="calendar-web-section" aria-disabled="true"><div class="monthly-gallery__head"><h3 class="monthly-gallery__title">Web 재배력 콘텐츠 이미지</h3><span class="monthly-gallery__count" id="calendar-web-count">0장</span></div><div class="monthly-gallery__drop" id="calendar-web-drop"><input class="monthly-gallery__input" id="calendar-web-input" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple><span>이미지를 선택하거나 이 곳에 끌어 놓으세요.</span><button type="button" class="monthly-gallery__pick" id="calendar-web-pick">이미지 선택</button></div><div class="monthly-gallery__list" id="calendar-web-grid"></div></div><div class="monthly-gallery is-disabled" id="calendar-app-section" aria-disabled="true"><div class="monthly-gallery__head"><h3 class="monthly-gallery__title">App 재배력 콘텐츠 이미지</h3><span class="monthly-gallery__count" id="calendar-app-count">0장</span></div><div class="monthly-gallery__drop" id="calendar-app-drop"><input class="monthly-gallery__input" id="calendar-app-input" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple><span>이미지를 선택하거나 이 곳에 끌어 놓으세요.</span><button type="button" class="monthly-gallery__pick" id="calendar-app-pick">이미지 선택</button></div><div class="monthly-gallery__list" id="calendar-app-grid"></div></div></div></section><div class="contents-actions"><div class="contents-actions__group"><button type="button" class="btn btn--secondary" id="resource-preview">App 미리보기</button><button type="submit" class="btn btn--primary" id="resource-save">저장</button></div></div></form></main>

<dialog class="flow-preview-dialog" id="resource-preview-dialog" aria-labelledby="resource-preview-heading"><header><h2 id="resource-preview-heading">App 자료 미리보기</h2><button type="button" class="btn" data-flow-close>닫기</button></header><p class="flow-guide">공개 전 검수 화면입니다. 실제 앱에는 저장된 공개 상태와 App 채널 설정에 따라 노출합니다.</p><div id="resource-preview-body"></div></dialog>
<dialog class="flow-zoom" id="resource-zoom" aria-labelledby="resource-zoom-title"><header><h2 id="resource-zoom-title">원본 확대</h2><button type="button" class="btn" id="resource-zoom-toggle">확대 / 원래 크기</button><button type="button" class="btn" data-flow-close>닫기</button></header><div class="flow-zoom__viewport"></div></dialog>

<%
extraScript = "<script src=""js/orchard-source.js""></script>" & vbCrLf & _
              "<script src=""js/pages/resources.js?v=" & Timer & """></script>"
%>
<!--#include file="inc/footer.asp"-->

<!--#include file="inc/footer.asp"-->