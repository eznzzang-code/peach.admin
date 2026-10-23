var Admin = (function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function menuIsActive(link, page) {
    if (link.getAttribute("data-menu") === page) return true;
    var hashKey = link.getAttribute("data-menu-hash");
    if (!hashKey) return false;
    return (window.location.hash || "").replace(/^#/, "") === hashKey;
  }

  function applyMenuState() {
    var page = document.body.getAttribute("data-page");

    qsa("[data-menu]").forEach(function (link) {
      var active = menuIsActive(link, page);
      link.classList.toggle("is-active", active);
      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    qsa(".sidebar__group").forEach(function (group) {
      var toggle = qs(".sidebar__toggle", group);
      var sub = qs(".sidebar__sub", group);
      var groupKey = group.getAttribute("data-menu-group") || "";
      var childActive = !!qs("[data-menu].is-active", group);
      var groupActive = childActive || groupKey === page;
      group.classList.toggle("is-active", groupActive);
      if (toggle) toggle.classList.toggle("is-active", groupActive);
      if (!groupActive || !sub || !sub.hidden) return;
      if (toggle) toggle.setAttribute("aria-expanded", "true");
      sub.hidden = false;
    });
  }

  function initLayout() {
    applyMenuState();

    qsa(".sidebar__group").forEach(function (group) {
      var toggle = qs(".sidebar__toggle", group);
      var sub = qs(".sidebar__sub", group);
      if (!toggle || toggle.getAttribute("data-menu-ready") === "true") return;
      toggle.setAttribute("data-menu-ready", "true");
      toggle.addEventListener("click", function () {
        var expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
        if (sub) sub.hidden = expanded;
      });
    });

    window.addEventListener("hashchange", applyMenuState);

    var nameEl = qs("[data-user-name]");
    if (nameEl && window.MockData && MockData.currentUser) {
      nameEl.textContent = MockData.currentUser.name;
    }

    var siteHome = qs(".header__site");
    if (siteHome) {
      siteHome.target = "_blank";
      siteHome.rel = "noopener noreferrer";
      if (location.port === "8765") {
        // 관리자 폴더만 연 정적 서버에서는 상위 peach-web으로 나갈 수 없습니다.
        siteHome.href = "http://127.0.0.1:8766/index.html";
      }
    }

    var logout = qs("[data-logout]");
    if (logout) {
      logout.addEventListener("click", function (event) {
        event.preventDefault();
        // TODO: 로그아웃 API 연동
      });
    }
  }

  ready(initLayout);

  return {
    ready: ready,
    qs: qs,
    qsa: qsa
  };
})();
