/* 운영자·권한 조회·수정 화면. */
(function () {
  var SAVE_MESSAGE = "현재는 시연용 화면으로, 권한 저장 기능은 연결되지 않았습니다.";
  var NO_CHANGE_MESSAGE = "변경된 권한이 없습니다.";
  var LEAVE_MESSAGE = "변경한 권한을 저장하지 않고 이동하시겠습니까?";
  var RELOAD_MESSAGE = "변경한 권한을 취소하고 기존 권한을 불러오시겠습니까?";

  var dbOperators = null;
  function fetchDbOperatorsSync() {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "proc/operator_proc.asp?action=list&_t=" + Date.now(), false);
      xhr.send(null);
      if (xhr.status === 200) {
        var json = JSON.parse(xhr.responseText);
        if (json && json.success && Array.isArray(json.items) && json.items.length > 0) {
          dbOperators = json.items;
          return dbOperators;
        }
      }
    } catch(e) {}
    return (window.MockData && MockData.operators) || [];
  }

  function operators() {
    if (dbOperators != null) return dbOperators;
    return fetchDbOperatorsSync();
  }

  function tasks() {
    var active = ((window.MockData && MockData.permissionTasks) || []).filter(function (task) { return task.id !== "survey" && task.id !== "event" && task.id !== "organization"; });
    return active.map(function(task) { return Object.assign({}, task, {name: task.id === "content" ? "공지·게시글" : "교육영상"}); }).concat([{id:"calendar",name:"상시 재배력",actions:["write","publish"]},{id:"orchard",name:"월별 과원관리",actions:["write","publish"]}]);
  }

  function actions() {
    return (window.MockData && MockData.permissionActions) || [];
  }

  function findOperator(id) {
    var list = operators();
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function readOperatorId() {
    return new URLSearchParams(window.location.search).get("operator") || "";
  }

  function writeOperatorId(id) {
    var next = window.location.pathname + "?operator=" + encodeURIComponent(id);
    if (window.location.pathname + window.location.search !== next) {
      history.replaceState(null, "", next);
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function allows(task, actionId) {
    return task.actions.indexOf(actionId) !== -1;
  }

  function clonePermissions(source) {
    var copy = {};
    tasks().forEach(function (task) {
      var row = (source && source[task.id]) || {};
      copy[task.id] = {};
      task.actions.forEach(function (actionId) {
        copy[task.id][actionId] = row[actionId] === true;
      });
    });
    return copy;
  }

  function samePermissions(left, right) {
    var taskList = tasks();
    for (var i = 0; i < taskList.length; i += 1) {
      var task = taskList[i];
      for (var j = 0; j < task.actions.length; j += 1) {
        var actionId = task.actions[j];
        var leftValue = left[task.id] && left[task.id][actionId] === true;
        var rightValue = right[task.id] && right[task.id][actionId] === true;
        if (leftValue !== rightValue) return false;
      }
    }
    return true;
  }

  function fillOperatorSelect(select, current) {
    var list = Admin.qs(".select__list", select);
    var label = Admin.qs(".select__label", select);
    var hidden = Admin.qs("input[type='hidden']", select);
    if (!list || !label || !hidden) return;
    list.innerHTML = operators().map(function (item) {
      var selected = item.id === current.id ? " is-selected" : "";
      return '<li><button type="button" class="select__option' + selected + '" data-value="' + escapeHtml(item.id) + '">' + escapeHtml(item.name) + "</button></li>";
    }).join("");
    label.textContent = current.name;
    hidden.value = current.id;
  }

  function showStatus(operator) {
    var status = document.getElementById("permissions-status");
    if (!status) return;
    var label = (operator.status === "ACTIVE" || operator.status === "사용중")
      ? "사용중"
      : (operator.status === "INACTIVE" || operator.status === "미사용")
        ? "미사용"
        : (operator.status || "");
    status.textContent = label;
    status.classList.toggle("is-inactive", label === "미사용");
  }

  function renderTable(readOnly, values) {
    var head = document.getElementById("permissions-head");
    var body = document.getElementById("permissions-body");
    if (!head || !body) return;
    var actionList = actions();
    var headHtml = "<tr><th scope=\"col\">업무</th>";
    actionList.forEach(function (action) {
      headHtml += "<th scope=\"col\">" + escapeHtml(action.name) + "</th>";
    });
    head.innerHTML = headHtml + "</tr>";

    body.innerHTML = tasks().map(function (task) {
      var cells = "<th scope=\"row\">" + escapeHtml(task.name) + "</th>";
      actionList.forEach(function (action) {
        if (!allows(task, action.id)) {
          cells += '<td class="permissions-na">–</td>';
          return;
        }
        var checked = values[task.id] && values[task.id][action.id] === true;
        var label = task.name + " " + action.name;
        cells += '<td><label class="checkbox">' +
          '<input type="checkbox" data-task="' + escapeHtml(task.id) + '" data-action="' + escapeHtml(action.id) + '"' +
          (checked ? " checked" : "") +
          (readOnly ? " disabled" : "") +
          ' aria-label="' + escapeHtml(label) + '">' +
          '<span class="checkbox__box" aria-hidden="true"></span>' +
          "</label></td>";
      });
      return "<tr>" + cells + "</tr>";
    }).join("");
  }

  function bindView() {
    var select = document.getElementById("permissions-operator");
    var editLink = document.getElementById("permissions-edit");
    if (!select || !operators().length) return;

    var requested = findOperator(readOperatorId());
    var current = requested || operators()[0];
    writeOperatorId(current.id);
    fillOperatorSelect(select, current);

    function show(operator) {
      fillOperatorSelect(select, operator);
      showStatus(operator);
      renderTable(true, clonePermissions(operator.permissions));
      if (editLink) editLink.href = "permissions-edit.asp?operator=" + encodeURIComponent(operator.id);
      writeOperatorId(operator.id);
    }

    show(current);
    select.addEventListener("select:change", function (event) {
      var next = findOperator(event.detail && event.detail.value);
      if (next) show(next);
    });
  }

  function bindEdit() {
    var editor = document.getElementById("permissions-editor");
    var missing = document.getElementById("permissions-missing");
    var operator = findOperator(readOperatorId());
    if (!operator || !editor || !missing) {
      if (editor) editor.hidden = true;
      if (missing) missing.hidden = false;
      return;
    }

    var select = document.getElementById("permissions-operator");
    var reload = document.getElementById("permissions-reload");
    var cancel = document.getElementById("permissions-cancel");
    var save = document.getElementById("permissions-save");
    var note = document.getElementById("permissions-save-note");
    var body = document.getElementById("permissions-body");
    var confirmTitle = document.getElementById("permissions-confirm-title");
    var confirmMessage = document.getElementById("permissions-confirm-message");
    var confirmOk = document.getElementById("permissions-confirm-ok");
    var baseline = clonePermissions(operator.permissions);
    var draft = clonePermissions(operator.permissions);
    var allowLeave = false;
    var pendingConfirm = null;

    missing.hidden = true;
    editor.hidden = false;
    fillOperatorSelect(select, operator);
    renderTable(false, draft);
    if (cancel) cancel.href = "permissions.asp?operator=" + encodeURIComponent(operator.id);

    function isDirty() {
      return !samePermissions(draft, baseline);
    }

    function hideNote() {
      if (note) note.hidden = true;
    }

    function applyOperator(next) {
      operator = next;
      baseline = clonePermissions(next.permissions);
      draft = clonePermissions(next.permissions);
      fillOperatorSelect(select, next);
      renderTable(false, draft);
      writeOperatorId(next.id);
      if (cancel) cancel.href = "permissions.asp?operator=" + encodeURIComponent(next.id);
      hideNote();
    }

    function restoreDraft() {
      draft = clonePermissions(baseline);
      renderTable(false, draft);
      hideNote();
    }

    function askConfirm(options) {
      if (!confirmTitle || !confirmMessage || !confirmOk || !window.AdminUI) {
        if (options.onConfirm) options.onConfirm();
        return;
      }
      pendingConfirm = options;
      confirmTitle.textContent = options.title;
      confirmMessage.textContent = options.message;
      confirmOk.textContent = options.okLabel;
      AdminUI.openModal("modal-permissions-confirm");
    }

    function finishConfirm(confirmed) {
      var current = pendingConfirm;
      pendingConfirm = null;
      if (window.AdminUI) AdminUI.closeModal("modal-permissions-confirm");
      if (!current) return;
      if (confirmed && current.onConfirm) current.onConfirm();
      if (!confirmed && current.onCancel) current.onCancel();
    }

    if (confirmOk) {
      confirmOk.addEventListener("click", function () {
        finishConfirm(true);
      });
    }

    document.addEventListener("click", function (event) {
      if (!pendingConfirm) return;
      if (event.target.closest("#modal-permissions-confirm [data-modal-close]")) finishConfirm(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !pendingConfirm) return;
      var modal = document.getElementById("modal-permissions-confirm");
      if (!modal || modal.hidden) return;
      finishConfirm(false);
    }, true);

    select.addEventListener("select:change", function (event) {
      var next = findOperator(event.detail && event.detail.value);
      if (!next || next.id === operator.id) return;
      if (!isDirty()) {
        applyOperator(next);
        return;
      }
      fillOperatorSelect(select, operator);
      askConfirm({
        title: "이동 확인",
        message: LEAVE_MESSAGE,
        okLabel: "이동",
        onConfirm: function () {
          applyOperator(next);
        }
      });
    });

    if (body) {
      body.addEventListener("change", function (event) {
        var input = event.target;
        if (!input || input.type !== "checkbox") return;
        var taskId = input.getAttribute("data-task");
        var actionId = input.getAttribute("data-action");
        if (!draft[taskId] || !Object.prototype.hasOwnProperty.call(draft[taskId], actionId)) return;
        draft[taskId][actionId] = input.checked;
        hideNote();
      });
    }

    if (reload) {
      reload.addEventListener("click", function () {
        if (!isDirty()) {
          restoreDraft();
          return;
        }
        askConfirm({
          title: "권한 불러오기",
          message: RELOAD_MESSAGE,
          okLabel: "불러오기",
          onConfirm: restoreDraft
        });
      });
    }

    if (save && note) {
      save.addEventListener("click", function () {
        if (!isDirty()) {
          note.textContent = NO_CHANGE_MESSAGE;
          note.hidden = false;
          return;
        }
        var params = new URLSearchParams();
        params.append("action", "save");
        params.append("operator_id", operator.id);
        params.append("status", (operator.status === "미사용" || operator.status === "INACTIVE") ? "INACTIVE" : "ACTIVE");
        params.append("perm_notice_write", (draft.content && draft.content.write) ? "Y" : "N");
        params.append("perm_notice_post", (draft.content && draft.content.publish) ? "Y" : "N");
        params.append("perm_video_write", (draft.video && draft.video.write) ? "Y" : "N");
        params.append("perm_video_post", (draft.video && draft.video.publish) ? "Y" : "N");
        params.append("perm_cal_write", (draft.calendar && draft.calendar.write) ? "Y" : "N");
        params.append("perm_cal_post", (draft.calendar && draft.calendar.publish) ? "Y" : "N");
        params.append("perm_orchard_write", (draft.orchard && draft.orchard.write) ? "Y" : "N");
        params.append("perm_orchard_post", (draft.orchard && draft.orchard.publish) ? "Y" : "N");

        save.disabled = true;
        fetch("proc/operator_proc.asp", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
          body: params.toString()
        })
          .then(function (res) { return res.json(); })
          .then(function (json) {
            save.disabled = false;
            if (json && json.success) {
              note.textContent = "권한 변경사항이 데이터베이스에 저장되었습니다.";
              note.hidden = false;
              baseline = clonePermissions(draft);
              operator.permissions = clonePermissions(draft);
              dbOperators = null;
            } else {
              note.textContent = "저장 실패: " + (json ? json.message : "");
              note.hidden = false;
            }
          })
          .catch(function () {
            save.disabled = false;
            note.textContent = "저장 중 통신 오류가 발생했습니다.";
            note.hidden = false;
          });
      });
    }

    document.addEventListener("click", function (event) {
      if (allowLeave || !isDirty() || event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var link = event.target.closest("a[href]");
      if (!link || link.target === "_blank" || link.closest(".modal")) return;
      var href = link.getAttribute("href") || "";
      if (!href || href.charAt(0) === "#") return;
      event.preventDefault();
      askConfirm({
        title: "이동 확인",
        message: LEAVE_MESSAGE,
        okLabel: "이동",
        onConfirm: function () {
          allowLeave = true;
          window.location.href = link.href;
        }
      });
    });

    window.addEventListener("beforeunload", function (event) {
      if (allowLeave || !isDirty()) return;
      event.preventDefault();
      event.returnValue = "";
    });
  }

  Admin.ready(function () {
    var mode = document.body.getAttribute("data-permissions") || (document.getElementById("permissions-editor") ? "edit" : "view");
    if (mode === "view") bindView();
    if (mode === "edit") bindEdit();
  });
})();
