/* 회원가입 UI와 입력 검증 (proc/account_proc.asp 서버 연동) */
var SignupApi = {
  sendCode: function (phone) {
    return window.AdminAccountApi.sendPhoneCode(phone);
  },
  verifyCode: function (phone, code, opts) {
    return window.AdminAccountApi.verifyPhoneCode({
      phone: phone,
      code: code,
      challengeId: opts && opts.challengeId ? opts.challengeId : ""
    });
  },
  checkId: function (id) {
    var body = new URLSearchParams();
    body.append("action", "check_id");
    body.append("id", id);
    return fetch("proc/account_proc.asp", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: body.toString()
    }).then(function (r) { return r.json(); }).then(function (json) {
      if (!json || json.success !== true) {
        throw new Error((json && json.message) || "아이디 중복 여부를 확인하지 못했습니다.");
      }
      return { available: json.available === true };
    });
  },
  createAccount: function (payload) {
    var body = new URLSearchParams();
    body.append("action", "create_account");
    body.append("name", payload.name || "");
    body.append("phone", payload.phone || "");
    body.append("id", payload.id || "");
    body.append("password", payload.password || "");
    body.append("phoneVerificationProof", payload.phoneVerificationProof || "");
    body.append("invitationToken", payload.invitationGrant && payload.invitationGrant.token ? payload.invitationGrant.token : "");
    return fetch("proc/account_proc.asp", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: body.toString()
    }).then(function (r) { return r.json(); }).then(function (json) {
      if (!json || json.success !== true) {
        var err = new Error((json && json.message) || "회원가입을 완료하지 못했습니다.");
        if (json && json.code) err.code = json.code;
        throw err;
      }
      return { id: json.id };
    });
  }
};

(function () {
  var CODE_TTL = 180;
  var RESEND_WAIT = 60;
  var MAX_SENDS = 5;
  var state = emptyState();
  var timerId = 0;
  var lastFocus = null;
  var invitationGrant = null;
  var gateBusy = false;
  var gateEpoch = 0;

  function emptyState() {
    return {
      sentPhone: "",
      expiresAt: 0,
      resendAt: 0,
      sendCount: 0,
      verifiedPhone: "",
      checkedId: "",
      phoneProof: null,
      challengeId: null
    };
  }

  function digits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function formatPhone(value) {
    var text = digits(value).slice(0, 11);
    if (text.length < 4) return text;
    if (text.length < 8) return text.slice(0, 3) + "-" + text.slice(3);
    return text.slice(0, 3) + "-" + text.slice(3, 7) + "-" + text.slice(7);
  }

  function validPhone(value) {
    return /^01[016789]\d{7,8}$/.test(digits(value));
  }

  function validId(value) {
    return /^[A-Za-z][A-Za-z0-9]{3,19}$/.test(value);
  }

  function validPassword(value) {
    return value.length >= 8 && value.length <= 20 && /[A-Za-z]/.test(value) && /\d/.test(value);
  }

  function showError(id, message) {
    var input = document.getElementById(id);
    var error = document.getElementById(id + "-error");
    if (input) {
      input.classList.toggle("is-invalid", !!message);
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    }
    if (error) {
      error.hidden = !message;
      error.textContent = message || "";
    }
  }

  function showStatus(id, message, success) {
    var node = document.getElementById(id);
    if (!node) return;
    node.hidden = !message;
    node.textContent = message || "";
    node.classList.toggle("is-success", !!success);
  }

  function secondsLeft(timestamp) {
    return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));
  }

  function clock(total) {
    var minutes = Math.floor(total / 60);
    var seconds = total % 60;
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
  }

  function paintTimer() {
    var timer = document.getElementById("signup-code-timer");
    var send = document.getElementById("signup-send");
    if (!timer || !send) return;
    var now = Date.now();
    if (state.expiresAt > now) {
      timer.hidden = false;
      timer.textContent = "인증번호 유효시간 " + clock(secondsLeft(state.expiresAt));
    } else if (state.sentPhone) {
      timer.hidden = false;
      timer.textContent = "인증번호 유효시간이 지났습니다. 다시 발송해 주세요.";
    } else {
      timer.hidden = true;
      timer.textContent = "";
    }
    var wait = secondsLeft(state.resendAt);
    if (state.sentPhone && wait > 0) {
      send.disabled = true;
      send.textContent = "재발송 " + wait + "초";
    } else {
      send.disabled = false;
      send.textContent = state.sendCount ? "재발송" : "인증번호 발송";
    }
  }

  function startTimer() {
    window.clearInterval(timerId);
    paintTimer();
    timerId = window.setInterval(paintTimer, 1000);
  }

  function stopTimer() {
    window.clearInterval(timerId);
    timerId = 0;
  }

  function resetForm() {
    var form = document.getElementById("signup-form");
    if (form) form.reset();
    state = emptyState();
    stopTimer();
    ["signup-name", "signup-phone", "signup-code", "signup-id", "signup-password", "signup-password-confirm"].forEach(function (id) {
      showError(id, "");
    });
    showError("signup-form", "");
    showStatus("signup-code-status", "");
    showStatus("signup-id-status", "");
    paintTimer();
  }

  function openModal() {
    var modal = document.getElementById("modal-signup");
    if (!modal) return;
    if (!invitationGrant) { openGate(); return; }
    modal.hidden = false;
    document.body.classList.add("is-modal-open");
    var name = document.getElementById("signup-name");
    if (name) name.focus();
  }

  function closeModal() {
    var modal = document.getElementById("modal-signup");
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    invitationGrant = null;
    document.body.classList.remove("is-modal-open");
    resetForm();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function openGate(message) {
    invitationGrant = null; gateEpoch++;
    lastFocus = document.getElementById("signup-open");
    document.getElementById("modal-signup").hidden = true;
    var gate = document.getElementById("modal-signup-invitation");
    gate.hidden = false; document.body.classList.add("is-modal-open");
    document.getElementById("invitation-code").value = "";
    var error = document.getElementById("invitation-error"); error.textContent = message || ""; error.hidden = !message;
    document.getElementById("invitation-code").focus();
  }

  function closeGate() {
    gateEpoch++;
    document.getElementById("modal-signup-invitation").hidden = true;
    invitationGrant = null;
    document.body.classList.remove("is-modal-open");
    if (lastFocus) lastFocus.focus();
  }

  function verifyInvitation(event) {
    event.preventDefault();
    if (gateBusy) return;
    gateBusy = true;
    var ticket = gateEpoch;
    var button = event.target.querySelector("[type='submit']"), error = document.getElementById("invitation-error");
    button.disabled = true;
    AdminAccountApi.verifyInvitation(document.getElementById("invitation-code").value.trim()).then(function (grant) {
      return AdminAccountApi.validateInvitation(grant).then(function () {
        if (ticket !== gateEpoch) return;
        invitationGrant = grant;
        document.getElementById("modal-signup-invitation").hidden = true;
        openModal();
      });
    }).catch(function (e) {
      if (ticket !== gateEpoch) return;
      error.textContent = e.message || "가입코드를 확인하지 못했습니다.";
      error.hidden = false;
    }).finally(function () {
      gateBusy = false;
      button.disabled = false;
    });
  }

  function onPhoneInput() {
    var input = document.getElementById("signup-phone");
    var next = formatPhone(input.value);
    if (input.value !== next) input.value = next;
    var phone = digits(input.value);
    if (state.verifiedPhone && phone !== state.verifiedPhone) {
      state.verifiedPhone = ""; state.phoneProof = null;
      showStatus("signup-code-status", "");
    }
    showError("signup-phone", "");
    showError("signup-form", "");
  }

  function onIdInput() {
    var input = document.getElementById("signup-id");
    if (state.checkedId && input.value.trim() !== state.checkedId) {
      state.checkedId = "";
      showStatus("signup-id-status", "");
    }
    showError("signup-id", "");
    showError("signup-form", "");
  }

  function sendCode() {
    var input = document.getElementById("signup-phone");
    var phone = digits(input.value);
    showError("signup-phone", "");
    if (!phone) {
      showError("signup-phone", "휴대폰 번호를 입력해 주세요.");
      input.focus();
      return;
    }
    if (!validPhone(phone)) {
      showError("signup-phone", "휴대폰 번호 형식을 확인해 주세요.");
      input.focus();
      return;
    }
    if (state.sendCount >= MAX_SENDS && state.sentPhone === phone) {
      showError("signup-phone", "인증번호 재발송 횟수를 초과했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    if (secondsLeft(state.resendAt) > 0 && state.sentPhone === phone) {
      showError("signup-phone", "인증번호는 " + secondsLeft(state.resendAt) + "초 후에 다시 발송할 수 있습니다.");
      return;
    }
    var button = document.getElementById("signup-send");
    button.disabled = true;
    SignupApi.sendCode(phone, { invitationGrant: invitationGrant }).then(function (result) {
      if (digits(document.getElementById("signup-phone").value) !== phone) return;
      if (!result || !result.challengeId) throw new Error("인증번호를 발송하지 못했습니다.");
      state.challengeId = result.challengeId;
      var expiresIn = result && result.expiresIn ? result.expiresIn : CODE_TTL;
      var retryAfter = result && result.retryAfter ? result.retryAfter : RESEND_WAIT;
      state.sentPhone = phone;
      state.expiresAt = Date.now() + expiresIn * 1000;
      state.resendAt = Date.now() + retryAfter * 1000;
      state.sendCount += 1;
      state.verifiedPhone = ""; state.phoneProof = null;
      showStatus("signup-code-status", "");
      showError("signup-code", "");
      startTimer();
      document.getElementById("signup-code").focus();
    }).catch(function (error) {
      showError("signup-phone", error && error.message ? error.message : "인증번호를 발송하지 못했습니다.");
      paintTimer();
    });
  }

  function verifyCode() {
    var phoneInput = document.getElementById("signup-phone");
    var codeInput = document.getElementById("signup-code");
    var phone = digits(phoneInput.value);
    var code = digits(codeInput.value);
    showError("signup-code", "");
    if (!state.sentPhone || state.sentPhone !== phone || !state.challengeId) {
      showError("signup-code", "인증번호를 먼저 발송해 주세요.");
      return;
    }
    if (state.expiresAt <= Date.now()) {
      showError("signup-code", "인증번호 유효시간이 지났습니다. 다시 발송해 주세요.");
      return;
    }
    if (!/^\d{4,6}$/.test(code)) {
      showError("signup-code", "인증번호 4자리를 입력해 주세요.");
      codeInput.focus();
      return;
    }
    var button = document.getElementById("signup-verify");
    button.disabled = true;
    SignupApi.verifyCode(phone, code, { challengeId: state.challengeId, invitationGrant: invitationGrant }).then(function (result) {
      if (!result || result.verified !== true || !result.proof) {
        showError("signup-code", "인증번호가 확인되지 않았습니다.");
        return;
      }
      if (digits(phoneInput.value) !== phone) return;
      state.verifiedPhone = phone; state.phoneProof = result.proof;
      showStatus("signup-code-status", "휴대폰 인증이 완료되었습니다.", true);
    }).catch(function (error) {
      state.verifiedPhone = ""; state.phoneProof = null;
      showStatus("signup-code-status", "");
      showError("signup-code", error && error.message ? error.message : "인증번호를 확인하지 못했습니다.");
    }).then(function () {
      button.disabled = false;
    });
  }

  function checkId() {
    var input = document.getElementById("signup-id");
    var id = input.value.trim();
    showError("signup-id", "");
    showStatus("signup-id-status", "");
    if (!id) {
      showError("signup-id", "아이디를 입력해 주세요.");
      input.focus();
      return;
    }
    if (!validId(id)) {
      showError("signup-id", "아이디는 영문으로 시작하는 4~20자의 영문과 숫자로 입력해 주세요.");
      input.focus();
      return;
    }
    var button = document.getElementById("signup-check-id");
    button.disabled = true;
    SignupApi.checkId(id).then(function (result) {
      if (!result || result.available !== true) {
        state.checkedId = "";
        showError("signup-id", "이미 사용 중인 아이디입니다.");
        return;
      }
      state.checkedId = id;
      showStatus("signup-id-status", "사용할 수 있는 아이디입니다.", true);
    }).catch(function (error) {
      state.checkedId = "";
      showError("signup-id", error && error.message ? error.message : "아이디 중복 확인을 하지 못했습니다.");
    }).then(function () {
      button.disabled = false;
    });
  }

  function validateForm() {
    var phone = digits(document.getElementById("signup-phone").value);
    var id = document.getElementById("signup-id").value.trim();
    var password = document.getElementById("signup-password").value;
    var confirm = document.getElementById("signup-password-confirm").value;
    var valid = true;
    if (!AdminAccountRules.validName(document.getElementById("signup-name").value)) { showError("signup-name", "이름을 1~40자로 입력해 주세요."); valid = false; } else showError("signup-name", "");
    if (!invitationGrant) { showError("signup-form", "가입 인증코드를 먼저 확인해 주세요."); valid = false; }

    if (!phone) {
      showError("signup-phone", "휴대폰 번호를 입력해 주세요.");
      valid = false;
    } else if (!validPhone(phone)) {
      showError("signup-phone", "휴대폰 번호 형식을 확인해 주세요.");
      valid = false;
    } else {
      showError("signup-phone", "");
    }

    if (!state.verifiedPhone || state.verifiedPhone !== phone || !state.phoneProof) {
      showError("signup-code", "휴대폰 인증을 완료해 주세요.");
      valid = false;
    } else {
      showError("signup-code", "");
    }

    if (!id) {
      showError("signup-id", "아이디를 입력해 주세요.");
      valid = false;
    } else if (!validId(id)) {
      showError("signup-id", "아이디는 영문으로 시작하는 4~20자의 영문과 숫자로 입력해 주세요.");
      valid = false;
    } else if (state.checkedId !== id) {
      showError("signup-id", "아이디 중복 확인을 완료해 주세요.");
      valid = false;
    } else {
      showError("signup-id", "");
    }

    if (!password) {
      showError("signup-password", "비밀번호를 입력해 주세요.");
      valid = false;
    } else if (!validPassword(password)) {
      showError("signup-password", "비밀번호는 8~20자이며 영문과 숫자를 모두 포함해야 합니다.");
      valid = false;
    } else {
      showError("signup-password", "");
    }

    if (!confirm) {
      showError("signup-password-confirm", "비밀번호를 다시 입력해 주세요.");
      valid = false;
    } else if (password !== confirm) {
      showError("signup-password-confirm", "비밀번호가 일치하지 않습니다.");
      valid = false;
    } else {
      showError("signup-password-confirm", "");
    }

    return valid;
  }

  function finishSignup(id) {
    closeModal();
    var loginId = document.querySelector("[data-auth='login'] [name='userId']");
    var loginPassword = document.querySelector("[data-auth='login'] [name='password']");
    var loginMessage = document.querySelector("[data-auth='login'] [data-auth-message]");
    if (loginId) loginId.value = id;
    if (loginPassword) {
      loginPassword.value = "";
      loginPassword.focus();
    }
    if (loginMessage) {
      loginMessage.hidden = false;
      loginMessage.setAttribute("data-tone", "success");
      loginMessage.textContent = "가입이 완료되었습니다. 비밀번호를 입력해 로그인해 주세요.";
    }
  }

  function submitForm(event) {
    event.preventDefault();
    showError("signup-form", "");
    if (!validateForm()) return;
    var phone = digits(document.getElementById("signup-phone").value);
    var id = document.getElementById("signup-id").value.trim();
    var password = document.getElementById("signup-password").value;
    var button = event.target.querySelector("[type='submit']");
    button.disabled = true;
    AdminAccountApi.validateInvitation(invitationGrant).then(function () {
      return SignupApi.createAccount({
        name: document.getElementById("signup-name").value.trim(),
        phone: phone,
        id: id,
        password: password,
        phoneVerificationProof: state.phoneProof,
        invitationGrant: invitationGrant
      });
    }).then(function (result) {
      if (!result || !result.id) {
        showError("signup-form", "계정을 만들지 못했습니다.");
        return;
      }
      finishSignup(result.id);
    }).catch(function (error) {
      if (error && error.code === "INVITATION") { resetForm(); openGate(error.message); }
      else showError("signup-form", error && error.message ? error.message : "회원가입을 완료하지 못했습니다. 계정이 만들어지지 않았습니다.");
    }).then(function () {
      button.disabled = false;
    });
  }

  function init() {
    var opener = document.getElementById("signup-open");
    var modal = document.getElementById("modal-signup");
    var form = document.getElementById("signup-form");
    if (!opener || !modal || !form) return;

    opener.addEventListener("click", function () { openGate(); });
    document.getElementById("invitation-form").addEventListener("submit", verifyInvitation);
    document.getElementById("modal-signup-invitation").addEventListener("click", function (e) { if (e.target.closest("[data-invitation-close]")) closeGate(); });
    document.getElementById("signup-name").addEventListener("input", function () { showError("signup-name", ""); });
    modal.addEventListener("click", function (event) {
      if (event.target.closest("[data-signup-close]")) closeModal();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !modal.hidden) closeModal();
      else if (event.key === "Escape" && !document.getElementById("modal-signup-invitation").hidden) closeGate();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Tab") return;
      var active = !modal.hidden ? modal : !document.getElementById("modal-signup-invitation").hidden ? document.getElementById("modal-signup-invitation") : null;
      if (!active) return;
      var nodes = Array.prototype.slice.call(active.querySelectorAll("button:not(:disabled),input:not(:disabled),a[href]")), first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    document.getElementById("signup-phone").addEventListener("input", onPhoneInput);
    document.getElementById("signup-code").addEventListener("input", function () {
      var input = this;
      var next = digits(input.value).slice(0, 6);
      if (input.value !== next) input.value = next;
      showError("signup-code", "");
    });
    document.getElementById("signup-id").addEventListener("input", onIdInput);
    document.getElementById("signup-password").addEventListener("input", function () {
      showError("signup-password", "");
    });
    document.getElementById("signup-password-confirm").addEventListener("input", function () {
      showError("signup-password-confirm", "");
    });
    document.getElementById("signup-send").addEventListener("click", sendCode);
    document.getElementById("signup-verify").addEventListener("click", verifyCode);
    document.getElementById("signup-check-id").addEventListener("click", checkId);
    form.addEventListener("submit", submitForm);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

