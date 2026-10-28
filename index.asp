<%@ Language="VBScript" CodePage="65001" %>
<!--#include file="inc/common.asp"-->
<%
Dim pageTitle, pageId, currentMenu, currentMenuGroup, extraCss, extraScript
pageTitle = "홈페이지 콘텐츠 관리"
pageId = "home"
currentMenu = "home"
currentMenuGroup = ""
extraCss = ""
%>
<!--#include file="inc/header.asp"-->
<!--#include file="inc/sidebar.asp"-->

      <main class="main home-preview">
        <h1 class="page-title">홈페이지 콘텐츠 관리</h1>
        <p class="home-lead">홈페이지 메인에 노출되는 주요 콘텐츠를 확인하고 관리할 수 있습니다.</p>

        <div class="home-feature">
          <section class="home-card" id="home-orchard" aria-label="이번 달 과원관리"></section>
          <section class="home-card" id="home-cultivation" aria-label="복숭아 재배력"></section>
        </div>

        <section class="home-videos-section" aria-labelledby="home-videos-title">
          <h2 class="home-section-title" id="home-videos-title">재배기술 교육영상</h2>
          <div class="home-videos" id="home-videos"></div>
        </section>

        <p class="home-note">이 화면은 홈페이지 메인에 사용 중인 콘텐츠를 보여 줍니다. 관리 화면의 저장이 홈페이지에 자동으로 반영되지는 않습니다.</p>

        <section class="home-recent" aria-labelledby="home-recent-title">
          <div class="home-section-head">
            <h2 class="home-section-title" id="home-recent-title">최근 게시글</h2>
            <a class="btn" href="contents-list.asp#notice">게시글 관리</a>
          </div>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">게시판</th>
                  <th scope="col">제목</th>
                  <th scope="col">상태</th>
                  <th scope="col">수정일</th>
                </tr>
              </thead>
              <tbody id="home-recent-body">
                <tr><td class="home-empty" colspan="4">게시글을 확인하고 있습니다.</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

<%
extraScript = "<script src=""js/home-preview-data.js""></script>" & vbCrLf & _
              "<script src=""js/pages/home.js?v=" & Timer & """></script>"
%>
<!--#include file="inc/footer.asp"-->
