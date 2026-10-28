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

<main class="main"><h1 class="page-title" id="resource-heading">월별 과원관리</h1><p class="flow-guide">자료 저장·공개 설정과 회원 알림 발송은 별도 업무입니다. 저장은 브라우저 시연용입니다. 통합 검수 주소에서는 앱에서 저장값을 확인할 수 있으며 실제 서버 연동은 별도입니다.</p><p class="flow-status" id="resource-status" role="status" aria-live="polite"></p><div class="flow-row"><label class="orchard-year">연도 <div class="select" id="resource-year" data-select><button type="button" class="select__button" aria-haspopup="listbox" aria-expanded="false" aria-label="자료 연도"><span class="select__label">연도</span><svg class="select__chevron" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path></svg></button><ul class="select__list" role="listbox" hidden></ul><input type="hidden" value=""></div></label><span id="resource-summary"></span><a class="btn" href="home-content-preview.asp">앱 홈 연결 미리보기</a></div><p class="flow-guide">다음 해 12개월 자료를 미리 등록·검수합니다. 사전 등록과 공개 설정은 별도입니다. 앱은 현재 연도의 공개 자료를 우선 조회하며 미래 연도 자료는 관리자 미리보기에서 검수합니다. 자동 일괄 공개 기능은 추가하지 않습니다.</p><div class="table-wrap"><table class="table orchard-table"><thead><tr><th>월</th><th>제목</th><th>준비 상태</th><th>공개 상태</th><th>채널</th><th>수정일</th><th>관리</th></tr></thead><tbody id="resource-rows"></tbody></table></div><p class="flow-guide">앱에는 연도 선택 없이 1~12월을 표시합니다. 올해 같은 월의 공개·App 자료를 우선 사용하고 없으면 작년 같은 월 공개 자료를 유지합니다. 두 해 모두 없으면 자료 없음과 다른 월 선택·상시 재배력으로 안내합니다. 사전 등록과 공개는 별도이며 자동 일괄 공개 규칙은 추가하지 않습니다.</p></main>

<%
extraScript = "<script src=""js/orchard-source.js""></script>" & vbCrLf & _
              "<script src=""js/pages/resources.js?v=" & Timer & """></script>"
%>
<!--#include file="inc/footer.asp"-->