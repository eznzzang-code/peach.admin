    </div><!-- /.layout__body -->
  </div><!-- /.layout -->

  <!-- 기본 공통 스크립트 -->
  <script src="js/mock-data.js"></script>
  <script src="js/content-store.js?v=<%=Timer%>"></script>
  <script src="js/resource-store.js"></script>
  <script src="js/common.js?v=<%=Timer%>"></script>
  <script src="js/components.js?v=<%=Timer%>"></script>
  <% If extraScript <> "" Then Response.Write extraScript %>
</body>
</html>
<%
' 페이지 종료 시 DB 커넥션 해제
Call CloseDB()
%>
