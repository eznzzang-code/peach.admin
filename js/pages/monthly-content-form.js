/* 월별 과원관리 등록·수정 화면. 과원관리는 저장본, 없으면 목록과 같은 2026년 시연 자료를 읽습니다. 저장은 하지 않습니다. 삭제는 이 브라우저에서 해당 월을 목록에서 뺍니다. */
(function () {
  var TYPE_LABEL = { orchard: "과원관리", cultivation: "재배력" };

  function records() {
    return window.MockData && Array.isArray(MockData.monthlyContents) ? MockData.monthlyContents : [];
  }

  function findRecord(typeLabel, year, month) {
    var matched = null;
    records().forEach(function (item) {
      if (matched) return;
      if (item.type === typeLabel && Number(item.year) === year && Number(item.month) === month) matched = item;
    });
    return matched;
  }

  function visibilityLabel(value) {
    if (value === "공개" || value === "public") return "공개";
    if (value === "비공개" || value === "private") return "비공개";
    return "";
  }

  // 목록의 2026년 시연 자료와 같은 제목·공개·채널만 사용합니다. 없는 이미지는 만들지 않습니다.
  function demoOrchard(year, month) {
    if (year !== 2026) return null;
    var source = window.ADMIN_ORCHARD_MONTHS || [];
    var found = null;
    source.forEach(function (item) {
      if (!found && item.month === month) found = item;
    });
    if (!found) return null;
    return {
      source: "demo",
      year: 2026,
      month: month,
      title: "2026년 " + month + "월 중점 과원관리",
      channels: ["App"],
      visibility: "public",
      preparation: "검수완료",
      updatedAt: "2026.10.19"
    };
  }

  function existingMedia(list) {
    if (!Array.isArray(list)) return [];
    var items = [];
    list.forEach(function (item) {
      if (!item) return;
      var url = item.url || item.src || "";
      var name = item.name || (item.file && item.file.name) || "";
      if (!item.file && !url) return;
      if (item.file && !url) {
        try { url = URL.createObjectURL(item.file); } catch (error) { url = ""; }
      }
      if (!url) return;
      var label = name || String(url).split("/").pop();
      items.push({ id: item.id || ("kept-" + items.length), file: item.file || { name: label }, url: url });
    });
    return items;
  }

  async function loadOrchardContent(year, month) {
    var saved = null;
    if (window.ResourceStore && ResourceStore.get) {
      try {
        saved = await ResourceStore.get("orchard:" + year + ":" + month);
      } catch (error) {
        saved = null;
      }
    }
    if (saved && saved.deleted) return { source: "empty", record: null };
    if (saved && saved.kind === "orchard" && Number(saved.year) === year && Number(saved.month) === month) {
      return { source: "saved", record: saved };
    }
    var demo = demoOrchard(year, month);
    if (demo) return { source: "demo", record: demo };
    return { source: "empty", record: null };
  }

  function parseYear(value) {
    var text = String(value == null ? "" : value).trim();
    if (!/^\d+$/.test(text)) return null;
    var year = Number(text);
    if (!Number.isInteger(year) || year < 1 || year > 9999) return null;
    return year;
  }

  function parseMonth(value) {
    var text = String(value == null ? "" : value).trim();
    if (!/^\d+$/.test(text)) return null;
    var month = Number(text);
    if (!Number.isInteger(month) || month < 1 || month > 12) return null;
    return month;
  }

  function filled(value) {
    return String(value == null ? "" : value).replace(/\u00a0/g, " ").trim().length > 0;
  }

  function isContentImage(file) {
    if (!file || (typeof File !== "undefined" && !(file instanceof File))) return false;
    if (/^image\/(jpeg|png|webp)$/.test(file.type || "")) return true;
    return /\.(jpe?g|png|webp)$/i.test(file.name || "");
  }

  function readTarget() {
    var params = new URLSearchParams(window.location.search);
    var typeCode = params.get("type") || "";
    var mode = params.get("mode") || "";
    return {
      typeCode: typeCode,
      typeLabel: TYPE_LABEL[typeCode] || "",
      year: parseYear(params.get("year")),
      month: parseMonth(params.get("month")),
      mode: mode === "create" || mode === "edit" ? mode : ""
    };
  }

  // 화면 검증입니다. 입력란에 바로 표시할 항목만 확인합니다.
  function validateMonthlyContentForm(values) {
    var errors = [];
    if (!filled(values.title)) errors.push({ field: "title", message: "제목을 입력해 주세요." });
    if (!values.webOn && !values.appOn) errors.push({ field: "channel", message: "노출채널을 1개 이상 선택해 주세요." });
    if (values.webOn && !values.webCount) errors.push({ field: "web", message: "Web 과원관리 콘텐츠 이미지를 1장 이상 첨부해 주세요." });
    if (values.appOn && !values.appCount) errors.push({ field: "app", message: "App 과원관리 콘텐츠 이미지를 1장 이상 첨부해 주세요." });
    return errors;
  }

  // 서버 검증입니다. 저장소는 읽기만 하고 변경하지 않습니다.
  // 실제 서버 연동 시 같은 조건으로 저장 요청을 거절해야 합니다.
  function validateMonthlyContentSave(request, source) {
    var typeLabel = TYPE_LABEL[request.typeCode] || "";
    if (!typeLabel) return { ok: false, code: "type", message: "콘텐츠 유형이 올바르지 않습니다." };
    if (!request.year) return { ok: false, code: "year", message: "연도가 올바르지 않습니다." };
    if (!request.month) return { ok: false, code: "month", message: "월은 1월부터 12월까지여야 합니다." };
    if (request.mode !== "create" && request.mode !== "edit") {
      return { ok: false, code: "mode", message: "등록 또는 수정 화면만 열 수 있습니다." };
    }
    var current = null;
    source.forEach(function (item) {
      if (current) return;
      if (item.type === typeLabel && Number(item.year) === request.year && Number(item.month) === request.month) current = item;
    });
    if (request.mode === "create" && current) {
      return { ok: false, code: "duplicate", message: typeLabel + " " + request.year + "년 " + request.month + "월 콘텐츠가 이미 등록되어 있습니다." };
    }
    if (request.mode === "edit" && !current) {
      return { ok: false, code: "missing", message: typeLabel + " " + request.year + "년 " + request.month + "월 콘텐츠가 없습니다." };
    }
    if (!filled(request.title)) return { ok: false, code: "title", field: "title", message: "제목을 입력해 주세요." };
    if (request.visibility !== "공개" && request.visibility !== "비공개") {
      return { ok: false, code: "visibility", message: "노출 상태를 선택해 주세요." };
    }
    return { ok: true, code: "", message: "" };
  }

  function listPage(typeCode) {
    if (typeCode === "orchard") return "orchard-content.html";
    if (typeCode === "cultivation") return "cultivation-content.html";
    return "";
  }

  Admin.ready(async function () {
    var form = Admin.qs("#monthly-form");
    var gate = Admin.qs("#monthly-gate");
    if (!form || !gate) return;

    var target = readTarget();
    var record = target.typeCode !== "orchard" && target.typeLabel && target.year && target.month ? findRecord(target.typeLabel, target.year, target.month) : null;
    if (target.typeCode === "orchard" && target.year && target.month && (target.mode === "edit" || target.mode === "create")) {
      var loaded = await loadOrchardContent(target.year, target.month);
      record = loaded.record;
      target.mode = record ? "edit" : "create";
      target.contentSource = loaded.source;
    }
    function validationRows() {
      if (target.typeCode !== "orchard") return records();
      if (!record) return [];
      return [{
        type: "과원관리",
        year: Number(record.year),
        month: Number(record.month),
        title: record.title || "",
        visibility: visibilityLabel(record.visibility) || "공개"
      }];
    }
    var gateCheck = validateMonthlyContentSave({
      typeCode: target.typeCode,
      year: target.year,
      month: target.month,
      mode: target.mode,
      title: "확인",
      visibility: "비공개"
    }, validationRows());
    var dirty = false;
    var hydrating = false;
    var gallerySeq = 0;
    var galleries = { web: [], app: [] };
    var previewChannel = "web";

    var titleInput = Admin.qs("#monthly-title");
    var submitButton = Admin.qs("#monthly-submit");
    var notice = Admin.qs("#monthly-notice");

    if (gateCheck.ok) showForm();
    else showGate(gateCheck);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
    });

    form.addEventListener("input", function () {
      if (hydrating) return;
      dirty = true;
      clearErrors();
    });
    form.addEventListener("change", function () {
      if (hydrating) return;
      dirty = true;
      clearErrors();
    });
    var visibilitySelect = Admin.qs("#monthly-visibility-select");
    if (visibilitySelect) {
      visibilitySelect.addEventListener("select:change", function () {
        if (hydrating) return;
        dirty = true;
      });
    }

    Admin.qs("#monthly-list").addEventListener("click", function () {
      if (!dirty) {
        window.location.href = listHref();
        return;
      }
      AdminUI.openModal("modal-monthly-leave");
    });
    var monthlyDelete = Admin.qs("#monthly-delete");
    var monthlyDeleteConfirm = Admin.qs("#monthly-delete-confirm");
    if (monthlyDelete) {
      monthlyDelete.addEventListener("click", function () {
        AdminUI.openModal("modal-monthly-delete");
      });
    }
    if (monthlyDeleteConfirm) {
      monthlyDeleteConfirm.addEventListener("click", async function () {
        if (target.typeCode !== "orchard" || !target.year || !target.month) return;
        monthlyDeleteConfirm.disabled = true;
        try {
          await ResourceStore.put({
            key: "orchard:" + target.year + ":" + target.month,
            kind: "orchard",
            year: target.year,
            month: target.month,
            deleted: true
          });
          dirty = false;
          var back = listHref();
          window.location.href = back + (back.indexOf("?") === -1 ? "?" : "&") + "deleted=1";
        } catch (error) {
          monthlyDeleteConfirm.disabled = false;
          if (notice) {
            notice.textContent = "삭제하지 못했습니다. 브라우저 저장 공간과 권한을 확인해 주세요.";
            AdminUI.openModal("modal-monthly-notice");
          }
        }
      });
    }
    Admin.qs("#monthly-heading-list").addEventListener("click", function (event) {
      if (!dirty) return;
      event.preventDefault();
      AdminUI.openModal("modal-monthly-leave");
    });

    Admin.qs("#monthly-leave-confirm").addEventListener("click", function () {
      window.location.href = listHref();
    });

    Admin.qs("#monthly-preview-open").addEventListener("click", openPreview);
    submitButton.addEventListener("click", submitForm);

    ["web", "app"].forEach(bindGallery);
    var thumbInput = Admin.qs("#monthly-thumb");
    var thumbName = Admin.qs("#monthly-thumb-name");
    var thumbPick = Admin.qs("#monthly-thumb-pick");
    var thumbClear = Admin.qs("#monthly-thumb-clear");
    function paintMonthlyThumb(file, message) {
      var name = file && file.name ? file.name : "";
      if (thumbPick) thumbPick.textContent = name ? "파일 변경" : "파일 선택";
      if (thumbName) {
        thumbName.textContent = name || message || "선택된 파일이 없습니다.";
        thumbName.title = name;
        thumbName.classList.toggle("is-empty", !name);
      }
      if (thumbClear) thumbClear.hidden = !name;
    }
    if (thumbPick && thumbInput) {
      thumbPick.addEventListener("click", function () { thumbInput.click(); });
    }
    if (thumbClear && thumbInput) {
      thumbClear.addEventListener("click", function () {
        thumbInput.value = "";
        paintMonthlyThumb(null);
      });
    }
    if (thumbInput) {
      thumbInput.addEventListener("change", function () {
        var file = thumbInput.files && thumbInput.files[0];
        if (!file) {
          paintMonthlyThumb(null);
          return;
        }
        if (!isContentImage(file)) {
          thumbInput.value = "";
          paintMonthlyThumb(null, "PNG·JPG·WebP 파일을 선택해 주세요.");
          return;
        }
        paintMonthlyThumb(file);
      });
    }
    Admin.qs("#monthly-preview-web").addEventListener("click", function () { previewChannel = "web"; paintPreviewStage(); });
    Admin.qs("#monthly-preview-app").addEventListener("click", function () { previewChannel = "app"; paintPreviewStage(); });
    window.addEventListener("pagehide", function () {
      ["web", "app"].forEach(function (channel) {
        galleries[channel].forEach(function (item) { URL.revokeObjectURL(item.url); });
      });
    });

    function channelOn(channel) {
      var input = Admin.qs(channel === "web" ? "#monthly-channel-web" : "#monthly-channel-app");
      return !!(input && input.checked);
    }

    function syncChannels() {
      ["web", "app"].forEach(function (channel) {
        var on = channelOn(channel);
        var section = Admin.qs("#monthly-" + channel + "-section");
        var input = Admin.qs("#monthly-" + channel + "-input");
        section.hidden = false;
        section.classList.toggle("is-disabled", !on);
        section.classList.toggle("is-active", on);
        section.setAttribute("aria-disabled", on ? "false" : "true");
        if (input) input.disabled = !on;
        renderGallery(channel);
      });
    }

    function bindGallery(channel) {
      var input = Admin.qs("#monthly-" + channel + "-input");
      var drop = Admin.qs("#monthly-" + channel + "-drop");
      var pick = Admin.qs("#monthly-" + channel + "-pick");
      var box = Admin.qs(channel === "web" ? "#monthly-channel-web" : "#monthly-channel-app");
      box.addEventListener("change", function () {
        syncChannels();
      });
      function take(fileList) {
        if (!channelOn(channel)) return;
        var files = Array.prototype.slice.call(fileList || []);
        var rejected = false;
        files.forEach(function (file) {
          if (!isContentImage(file)) {
            rejected = true;
            return;
          }
          galleries[channel].push({ id: "img-" + (++gallerySeq), file: file, url: URL.createObjectURL(file) });
          dirty = true;
        });
        input.value = "";
        renderGallery(channel);
        clearErrors();
        if (rejected) showFieldError(channel, "JPG, JPEG, PNG, WebP 이미지만 첨부할 수 있습니다.");
      }
      input.addEventListener("change", function (event) {
        event.stopPropagation();
        take(input.files);
      });
      pick.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (input.disabled) return;
        input.click();
      });
      drop.addEventListener("click", function (event) {
        if (input.disabled || event.target.closest("button") || event.target === input) return;
        input.click();
      });
      drop.addEventListener("dragover", function (event) {
        if (!channelOn(channel)) return;
        event.preventDefault();
        drop.classList.add("is-dragover");
      });
      drop.addEventListener("dragleave", function () { drop.classList.remove("is-dragover"); });
      drop.addEventListener("drop", function (event) {
        event.preventDefault();
        drop.classList.remove("is-dragover");
        take(event.dataTransfer && event.dataTransfer.files);
      });
    }

    function renderGallery(channel) {
      var items = galleries[channel];
      var grid = Admin.qs("#monthly-" + channel + "-grid");
      Admin.qs("#monthly-" + channel + "-count").textContent = items.length + "장";
      grid.replaceChildren();
      items.forEach(function (item, index) {
        var card = document.createElement("article");
        card.className = "monthly-gallery__card";
        var thumb = document.createElement("div");
        thumb.className = "monthly-gallery__thumb";
        var image = document.createElement("img");
        image.src = item.url;
        image.alt = item.file.name;
        thumb.appendChild(image);
        var meta = document.createElement("div");
        meta.className = "monthly-gallery__meta";
        var order = document.createElement("span");
        order.className = "monthly-gallery__order";
        order.textContent = String(index + 1);
        var name = document.createElement("span");
        name.className = "monthly-gallery__name";
        name.textContent = item.file.name;
        name.title = item.file.name;
        meta.appendChild(order);
        meta.appendChild(name);
        var actions = document.createElement("div");
        actions.className = "monthly-gallery__actions";
        actions.appendChild(moveButton(channel, index, -1));
        actions.appendChild(moveButton(channel, index, 1));
        var remove = document.createElement("button");
        remove.type = "button";
        remove.className = "monthly-gallery__delete";
        remove.title = "삭제";
        remove.disabled = !channelOn(channel);
        remove.setAttribute("aria-label", (index + 1) + "번 이미지 삭제");
        remove.textContent = "삭제";
        remove.addEventListener("click", function () {
          URL.revokeObjectURL(item.url);
          galleries[channel].splice(index, 1);
          dirty = true;
          renderGallery(channel);
        });
        actions.appendChild(remove);
        meta.appendChild(actions);
        card.appendChild(meta);
        card.appendChild(thumb);
        grid.appendChild(card);
      });
    }

    function moveButton(channel, index, direction) {
      var button = document.createElement("button");
      var next = index + direction;
      button.type = "button";
      button.className = "monthly-gallery__move";
      button.disabled = !channelOn(channel) || next < 0 || next >= galleries[channel].length;
      button.title = direction < 0 ? "위로 이동" : "아래로 이동";
      button.setAttribute("aria-label", button.title);
      button.textContent = direction < 0 ? "↑" : "↓";
      button.addEventListener("click", function () {
        var list = galleries[channel];
        var swapped = list[index];
        list[index] = list[next];
        list[next] = swapped;
        dirty = true;
        renderGallery(channel);
      });
      return button;
    }

    function listHref() {
      var page = listPage(target.typeCode);
      if (!page) return "orchard-content.html";
      if (!target.year) return page;
      return page + "?year=" + encodeURIComponent(target.year);
    }

    function paintHeading(label, when) {
      var listLink = Admin.qs("#monthly-heading-list");
      var headingLabel = Admin.qs("#monthly-heading-label");
      var sep = Admin.qs("#monthly-heading-sep");
      var whenLabel = Admin.qs("#monthly-heading-when");
      if (listLink) {
        listLink.textContent = target.typeCode === "cultivation" ? "상시 재배력" : "월별 과원관리";
        listLink.href = listHref();
      }
      if (headingLabel) headingLabel.textContent = label;
      if (sep) sep.hidden = !when;
      if (whenLabel) {
        whenLabel.hidden = !when;
        whenLabel.textContent = when || "";
      }
    }

    function periodLabel() {
      if (!target.year || !target.month) return "";
      var month = String(target.month).padStart(2, "0");
      return target.year + "년 " + month + "월";
    }

    function showForm() {
      gate.hidden = true;
      form.hidden = false;
      var actionLabel = target.mode === "edit" ? "수정" : "등록";
      var heading = target.typeLabel + " " + actionLabel;
      document.title = heading + " | 복숭아자조금 관리자";
      paintHeading(heading, periodLabel());
      submitButton.textContent = actionLabel;
      hydrating = true;
      if (target.mode === "edit" && record) {
        titleInput.value = record.title || "";
        setVisibility(visibilityLabel(record.visibility) === "공개" ? "공개" : "비공개");
        if (target.typeCode === "orchard" && Array.isArray(record.channels)) {
          Admin.qs("#monthly-channel-web").checked = record.channels.indexOf("Web") !== -1;
          Admin.qs("#monthly-channel-app").checked = record.channels.indexOf("App") !== -1;
        }
        if (target.typeCode === "orchard") {
          paintMonthlyThumb(record.thumbnail && record.thumbnail.name ? record.thumbnail : null);
          galleries.web = existingMedia(record.webImages);
          galleries.app = existingMedia(record.appImages);
        }
      } else {
        titleInput.value = "";
        setVisibility("공개");
      }
      hydrating = false;
      dirty = false;
      var deleteButton = Admin.qs("#monthly-delete");
      if (deleteButton) deleteButton.hidden = !(target.typeCode === "orchard" && target.mode === "edit" && record);
      syncChannels();
      renderGallery("web");
      renderGallery("app");
    }

    function showGate(result) {
      form.hidden = true;
      gate.hidden = false;
      document.title = "월별 콘텐츠 | 복숭아자조금 관리자";
      paintHeading(target.typeLabel ? target.typeLabel : "월별 콘텐츠", "");
      var message = result.message;
      if (result.code === "duplicate") message += " 수정 화면에서 관리해 주세요.";
      if (result.code === "missing") message += " 목록에서 등록해 주세요.";
      Admin.qs("#monthly-gate-message").textContent = message;

      var actions = Admin.qs("#monthly-gate-actions");
      actions.innerHTML = "";
      if (target.typeCode && listPage(target.typeCode)) {
        actions.appendChild(gateLink(listHref(), "목록"));
      } else {
        actions.appendChild(gateLink("orchard-content.html", "과원관리 목록"));
        actions.appendChild(gateLink("cultivation-content.html", "재배력 목록"));
      }
      if (result.code === "duplicate") {
        var editUrl = "monthly-content-form.html?type=" + encodeURIComponent(target.typeCode) +
          "&year=" + encodeURIComponent(target.year) +
          "&month=" + encodeURIComponent(target.month) +
          "&mode=edit";
        actions.appendChild(gateLink(editUrl, "수정 화면으로 이동"));
      }
    }

    function gateLink(href, label) {
      var link = document.createElement("a");
      link.className = "btn";
      link.href = href;
      link.textContent = label;
      return link;
    }

    function setVisibility(value) {
      var next = value === "비공개" ? "비공개" : "공개";
      var input = Admin.qs("#monthly-visibility");
      var label = Admin.qs("#monthly-visibility-label");
      if (input) input.value = next;
      if (label) label.textContent = next;
      Admin.qsa("#monthly-visibility-list .select__option").forEach(function (option) {
        option.classList.toggle("is-selected", option.getAttribute("data-value") === next);
      });
    }

    function visibilityValue() {
      var input = Admin.qs("#monthly-visibility");
      return input && input.value ? input.value : "공개";
    }

    function displayValue(value) {
      return filled(value) ? String(value) : "미입력";
    }

    function openPreview() {
      Admin.qs("#monthly-preview-type").textContent = target.typeLabel || "미입력";
      Admin.qs("#monthly-preview-when").textContent = periodLabel() || "미입력";
      Admin.qs("#monthly-preview-title").textContent = displayValue(titleInput.value);
      Admin.qs("#monthly-preview-visibility").textContent = visibilityValue() || "미입력";
      AdminUI.openModal("modal-monthly-preview");
      paintPreviewStage();
    }

    function paintPreviewStage() {
      var stage = Admin.qs("#monthly-preview-stage");
      var tabs = Admin.qs("#monthly-preview-tabs");
      var selected = [];
      if (channelOn("web")) selected.push("web");
      if (channelOn("app")) selected.push("app");
      tabs.hidden = selected.length < 2;
      Admin.qs("#monthly-preview-web").setAttribute("aria-pressed", String(previewChannel === "web"));
      Admin.qs("#monthly-preview-app").setAttribute("aria-pressed", String(previewChannel === "app"));
      stage.replaceChildren();
      if (!selected.length) {
        var emptyChannel = document.createElement("p");
        emptyChannel.className = "monthly-preview__line";
        emptyChannel.textContent = "선택한 노출채널이 없습니다.";
        stage.appendChild(emptyChannel);
        return;
      }
      if (selected.indexOf(previewChannel) < 0) previewChannel = selected[0];
      Admin.qs("#monthly-preview-web").setAttribute("aria-pressed", String(previewChannel === "web"));
      Admin.qs("#monthly-preview-app").setAttribute("aria-pressed", String(previewChannel === "app"));
      var column = document.createElement("div");
      column.className = previewChannel === "app" ? "monthly-preview__app" : "monthly-preview__web";
      var items = galleries[previewChannel];
      if (!items.length) {
        var emptyImages = document.createElement("p");
        emptyImages.className = "monthly-preview__line";
        emptyImages.textContent = "첨부한 이미지가 없습니다.";
        column.appendChild(emptyImages);
      }
      items.forEach(function (item) {
        var image = document.createElement("img");
        image.src = item.url;
        image.alt = item.file.name;
        column.appendChild(image);
      });
      stage.appendChild(column);
    }

    function clearErrors() {
      Admin.qsa(".field-error", form).forEach(function (error) { error.remove(); });
      Admin.qsa(".is-invalid", form).forEach(function (field) { field.classList.remove("is-invalid"); });
    }

    function showFieldError(fieldName, message) {
      var field = titleInput;
      var focusTarget = titleInput;
      var anchor = null;
      if (fieldName === "channel") {
        field = Admin.qs("#monthly-channel-row");
        focusTarget = Admin.qs("#monthly-channel-web");
      } else if (fieldName === "web" || fieldName === "app") {
        field = Admin.qs("#monthly-" + fieldName + "-section");
        anchor = Admin.qs("#monthly-" + fieldName + "-drop");
        focusTarget = Admin.qs("#monthly-" + fieldName + "-input");
      }
      if (!field || field.classList.contains("is-invalid")) return focusTarget;
      field.classList.add("is-invalid");
      var error = document.createElement("p");
      error.className = "field-error";
      error.textContent = message;
      if (anchor) anchor.insertAdjacentElement("afterend", error);
      else field.insertAdjacentElement("afterend", error);
      return focusTarget;
    }

    function formValues() {
      return {
        typeCode: target.typeCode,
        year: target.year,
        month: target.month,
        mode: target.mode,
        title: titleInput.value,
        visibility: visibilityValue(),
        webOn: channelOn("web"),
        appOn: channelOn("app"),
        webCount: galleries.web.length,
        appCount: galleries.app.length
      };
    }

    function submitForm() {
      var values = formValues();
      var screenErrors = validateMonthlyContentForm(values);
      var saveResult = validateMonthlyContentSave(values, validationRows());
      var beforeMonthly = JSON.stringify(records());
      var beforeContents = window.MockData && MockData.contents ? JSON.stringify(MockData.contents) : "";
      clearErrors();

      var focusField = null;
      screenErrors.forEach(function (error) {
        var field = showFieldError(error.field, error.message);
        if (!focusField && field) focusField = field;
      });
      if (saveResult.field) {
        var serverField = showFieldError(saveResult.field, saveResult.message);
        if (!focusField && serverField) focusField = serverField;
      }
      if (focusField && typeof focusField.focus === "function") focusField.focus();
      if (screenErrors.length || !saveResult.ok) {
        if (!saveResult.ok && !saveResult.field && notice) {
          notice.textContent = saveResult.message;
          AdminUI.openModal("modal-monthly-notice");
        }
        return;
      }

      // 검증만 통과했습니다. 월별 콘텐츠, 게시글, localStorage는 바꾸지 않습니다.
      if (notice) {
        notice.textContent = target.mode === "edit"
          ? "서버가 연결되지 않아 콘텐츠를 수정할 수 없습니다."
          : "서버가 연결되지 않아 콘텐츠를 등록할 수 없습니다.";
        AdminUI.openModal("modal-monthly-notice");
      }
      if (JSON.stringify(records()) !== beforeMonthly || (window.MockData && MockData.contents && JSON.stringify(MockData.contents) !== beforeContents)) {
        console.error("월별 콘텐츠 검증 중 저장 데이터가 변경되었습니다.");
      }
    }
  });
})();
