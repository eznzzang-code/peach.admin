/* 보존용 이전 구현. 현재 월별·상시 재배력 화면에서는 resources.js를 사용합니다. 이 파일은 활성 페이지에서 로드하지 않습니다. */
(function () {
  var MONTH_COUNT = 12;

  // 목록의 현재 시각입니다. 서버 연동 시 이 함수만 한국시간(Asia/Seoul) 기준으로 바꿉니다.
  function monthlyContentNow() {
    return new Date();
  }

  function currentYear() {
    return monthlyContentNow().getFullYear();
  }

  function escapeText(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function records() {
    return window.MockData && Array.isArray(MockData.monthlyContents) ? MockData.monthlyContents : [];
  }

  function findRecord(type, year, month) {
    var matched = null;
    records().forEach(function (item) {
      if (matched) return;
      if (item.type === type && Number(item.year) === year && Number(item.month) === month) matched = item;
    });
    return matched;
  }

  function yearOptions(type) {
    var years = {};
    var now = currentYear();
    years[now - 1] = true;
    years[now] = true;
    years[now + 1] = true;
    records().forEach(function (item) {
      if (item.type === type && Number(item.year) > 0) years[Number(item.year)] = true;
    });
    return Object.keys(years).map(Number).sort(function (a, b) { return b - a; });
  }

  Admin.ready(function () {
    var page = Admin.qs(".monthly-content");
    var table = Admin.qs("#monthly-table");
    if (!page || !table) return;

    var type = page.getAttribute("data-monthly-type") || "";
    var yearSelect = Admin.qs("#monthly-year-select");
    var yearList = Admin.qs("#monthly-year-list");
    var yearInput = Admin.qs("#monthly-year");
    var yearLabel = yearSelect ? Admin.qs(".select__label", yearSelect) : null;
    var summary = Admin.qs("#monthly-summary");
    var tbody = Admin.qs("tbody", table);
    var selectedYear = currentYear();
    var requestedYear = Number(new URLSearchParams(window.location.search).get("year"));
    if (yearOptions(type).indexOf(requestedYear) !== -1) selectedYear = requestedYear;

    renderYearOptions();
    render();

    if (yearSelect) {
      yearSelect.addEventListener("select:change", function (event) {
        var next = Number(event.detail && event.detail.value);
        if (!next) return;
        selectedYear = next;
        render();
      });
    }

    function renderYearOptions() {
      if (!yearList) return;
      yearList.innerHTML = yearOptions(type).map(function (year) {
        var selected = year === selectedYear ? " is-selected" : "";
        return '<li><button type="button" class="select__option' + selected + '" data-value="' + year + '">' + year + "년</button></li>";
      }).join("");
      if (yearLabel) yearLabel.textContent = selectedYear + "년";
      if (yearInput) yearInput.value = String(selectedYear);
    }

    function render() {
      var registered = 0;
      var rows = [];
      for (var month = 1; month <= MONTH_COUNT; month += 1) {
        var item = findRecord(type, selectedYear, month);
        if (item) registered += 1;
        rows.push(renderRow(month, item));
      }
      if (tbody) tbody.innerHTML = rows.join("");
      if (summary) {
        summary.textContent = "등록 완료 " + registered + "개월 / 미등록 " + (MONTH_COUNT - registered) + "개월";
      }
    }

    function renderRow(month, item) {
      var title = item && String(item.title || "").trim() ? item.title : "-";
      var updated = item && item.updatedAt ? item.updatedAt : "-";
      var visibility = item ? (item.visibility || "-") : "-";
      var registeredLabel = item ? "등록완료" : "미등록";
      var mode = item ? "edit" : "create";
      var action = item ? "수정" : "등록";
      var typeCode = type === "재배력" ? "cultivation" : "orchard";
      var href = "monthly-content-form.asp?type=" + typeCode + "&year=" + selectedYear + "&month=" + month + "&mode=" + mode;
      var visibilityClass = visibility === "공개" ? " contents-status--live" : (visibility === "비공개" ? " contents-status--private" : "");
      return "<tr>" +
        "<th scope=\"row\">" + month + "월</th>" +
        "<td>" + escapeText(title) + "</td>" +
        "<td><span class=\"contents-status" + (item ? " contents-status--scheduled" : " contents-status--ended") + "\">" + registeredLabel + "</span></td>" +
        "<td>" + (item ? "<span class=\"contents-status" + visibilityClass + "\">" + escapeText(visibility) + "</span>" : "-") + "</td>" +
        "<td>" + escapeText(updated) + "</td>" +
        "<td><a class=\"btn\" href=\"" + href + "\">" + action + "</a></td>" +
        "</tr>";
    }
  });
})();
