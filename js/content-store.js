var ContentStore = (function () {
  function startOfToday() {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function parseDate(value) {
    if (!value) return null;
    var parts = String(value).split(".");
    if (parts.length < 3) return null;
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  // 시연 저장소 용량을 넘지 않도록 이 크기 이하의 대표 이미지만 data URL로 보관합니다.
  var IMAGE_DATA_LIMIT = 200 * 1024;

  function fileRecord(file, keepData) {
    if (!file || !file.name) return null;
    var record = {
      name: String(file.name),
      type: file.type || "",
      size: Number(file.size) || 0,
      resourceKey: file.resourceKey || ""
    };
    if (keepData && file.dataUrl && record.size <= IMAGE_DATA_LIMIT) {
      record.dataUrl = file.dataUrl;
    }
    return record;
  }

  // 기존 단건 attachment는 그대로 읽고, 여러 파일은 attachments에 같은 메타 형식으로 보관합니다.
  function attachmentList(raw) {
    var source = Array.isArray(raw.attachments) ? raw.attachments : (raw.attachment ? [raw.attachment] : []);
    return source.map(function (file) {
      return fileRecord(file, false);
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
      channels: raw.channels ? raw.channels.slice() : [],
      author: raw.author || "",
      registeredAt: raw.registeredAt || raw.updatedAt || "",
      updatedAt: raw.updatedAt || raw.registeredAt || "",
      isDraft: isDraft,
      visibility: visibility,
      publishStart: publishStart,
      publishEnd: publishEnd,
      noEnd: noEnd,
      urgentUse: raw.urgentUse === true,
      // 공지 상단 고정. 필드가 없는 기존 글은 고정 해제입니다. 목록 노출은 게시중일 때만 적용합니다.
      pinned: raw.pinned === true,
      urgentOrder: Math.max(1, Math.floor(Number(raw.urgentOrder)||1)),
      urgentStart: raw.urgentStart || "",
      urgentEnd: raw.urgentEnd || "",
      image: fileRecord(raw.image, true),
      attachment: attachments[0] || null,
      attachments: attachments,
      editorFontSize: raw.editorFontSize || "",
      editorLineHeight: raw.editorLineHeight || ""
    };
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

  var STORAGE_KEY = "peach-admin-demo-contents";
  var SHOWCASE_VERSION = "1";
  var SHOWCASE_VERSION_KEY = STORAGE_KEY + "-showcase";
  // 처음 시연 데이터가 저장된 수정일입니다. 이 날짜가 그대로인 글만 목록 예시로 맞춥니다.
  var ORIGINAL_UPDATED_AT = {
    "2026.10.07": true,
    "2026.09.20": true,
    "2026.08.12": true,
    "2026.06.03": true
  };
  var storageProblem = "";

  function seed() {
    return MockData.contents.map(normalize);
  }

  function showcasePending() {
    try {
      return localStorage.getItem(SHOWCASE_VERSION_KEY) !== SHOWCASE_VERSION;
    } catch (error) {
      return false;
    }
  }

  function markShowcase() {
    try {
      localStorage.setItem(SHOWCASE_VERSION_KEY, SHOWCASE_VERSION);
    } catch (error) {
      storageProblem = "write";
    }
  }

  // 이미 브라우저에 저장된 시연 글 중, 운영자가 수정하지 않은 글만 목록 예시로 맞춥니다.
  function applyShowcase(items) {
    var demos = seed();
    var byId = {};
    items.forEach(function (item) {
      byId[String(item.id)] = item;
    });
    demos.forEach(function (demo) {
      var current = byId[String(demo.id)];
      if (!current) {
        if (Number(demo.id) > 50) items.push(demo);
        return;
      }
      if (current.title !== demo.title) return;
      if (!ORIGINAL_UPDATED_AT[current.updatedAt]) return;
      current.channels = demo.channels.slice();
      current.isDraft = demo.isDraft;
      current.visibility = demo.visibility;
      current.publishStart = demo.publishStart;
      current.publishEnd = demo.publishEnd;
      current.noEnd = demo.noEnd;
      current.urgentUse = demo.urgentUse;
      current.urgentStart = demo.urgentStart;
      current.urgentEnd = demo.urgentEnd;
      current.pinned = demo.pinned === true;
      current.updatedAt = demo.updatedAt;
    });
    return items;
  }

  function isRecord(item) {
    return !!item && typeof item === "object" && !Array.isArray(item);
  }

  // 대시보드 등 조회 전용 화면용입니다. 시드 복사와 registeredAt 보정을 저장하지 않습니다.
  function peek() {
    storageProblem = "";
    var saved;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      storageProblem = "parse";
      return [];
    }
    if (saved == null) return seed();
    try {
      var parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.some(function (item) { return !isRecord(item); })) {
        storageProblem = "format";
        return [];
      }
      var peeked = parsed.map(normalize);
      return showcasePending() ? applyShowcase(peeked) : peeked;
    } catch (error) {
      storageProblem = "parse";
      return [];
    }
  }

  function read() {
    storageProblem = "";
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved == null) {
      var initial = seed();
      // TODO: 콘텐츠 목록 조회 API 연동. localStorage 저장은 시연용입니다.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      markShowcase();
      return initial;
    }
    try {
      var parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.some(function (item) { return !isRecord(item); })) {
        storageProblem = "format";
        return [];
      }
      var items = parsed.map(normalize);
      var showcase = showcasePending();
      if (showcase) applyShowcase(items);
      var needsRegisteredAt = parsed.some(function (item) {
        return !item.registeredAt;
      });
      if (showcase || needsRegisteredAt) write(items);
      if (showcase && !storageProblem) markShowcase();
      return items;
    } catch (error) {
      storageProblem = "parse";
      return [];
    }
  }

  function write(items) {
    // TODO: 콘텐츠 저장 API 연동. localStorage 저장은 시연용입니다.
    if (storageProblem) return false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      return true;
    } catch(error) {
      storageProblem = "write";
      return false;
    }
  }

  function problemMessage(code) {
    if (code === "write") return "게시물을 저장하지 못했습니다. 브라우저 저장 공간과 권한을 확인해 주세요. 기존 게시물과 입력 내용은 유지됩니다.";
    if (code === "parse") return "시연 데이터를 읽을 수 없습니다. 저장된 데이터는 변경하지 않았으며, 자동으로 초기화하지 않습니다.";
    if (code === "format") return "시연 데이터 형식이 올바르지 않습니다. 저장된 데이터는 변경하지 않았으며, 자동으로 초기화하지 않습니다.";
    return "";
  }

  function formatToday() {
    var now = new Date();
    var month = now.getMonth() + 1;
    var date = now.getDate();
    return now.getFullYear() + "." + (month < 10 ? "0" : "") + month + "." + (date < 10 ? "0" : "") + date;
  }

  function nextId(items) {
    var max = 0;
    items.forEach(function (item) {
      var id = Number(item.id);
      if (id > max) max = id;
    });
    return max + 1;
  }

  return {
    storageKey: STORAGE_KEY,
    imageDataLimit: IMAGE_DATA_LIMIT,
    problem: function () {
      return storageProblem;
    },
    problemMessage: function () {
      return problemMessage(storageProblem);
    },
    // 복구·초기화는 운영자 확인 없이 진행하지 않습니다. 이 단계에서는 확인 후에도 저장값을 지우지 않습니다.
    confirmReset: function (confirmed) {
      if (confirmed !== true) return false;
      return false;
    },
    list: read,
    peek: peek,
    statusOf: statusOf,
    urgentActive: urgentActive,
    add: function (input) {
      // TODO: 콘텐츠 등록·임시저장 API 연동. localStorage 저장은 시연용입니다.
      var items = read();
      if (storageProblem) return null;
      var today = formatToday();
      var record = normalize({
        id: nextId(items),
        category: input.category,
        title: input.title,
        body: input.body,
        relatedTarget: input.relatedTarget,
        channels: input.channels,
        author: (MockData.currentUser && MockData.currentUser.name) || "",
        registeredAt: today,
        updatedAt: today,
        isDraft: input.isDraft === true,
        visibility: input.visibility,
        publishStart: input.publishStart,
        publishEnd: input.publishEnd,
        noEnd: input.noEnd,
        urgentUse: input.urgentUse,
        pinned: input.category === "공지" && input.pinned === true,
        urgentOrder: input.urgentOrder,
        urgentStart: input.urgentStart,
        urgentEnd: input.urgentEnd,
        image: input.image,
        attachment: input.attachment,
        attachments: input.attachments,
        editorFontSize: input.editorFontSize,
        editorLineHeight: input.editorLineHeight
      });
      items.push(record);
      if (!write(items)) return null;
      return record;
    },
    get: function (id) {
      if (id == null || id === "") return null;
      var found = null;
      read().some(function (item) {
        if (String(item.id) !== String(id)) return false;
        found = item;
        return true;
      });
      return found;
    },
    update: function (id, input) {
      // TODO: 콘텐츠 수정 API 연동. localStorage 수정은 시연용입니다.
      var items = read();
      if (storageProblem) return null;
      var index = -1;
      items.forEach(function (item, itemIndex) {
        if (String(item.id) === String(id)) index = itemIndex;
      });
      if (index < 0) return null;
      var current = items[index];
      var record = normalize({
        id: current.id,
        category: input.category,
        title: input.title,
        body: input.body,
        relatedTarget: input.relatedTarget,
        channels: input.channels,
        author: current.author,
        registeredAt: current.registeredAt,
        updatedAt: formatToday(),
        isDraft: input.isDraft === true,
        visibility: input.visibility,
        publishStart: input.publishStart,
        publishEnd: input.publishEnd,
        noEnd: input.noEnd,
        urgentUse: input.urgentUse,
        pinned: input.category === "공지" && input.pinned === true,
        urgentOrder: input.urgentOrder,
        urgentStart: input.urgentStart,
        urgentEnd: input.urgentEnd,
        image: input.image,
        attachment: input.attachment,
        attachments: input.attachments,
        editorFontSize: input.editorFontSize,
        editorLineHeight: input.editorLineHeight
      });
      items[index] = record;
      if (!write(items)) return null;
      return record;
    },
    remove: function (ids) {
      // TODO: 콘텐츠 삭제 API 연동. localStorage 삭제는 시연용입니다.
      var removeSet = {};
      ids.forEach(function (id) {
        removeSet[String(id)] = true;
      });
      var items = read();
      if (storageProblem) return null;
      var next = items.filter(function (item) {
        return !removeSet[String(item.id)];
      });
      if (!write(next)) return null;
      return next;
    }
  };
})();
