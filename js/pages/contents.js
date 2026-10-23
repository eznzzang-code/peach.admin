(function () {
  var PAGE_SIZE = 10;

  function startOfToday() {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  var state = {
    category: "",
    period: "all",
    periodStart: "",
    periodEnd: "",
    status: "",
    field: "titleBody",
    keyword: "",
    drafts: false,
    page: 1
  };

  function qs(selector, root) {
    return Admin.qs(selector, root);
  }

  function qsa(selector, root) {
    return Admin.qsa(selector, root);
  }

  function categoryLabel(category) {
    if (category === "공지") return "공지사항";
    return category || "";
  }

  function boardHash(category) {
    if (category === "공지") return "#notice";
    if (category === "복숭아정보") return "#info";
    if (category === "재배자료") return "#material";
    return "";
  }

  function listHref(category) {
    return "contents-list.html" + boardHash(category);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function parseDate(value) {
    if (!value) return null;
    var parts = String(value).split(".");
    if (parts.length < 3) return null;
    var year = Number(parts[0]);
    var month = Number(parts[1]);
    var day = Number(parts[2]);
    if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
    var date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return date;
  }

  function matchesPeriod(item) {
    if (state.period === "all") return true;
    var date = parseDate(item.updatedAt);
    if (!date) return false;
    if (state.period === "custom") {
      var from = parseDate(state.periodStart);
      var to = parseDate(state.periodEnd);
      if (!from || !to || from > to) return true;
      return date >= from && date <= to;
    }
    var months = Number(state.period);
    if (months !== 1 && months !== 3 && months !== 6) return true;
    var today = startOfToday();
    var start = new Date(today.getTime());
    start.setMonth(start.getMonth() - months);
    return date >= start && date <= today;
  }

  function matchesKeyword(item) {
    var keyword = state.keyword.toLowerCase();
    if (!keyword) return true;
    var title = item.title.toLowerCase();
    var body = item.body.toLowerCase();
    var author = item.author.toLowerCase();
    if (state.field === "title") return title.indexOf(keyword) !== -1;
    if (state.field === "author") return author.indexOf(keyword) !== -1;
    return title.indexOf(keyword) !== -1 || body.indexOf(keyword) !== -1;
  }

  var STATUS_CLASS = {
    "게시예정": "contents-status--scheduled",
    "게시중": "contents-status--live",
    "게시종료": "contents-status--ended",
    "비공개": "contents-status--private",
    "임시저장": "contents-status--draft"
  };

  function compareLatest(a, b) {
    if (a.updatedAt !== b.updatedAt) return a.updatedAt < b.updatedAt ? 1 : -1;
    return b.id - a.id;
  }

  function isLivePin(item) {
    return item.category === "공지" && item.pinned === true && ContentStore.statusOf(item) === "게시중";
  }

  function isDraftItem(item) {
    return ContentStore.statusOf(item) === "임시저장";
  }

  function draftCount() {
    if (!state.category) return 0;
    return ContentStore.list().filter(function (item) {
      return item.category === state.category && isDraftItem(item);
    }).length;
  }

  function syncDraftButton() {
    var button = qs("#contents-drafts");
    if (!button) return;
    button.textContent = "임시저장(" + draftCount() + ")";
    button.setAttribute("aria-pressed", state.drafts ? "true" : "false");
  }

  function filteredItems() {
    // TODO: 콘텐츠 목록 조회 API 연동
    return ContentStore.list().filter(function (item) {
      // 운영자 목록에서만 제외합니다. 저장된 과원관리 게시글과 저장 구조는 바꾸지 않습니다.
      if (item.category === "과원관리") return false;
      if (!state.category || item.category !== state.category) return false;
      if (state.drafts) {
        if (!isDraftItem(item)) return false;
      } else if (isDraftItem(item)) {
        return false;
      } else if (state.status && ContentStore.statusOf(item) !== state.status) {
        return false;
      }
      if (!matchesPeriod(item)) return false;
      return matchesKeyword(item);
    }).sort(function (a, b) {
      var aPin = isLivePin(a);
      var bPin = isLivePin(b);
      if (aPin !== bPin) return aPin ? -1 : 1;
      return compareLatest(a, b);
    });
  }

  function renderStatus(status) {
    var className = "contents-status " + (STATUS_CLASS[status] || "");
    return '<span class="' + className + '">' + escapeHtml(status) + "</span>";
  }

  function renderChannels(channels) {
    return channels.map(function (channel) {
      return '<span class="badge">' + escapeHtml(channel) + "</span>";
    }).join("");
  }

  function renderRows(items) {
    var tbody = qs("#contents-table tbody");
    var start = (state.page - 1) * PAGE_SIZE;
    var pageItems = items.slice(start, start + PAGE_SIZE);

    if (!pageItems.length) {
      var emptyText = !state.category
        ? "왼쪽 메뉴에서 게시판을 선택해 주세요."
        : state.drafts
          ? "임시저장된 게시글이 없습니다."
          : "검색 조건에 맞는 게시글이 없습니다.";
      tbody.innerHTML = '<tr><td class="contents-empty" colspan="7">' + emptyText + "</td></tr>";
      var emptyMaster = qs("#contents-table [data-check-all]");
      var emptyRemove = qs("#contents-delete");
      if (emptyMaster) {
        emptyMaster.checked = false;
        emptyMaster.indeterminate = false;
      }
      if (emptyRemove) emptyRemove.disabled = true;
      return;
    }

    var regularTotal = 0;
    items.forEach(function (item) {
      if (!isLivePin(item)) regularTotal += 1;
    });
    var regularBefore = 0;
    items.slice(0, start).forEach(function (item) {
      if (!isLivePin(item)) regularBefore += 1;
    });

    tbody.innerHTML = pageItems.map(function (item) {
      var href = "contents-edit.html?id=" + encodeURIComponent(item.id) + boardHash(item.category);
      var pinned = isLivePin(item);
      var numberCell = pinned
        ? '<span class="contents-pin">공지</span>'
        : String(regularTotal - regularBefore++);
      // 수정·등록일 열은 수정일(updatedAt)을 표시합니다. No는 화면 순번이며 게시글 id와 다릅니다.
      return (
        '<tr' + (pinned ? ' class="is-notice"' : "") + ">" +
          '<td class="table__check"><label class="checkbox">' +
            '<input type="checkbox" data-id="' + item.id + '">' +
            '<span class="checkbox__box" aria-hidden="true"></span>' +
            '<span class="sr-only">' + item.id + "번 선택</span>" +
          "</label></td>" +
          "<td>" + numberCell + "</td>" +
          '<td><span class="contents-title-line">' +
            '<a class="contents-title" href="' + href + '">' + escapeHtml(String(item.title || "").trim() ? item.title : "(제목 없음)") + "</a>" +
            (ContentStore.urgentActive(item) ? '<span class="contents-urgent">· 긴급</span>' : "") +
          "</span></td>" +
          "<td>" + renderChannels(item.channels) + "</td>" +
          "<td>" + renderStatus(ContentStore.statusOf(item)) + "</td>" +
          "<td>" + escapeHtml(item.author) + "</td>" +
          "<td>" + escapeHtml(item.updatedAt) + "</td>" +
        "</tr>"
      );
    }).join("");

    var master = qs("#contents-table [data-check-all]");
    var removeButton = qs("#contents-delete");
    if (master) {
      master.checked = false;
      master.indeterminate = false;
    }
    if (removeButton) removeButton.disabled = true;
  }

  function showStorageProblem() {
    var storage = qs("#contents-storage");
    var message = ContentStore.problemMessage();
    if (!storage) return;
    storage.hidden = !message;
    var messageEl = qs("#contents-storage-message");
    if (messageEl) messageEl.textContent = message;
  }

  function render(updatePager) {
    syncDraftButton();
    var items = filteredItems();
    var problem = ContentStore.problem();
    showStorageProblem();
    if (problem) {
      var tbody = qs("#contents-table tbody");
      if (tbody) tbody.innerHTML = "";
      var master = qs("#contents-table [data-check-all]");
      var removeButton = qs("#contents-delete");
      if (master) {
        master.checked = false;
        master.indeterminate = false;
      }
      if (removeButton) removeButton.disabled = true;
      if (updatePager) {
        var brokenNav = qs("[data-pagination]");
        if (brokenNav) {
          brokenNav.setAttribute("data-current", "1");
          brokenNav.setAttribute("data-total", "1");
          AdminUI.refreshPagination(brokenNav);
        }
      }
      return;
    }
    var totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;
    renderRows(items);

    if (!updatePager) return;
    var nav = qs("[data-pagination]");
    if (!nav) return;
    nav.setAttribute("data-current", String(state.page));
    nav.setAttribute("data-total", String(items.length ? totalPages : 1));
    AdminUI.refreshPagination(nav);
  }

  function periodErrorMessage(startValue, endValue) {
    if (!startValue || !endValue) return "시작일과 종료일을 선택해 주세요.";
    var start = parseDate(startValue);
    var end = parseDate(endValue);
    if (!start || !end) return "날짜 형식이 올바르지 않습니다.";
    if (start > end) return "시작일은 종료일보다 늦을 수 없습니다.";
    return "";
  }

  function showPeriodError(message) {
    var error = qs("#contents-period-error");
    if (!error) return;
    error.textContent = message;
    error.hidden = false;
  }

  function clearPeriodError() {
    var error = qs("#contents-period-error");
    if (!error) return;
    error.textContent = "";
    error.hidden = true;
  }

  function syncCustomPeriod() {
    var row = qs("#contents-custom-period");
    var period = qs("[name='period']");
    if (row) row.hidden = !period || period.value !== "custom";
  }

  function applySearch(options) {
    var revealError = options && options.revealError;
    var periodInput = qs("[name='period']");
    var period = periodInput ? periodInput.value : "all";
    syncCustomPeriod();
    if (period === "custom") {
      var startValue = qs("[name='periodStart']").value;
      var endValue = qs("[name='periodEnd']").value;
      var error = periodErrorMessage(startValue, endValue);
      if (error) {
        if (revealError || (startValue && endValue)) showPeriodError(error);
        else clearPeriodError();
        state.period = "custom";
        if (!startValue || !endValue) {
          state.periodStart = "";
          state.periodEnd = "";
        }
      } else {
        clearPeriodError();
        state.period = "custom";
        state.periodStart = startValue;
        state.periodEnd = endValue;
      }
    } else {
      clearPeriodError();
      state.period = period || "all";
      state.periodStart = "";
      state.periodEnd = "";
    }
    state.status = qs("[name='status']").value;
    state.field = qs("[name='field']").value;
    state.keyword = qs("[name='keyword']").value.trim();
    state.page = 1;
    render(true);
  }

  function initCreate() {
    var form = qs("#contents-form");
    if (!form) return;

    var isEdit = form.getAttribute("data-mode") === "edit";
    var editing = null;
    var boardCategory = "";
    var categoryFromHash = { notice: "공지", info: "복숭아정보", material: "재배자료" };

    function hashCategory() {
      return categoryFromHash[(window.location.hash || "").replace(/^#/, "")] || "";
    }

    function showBoardProblem(message, backHref) {
      form.hidden = true;
      var intro = form.previousElementSibling;
      if (intro && intro.classList.contains("flow-guide")) intro.hidden = true;
      var block = qs("#contents-board");
      if (!block) return;
      block.hidden = false;
      var messageEl = qs("#contents-board-message");
      if (messageEl) messageEl.textContent = message;
      var back = qs("#contents-board-back");
      if (back) back.href = backHref || "contents-list.html";
    }

    function applyBoard(category) {
      boardCategory = category;
      var input = qs("[name='category']");
      if (input) input.value = category;
      var label = categoryLabel(category);
      var action = isEdit ? "수정" : "등록";
      var heading = qs("#contents-page-title");
      if (heading) heading.textContent = label + " " + action;
      document.title = label + " " + action + " | 복숭아자조금 관리자";
      var href = listHref(category);
      qsa("main a[href='contents-list.html'], main a[href^='contents-list.html#']").forEach(function (link) {
        link.href = href;
      });
      var pinRow = qs("#contents-pin-row");
      if (pinRow) {
        pinRow.hidden = category !== "공지";
        if (category !== "공지") {
          var pinBox = qs("#contents-pin");
          if (pinBox) pinBox.checked = false;
        }
      }
    }

    if (isEdit) {
      editing = ContentStore.get(new URLSearchParams(window.location.search).get("id"));
      if (ContentStore.problem()) {
        showStorageProblem();
        return;
      }
      if (!editing) {
        var missing = qs("#contents-missing");
        if (missing) missing.hidden = false;
        return;
      }
      if (editing.category === "과원관리") {
        var orchard = qs("#contents-orchard");
        if (orchard) orchard.hidden = false;
        return;
      }
      if (!boardHash(editing.category)) {
        showBoardProblem("이 게시글의 게시판 유형을 확인할 수 없어 수정할 수 없습니다.");
        return;
      }
      var urlCategory = hashCategory();
      if (urlCategory && urlCategory !== editing.category) {
        showBoardProblem("주소의 게시판과 저장된 게시글 유형이 달라 수정할 수 없습니다.", listHref(editing.category));
        return;
      }
      if ((window.location.hash || "") !== boardHash(editing.category)) {
        history.replaceState(null, "", window.location.pathname + window.location.search + boardHash(editing.category));
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      }
      applyBoard(editing.category);
      window.addEventListener("hashchange", function () {
        var next = hashCategory();
        if (next && next !== boardCategory) {
          showBoardProblem("주소의 게시판과 저장된 게시글 유형이 달라 수정할 수 없습니다.", listHref(boardCategory));
        }
      });
    } else {
      ContentStore.list();
      showStorageProblem();
      var createdCategory = hashCategory();
      if (!createdCategory) {
        showBoardProblem("게시판을 확인할 수 없습니다. 사이드바에서 게시판을 선택한 뒤 등록해 주세요.");
        return;
      }
      applyBoard(createdCategory);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
    });

    var urgentUse = qs("#urgent-use");
    var urgentUnused = qs("#urgent-unused");
    var urgentPeriod = qs("#urgent-period");
    var urgentStart = qs("#urgent-start");
    var urgentEnd = qs("#urgent-end");
    var urgentOrderValue = 1;
    var publishStart = qs("#publish-start");
    var publishEnd = qs("#publish-end");
    var noEnd = qs("#publish-no-end");
    var canvas = qs("[data-editor-canvas]");
    var source = qs("[data-editor-source]");
    var editor = qs("[data-editor]");
    var dirty = false;
    var hydrating = false;
    var saveLocked = false;
    var editorMode = "design";
    var savedRange = null;
    var imageFile = null;
    var imageTouched = false;
    var attachmentTouched = false;

    function markDirty() {
      if (hydrating) return;
      dirty = true;
    }

    function setPickerDisabled(input, disabled) {
      input.disabled = disabled;
      var picker = input.closest(".datepicker");
      if (picker) picker.classList.toggle("is-disabled", disabled);
    }

    function syncUrgent() {
      var enabled = urgentUse.checked;
      if (urgentPeriod) urgentPeriod.hidden = !enabled;
      setPickerDisabled(urgentStart, !enabled);
      setPickerDisabled(urgentEnd, !enabled);
      if (enabled) urgentEnd.closest(".datepicker").setAttribute("data-min", urgentStart.value);
      syncUrgentState();
    }

    function syncUrgentState() {
      var stateEl = qs("#urgent-state");
      if (!stateEl) return;
      if (!urgentUse.checked) {
        stateEl.hidden = true;
        stateEl.textContent = "";
        stateEl.classList.remove("is-active", "is-inactive");
        return;
      }
      var active = ContentStore.urgentActive({
        isDraft: !!(editing && editing.isDraft),
        visibility: (qs("[name='visibility']") || {}).value || "public",
        publishStart: publishStart.value,
        publishEnd: publishEnd.value,
        noEnd: noEnd.checked,
        urgentUse: true,
        urgentStart: urgentStart.value,
        urgentEnd: urgentEnd.value
      });
      stateEl.hidden = false;
      stateEl.textContent = active ? "긴급공지 활성" : "긴급공지 비활성";
      stateEl.classList.toggle("is-active", active);
      stateEl.classList.toggle("is-inactive", !active);
    }

    function syncDateMin(startInput, endInput, preserveEnd) {
      var endPicker = endInput.closest(".datepicker");
      if (startInput.value) endPicker.setAttribute("data-min", startInput.value);
      else endPicker.removeAttribute("data-min");
      if (!preserveEnd && startInput.value && endInput.value && parseDate(endInput.value) < parseDate(startInput.value)) {
        endInput.value = "";
      }
    }

    function clearErrors() {
      qsa(".field-error", form).forEach(function (error) { error.remove(); });
      qsa(".is-invalid", form).forEach(function (field) { field.classList.remove("is-invalid"); });
    }

    function addError(anchor, message) {
      var error = document.createElement("p");
      error.className = "field-error";
      error.textContent = message;
      anchor.insertAdjacentElement("afterend", error);
    }

    function editorHtml() {
      return editorMode === "html" ? source.value : canvas.innerHTML;
    }

    function editorText() {
      if (editorMode === "html") {
        var holder = document.createElement("div");
        holder.innerHTML = source.value;
        return holder.textContent.replace(/\u00a0/g, " ").trim();
      }
      return canvas.textContent.replace(/\u00a0/g, " ").trim();
    }

    function saveSelection() {
      var selection = window.getSelection();
      if (!selection.rangeCount) return;
      if (!canvas.contains(selection.anchorNode)) return;
      savedRange = selection.getRangeAt(0);
    }

    function restoreSelection() {
      canvas.focus();
      if (!savedRange) return;
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }

    function isJpegOrPng(file) {
      var name = String(file && file.name || "").toLowerCase();
      var type = String(file && file.type || "").toLowerCase();
      var dot = name.lastIndexOf(".");
      var ext = dot === -1 ? "" : name.slice(dot + 1);
      var extOk = ext === "jpg" || ext === "jpeg" || ext === "png";
      var typeOk = type === "image/jpeg" || type === "image/jpg" || type === "image/png";
      if (type && !typeOk) return false;
      return extOk || typeOk;
    }

    function bindFile(zone, withPreview, onFile) {
      var input = qs(".upload__input", zone);
      var nameEl = qs(".upload__name", zone);
      var sizeEl = qs(".upload__size", zone);
      var keepEl = qs(".upload__keep", zone);
      var chosen = qs(".upload__chosen", zone);
      var empty = qs(".upload__empty", zone);
      var removeButton = qs(".upload__remove", zone);
      var preview = qs(".upload__preview", zone);
      var previewUrl = "";
      var selectedFile = null;
      var storedMeta = null;

      function errorElement() {
        var el = document.getElementById(zone.id + "-error");
        if (el && zone.parentElement && zone.parentElement.contains(el)) return el;
        el = document.createElement("p");
        el.className = "field-error";
        el.id = zone.id + "-error";
        el.hidden = true;
        zone.parentElement.appendChild(el);
        return el;
      }

      function clearFileError() {
        zone.classList.remove("is-invalid");
        var el = document.getElementById(zone.id + "-error");
        if (!el) return;
        el.hidden = true;
        el.textContent = "";
      }

      function showFileError(message) {
        zone.classList.add("is-invalid");
        var el = errorElement();
        el.hidden = false;
        el.textContent = message;
      }

      function clearPreview() {
        if (preview) preview.onerror = null;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = "";
        if (!preview) return;
        preview.hidden = true;
        preview.removeAttribute("src");
      }

      function showPreview(src, revokeUrl) {
        if (!withPreview || !preview) return;
        clearPreview();
        previewUrl = revokeUrl || "";
        preview.onerror = function () {
          clearPreview();
          showFileError("미리보기를 표시할 수 없습니다.");
        };
        preview.src = src;
        preview.hidden = false;
      }

      function setChosen(hasFile) {
        zone.classList.toggle("is-selected", hasFile);
        if (chosen) chosen.hidden = !hasFile;
        if (empty) empty.hidden = hasFile;
        if (removeButton) removeButton.hidden = !hasFile;
      }

      function paint(file) {
        selectedFile = file || null;
        storedMeta = null;
        clearPreview();
        if (keepEl) {
          keepEl.hidden = true;
          keepEl.textContent = "";
        }
        if (onFile) onFile(file || null);
        var hasFile = !!file;
        setChosen(hasFile);
        if (!hasFile) {
          if (nameEl) nameEl.textContent = "";
          if (sizeEl) sizeEl.textContent = "";
          return;
        }
        if (nameEl) nameEl.textContent = file.name;
        if (sizeEl) sizeEl.textContent = formatFileSize(file.size);
        if (withPreview && isJpegOrPng(file)) {
          var nextUrl = URL.createObjectURL(file);
          showPreview(nextUrl, nextUrl);
        }
      }

      function showStored(meta) {
        selectedFile = null;
        storedMeta = meta && meta.name ? meta : null;
        clearPreview();
        var hasFile = !!storedMeta;
        setChosen(hasFile);
        if (keepEl) {
          keepEl.hidden = true;
          keepEl.textContent = "";
        }
        if (!hasFile) {
          if (nameEl) nameEl.textContent = "";
          if (sizeEl) sizeEl.textContent = "";
          return;
        }
        if (nameEl) nameEl.textContent = storedMeta.name;
        if (sizeEl) sizeEl.textContent = formatFileSize(storedMeta.size);
        var keptPreview = withPreview && !!storedMeta.dataUrl;
        if (!keptPreview && keepEl) {
          keepEl.hidden = false;
          keepEl.textContent = "파일 내용은 보관되지 않습니다";
        }
        if (keptPreview) showPreview(storedMeta.dataUrl, "");
      }

      function restoreDisplay() {
        input.value = "";
        if (selectedFile) paint(selectedFile);
        else showStored(storedMeta);
      }

      zone.addEventListener("drop", function (event) {
        if (!withPreview) return;
        var dropped = event.dataTransfer && event.dataTransfer.files;
        if (!dropped || !dropped.length || isJpegOrPng(dropped[0])) return;
        event.preventDefault();
        event.stopPropagation();
        showFileError("JPG, JPEG, PNG 파일만 선택할 수 있습니다.");
      }, true);

      input.addEventListener("change", function (event) {
        var file = input.files && input.files[0];
        input.value = "";
        if (!file) return;
        clearFileError();
        try {
          if (withPreview && !isJpegOrPng(file)) {
            showFileError("JPG, JPEG, PNG 파일만 선택할 수 있습니다.");
            restoreDisplay();
            event.stopPropagation();
            return;
          }
          paint(file);
          markDirty();
        } catch (error) {
          showFileError(withPreview ? "이미지를 선택하지 못했습니다. 다시 선택해 주세요." : "파일을 선택하지 못했습니다. 다시 선택해 주세요.");
          restoreDisplay();
          event.stopPropagation();
        }
      });

      if (removeButton) {
        removeButton.addEventListener("click", function (event) {
          event.preventDefault();
          event.stopPropagation();
          input.value = "";
          clearFileError();
          paint(null);
          markDirty();
        });
      }

      return {
        showStored: showStored,
        showFileError: showFileError
      };
    }

    function formatFileSize(size) {
      var value = Number(size) || 0;
      if (value < 1024) return value + "B";
      if (value < 1024 * 1024) return Math.round(value / 1024) + "KB";
      return (value / (1024 * 1024)).toFixed(1) + "MB";
    }

    function bindAttachments(zone, onChange) {
      var input = qs(".upload__input", zone);
      var listEl = document.getElementById(zone.id + "-list");
      var noteEl = document.getElementById(zone.id + "-note");
      var entries = [];
      var nextId = 1;

      function errorElement() {
        var el = document.getElementById(zone.id + "-error");
        if (el && zone.parentElement && zone.parentElement.contains(el)) return el;
        el = document.createElement("p");
        el.className = "field-error";
        el.id = zone.id + "-error";
        el.hidden = true;
        zone.parentElement.appendChild(el);
        return el;
      }

      function clearFileError() {
        zone.classList.remove("is-invalid");
        var el = document.getElementById(zone.id + "-error");
        if (!el) return;
        el.hidden = true;
        el.textContent = "";
      }

      function showFileError(message) {
        zone.classList.add("is-invalid");
        var el = errorElement();
        el.hidden = false;
        el.textContent = message;
      }

      function sameEntry(entry, file) {
        var current = entry.file || entry.meta;
        if (!current || current.name !== file.name || Number(current.size) !== Number(file.size)) return false;
        var knownModified = entry.file ? entry.file.lastModified : 0;
        if (knownModified && file.lastModified) return knownModified === file.lastModified;
        return true;
      }

      function render() {
        if (!listEl) return;
        listEl.replaceChildren();
        entries.forEach(function (entry) {
          var source = entry.file || entry.meta || {};
          var item = document.createElement("li");
          item.className = "upload-list__item";
          var meta = document.createElement("div");
          meta.className = "upload-list__meta";
          var name = document.createElement("span");
          name.className = "upload-list__name";
          name.textContent = source.name || "";
          var size = document.createElement("span");
          size.className = "upload-list__size";
          var sizeText = formatFileSize(source.size);
          if (!entry.file && !(entry.meta && entry.meta.resourceKey)) sizeText += " · 파일 내용은 보관되지 않습니다";
          size.textContent = sizeText;
          meta.append(name, size);
          var removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "upload__remove";
          removeButton.textContent = "제거";
          removeButton.addEventListener("click", function () {
            entries = entries.filter(function (itemEntry) { return itemEntry.id !== entry.id; });
            if (noteEl) noteEl.hidden = true;
            clearFileError();
            render();
            if (onChange) onChange();
          });
          item.append(meta, removeButton);
          listEl.append(item);
        });
      }

      function addFiles(files) {
        var skipped = 0;
        var added = 0;
        Array.prototype.forEach.call(files, function (file) {
          if (entries.some(function (entry) { return sameEntry(entry, file); })) {
            skipped += 1;
            return;
          }
          entries.push({ id: nextId++, file: file, meta: null });
          added += 1;
        });
        if (noteEl) {
          noteEl.hidden = skipped === 0;
          noteEl.textContent = skipped ? "이미 첨부된 파일과 이름·크기가 같고, 수정 시각이 같거나 확인되지 않는 파일은 다시 추가하지 않았습니다." : "";
        }
        render();
        if (added && onChange) onChange();
        return added;
      }

      input.addEventListener("change", function (event) {
        var picked = Array.prototype.slice.call(input.files || []);
        input.value = "";
        if (!picked.length) return;
        clearFileError();
        try {
          if (!addFiles(picked)) event.stopPropagation();
        } catch (error) {
          showFileError("파일을 선택하지 못했습니다. 다시 선택해 주세요.");
          event.stopPropagation();
        }
      });

      return {
        showStored: function (record) {
          var stored = [];
          if (record && Array.isArray(record.attachments) && record.attachments.length) stored = record.attachments;
          else if (record && record.attachment && record.attachment.name) stored = [record.attachment];
          entries = stored.map(function (meta) {
            return { id: nextId++, file: null, meta: meta };
          });
          if (noteEl) noteEl.hidden = true;
          render();
        },
        entries: function () {
          return entries.map(function (entry) {
            return { file: entry.file, meta: entry.meta };
          });
        },
        showFileError: showFileError
      };
    }

    urgentUse.addEventListener("change", function () {
      if (urgentUse.checked) urgentUnused.checked = false;
      syncUrgent();
    });

    urgentUnused.addEventListener("change", function () {
      if (urgentUnused.checked) urgentUse.checked = false;
      else if (!urgentUse.checked) urgentUnused.checked = true;
      syncUrgent();
    });

    publishStart.addEventListener("change", function () {
      syncDateMin(publishStart, publishEnd);
    });

    urgentStart.addEventListener("change", function () {
      syncDateMin(urgentStart, urgentEnd);
    });

    form.addEventListener("input", function () {
      markDirty();
      clearErrors();
      syncUrgentState();
    });
    form.addEventListener("change", function () {
      markDirty();
      clearErrors();
      syncUrgentState();
    });
    form.addEventListener("select:change", function () {
      markDirty();
      clearErrors();
      syncUrgentState();
    });

    canvas.addEventListener("mouseup", saveSelection);
    canvas.addEventListener("keyup", saveSelection);
    canvas.addEventListener("input", markDirty);

    qsa("[data-command]", editor).forEach(function (button) {
      button.addEventListener("click", function () {
        if (editorMode !== "design") return;
        var command = button.getAttribute("data-command");
        restoreSelection();
        if (command === "link") {
          var url = window.prompt("링크 주소를 입력해 주세요.");
          if (!url) return;
          document.execCommand("createLink", false, url);
        } else {
          document.execCommand(command, false, null);
        }
        saveSelection();
        markDirty();
      });
    });

    qs("[data-editor-font]").addEventListener("change", function (event) {
      if (editorMode !== "design") return;
      restoreSelection();
      document.execCommand("fontName", false, event.target.value);
      markDirty();
    });

    qs("[data-editor-block]").addEventListener("change", function (event) {
      if (editorMode !== "design" || !event.target.value) return;
      restoreSelection();
      document.execCommand("formatBlock", false, event.target.value);
      markDirty();
    });

    qs("[data-editor-size]").addEventListener("change", function (event) {
      canvas.style.fontSize = event.target.value;
      markDirty();
    });

    qs("[data-editor-line]").addEventListener("change", function (event) {
      canvas.style.lineHeight = event.target.value;
      source.style.lineHeight = event.target.value;
      markDirty();
    });

    qsa("[data-editor-mode]", editor).forEach(function (tab) {
      tab.addEventListener("click", function () {
        var mode = tab.getAttribute("data-editor-mode");
        if (mode === editorMode) return;
        if (mode === "html") source.value = canvas.innerHTML;
        else canvas.innerHTML = source.value;
        editorMode = mode;
        canvas.hidden = mode !== "design";
        source.hidden = mode !== "html";
        qsa("[data-editor-mode]", editor).forEach(function (item) {
          item.classList.toggle("is-active", item === tab);
        });
        qsa("[data-command], [data-editor-font], [data-editor-block], [data-editor-size], [data-editor-line]", editor).forEach(function (control) {
          control.disabled = mode !== "design";
        });
      });
    });

    source.addEventListener("input", markDirty);
    var imageZone = qs("#image-upload");
    var imageUpload = imageZone ? bindFile(imageZone, true, function (file) {
      imageFile = file;
      imageTouched = true;
    }) : null;
    var fileUpload = bindAttachments(qs("#file-upload"), function () {
      attachmentTouched = true;
      markDirty();
    });
    form.getAttachmentEntries = function () {
      return fileUpload.entries();
    };

    function setSelect(select, value, label) {
      var hidden = qs("input[type='hidden']", select);
      var labelEl = qs(".select__label", select);
      if (hidden) hidden.value = value;
      if (labelEl) labelEl.textContent = label;
      qsa(".select__option", select).forEach(function (option) {
        option.classList.toggle("is-selected", (option.getAttribute("data-value") || "") === value);
      });
    }

    if (editing) {
      hydrating = true;
      setSelect(qs("[name='visibility']").closest(".select"), editing.visibility === "private" ? "private" : "public", editing.visibility === "private" ? "비공개" : "공개");
      urgentUse.checked = editing.urgentUse === true;
      urgentOrderValue = editing.urgentOrder || 1;
      urgentUnused.checked = !urgentUse.checked;
      urgentStart.value = editing.urgentStart || "";
      urgentEnd.value = editing.urgentEnd || "";
      qs("#channel-web").checked = editing.channels.indexOf("Web") !== -1;
      qs("#channel-app").checked = editing.channels.indexOf("App") !== -1;
      publishStart.value = editing.publishStart || "";
      publishEnd.value = editing.publishEnd || "";
      noEnd.checked = editing.noEnd === true;
      noEnd.dispatchEvent(new Event("change", { bubbles: true }));
      var pinBox = qs("#contents-pin");
      if (pinBox) pinBox.checked = editing.category === "공지" && editing.pinned === true;
      qs("#contents-title").value = editing.title || "";
      if (editing.body && editing.body.indexOf("<") !== -1) canvas.innerHTML = editing.body;
      else canvas.textContent = editing.body || "";
      if (editing.editorFontSize) canvas.style.fontSize = editing.editorFontSize;
      if (editing.editorLineHeight) {
        canvas.style.lineHeight = editing.editorLineHeight;
        source.style.lineHeight = editing.editorLineHeight;
      }
      if (imageUpload) imageUpload.showStored(editing.image);
      fileUpload.showStored(editing);
      if (!editing.isDraft) {
        qs("#contents-draft").hidden = true;
        qs("#contents-submit").textContent = "저장";
      }
      hydrating = false;
    }

    if (!isEdit) {
      var today = startOfToday();
      var month = String(today.getMonth() + 1);
      var day = String(today.getDate());
      publishStart.value = today.getFullYear() + "." + (month.length < 2 ? "0" + month : month) + "." + (day.length < 2 ? "0" + day : day);
    }

    syncUrgent();
    syncDateMin(publishStart, publishEnd, !!editing);
    syncDateMin(urgentStart, urgentEnd, !!editing);
    if (isEdit) form.hidden = false;

    qs("#contents-cancel").addEventListener("click", function () {
      if (!dirty) {
        window.location.href = listHref(boardCategory);
        return;
      }
      AdminUI.openModal("modal-contents-cancel");
    });

    qs("#contents-cancel-confirm").addEventListener("click", function () {
      window.location.href = listHref(boardCategory);
    });

    var editDelete = qs("#contents-delete");
    var editDeleteConfirm = qs("#contents-edit-delete-confirm");
    if (editDelete && isEdit && editing) {
      editDelete.addEventListener("click", function () {
        AdminUI.openModal("modal-contents-edit-delete");
      });
    }
    if (editDeleteConfirm && isEdit && editing) {
      editDeleteConfirm.addEventListener("click", function () {
        if (!ContentStore.remove([editing.id])) return;
        dirty = false;
        window.location.href = listHref(editing.category);
      });
    }

    qs("#contents-preview").addEventListener("click", function () {
      var title = qs("#contents-title").value.trim();
      var image = qs("#image-upload .upload__preview");
      var previewImage = qs("#preview-image");
      qs("#preview-title").textContent = title;
      var previewHtml = editorHtml() || "";
      var previewHolder = document.createElement("template");
      previewHolder.innerHTML = previewHtml;
      previewHolder.content.querySelectorAll("script").forEach(function (node) { node.remove(); });
      qs("#preview-body").innerHTML = previewHolder.innerHTML;
      if (image && !image.hidden && image.getAttribute("src")) {
        previewImage.src = image.src;
        previewImage.hidden = false;
      } else {
        previewImage.hidden = true;
        previewImage.removeAttribute("src");
      }
      AdminUI.openModal("modal-contents-preview");
    });

    function datesOutOfOrder(startValue, endValue) {
      if (!startValue || !endValue) return false;
      return parseDate(endValue) < parseDate(startValue);
    }

    function beginErrors() {
      clearErrors();
      var firstInvalid = null;
      return {
        fail: function (field, anchor, message, focusEl) {
          field.classList.add("is-invalid");
          addError(anchor, message);
          if (!firstInvalid) firstInvalid = focusEl || field;
        },
        blocked: function () {
          if (!firstInvalid) return false;
          if (typeof firstInvalid.focus === "function") firstInvalid.focus();
          return true;
        }
      };
    }

    function formValue() {
      var channels = [];
      if (qs("#channel-web").checked) channels.push("Web");
      if (qs("#channel-app").checked) channels.push("App");
      return {
        category: boardCategory,
        title: qs("#contents-title").value.trim(),
        body: editorHtml(),
        relatedTarget: qs("#contents-related-target")?.disabled ? editing?.relatedTarget || null : (qs("#contents-related-target")?.value ? JSON.parse(qs("#contents-related-target").value) : null),
        channels: channels,
        visibility: qs("[name='visibility']").value || "public",
        publishStart: publishStart.value,
        publishEnd: publishEnd.value,
        noEnd: noEnd.checked,
        pinned: boardCategory === "공지" && !!(qs("#contents-pin") && qs("#contents-pin").checked),
        urgentUse: urgentUse.checked,
        urgentOrder: urgentOrderValue,
        urgentStart: urgentStart.value,
        urgentEnd: urgentEnd.value,
        editorFontSize: canvas.style.fontSize || "",
        editorLineHeight: canvas.style.lineHeight || ""
      };
    }

    function fileMeta(file) {
      if (!file) return null;
      return { name: file.name, type: file.type || "", size: file.size || 0 };
    }

    function readImage(file, callback) {
      var meta = fileMeta(file);
      if (!meta || !isJpegOrPng(file) || file.size > ContentStore.imageDataLimit) {
        callback(meta);
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        meta.dataUrl = typeof reader.result === "string" ? reader.result : "";
        callback(meta);
      };
      reader.onerror = function () {
        meta.readError = true;
        callback(meta);
      };
      reader.readAsDataURL(file);
    }

    function showDone(isDraft) {
      var title = "등록 완료";
      var message = "게시글이 시연용 데이터에 등록되었습니다.";
      if (isDraft) {
        title = "임시저장 완료";
        message = "게시글이 시연용 데이터에 임시저장되었습니다.";
      } else if (isEdit && editing && !editing.isDraft) {
        title = "수정 완료";
        message = "게시글이 시연용 데이터에 수정되었습니다.";
      }
      qs("#contents-done-title").textContent = title;
      qs("#contents-done-message").textContent = message;
      AdminUI.openModal("modal-contents-done");
    }

    function currentImage(callback) {
      if (imageFile) {
        readImage(imageFile, callback);
        return;
      }
      if (imageTouched) {
        callback(null);
        return;
      }
      callback(editing ? editing.image : null);
    }

    function materializeAttachments() {
      if (!attachmentTouched) {
        if (editing && Array.isArray(editing.attachments)) return Promise.resolve(editing.attachments.slice());
        if (editing && editing.attachment) return Promise.resolve([editing.attachment]);
        return Promise.resolve([]);
      }
      var entries = fileUpload.entries();
      return (async function () {
        var saved = [];
        for (var index = 0; index < entries.length; index += 1) {
          var entry = entries[index];
          if (entry.file) {
            var binaryKey = "post-file:" + crypto.randomUUID();
            await ResourceStore.put({ key: binaryKey, kind: "post-file", file: entry.file });
            var meta = fileMeta(entry.file);
            meta.resourceKey = binaryKey;
            saved.push(meta);
          } else if (entry.meta) {
            saved.push(entry.meta);
          }
        }
        return saved;
      })();
    }

    function saveContent(isDraft) {
      if (saveLocked) return;
      if (!formValue().category || formValue().category === "과원관리") return;
      saveLocked = true;
      var payload = formValue();
      payload.isDraft = isDraft;
      currentImage(async function (image) {
        payload.image = image;
        try {
          var attachments = await materializeAttachments();
          payload.attachments = attachments;
          payload.attachment = attachments.length ? attachments[0] : null;
        } catch (error) {
          saveLocked = false;
          fileUpload.showFileError("첨부파일을 저장하지 못했습니다. 입력 내용은 유지됩니다. 다시 저장해 주세요.");
          return;
        }
        if (image && image.readError && imageUpload) {
          imageUpload.showFileError("이미지를 읽지 못했습니다. 파일명과 용량만 시연 데이터에 남습니다.");
        }
        var savedRecord = isEdit ? ContentStore.update(editing.id, payload) : ContentStore.add(payload);
        if (!savedRecord) {
          saveLocked = false;
          if (ContentStore.problem()) showStorageProblem();
          return;
        }
        dirty = false;
        showDone(isDraft);
      });
    }

    qs("#contents-draft").addEventListener("click", function () {
      if (saveLocked) return;
      if (isEdit && editing && !editing.isDraft) return;
      var errors = beginErrors();
      if (datesOutOfOrder(publishStart.value, publishEnd.value)) {
        errors.fail(publishEnd, publishEnd.closest(".form-row"), "종료일은 시작일 이후로 선택해 주세요.", publishEnd);
      }
      if (datesOutOfOrder(urgentStart.value, urgentEnd.value)) {
        errors.fail(urgentEnd, urgentEnd.closest(".datepicker"), "긴급 종료일은 시작일 이후로 선택해 주세요.", urgentEnd);
      }
      if (errors.blocked()) return;
      saveContent(true);
    });

    qs("#contents-submit").addEventListener("click", function () {
      if (saveLocked) return;
      var title = qs("#contents-title");
      var channelChecked = qs("#channel-web").checked || qs("#channel-app").checked;
      var errors = beginErrors();

      if (!boardCategory || boardCategory === "과원관리") errors.fail(title, title.closest(".form-row"), "게시판 유형을 확인할 수 없어 저장하지 않습니다.", title);
      if (!channelChecked) errors.fail(qs("#channel-field"), qs("#channel-field").closest(".form-row"), "노출채널을 1개 이상 선택해 주세요.", qs("#channel-web"));
      if (!publishStart.value) errors.fail(publishStart, publishStart.closest(".form-row"), "게시 시작일을 선택해 주세요.", publishStart);
      if (!noEnd.checked && datesOutOfOrder(publishStart.value, publishEnd.value)) {
        errors.fail(publishEnd, publishEnd.closest(".form-row"), "종료일은 시작일 이후로 선택해 주세요.", publishEnd);
      }
      if (!title.value.trim()) errors.fail(title, title, "제목을 입력해 주세요.", title);
      if (!editorText()) errors.fail(editor, editor, "본문을 입력해 주세요.", editorMode === "html" ? source : canvas);

      if (urgentUse.checked) {
        if (!urgentStart.value || !urgentEnd.value) {
          errors.fail(urgentStart, urgentUse.closest(".form-row"), "긴급 시작일과 종료일을 입력해 주세요.", urgentStart);
        } else if (datesOutOfOrder(urgentStart.value, urgentEnd.value)) {
          errors.fail(urgentEnd, urgentEnd.closest(".datepicker"), "긴급 종료일은 시작일 이후로 선택해 주세요.", urgentEnd);
        }
      }

      if (errors.blocked()) return;
      saveContent(false);
    });

    qs("#contents-done-confirm").addEventListener("click", function () {
      window.location.href = listHref(boardCategory);
    });
  }

  Admin.ready(function () {
    var table = qs("#contents-table");
    if (!table) {
      initCreate();
      return;
    }

    var HASH_TO_CATEGORY = {
      notice: "공지",
      info: "복숭아정보",
      material: "재배자료"
    };

    function applyBoardFromHash() {
      var hash = (window.location.hash || "").replace(/^#/, "");
      var category = HASH_TO_CATEGORY[hash] || "";
      state.category = category;
      state.page = 1;
      var heading = qs("#contents-page-title");
      var title = category ? categoryLabel(category) : "게시글 관리";
      if (heading) heading.textContent = title;
      document.title = title + " | 복숭아자조금 관리자";
      var note = qs("#contents-board-note");
      if (note) note.hidden = !!category;
      var createLink = qs("#contents-create");
      if (createLink) {
        createLink.classList.toggle("is-disabled", !category);
        createLink.setAttribute("aria-disabled", category ? "false" : "true");
        if (category) {
          createLink.href = "contents-create.html#" + hash;
          createLink.removeAttribute("tabindex");
        } else {
          createLink.href = "contents-list.html";
          createLink.tabIndex = -1;
        }
      }
      render(true);
    }

    var createLink = qs("#contents-create");
    if (createLink) {
      createLink.addEventListener("click", function (event) {
        if (!state.category) event.preventDefault();
      });
    }

    window.addEventListener("hashchange", applyBoardFromHash);

    var draftButton = qs("#contents-drafts");
    if (draftButton) {
      draftButton.addEventListener("click", function () {
        state.drafts = !state.drafts;
        state.page = 1;
        render(true);
      });
    }

    var searchButton = qs("#contents-search");
    if (searchButton) searchButton.addEventListener("click", function () {
      applySearch({ revealError: true });
    });
    var contentsFilters = qs(".contents-page .list-filters");
    if (contentsFilters) {
      contentsFilters.addEventListener("select:change", function (event) {
        if (event.detail && event.detail.value === "custom") {
          syncCustomPeriod();
          clearPeriodError();
          state.period = "custom";
          state.periodStart = "";
          state.periodEnd = "";
          state.page = 1;
          render(true);
          return;
        }
        applySearch();
      });
      contentsFilters.addEventListener("change", function (event) {
        var name = event.target && event.target.name;
        if (name !== "periodStart" && name !== "periodEnd") return;
        if (!qs("[name='period']") || qs("[name='period']").value !== "custom") return;
        var endPicker = qs("#contents-period-end");
        if (name === "periodStart" && endPicker) endPicker.closest(".datepicker").setAttribute("data-min", event.target.value);
        applySearch({ revealError: !!(qs("[name='periodStart']").value && qs("[name='periodEnd']").value) });
      });
    }

    var keyword = qs("[name='keyword']");
    if (keyword) {
      keyword.addEventListener("keydown", function (event) {
        if (event.key !== "Enter") return;
        event.preventDefault();
        applySearch({ revealError: true });
      });
    }

    var nav = qs("[data-pagination]");
    if (nav) {
      nav.addEventListener("pagination:change", function (event) {
        state.page = event.detail.page;
        render(false);
      });
    }

    var confirmButton = qs("#contents-delete-confirm");
    if (confirmButton) {
      confirmButton.addEventListener("click", function () {
        var ids = qsa("#contents-table tbody input[type='checkbox']:checked").map(function (box) {
          return box.getAttribute("data-id");
        });
        if (!ids.length) {
          AdminUI.closeModal("modal-contents-delete");
          return;
        }
        ids = ids.filter(function (id) {
          var item = ContentStore.get(id);
          return item && item.category !== "과원관리";
        });
        if (!ids.length) {
          AdminUI.closeModal("modal-contents-delete");
          return;
        }
        if (!ContentStore.remove(ids)) {
          AdminUI.closeModal("modal-contents-delete");
          render(true);
          return;
        }
        render(true);
        AdminUI.openModal("modal-contents-deleted");
      });
    }

    applyBoardFromHash();
  });
})();
