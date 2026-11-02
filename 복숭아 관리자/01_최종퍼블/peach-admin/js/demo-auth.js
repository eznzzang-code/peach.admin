/* 시연용 데모 로그인입니다. 운영 인증이 아니며, 서버 세션으로 교체할 부분만 이 파일에 둡니다.
   sessionStorage에는 비밀번호를 넣지 않습니다. */
var DemoAuth = (function () {
  var KEY = "peach-admin-session";
  var ACCOUNT = { id: "test", password: "1111" };
  var PUBLIC_PAGES = { "login.html": true, "find-account.html": true };

  function pageName() {
    var name = "";
    try {
      name = decodeURIComponent(location.pathname.split("/").pop() || "");
    } catch (error) {
      name = location.pathname.split("/").pop() || "";
    }
    return name || "index.html";
  }

  function read() {
    try {
      var data = JSON.parse(sessionStorage.getItem(KEY) || "null");
      if (!data || data.demo !== true || !data.id) return null;
      return { demo: true, id: String(data.id) };
    } catch (error) {
      return null;
    }
  }

  function isLoggedIn() {
    return !!read();
  }

  function login(id, password) {
    if (String(id || "") !== ACCOUNT.id || String(password || "") !== ACCOUNT.password) return false;
    sessionStorage.setItem(KEY, JSON.stringify({ demo: true, id: ACCOUNT.id }));
    return true;
  }

  function logout() {
    try {
      sessionStorage.removeItem(KEY);
      localStorage.removeItem("peach-admin-auto");
    } catch (error) {
      /* 저장소를 쓸 수 없어도 화면 이동은 계속합니다. */
    }
  }

  function guard() {
    var name = pageName();
    var loggedIn = isLoggedIn();
    if (name === "login.html" && loggedIn) {
      location.replace("index.html");
      return;
    }
    if (!PUBLIC_PAGES[name] && !loggedIn) {
      location.replace("login.html");
    }
  }

  guard();
  window.addEventListener("pageshow", guard);

  return {
    current: read,
    key: KEY,
    isLoggedIn: isLoggedIn,
    login: login,
    logout: logout
  };
})();
