<%@ Language="VBScript" CodePage="65001" %>
<!--#include file="inc/common.asp"-->
<%
Dim pageTitle, pageId, currentMenu, currentMenuGroup, extraCss, extraScript, pageResource
pageTitle = "월별 과원관리"
pageId = "orchard-content"
pageResource = "list"
currentMenu = "orchard-content"
currentMenuGroup = "content-hub"
extraCss = ""
%>
<!--#include file="inc/header.asp"-->
<!--#include file="inc/sidebar.asp"-->

<main class="main"><h1 class="page-title" id="resource-heading">월별 과원관리</h1><ul class="flow-guide"><li><strong>화면 안내</strong> : 1월~12월 과원관리 이미지를 올려 홈페이지(Web)와 앱(App)에 보여주는 화면입니다.</li><li><strong>미리 준비</strong> : 내년 자료는 '비공개'로 먼저 저장해 두셨다가, 보여줄 시점에 '공개'로 바꿔주시면 됩니다.</li><li><strong>앱 노출 기준</strong> : 올해 아직 공개된 자료가 없는 달은 앱에서 작년 같은 달 공개 자료가 대신 보입니다.</li></ul><p class="flow-status" id="resource-status" role="status" aria-live="polite"></p><div class="flow-row"><label class="orchard-year">연도 <div class="select" id="resource-year" data-select><button type="button" class="select__button" aria-haspopup="listbox" aria-expanded="false" aria-label="자료 연도"><span class="select__label">연도</span><svg class="select__chevron" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path></svg></button><ul class="select__list" role="listbox" hidden></ul><input type="hidden" value=""></div></label><span id="resource-summary"></span><a class="btn" href="home-content-preview.asp">앱 홈 연결 미리보기</a></div><div class="table-wrap"><table class="table orchard-table"><thead><tr><th>월</th><th>제목</th><th>준비 상태</th><th>공개 상태</th><th>채널</th><th>수정일</th><th>관리</th></tr></thead><tbody id="resource-rows"></tbody></table></div></main>

<%
extraScript = "<script src=""js/orchard-source.js""></script>" & vbCrLf & _
              "<script src=""js/pages/resources.js?v=" & Timer & """></script>"
%>
<!--#include file="inc/footer.asp"-->