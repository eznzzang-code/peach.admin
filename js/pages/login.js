var AuthPage = (function () {
  // TODO: 로그인·계정 찾기 API 연동. 아래 계정은 화면 시연용입니다.
  var ACCOUNTS = [
    { id: "admin", password: "admin1234", name: "정유현", phone: "01000000000" }
  ];
  var VERIFY_CODE = "123456";
  var AUTO_KEY = "peach-admin-auto";
  var SESSION_KEY = "peach-admin-session";

  function ready(fn) {
    if (window.Admin && Admin.ready) {
      Admin.ready(fn);
      return;
    }
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

  function digits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function findAccount(predicate) {
    for (var i = 0; i < ACCOUNTS.length; i += 1) {
      if (predicate(ACCOUNTS[i])) return ACCOUNTS[i];
    }
    return null;
  }

  function showMessage(node, text, tone) {
    if (!node) return;
    node.hidden = !text;
    node.setAttribute("data-tone", tone || "error");
    node.textContent = text || "";
  }

  function markInvalid(fields, invalid) {
    fields.forEach(function (field) {
      if (!field) return;
      field.classList.toggle("is-invalid", invalid);
      if (invalid) field.setAttribute("aria-invalid", "true");
      else field.removeAttribute("aria-invalid");
    });
  }

  function clearOnInput(fields, message, result) {
    fields.forEach(function (field) {
      field.addEventListener("input", function () {
        markInvalid(fields, false);
        showMessage(message, "");
        if (result) result.hidden = true;
      });
    });
  }

  function storeSession(account, autoLogin) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: account.id, name: account.name }));
      if (autoLogin) localStorage.setItem(AUTO_KEY, JSON.stringify({ id: account.id }));
      else localStorage.removeItem(AUTO_KEY);
    } catch (error) {
      return;
    }
  }

  function savedAutoId() {
    try {
      var raw = localStorage.getItem(AUTO_KEY);
      if (!raw) return "";
      var data = JSON.parse(raw);
      return data && data.id ? String(data.id) : "";
    } catch (error) {
      return "";
    }
  }

  function initLogin() {
    var form = qs("[data-auth='login']");
    if (!form) return;

    var idInput = qs("[name='userId']", form);
    var passwordInput = qs("[name='password']", form);
    var autoInput = qs("[name='autoLogin']", form);
    var message = qs("[data-auth-message]", form);
    var params = new URLSearchParams(window.location.search);
    var savedId = savedAutoId();
    var queryId = params.get("id");

    if (queryId) idInput.value = queryId;
    else if (savedId) idInput.value = savedId;
    if (savedId) autoInput.checked = true;

    clearOnInput([idInput, passwordInput], message);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var id = idInput.value.trim();
      var password = passwordInput.value;
      markInvalid([idInput, passwordInput], false);

      if (!id || !password) {
        markInvalid([id ? null : idInput, password ? null : passwordInput], true);
        showMessage(message, !id ? "아이디를 입력해 주세요." : "비밀번호를 입력해 주세요.");
        (id ? passwordInput : idInput).focus();
        return;
      }

      var account = findAccount(function (item) {
        return item.id === id && item.password === password;
      });
      if (!account) {
        markInvalid([idInput, passwordInput], true);
        showMessage(message, "아이디 또는 비밀번호가 올바르지 않습니다.");
        passwordInput.focus();
        return;
      }

      storeSession(account, autoInput.checked);
      window.location.href = "index.html";
    });
  }

  function bindPhone(inputs) {
    inputs.forEach(function (input, index) {
      input.addEventListener("input", function () {
        var nextValue = digits(input.value).slice(0, input.maxLength || 4);
        if (input.value !== nextValue) input.value = nextValue;
        if (nextValue.length === (input.maxLength || 4) && inputs[index + 1]) inputs[index + 1].focus();
      });
      input.addEventListener("keydown", function (event) {
        if (event.key === "Backspace" && !input.value && inputs[index - 1]) {
          inputs[index - 1].focus();
        }
      });
    });
  }

  function initFind() {
    var tabs = qsa("[data-auth-tab]");
    if (!tabs.length) return;

    var panels = {
      id: document.getElementById("panel-id"),
      password: document.getElementById("panel-password")
    };
    var codeSentFor = "";

    function showTab(name) {
      if (!panels[name]) name = "id";
      tabs.forEach(function (tab) {
        var active = tab.getAttribute("data-auth-tab") === name;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
        tab.tabIndex = active ? 0 : -1;
      });
      Object.keys(panels).forEach(function (key) {
        panels[key].hidden = key !== name;
      });
      if (window.location.hash !== "#" + name) {
        history.replaceState(null, "", "#" + name);
      }
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        showTab(tab.getAttribute("data-auth-tab"));
      });
    });

    window.addEventListener("hashchange", function () {
      showTab((window.location.hash || "#id").replace("#", ""));
    });
    showTab((window.location.hash || "#id").replace("#", ""));

    var idForm = panels.id;
    var nameInput = qs("[name='name']", idForm);
    var phoneInputs = [
      qs("[name='phone1']", idForm),
      qs("[name='phone2']", idForm),
      qs("[name='phone3']", idForm)
    ];
    var codeInput = qs("[name='code']", idForm);
    var verifyButton = qs("[data-auth-verify]", idForm);
    var idMessage = qs("[data-auth-message]", idForm);
    var idResult = qs("[data-auth-result]", idForm);
    var foundId = qs("[data-found-id]", idForm);

    bindPhone(phoneInputs);
    clearOnInput([nameInput, codeInput].concat(phoneInputs), idMessage, idResult);
    phoneInputs.forEach(function (input) {
      input.addEventListener("input", function () {
        codeSentFor = "";
        verifyButton.textContent = "인증";
      });
    });

    function phoneValue() {
      return phoneInputs.map(function (input) { return digits(input.value); }).join("");
    }

    function phoneComplete() {
      return digits(phoneInputs[0].value).length === 3 &&
        digits(phoneInputs[1].value).length === 4 &&
        digits(phoneInputs[2].value).length === 4;
    }

    verifyButton.addEventListener("click", function () {
      idResult.hidden = true;
      if (!phoneComplete()) {
        markInvalid(phoneInputs, true);
        showMessage(idMessage, "휴대전화번호를 모두 입력해 주세요.");
        phoneInputs.some(function (input) {
          if (digits(input.value).length >= (input.maxLength || 4)) return false;
          input.focus();
          return true;
        });
        return;
      }
      markInvalid(phoneInputs, false);
      codeSentFor = phoneValue();
      verifyButton.textContent = "재전송";
      showMessage(idMessage, "인증번호가 발송되었습니다.", "success");
      codeInput.focus();
    });

    idForm.addEventListener("submit", function (event) {
      event.preventDefault();
      idResult.hidden = true;
      var name = nameInput.value.trim();
      markInvalid([nameInput, codeInput].concat(phoneInputs), false);

      if (!name) {
        markInvalid([nameInput], true);
        showMessage(idMessage, "이름을 입력해 주세요.");
        nameInput.focus();
        return;
      }
      if (!phoneComplete()) {
        markInvalid(phoneInputs, true);
        showMessage(idMessage, "휴대전화번호를 모두 입력해 주세요.");
        phoneInputs[0].focus();
        return;
      }
      if (!codeSentFor || codeSentFor !== phoneValue()) {
        showMessage(idMessage, "휴대전화 인증을 진행해 주세요.");
        verifyButton.focus();
        return;
      }
      if (!codeInput.value.trim()) {
        markInvalid([codeInput], true);
        showMessage(idMessage, "인증번호를 입력해 주세요.");
        codeInput.focus();
        return;
      }
      if (digits(codeInput.value) !== VERIFY_CODE) {
        markInvalid([codeInput], true);
        showMessage(idMessage, "인증번호가 일치하지 않습니다.");
        codeInput.focus();
        return;
      }

      var account = findAccount(function (item) {
        return item.name === name && item.phone === phoneValue();
      });
      if (!account) {
        showMessage(idMessage, "입력하신 정보와 일치하는 아이디가 없습니다.");
        return;
      }

      showMessage(idMessage, "");
      foundId.textContent = account.id;
      idResult.hidden = false;
      var loginLink = qs(".auth-actions__back", idForm);
      if (loginLink) loginLink.href = "login.html?id=" + encodeURIComponent(account.id);
    });

    var passwordForm = panels.password;
    var userIdInput = qs("[name='userId']", passwordForm);
    var passwordMessage = qs("[data-auth-message]", passwordForm);
    var passwordResult = qs("[data-auth-result]", passwordForm);
    clearOnInput([userIdInput], passwordMessage, passwordResult);

    passwordForm.addEventListener("submit", function (event) {
      event.preventDefault();
      passwordResult.hidden = true;
      var id = userIdInput.value.trim();
      markInvalid([userIdInput], false);

      if (!id) {
        markInvalid([userIdInput], true);
        showMessage(passwordMessage, "아이디를 입력해 주세요.");
        userIdInput.focus();
        return;
      }

      var account = findAccount(function (item) { return item.id === id; });
      if (!account) {
        markInvalid([userIdInput], true);
        showMessage(passwordMessage, "등록되지 않은 아이디입니다.");
        userIdInput.focus();
        return;
      }

      showMessage(passwordMessage, "");
      passwordResult.hidden = false;
    });
  }

  ready(function () {
    initLogin();
    initFind();
  });

  return {
    sessionKey: SESSION_KEY,
    autoKey: AUTO_KEY
  };
})();
