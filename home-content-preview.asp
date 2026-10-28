<%@ Language="VBScript" CodePage="65001" %>
<!--#include file="inc/common.asp"-->
<%
Dim pageTitle, pageId, currentMenu, currentMenuGroup, extraCss, extraScript, pageResource
pageTitle = "앱 홈 연결 미리보기"
pageId = "orchard-content"
pageResource = "home"
currentMenu = "home"
currentMenuGroup = ""
extraCss = ""
%>
<!--#include file="inc/header.asp"-->
<!--#include file="inc/sidebar.asp"-->

<main class="main"><h1 class="page-title" id="resource-heading"><a href="orchard-content.asp">월별 과원관리</a><span class="page-title__sep">&gt;</span>앱 홈 연결 미리보기</h1><p class="flow-guide">자료 저장·공개 설정과 회원 알림 발송은 별도 업무입니다. 이 화면의 저장은 해당 브라우저에서 확인하는 시연용이며 통합 검수 실행 주소에서는 앱의 connected=1 모드로 저장 결과를 확인할 수 있습니다. 실제 서버 연동은 별도입니다.</p><p class="flow-status" id="resource-status" role="status" aria-live="polite"></p><p class="flow-guide flow-pending">월별 자료를 먼저 표시하고 7초마다 자동 전환합니다. 수동 이동 후에는 자동 전환을 멈추며 홈에 다시 진입하면 재시작합니다. 홈은 현재 월 기준이며 올해 공개 자료가 없으면 작년 같은 월 공개 자료를 유지합니다. 한 자료만 공개되어 있으면 해당 자료만 표시합니다. 실제 동작은 저장한 자료의 앱 검수 링크에서 확인합니다.</p><div class="flow-home-tabs"><button type="button" class="btn" id="home-slide-month">월별 과원관리</button><button type="button" class="btn" id="home-slide-calendar">상시 재배력</button></div><div id="home-preview-body"></div><a class="btn" href="orchard-content.asp">관리자 목록으로</a></main>

<dialog class="flow-preview-dialog" id="resource-preview-dialog" aria-labelledby="resource-preview-heading"><header><h2 id="resource-preview-heading">App 자료 미리보기</h2><button type="button" class="btn" data-flow-close>닫기</button></header><p class="flow-guide">공개 전 검수 화면입니다. 실제 앱에는 저장된 공개 상태와 App 채널 설정에 따라 노출합니다.</p><div id="resource-preview-body"></div></dialog>
<dialog class="flow-zoom" id="resource-zoom" aria-labelledby="resource-zoom-title"><header><h2 id="resource-zoom-title">원본 확대</h2><button type="button" class="btn" id="resource-zoom-toggle">확대 / 원래 크기</button><button type="button" class="btn" data-flow-close>닫기</button></header><div class="flow-zoom__viewport"></div></dialog>

<%
extraScript = "<script src=""js/orchard-source.js""></script>" & vbCrLf & _
              "<script src=""js/pages/resources.js?v=" & Timer & """></script>"
%>
<!--#include file="inc/footer.asp"-->
