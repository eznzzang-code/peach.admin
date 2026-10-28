/**
 * ContentStore - MSSQL Stored Procedure AJAX API 연동 모듈
 * 백엔드 엔드포인트: /proc/board_proc.asp
 */
var ContentStore = (function () {
  var API_URL = "proc/board_proc.asp";
  var cachedItems = null;
  var storageProblem = "";

  function parseDate(value) {
    if (!value) return null;
    var parts = String(value).split(".");
    if (parts.length < 3) return null;
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function dateOnly(value) {
    var day = value instanceof Date && !isNaN(value.getTime()) ? value : new Date();
    return new Date(day.getFullYear(), day.getMonth(), day.getDate());
  }

  function includesDay(day, startValue, endValue, openEnded) {
    var start = parseDate(startValue);
    if (!start || day < start) return false;
    if (openEnded) return true;
    var end = parseDate(endValue);
    if (!end || day > end) return false;
    return true;
  }

  function statusOf(item, today) {
    var day = dateOnly(today);
    if (item.isDraft) return "임시저장";
    if (item.visibility !== "public") return "비공개";

    var start = parseDate(item.publishStart);
    var end = item.noEnd ? null : parseDate(item.publishEnd);
    if (start && day < start) return "게시예정";
    if (end && day > end) return "게시종료";
    return "게시중";
  }

  function urgentActive(item, today) {
    var day = dateOnly(today);
    if (!item || item.isDraft || item.visibility !== "public" || item.urgentUse !== true) return false;
    if (!includesDay(day, item.publishStart, item.publishEnd, item.noEnd === true)) return false;
    return includesDay(day, item.urgentStart, item.urgentEnd, false);
  }

  function fileRecord(file) {
    if (!file || !file.name) return null;
    return {
      name: String(file.name),
      type: file.type || "",
      size: Number(file.size) || 0,
      resourceKey: file.resourceKey || ""
    };
  }

  function attachmentList(raw) {
    var source = Array.isArray(raw.attachments) ? raw.attachments : (raw.attachment ? [raw.attachment] : []);
    return source.map(function (file) {
      return fileRecord(file);
    }).filter(Boolean);
  }

  function normalize(raw) {
    var isDraft = raw.isDraft != null ? raw.isDraft === true : raw.status === "임시저장";
    var visibility = raw.visibility || (raw.status === "비공개" ? "private" : "public");
    var publishEnd = raw.publishEnd != null ? raw.publishEnd : "";
    var noEnd = raw.noEnd != null ? raw.noEnd === true : !publishEnd;
    var publishStart = raw.publishStart != null ? raw.publishStart : (raw.updatedAt || "");
    var attachments = attachmentList(raw);

    return {
      id: raw.id,
      category: raw.category || "",
      title: raw.title || "",
      body: raw.body || "",
      relatedTarget: raw.relatedTarget || null,
      channels: raw.channels ? raw.channels.slice() : ["Web", "App"],
      author: raw.author || "정유현",
      registeredAt: raw.registeredAt || raw.updatedAt || "",
      updatedAt: raw.updatedAt || raw.registeredAt || "",
      isDraft: isDraft,
      visibility: visibility,
      publishStart: publishStart,
      publishEnd: publishEnd,
      noEnd: noEnd,
      urgentUse: raw.urgentUse === true,
      pinned: raw.pinned === true,
      urgentOrder: Math.max(1, Math.floor(Number(raw.urgentOrder) || 1)),
      urgentStart: raw.urgentStart || "",
      urgentEnd: raw.urgentEnd || "",
      image: null,
      attachment: attachments[0] || null,
      attachments: attachments,
      editorFontSize: raw.editorFontSize || "",
      editorLineHeight: raw.editorLineHeight || ""
    };
  }

  // 동기식/비동기식 AJAX 유틸
  function ajaxRequest(method, url, data, isAsync, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, !!isAsync);
    if (!(data instanceof FormData) && method === "POST") {
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
    }
    if (isAsync) {
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              var json = JSON.parse(xhr.responseText);
              if (callback) callback(null, json);
            } catch (err) {
              if (callback) callback(err, null);
            }
          } else {
            if (callback) callback(new Error("HTTP " + xhr.status), null);
          }
        }
      };
      xhr.send(data);
    } else {
      try {
        xhr.send(data);
        if (xhr.status === 200) {
          return JSON.parse(xhr.responseText);
        }
      } catch (e) {
        console.error("AJAX Error:", e);
      }
      return null;
    }
  }

  function fetchDBListSync() {
    var res = ajaxRequest("GET", API_URL + "?action=list", null, false);
    if (res && res.success && Array.isArray(res.items)) {
      cachedItems = res.items.map(normalize);
      return cachedItems;
    }
    return [];
  }

  function read() {
    if (cachedItems != null) return cachedItems;
    return fetchDBListSync();
  }

  function formatToday() {
    var now = new Date();
    var m = now.getMonth() + 1;
    var d = now.getDate();
    return now.getFullYear() + "." + (m < 10 ? "0" : "") + m + "." + (d < 10 ? "0" : "") + d;
  }

  return {
    storageKey: "peach-db-mode",
    imageDataLimit: 200 * 1024,
    problem: function () { return storageProblem; },
    problemMessage: function () { return ""; },
    statusOf: statusOf,
    urgentActive: urgentActive,
    list: read,
    peek: read,

    // DB 데이터 강제 리로드
    reload: function (callback) {
      ajaxRequest("GET", API_URL + "?action=list", null, true, function (err, res) {
        if (!err && res && res.success && Array.isArray(res.items)) {
          cachedItems = res.items.map(normalize);
        }
        if (callback) callback(cachedItems);
      });
    },

    // 등록 (INSERT) -> USP_ADMIN_BOARD_SAVE
    add: function (input) {
      var formData = new FormData();
      formData.append("action", "save");
      formData.append("id", "0");
      formData.append("category", input.category || "");
      formData.append("title", input.title || "");
      formData.append("body", input.body || "");
      formData.append("visibility", input.visibility || "public");
      formData.append("isDraft", input.isDraft ? "true" : "false");
      formData.append("pinned", (input.category === "공지" && input.pinned) ? "true" : "false");
      formData.append("channels", (input.channels || []).join(","));
      formData.append("publishStart", input.publishStart || formatToday());
      formData.append("publishEnd", input.publishEnd || "");
      formData.append("noEnd", input.noEnd ? "true" : "false");
      formData.append("urgentUse", input.urgentUse ? "true" : "false");
      formData.append("urgentStart", input.urgentStart || "");
      formData.append("urgentEnd", input.urgentEnd || "");
      if (input.relatedTarget) {
        formData.append("relatedType", input.relatedTarget.type || "");
        formData.append("relatedTarget", input.relatedTarget.id || "");
      }
      formData.append("author", (MockData.currentUser && MockData.currentUser.name) || "정유현");

      var res = ajaxRequest("POST", API_URL, formData, false);
      if (res && res.success) {
        var newId = res.id;
        var record = normalize(Object.assign({}, input, {
          id: newId,
          registeredAt: formatToday(),
          updatedAt: formatToday()
        }));
        if (!cachedItems) cachedItems = [];
        cachedItems.unshift(record);
        return record;
      }
      return null;
    },

    // 단건 조회 -> USP_ADMIN_BOARD_GET
    get: function (id) {
      if (!id) return null;
      // DB 단건 조회 (본문 및 첨부파일 포함)
      var res = ajaxRequest("GET", API_URL + "?action=get&id=" + encodeURIComponent(id), null, false);
      if (res && res.success && res.item) {
        var item = normalize(res.item);
        if (res.attachments) item.attachments = res.attachments;
        return item;
      }
      var found = null;
      read().some(function (item) {
        if (String(item.id) === String(id)) {
          found = item;
          return true;
        }
      });
      return found;
    },

    // 수정 (UPDATE) -> USP_ADMIN_BOARD_SAVE
    update: function (id, input) {
      var formData = new FormData();
      formData.append("action", "save");
      formData.append("id", String(id));
      formData.append("category", input.category || "");
      formData.append("title", input.title || "");
      formData.append("body", input.body || "");
      formData.append("visibility", input.visibility || "public");
      formData.append("isDraft", input.isDraft ? "true" : "false");
      formData.append("pinned", (input.category === "공지" && input.pinned) ? "true" : "false");
      formData.append("channels", (input.channels || []).join(","));
      formData.append("publishStart", input.publishStart || formatToday());
      formData.append("publishEnd", input.publishEnd || "");
      formData.append("noEnd", input.noEnd ? "true" : "false");
      formData.append("urgentUse", input.urgentUse ? "true" : "false");
      formData.append("urgentStart", input.urgentStart || "");
      formData.append("urgentEnd", input.urgentEnd || "");
      if (input.relatedTarget) {
        formData.append("relatedType", input.relatedTarget.type || "");
        formData.append("relatedTarget", input.relatedTarget.id || "");
      }
      formData.append("author", (MockData.currentUser && MockData.currentUser.name) || "정유현");

      var res = ajaxRequest("POST", API_URL, formData, false);
      if (res && res.success) {
        var record = normalize(Object.assign({}, input, {
          id: id,
          updatedAt: formatToday()
        }));
        if (cachedItems) {
          cachedItems.forEach(function (item, idx) {
            if (String(item.id) === String(id)) {
              cachedItems[idx] = record;
            }
          });
        }
        return record;
      }
      return null;
    },

    // 삭제 (DELETE) -> USP_ADMIN_BOARD_DELETE
    remove: function (ids) {
      if (!ids || !ids.length) return null;
      var formData = new FormData();
      formData.append("action", "delete");
      formData.append("ids", ids.join(","));

      var res = ajaxRequest("POST", API_URL, formData, false);
      if (res && res.success) {
        var removeSet = {};
        ids.forEach(function (id) { removeSet[String(id)] = true; });
        if (cachedItems) {
          cachedItems = cachedItems.filter(function (item) {
            return !removeSet[String(item.id)];
          });
        }
        return cachedItems || [];
      }
      return null;
    }
  };
})();
