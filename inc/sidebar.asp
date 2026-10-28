      <nav class="sidebar" aria-label="주요 메뉴">
        <a class="sidebar__link<% If currentMenu = "home" Then Response.Write " is-active" %>" href="index.asp" data-menu="home">
          <span class="sidebar__dot" aria-hidden="true"></span>
          홈
        </a>
        <div class="sidebar__group<% If currentMenuGroup = "contents" Then Response.Write " is-open" %>" data-menu-group="contents">
          <button type="button" class="sidebar__toggle" aria-expanded="<% If currentMenuGroup = "contents" Then Response.Write "true" Else Response.Write "false" %>" aria-controls="sidebar-posts">
            <span class="sidebar__dot" aria-hidden="true"></span>
            게시글 관리
            <svg class="sidebar__chevron" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>
            </svg>
          </button>
          <div class="sidebar__sub" id="sidebar-posts"<% If currentMenuGroup <> "contents" Then Response.Write " hidden" %>>
            <a class="sidebar__sublink<% If currentMenu = "contents-notice" Then Response.Write " is-active" %>" href="contents-list.asp#notice" data-menu="contents-notice" data-menu-hash="notice">공지사항</a>
            <a class="sidebar__sublink<% If currentMenu = "contents-info" Then Response.Write " is-active" %>" href="contents-list.asp#info" data-menu="contents-info" data-menu-hash="info">복숭아정보</a>
            <a class="sidebar__sublink<% If currentMenu = "contents-material" Then Response.Write " is-active" %>" href="contents-list.asp#material" data-menu="contents-material" data-menu-hash="material">재배자료</a>
          </div>
        </div>
        <div class="sidebar__group<% If currentMenuGroup = "content-hub" Then Response.Write " is-open" %>" data-menu-group="content-hub">
          <button type="button" class="sidebar__toggle" aria-expanded="<% If currentMenuGroup = "content-hub" Then Response.Write "true" Else Response.Write "false" %>" aria-controls="sidebar-content-hub">
            <span class="sidebar__dot" aria-hidden="true"></span>
            재배·과원관리
            <svg class="sidebar__chevron" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>
            </svg>
          </button>
          <div class="sidebar__sub" id="sidebar-content-hub"<% If currentMenuGroup <> "content-hub" Then Response.Write " hidden" %>>
            <a class="sidebar__sublink<% If currentMenu = "orchard-content" Then Response.Write " is-active" %>" href="orchard-content.asp" data-menu="orchard-content">월별 과원관리</a>
            <a class="sidebar__sublink<% If currentMenu = "cultivation-content" Then Response.Write " is-active" %>" href="cultivation-content.asp" data-menu="cultivation-content">상시 재배력</a>
          </div>
        </div>
        <a class="sidebar__link<% If currentMenu = "videos" Then Response.Write " is-active" %>" href="videos-list.asp" data-menu="videos">
          <span class="sidebar__dot" aria-hidden="true"></span>
          교육영상 관리
        </a>
        <a class="sidebar__link<% If currentMenu = "permissions" Then Response.Write " is-active" %>" href="permissions.asp" data-menu="permissions">
          <span class="sidebar__dot" aria-hidden="true"></span>
          운영자·권한 관리
        </a>
      </nav>
