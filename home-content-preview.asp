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

<main class="main"><h1 class="page-title" id="resource-heading"><a href="orchard-content.asp">월별 과원관리</a><span class="page-title__sep">&gt;</span>앱 홈 연결 미리보기</h1><ul class="flow-guide"><li>현재 저장된 과원관리·재배력 자료가 앱 첫 화면에서 어떻게 보이는지 연도·월별로 미리 확인하는 화면입니다.</li><li>올해 공개된 월별 자료가 없는 달은 작년 같은 달 공개 자료가 대신 표시됩니다.</li></ul><p class="flow-status" id="resource-status" role="status" aria-live="polite"></p><div class="flow-home-tabs"><button type="button" class="btn" id="home-slide-month">월별 과원관리</button><button type="button" class="btn" id="home-slide-calendar">상시 재배력</button></div><div id="home-preview-body"></div><a class="btn" href="orchard-content.asp">관리자 목록으로</a></main>

<dialog class="flow-preview-dialog" id="resource-preview-dialog" aria-labelledby="resource-preview-heading"><header><h2 id="resource-preview-heading">App 자료 미리보기</h2><button type="button" class="btn" data-flow-close>닫기</button></header><p class="flow-guide">앱에서 자료를 열었을 때 보이는 상세 화면 미리보기입니다.</p><div id="resource-preview-body"></div></dialog>
<dialog class="flow-zoom" id="resource-zoom" aria-labelledby="resource-zoom-title"><header><h2 id="resource-zoom-title">원본 확대</h2><button type="button" class="btn" id="resource-zoom-toggle">확대 / 원래 크기</button><button type="button" class="btn" data-flow-close>닫기</button></header><div class="flow-zoom__viewport"></div></dialog>

<%
extraScript = "<script src=""js/orchard-source.js""></script>" & vbCrLf & _
              "<script src=""js/pages/resources.js?v=" & Timer & """></script>"
%>
<!--#include file="inc/footer.asp"-->
