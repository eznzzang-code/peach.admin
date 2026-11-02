var AdminUI = (function () {
  var WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
  var openModalId = null;
  var lastFocus = null;

  function qs(selector, root) {
    return Admin.qs(selector, root);
  }

  function qsa(selector, root) {
    return Admin.qsa(selector, root);
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function formatDate(year, month, day) {
    return year + "." + pad(month) + "." + pad(day);
  }

  function parseDate(value) {
    var matched = /^(\d{4})\.(\d{2})\.(\d{2})$/.exec(value || "");
    if (!matched) return null;
    return {
      year: Number(matched[1]),
      month: Number(matched[2]),
      day: Number(matched[3])
    };
  }

  function initTabs(root) {
    qsa("[data-tabs]", root).forEach(function (group) {
      if (group.getAttribute("data-ready") === "true") return;
      group.setAttribute("data-ready", "true");

      group.addEventListener("click", function (event) {
        var tab = event.target.closest(".tabs__item");
        if (!tab || !group.contains(tab)) return;

        qsa(".tabs__item", group).forEach(function (item) {
          var active = item === tab;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-selected", active ? "true" : "false");
          var panelId = item.getAttribute("aria-controls");
          if (!panelId) return;
          var panel = document.getElementById(panelId);
          if (panel) panel.hidden = !active;
        });
      });
    });
  }

  function closeSelect(select) {
    var list = qs(".select__list", select);
    var button = qs(".select__button", select);
    if (!list || !button) return;
    list.hidden = true;
    select.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
  }

  function openSelect(select) {
    qsa(".select.is-open").forEach(function (opened) {
      if (opened !== select) closeSelect(opened);
    });
    closeDatepickers();
    var list = qs(".select__list", select);
    var button = qs(".select__button", select);
    list.hidden = false;
    select.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
  }

  function initSelects(root) {
    qsa("[data-select]", root).forEach(function (select) {
      if (select.getAttribute("data-ready") === "true") return;
      select.setAttribute("data-ready", "true");

      var button = qs(".select__button", select);
      var label = qs(".select__label", select);
      var list = qs(".select__list", select);
      var hidden = qs("input[type='hidden']", select);
      if (!button || !list) return;

      button.addEventListener("click", function () {
        if (button.disabled) return;
        if (select.classList.contains("is-open")) closeSelect(select);
        else openSelect(select);
      });

      list.addEventListener("click", function (event) {
        var option = event.target.closest(".select__option");
        if (!option) return;
        qsa(".select__option", list).forEach(function (item) {
          item.classList.toggle("is-selected", item === option);
        });
        label.textContent = option.textContent;
        if (hidden) hidden.value = option.getAttribute("data-value") || "";
        closeSelect(select);
        select.dispatchEvent(new CustomEvent("select:change", {
          bubbles: true,
          detail: {
            value: hidden ? hidden.value : "",
            label: option.textContent
          }
        }));
      });
    });
  }

  function closeDatepickers(except) {
    qsa(".datepicker.is-open").forEach(function (picker) {
      if (picker === except) return;
      var popup = qs(".datepicker__popup", picker);
      if (popup) popup.hidden = true;
      picker.classList.remove("is-open");
    });
  }

  function renderCalendar(picker) {
    var popup = qs(".datepicker__popup", picker);
    var input = qs(".datepicker__input", picker);
    var viewYear = Number(picker.getAttribute("data-year"));
    var viewMonth = Number(picker.getAttribute("data-month"));
    var selected = parseDate(input.value);
    var today = new Date();
    var firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
    var lastDate = new Date(viewYear, viewMonth, 0).getDate();
    var html = "";

    html += '<div class="datepicker__header">';
    html += '<button type="button" class="datepicker__nav" data-move="-1" aria-label="이전 달">‹</button>';
    html += '<span class="datepicker__title">' + viewYear + "." + pad(viewMonth) + "</span>";
    html += '<button type="button" class="datepicker__nav" data-move="1" aria-label="다음 달">›</button>';
    html += "</div>";
    html += '<div class="datepicker__grid">';
    WEEKDAYS.forEach(function (name) {
      html += '<span class="datepicker__dow">' + name + "</span>";
    });
    for (var blank = 0; blank < firstDay; blank += 1) {
      html += '<span></span>';
    }
    var minDate = parseDate(picker.getAttribute("data-min") || "");
    var maxDate = parseDate(picker.getAttribute("data-max") || "");
    for (var day = 1; day <= lastDate; day += 1) {
      var classes = "datepicker__day";
      var isSelected = selected && selected.year === viewYear && selected.month === viewMonth && selected.day === day;
      var isToday = today.getFullYear() === viewYear && today.getMonth() + 1 === viewMonth && today.getDate() === day;
      var blocked = isDateBlocked(viewYear, viewMonth, day, minDate, maxDate);
      if (isSelected) classes += " is-selected";
      if (isToday) classes += " is-today";
      html += '<button type="button" class="' + classes + '" data-day="' + day + '"' + (blocked ? " disabled" : "") + ">" + day + "</button>";
    }
    html += "</div>";
    var todayBlocked = isDateBlocked(today.getFullYear(), today.getMonth() + 1, today.getDate(), minDate, maxDate);
    html += '<div class="datepicker__footer">';
    html += '<button type="button" class="datepicker__today" data-today' + (todayBlocked ? " disabled" : "") + ">오늘</button>";
    html += "</div>";
    popup.innerHTML = html;
  }

  function isDateBlocked(year, month, day, minDate, maxDate) {
    var current = new Date(year, month - 1, day);
    if (minDate && current < new Date(minDate.year, minDate.month - 1, minDate.day)) return true;
    if (maxDate && current > new Date(maxDate.year, maxDate.month - 1, maxDate.day)) return true;
    return false;
  }

  function initDatePickers(root) {
    qsa("[data-datepicker]", root).forEach(function (picker) {
      if (picker.getAttribute("data-ready") === "true") return;
      picker.setAttribute("data-ready", "true");

      var input = qs(".datepicker__input", picker);
      var popup = document.createElement("div");
      popup.className = "datepicker__popup";
      popup.hidden = true;
      picker.appendChild(popup);

      var initial = parseDate(input.value) || {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
      };
      picker.setAttribute("data-year", String(initial.year));
      picker.setAttribute("data-month", String(initial.month));

      function open() {
        if (input.disabled || picker.classList.contains("is-disabled")) return;
        qsa(".select.is-open").forEach(closeSelect);
        closeDatepickers(picker);
        var current = parseDate(input.value);
        if (current) {
          picker.setAttribute("data-year", String(current.year));
          picker.setAttribute("data-month", String(current.month));
        }
        renderCalendar(picker);
        popup.hidden = false;
        popup.style.top = "";
        popup.style.bottom = "";
        picker.classList.add("is-open");
        if (popup.getBoundingClientRect().bottom > window.innerHeight - 12) {
          popup.style.top = "auto";
          popup.style.bottom = "calc(100% + 4px)";
        }
      }

      input.addEventListener("click", open);
      input.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });

      popup.addEventListener("click", function (event) {
        event.stopPropagation();
        var move = event.target.closest("[data-move]");
        if (move) {
          var year = Number(picker.getAttribute("data-year"));
          var month = Number(picker.getAttribute("data-month")) + Number(move.getAttribute("data-move"));
          if (month < 1) {
            month = 12;
            year -= 1;
          }
          if (month > 12) {
            month = 1;
            year += 1;
          }
          picker.setAttribute("data-year", String(year));
          picker.setAttribute("data-month", String(month));
          renderCalendar(picker);
          return;
        }

        var todayButton = event.target.closest("[data-today]");
        if (todayButton) {
          if (todayButton.disabled) return;
          var now = new Date();
          input.value = formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
          popup.hidden = true;
          picker.classList.remove("is-open");
          input.dispatchEvent(new Event("change", { bubbles: true }));
          return;
        }

        var dayButton = event.target.closest("[data-day]");
        if (!dayButton || dayButton.disabled) return;
        var pickedYear = Number(picker.getAttribute("data-year"));
        var pickedMonth = Number(picker.getAttribute("data-month"));
        input.value = formatDate(pickedYear, pickedMonth, Number(dayButton.getAttribute("data-day")));
        popup.hidden = true;
        picker.classList.remove("is-open");
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
  }

  function initUploads(root) {
    qsa("[data-upload]", root).forEach(function (zone) {
      if (zone.getAttribute("data-ready") === "true") return;
      zone.setAttribute("data-ready", "true");

      var input = qs(".upload__input", zone);
      var nameEl = qs(".upload__name", zone);
      if (!input) return;

      function showFiles(files) {
        if (!nameEl) return;
        if (!files || !files.length) {
          nameEl.textContent = "";
          return;
        }
        nameEl.textContent = Array.prototype.map.call(files, function (file) {
          return file.name;
        }).join(", ");
        // TODO: 파일 업로드 API 연동
      }

      zone.addEventListener("click", function (event) {
        if (event.target === input || event.target.closest(".upload__pick") || event.target.closest(".upload__remove")) return;
        input.click();
      });

      qsa(".upload__pick", zone).forEach(function (pick) {
        pick.addEventListener("click", function (event) {
          event.preventDefault();
          event.stopPropagation();
          input.click();
        });
      });

      input.addEventListener("change", function () {
        showFiles(input.files);
      });

      zone.addEventListener("dragover", function (event) {
        event.preventDefault();
        zone.classList.add("is-dragover");
      });

      zone.addEventListener("dragleave", function () {
        zone.classList.remove("is-dragover");
      });

      zone.addEventListener("drop", function (event) {
        event.preventDefault();
        zone.classList.remove("is-dragover");
        if (!event.dataTransfer || !event.dataTransfer.files.length) return;
        input.files = event.dataTransfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
  }

  function syncCheckAll(table) {
    var master = qs("[data-check-all]", table);
    if (!master) return;
    var boxes = qsa("tbody .checkbox input[type='checkbox']", table);
    var checked = boxes.filter(function (box) { return box.checked; });
    master.checked = boxes.length > 0 && checked.length === boxes.length;
    master.indeterminate = checked.length > 0 && checked.length < boxes.length;
  }

  function initTables(root) {
    qsa(".table", root).forEach(function (table) {
      if (table.getAttribute("data-ready") === "true") return;
      table.setAttribute("data-ready", "true");

      table.addEventListener("change", function (event) {
        var input = event.target;
        if (!input.matches("input[type='checkbox']")) return;
        if (input.hasAttribute("data-check-all")) {
          qsa("tbody .checkbox input[type='checkbox']", table).forEach(function (box) {
            if (!box.disabled) box.checked = input.checked;
          });
        }
        syncCheckAll(table);
      });
    });
  }

  function renderPagination(nav) {
    var current = Number(nav.getAttribute("data-current") || 1);
    var total = Number(nav.getAttribute("data-total") || 1);
    nav.innerHTML = "";

    function addButton(label, page, type) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = type === "page" ? "pagination__page" : "pagination__ctrl";
      button.textContent = label;
      if (type === "page" && page === current) {
        button.classList.add("is-active");
        button.setAttribute("aria-current", "page");
      }
      var controlLabel = {
        first: "처음 페이지",
        prev: "이전 페이지",
        next: "다음 페이지",
        last: "마지막 페이지"
      };
      if (controlLabel[type]) button.setAttribute("aria-label", controlLabel[type]);
      button.addEventListener("click", function () {
        if (page < 1 || page > total || page === current) return;
        nav.setAttribute("data-current", String(page));
        renderPagination(nav);
        nav.dispatchEvent(new CustomEvent("pagination:change", {
          bubbles: true,
          detail: { page: page, total: total }
        }));
      });
      nav.appendChild(button);
    }

    addButton("«", 1, "first");
    addButton("‹", current - 1, "prev");
    for (var page = 1; page <= total; page += 1) addButton(String(page), page, "page");
    addButton("›", current + 1, "next");
    addButton("»", total, "last");
  }

  function initPagination(root) {
    qsa("[data-pagination]", root).forEach(function (nav) {
      if (nav.getAttribute("data-ready") === "true") return;
      nav.setAttribute("data-ready", "true");
      renderPagination(nav);
    });
  }

  function getFocusable(dialog) {
    return qsa("button, [href], input, select, textarea, [tabindex]", dialog).filter(function (el) {
      return !el.disabled && el.getAttribute("tabindex") !== "-1" && !el.hidden;
    });
  }

  function openModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    if (openModalId) closeModal(openModalId);
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("is-modal-open");
    openModalId = id;
    var dialog = qs(".modal__dialog", modal);
    var focusable = getFocusable(dialog);
    if (focusable.length) focusable[0].focus();
  }

  function closeModal(id) {
    var modal = document.getElementById(id || openModalId);
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("is-modal-open");
    openModalId = null;
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function initModals() {
    document.addEventListener("click", function (event) {
      var opener = event.target.closest("[data-modal-open]");
      if (opener) {
        event.preventDefault();
        openModal(opener.getAttribute("data-modal-open"));
        return;
      }
      var closer = event.target.closest("[data-modal-close]");
      if (closer) {
        var modal = closer.closest(".modal");
        if (modal) closeModal(modal.id);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (!openModalId) return;
      if (event.key === "Escape") {
        closeModal(openModalId);
        return;
      }
      if (event.key !== "Tab") return;
      var modal = document.getElementById(openModalId);
      var dialog = qs(".modal__dialog", modal);
      var focusable = getFocusable(dialog);
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  function initToggleDisable(root) {
    qsa("[data-toggle-disable]", root).forEach(function (box) {
      if (box.getAttribute("data-ready") === "true") return;
      box.setAttribute("data-ready", "true");
      var target = document.getElementById(box.getAttribute("data-toggle-disable"));
      if (!target) return;

      function sync() {
        target.disabled = box.checked;
        var picker = target.closest(".datepicker");
        if (picker) picker.classList.toggle("is-disabled", box.checked);
      }

      box.addEventListener("change", sync);
      sync();
    });
  }

  function initDocumentEvents() {
    document.addEventListener("click", function (event) {
      qsa(".select.is-open").forEach(function (select) {
        if (!select.contains(event.target)) closeSelect(select);
      });
      qsa(".datepicker.is-open").forEach(function (picker) {
        if (!picker.contains(event.target)) closeDatepickers();
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || openModalId) return;
      qsa(".select.is-open").forEach(closeSelect);
      closeDatepickers();
    });
  }

  function initRequireCheck(root) {
    qsa("[data-require-check]", root).forEach(function (button) {
      if (button.getAttribute("data-ready") === "true") return;
      button.setAttribute("data-ready", "true");
      var table = document.querySelector(button.getAttribute("data-require-check"));
      if (!table) return;

      function sync() {
        button.disabled = qsa("tbody input[type='checkbox']:checked", table).length === 0;
      }

      table.addEventListener("change", sync);
      sync();
    });
  }

  function init(root) {
    var scope = root || document;
    initTabs(scope);
    initSelects(scope);
    initDatePickers(scope);
    initUploads(scope);
    initTables(scope);
    initPagination(scope);
    initToggleDisable(scope);
    initRequireCheck(scope);
  }

  Admin.ready(function () {
    init(document);
    initModals();
    initDocumentEvents();
  });

  return {
    init: init,
    openModal: openModal,
    closeModal: closeModal,
    refreshPagination: renderPagination
  };
})();
