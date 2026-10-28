/**
 * auth-custom.js
 * 퍼블리셔 원본 js(login.js)를 덮어쓰지 않고 실제 서버와 연동하기 위해 분리한 인증 전용 스크립트입니다.
 */
var AuthApp = (function () {
  var VERIFY_CODE = "123456";
  var AUTO_KEY = "peach-admin-auto";
  var SESSION_KEY = "peach-admin-session";

  // 인증 처리 백엔드 URL (추후 JSP 주소로 바로 교체 가능)
  var AUTH_API_URL = "proc/auth_proc.asp";

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

  function setAutoId(id, enabled) {
    try {
      if (enabled && id) {
        localStorage.setItem(AUTO_KEY, JSON.stringify({ id: id }));
      } else {
        localStorage.removeItem(AUTO_KEY);
      }
    } catch (e) {}
  }

  function postApi(data) {
    var searchParams = new URLSearchParams();
    Object.keys(data).forEach(function (key) {
      if (data[key] !== undefined && data[key] !== null) {
        searchParams.append(key, data[key]);
      }
    });
    return fetch(AUTH_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      body: searchParams.toString()
    }).then(function (res) { return res.json(); });
  }

  // 1. 로그인 폼 초기화
  function initLogin() {
    var form = qs("[data-auth='login']");
    if (!form) return;

    var idInput = qs("[name='userId']", form);
    var passwordInput = qs("[name='password']", form);
    var autoInput = qs("[name='autoLogin']", form);
    var message = qs("[data-auth-message]", form);
    var submitBtn = qs(".auth-submit", form);

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

      if (submitBtn) submitBtn.disabled = true;
      showMessage(message, "");

      postApi({
        action: "login",
        userId: id,
        password: password,
        autoLogin: autoInput.checked ? "1" : "0"
      })
      .then(function (data) {
        if (submitBtn) submitBtn.disabled = false;
        if (data.success) {
          setAutoId(id, autoInput.checked);
          try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: id, name: data.name || id }));
          } catch (e) {}

          // 관리자 메인 화면으로 이동
          window.location.href = data.redirectUrl || "index.asp";
        } else {
          markInvalid([idInput, passwordInput], true);
          showMessage(message, data.message || "아이디 또는 비밀번호가 올바르지 않습니다.");
          passwordInput.focus();
        }
      })
      .catch(function (err) {
        if (submitBtn) submitBtn.disabled = false;
        markInvalid([idInput, passwordInput], true);
        showMessage(message, "로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      });
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

  // 2. 계정 찾기 초기화
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

    var currentSpringSessionId = "";

    verifyButton.addEventListener("click", function () {
      idResult.hidden = true;
      var name = nameInput.value.trim();
      if (!name) {
        markInvalid([nameInput], true);
        showMessage(idMessage, "이름을 먼저 입력해 주세요.");
        nameInput.focus();
        return;
      }
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
      markInvalid([nameInput].concat(phoneInputs), false);
      verifyButton.disabled = true;
      showMessage(idMessage, "인증번호를 발송 중입니다...");

      postApi({
        action: "send_auth_find_id",
        name: name,
        phone: phoneValue()
      })
      .then(function (data) {
        verifyButton.disabled = false;
        if (data.success) {
          if (data.springSessionId) {
            currentSpringSessionId = data.springSessionId;
          }
          codeSentFor = phoneValue();
          verifyButton.textContent = "재전송";
          showMessage(idMessage, "인증번호가 발송되었습니다.", "success");
          codeInput.focus();
        } else {
          showMessage(idMessage, data.message || "인증번호 발송에 실패했습니다.");
        }
      })
      .catch(function () {
        verifyButton.disabled = false;
        showMessage(idMessage, "인증번호 발송 중 오류가 발생했습니다.");
      });
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
        showMessage(idMessage, "휴대전화 인증을 먼저 진행해 주세요.");
        verifyButton.focus();
        return;
      }
      var codeVal = digits(codeInput.value);
      if (!codeVal) {
        markInvalid([codeInput], true);
        showMessage(idMessage, "인증번호를 입력해 주세요.");
        codeInput.focus();
        return;
      }

      postApi({
        action: "find_id_verify",
        name: name,
        phone: phoneValue(),
        code: codeVal,
        springSessionId: currentSpringSessionId
      })
      .then(function (data) {
        if (data.success && data.foundId) {
          showMessage(idMessage, "");
          foundId.textContent = data.foundId;
          idResult.hidden = false;
          var loginLink = qs(".auth-actions__back", idForm);
          if (loginLink) loginLink.href = "login.asp?id=" + encodeURIComponent(data.foundId);
        } else {
          markInvalid([codeInput], true);
          showMessage(idMessage, data.message || "인증번호가 일치하지 않거나 유효하지 않습니다.");
          codeInput.focus();
        }
      })
      .catch(function () {
        showMessage(idMessage, "조회 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      });
    });

    var passwordForm = panels.password;
    var pwdGuide = document.getElementById("pwd-guide");
    var pwdSubmitBtn = document.getElementById("pwd-submit-btn");
    var pwdMessage = document.getElementById("pwd-message");

    var pwdStep1 = document.getElementById("pwd-step-1");
    var pwdStep2 = document.getElementById("pwd-step-2");
    var pwdStep3 = document.getElementById("pwd-step-3");
    var pwdStep4 = document.getElementById("pwd-step-4");

    var pwdUserIdInput = qs("[name='userId']", pwdStep1);

    var pwdStaticId = document.getElementById("pwd-static-id");
    var pwdPhoneInputs = [
      document.getElementById("pwd-phone-1"),
      document.getElementById("pwd-phone-2"),
      document.getElementById("pwd-phone-3")
    ];
    var pwdVerifyBtn = document.getElementById("pwd-verify-btn");
    var pwdCodeInput = document.getElementById("pwd-code");

    var pwdNewPwInput = document.getElementById("pwd-new-password");
    var pwdNewPwConfirmInput = document.getElementById("pwd-new-password-confirm");

    var currentPwdStep = 1;
    var currentVerifiedUserId = "";
    var currentPwdSessionId = "";
    var pwdPhoneSentFor = "";

    bindPhone(pwdPhoneInputs);
    clearOnInput([pwdUserIdInput, pwdCodeInput, pwdNewPwInput, pwdNewPwConfirmInput].concat(pwdPhoneInputs), pwdMessage);

    function pwdPhoneValue() {
      return pwdPhoneInputs.map(function (input) { return digits(input.value); }).join("");
    }

    function pwdPhoneComplete() {
      return digits(pwdPhoneInputs[0].value).length === 3 &&
        digits(pwdPhoneInputs[1].value).length === 4 &&
        digits(pwdPhoneInputs[2].value).length === 4;
    }

    function setPwdStep(step) {
      currentPwdStep = step;
      if (pwdStep1) pwdStep1.hidden = (step !== 1);
      if (pwdStep2) pwdStep2.hidden = (step !== 2);
      if (pwdStep3) pwdStep3.hidden = (step !== 3);
      if (pwdStep4) pwdStep4.hidden = (step !== 4);
      showMessage(pwdMessage, "");

      if (step === 1) {
        if (pwdGuide) pwdGuide.textContent = "비밀번호를 찾으려고 하는 아이디를 입력해 주세요.";
        if (pwdSubmitBtn) {
          pwdSubmitBtn.textContent = "확인";
          pwdSubmitBtn.hidden = false;
        }
        if (pwdUserIdInput) pwdUserIdInput.focus();
      } else if (step === 2) {
        if (pwdGuide) pwdGuide.textContent = "회원정보에 등록한 휴대전화로 인증합니다.";
        if (pwdStaticId) pwdStaticId.textContent = currentVerifiedUserId;
        if (pwdSubmitBtn) {
          pwdSubmitBtn.textContent = "확인";
          pwdSubmitBtn.hidden = false;
        }
        if (pwdPhoneInputs[0]) pwdPhoneInputs[0].focus();
      } else if (step === 3) {
        if (pwdGuide) pwdGuide.textContent = "새로운 비밀번호를 입력해 주세요.";
        if (pwdSubmitBtn) {
          pwdSubmitBtn.textContent = "비밀번호 변경";
          pwdSubmitBtn.hidden = false;
        }
        if (pwdNewPwInput) pwdNewPwInput.focus();
      } else if (step === 4) {
        if (pwdGuide) pwdGuide.textContent = "";
        if (pwdSubmitBtn) pwdSubmitBtn.hidden = true;
        var backLink = document.getElementById("pwd-login-link");
        if (backLink) {
          backLink.className = "btn btn--primary auth-actions__confirm";
          backLink.textContent = "로그인 하러 가기";
          backLink.href = "login.asp?id=" + encodeURIComponent(currentVerifiedUserId);
        }
      }
    }

    // 2단계 휴대전화 인증번호 발송
    if (pwdVerifyBtn) {
      pwdPhoneInputs.forEach(function (input) {
        input.addEventListener("input", function () {
          pwdPhoneSentFor = "";
          pwdVerifyBtn.textContent = "인증";
        });
      });

      pwdVerifyBtn.addEventListener("click", function () {
        if (!pwdPhoneComplete()) {
          markInvalid(pwdPhoneInputs, true);
          showMessage(pwdMessage, "휴대전화번호를 모두 올바르게 입력해 주세요.");
          pwdPhoneInputs[0].focus();
          return;
        }
        markInvalid(pwdPhoneInputs, false);
        pwdVerifyBtn.disabled = true;
        showMessage(pwdMessage, "인증번호를 발송 중입니다...");

        postApi({
          action: "send_auth_find_pwd",
          userId: currentVerifiedUserId,
          phone: pwdPhoneValue()
        })
        .then(function (data) {
          pwdVerifyBtn.disabled = false;
          if (data.success) {
            if (data.springSessionId) {
              currentPwdSessionId = data.springSessionId;
            }
            pwdPhoneSentFor = pwdPhoneValue();
            pwdVerifyBtn.textContent = "재전송";
            showMessage(pwdMessage, "인증번호가 발송되었습니다.", "success");
            if (pwdCodeInput) pwdCodeInput.focus();
          } else {
            showMessage(pwdMessage, data.message || "인증번호 발송에 실패했습니다.");
          }
        })
        .catch(function () {
          pwdVerifyBtn.disabled = false;
          showMessage(pwdMessage, "인증번호 발송 중 오류가 발생했습니다.");
        });
      });
    }

    // 폼 서브밋 핸들러 (단계별 처리)
    passwordForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (currentPwdStep === 1) {
        // [1단계] 아이디 검증
        var id = pwdUserIdInput.value.trim();
        markInvalid([pwdUserIdInput], false);

        if (!id) {
          markInvalid([pwdUserIdInput], true);
          showMessage(pwdMessage, "아이디를 입력해 주세요.");
          pwdUserIdInput.focus();
          return;
        }

        if (pwdSubmitBtn) pwdSubmitBtn.disabled = true;
        postApi({
          action: "check_pwd_id",
          userId: id
        })
        .then(function (data) {
          if (pwdSubmitBtn) pwdSubmitBtn.disabled = false;
          if (data.success) {
            currentVerifiedUserId = data.userId || id;
            setPwdStep(2);
          } else {
            markInvalid([pwdUserIdInput], true);
            showMessage(pwdMessage, data.message || "등록되지 않은 아이디입니다.");
            pwdUserIdInput.focus();
          }
        })
        .catch(function () {
          if (pwdSubmitBtn) pwdSubmitBtn.disabled = false;
          showMessage(pwdMessage, "요청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        });

      } else if (currentPwdStep === 2) {
        // [2단계] 휴대전화 인증번호 검증
        markInvalid(pwdPhoneInputs.concat([pwdCodeInput]), false);

        if (!pwdPhoneComplete()) {
          markInvalid(pwdPhoneInputs, true);
          showMessage(pwdMessage, "휴대전화번호를 모두 입력해 주세요.");
          pwdPhoneInputs[0].focus();
          return;
        }

        if (!pwdPhoneSentFor || pwdPhoneSentFor !== pwdPhoneValue()) {
          showMessage(pwdMessage, "휴대전화 [인증] 버튼을 눌러 인증번호를 먼저 받아주세요.");
          if (pwdVerifyBtn) pwdVerifyBtn.focus();
          return;
        }

        var codeVal = digits(pwdCodeInput.value);
        if (!codeVal) {
          markInvalid([pwdCodeInput], true);
          showMessage(pwdMessage, "인증번호를 입력해 주세요.");
          pwdCodeInput.focus();
          return;
        }

        if (pwdSubmitBtn) pwdSubmitBtn.disabled = true;
        postApi({
          action: "verify_code_find_pwd",
          userId: currentVerifiedUserId,
          phone: pwdPhoneValue(),
          code: codeVal,
          springSessionId: currentPwdSessionId
        })
        .then(function (data) {
          if (pwdSubmitBtn) pwdSubmitBtn.disabled = false;
          if (data.success) {
            setPwdStep(3);
          } else {
            markInvalid([pwdCodeInput], true);
            showMessage(pwdMessage, data.message || "인증번호가 일치하지 않거나 유효하지 않습니다.");
            pwdCodeInput.focus();
          }
        })
        .catch(function () {
          if (pwdSubmitBtn) pwdSubmitBtn.disabled = false;
          showMessage(pwdMessage, "인증 처리 중 오류가 발생했습니다.");
        });

      } else if (currentPwdStep === 3) {
        // [3단계] 새 비밀번호 설정
        var newPw = pwdNewPwInput.value;
        var newPwConfirm = pwdNewPwConfirmInput.value;
        markInvalid([pwdNewPwInput, pwdNewPwConfirmInput], false);

        if (!newPw) {
          markInvalid([pwdNewPwInput], true);
          showMessage(pwdMessage, "새 비밀번호를 입력해 주세요.");
          pwdNewPwInput.focus();
          return;
        }
        if (newPw.length < 4) {
          markInvalid([pwdNewPwInput], true);
          showMessage(pwdMessage, "비밀번호는 최소 4자 이상이어야 합니다.");
          pwdNewPwInput.focus();
          return;
        }
        if (!newPwConfirm) {
          markInvalid([pwdNewPwConfirmInput], true);
          showMessage(pwdMessage, "비밀번호 확인을 입력해 주세요.");
          pwdNewPwConfirmInput.focus();
          return;
        }
        if (newPw !== newPwConfirm) {
          markInvalid([pwdNewPwConfirmInput], true);
          showMessage(pwdMessage, "비밀번호가 서로 일치하지 않습니다.");
          pwdNewPwConfirmInput.focus();
          return;
        }

        if (pwdSubmitBtn) pwdSubmitBtn.disabled = true;
        postApi({
          action: "reset_password",
          userId: currentVerifiedUserId,
          newPassword: newPw,
          newPasswordConfirm: newPwConfirm,
          phone: pwdPhoneValue()
        })
        .then(function (data) {
          if (pwdSubmitBtn) pwdSubmitBtn.disabled = false;
          if (data.success) {
            setPwdStep(4);
          } else {
            showMessage(pwdMessage, data.message || "비밀번호 변경에 실패했습니다.");
          }
        })
        .catch(function () {
          if (pwdSubmitBtn) pwdSubmitBtn.disabled = false;
          showMessage(pwdMessage, "비밀번호 변경 요청 중 오류가 발생했습니다.");
        });
      }
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
