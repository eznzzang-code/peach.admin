<%@ Language="VBScript" CodePage="65001" %>
<%
Option Explicit
Response.CharSet = "UTF-8"
Session.CodePage = 65001
%>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>설문·행사 참여 | 복숭아자조금</title>
  <link rel="icon" type="image/png" href="assets/logo-mark.png?v=20261103.1">
  <link rel="stylesheet" href="css/variables.css">
  <link rel="stylesheet" href="css/common.css">
  <link rel="stylesheet" href="css/layout.css">
  <link rel="stylesheet" href="css/components.css">
  <link rel="stylesheet" href="css/pages.css">
  <link rel="stylesheet" href="css/flow-alignment.css">
  <link rel="stylesheet" href="css/participation/prototype.css?v=20261029.1">
  <link rel="stylesheet" href="css/participation/form-editor.css?v=20261029.1">
  <link rel="stylesheet" href="css/participation/admin-theme.css?v=20261029.1">
  <link rel="stylesheet" href="css/participation/operation.css?v=20261029.1">
  <link rel="stylesheet" href="css/participation/integration.css?v=20261029.1">
  <link rel="stylesheet" href="css/participation/event-participant.css?v=20261029.1">
  <link rel="stylesheet" href="css/participation/member-auth.css?v=20261029.1">
  <script defer src="js/participation/model.js?v=20261104.5"></script>
  <script defer src="proc/participation_proc.asp?action=bootstrap_js&_=<%=Timer%>"></script>
  <script defer src="js/participation/store.js?v=20261102.1"></script>
  <script defer src="js/participation/runtime.js?v=20261029.1"></script>
  <script defer src="js/participation/participant-ui.js?v=20261104.5"></script>
  <script defer src="js/participation/member-auth.js?v=20261029.1"></script>
  <script defer src="js/participation/portal.js?v=20261103.1"></script>
</head>
<body class="participation-portal"><main id="peach-survey-prototype"></main></body>
</html>

