<%@ Language="VBScript" CodePage="65001" %>
<!--#include file="inc/common.asp"-->
<%
Dim pageTitle, pageId, currentMenu, currentMenuGroup, extraCss, extraScript
pageTitle = "행사·교육참여 관리"
pageId = "events"
currentMenu = "events"
currentMenuGroup = ""
extraCss = "<link rel=""stylesheet"" href=""css/participation/prototype.css?v=20261029.1"">" & vbCrLf & _
           "  <link rel=""stylesheet"" href=""css/participation/form-editor.css?v=20261029.1"">" & vbCrLf & _
           "  <link rel=""stylesheet"" href=""css/participation/admin-theme.css?v=20261029.1"">" & vbCrLf & _
           "  <link rel=""stylesheet"" href=""css/participation/operation.css?v=20261029.1"">" & vbCrLf & _
           "  <link rel=""stylesheet"" href=""css/participation/integration.css?v=20261029.1"">"
extraScript = "<dialog id=""ps-dialog"" aria-label=""설문 행사 안내""></dialog>" & vbCrLf & _
              "  <div id=""ps-toast"" role=""status""></div>" & vbCrLf & _
              "  <script src=""js/participation/model.js?v=20261104.5""></script>" & vbCrLf & _
              "  <script src=""proc/participation_proc.asp?action=bootstrap_js&_=" & Timer & """></script>" & vbCrLf & _
              "  <script src=""js/participation/store.js?v=20261102.1""></script>" & vbCrLf & _
              "  <script src=""js/participation/runtime.js?v=20261029.1""></script>" & vbCrLf & _
              "  <script src=""js/participation/participant-ui.js?v=20261104.5""></script>" & vbCrLf & _
              "  <script src=""js/participation/editor.js?v=20261104.5""></script>" & vbCrLf & _
              "  <script src=""js/participation/app.js?v=20261104.5""></script>" & vbCrLf & _
              "  <noscript><p>설문·행사 관리 기능을 이용하려면 JavaScript를 활성화해 주세요.</p></noscript>"
%>
<!--#include file="inc/header.asp"-->
<!--#include file="inc/sidebar.asp"-->

      <main class="main participation-main"><div id="peach-survey-prototype"></div></main>

<!--#include file="inc/footer.asp"-->

