<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><% If pageTitle <> "" Then Response.Write pageTitle & " | " %>복숭아자조금 관리자</title>
  <link rel="icon" type="image/png" href="assets/logo-mark.png?v=20261103.1">
  <link rel="stylesheet" href="css/variables.css">
  <link rel="stylesheet" href="css/common.css">
  <link rel="stylesheet" href="css/layout.css">
  <link rel="stylesheet" href="css/components.css">
  <link rel="stylesheet" href="css/pages.css?v=<%=Timer%>">
  <link rel="stylesheet" href="css/flow-alignment.css?v=20261104.5">
  <link rel="stylesheet" href="css/admin-account.css?v=<%=Timer%>">
  <% If extraCss <> "" Then Response.Write extraCss %>
</head>
<body data-page="<%=pageId%>"<% If pageResource <> "" Then Response.Write " data-resource=""" & pageResource & """" %>>
  <div class="layout">
    <header class="header">
      <a class="header__brand" href="index.asp">
        <img class="header__logo" src="assets/logo-mark.png?v=20261103.1" alt="">
        복숭아자조금 관리자
      </a>
      <div class="header__tools">
        <a class="header__site" href="http://ko-peach.kr" target="_blank" rel="noopener noreferrer">
          <svg class="header__icon" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2.8 7.1 8 2.9l5.2 4.2V13.2H9.4V9.2H6.6v4H2.8V7.1Z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"></path>
          </svg>
          홈페이지
        </a>
        <a class="header__user header__user--link<% If pageId = "admin-account" Then Response.Write " is-active"" aria-current=""page" %>" href="admin-account.asp">
          <svg class="header__icon" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="5.2" r="2.2" fill="none" stroke="currentColor" stroke-width="1.2"></circle>
            <path d="M3.2 13.2c.8-2.2 2.5-3.2 4.8-3.2s4 1 4.8 3.2" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>
          </svg>
          <span class="header__user-text" data-user-name><%=loginUserName%></span>
        </a>
        <script>
          window.__ADMIN_USER__ = { id: "<%=loginUserId%>", name: "<%=loginUserName%>" };
          if (window.MockData && MockData.currentUser) {
            MockData.currentUser.name = "<%=loginUserName%>";
            MockData.currentUser.id = "<%=loginUserId%>";
          }
        </script>
        <a href="logout.asp" class="header__logout">
          <svg class="header__icon" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M6.2 3.2H3.4v9.6h2.8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M7.2 8h6M10.8 5.4 13.4 8l-2.6 2.6" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
          로그아웃
        </a>
      </div>
    </header>

    <div class="layout__body">
