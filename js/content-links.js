/* 연결 자료는 기존 relatedTarget 한 건을 유지합니다. 발송·수신 대상 정책과 분리합니다. */
window.previewPostAttachment = function (root) {
  root.textContent = "첨부 자료를 준비하고 있습니다.";
};

Admin.ready(async function () {
  var form = document.querySelector("#contents-title") && document.querySelector("#contents-title").closest("form");
  var kindInput = document.getElementById("contents-related-kind");
  var targetInput = document.getElementById("contents-related-target");
  var targetList = document.getElementById("contents-related-target-list");
  var targetButton = document.getElementById("contents-related-target-button");
  var targetLabel = document.getElementById("contents-related-target-label");
  var kindLabel = document.getElementById("contents-related-type-label");
  var kindList = document.getElementById("contents-related-type-list");
  var boardSelect = document.getElementById("contents-related-board") && document.getElementById("contents-related-board").closest(".select");
  var boardInput = document.getElementById("contents-related-board");
  var boardButton = document.getElementById("contents-related-board-button");
  var boardLabel = document.getElementById("contents-related-board-label");
  var boardList = document.getElementById("contents-related-board-list");
  var guide = document.getElementById("contents-related-guide");
  if (!form || !kindInput || !targetInput || !targetList || !targetButton) return;

  var current = new URLSearchParams(location.search).get("id");
  var editing = null;
  if (current) {
    try {
      var editRes = await fetch("proc/board_proc.asp?action=get&id=" + encodeURIComponent(current));
      var editJson = await editRes.json();
      if (editJson && editJson.success && editJson.item) {
        editing = editJson.item;
      }
    } catch (e) {
      if (window.ContentStore) editing = ContentStore.get(current);
    }
  }
  var kindLabels = {
    "": "자료 유형",
    video: "영상",
    post: "게시글",
    orchard: "월별 과원관리",
    calendar: "상시 재배력"
  };
  var boardLabels = {
    "공지": "공지사항",
    "복숭아정보": "복숭아정보",
    "재배자료": "재배자료"
  };

  function sameTarget(left, right) {
    if (!left || !right) return false;
    var lKind = left.kind || left.type;
    var rKind = right.kind || right.type;
    if (lKind !== rKind) return false;
    if (lKind === "video" || lKind === "post") {
      return String(left.id || "") === String(right.id || "");
    }
    if (lKind === "orchard") {
      var lY = left.year || (left.id && left.id.indexOf(":") > -1 ? left.id.split(":")[0] : "");
      var lM = left.month || (left.id && left.id.indexOf(":") > -1 ? left.id.split(":")[1] : "");
      var rY = right.year || (right.id && right.id.indexOf(":") > -1 ? right.id.split(":")[0] : "");
      var rM = right.month || (right.id && right.id.indexOf(":") > -1 ? right.id.split(":")[1] : "");
      return Number(lY) === Number(rY) && Number(lM) === Number(rM);
    }
    if (lKind === "calendar") return true;
    return JSON.stringify(left) === JSON.stringify(right);
  }

  function knownKind(target) {
    if (!target) return "";
    var k = target.kind || target.type;
    if (!k || !kindLabels[k]) return "";
    return k;
  }

  function setKind(kind) {
    kindInput.value = kind || "";
    if (kindLabel) kindLabel.textContent = kindLabels[kind] || "자료 유형";
    if (!kindList) return;
    Array.prototype.forEach.call(kindList.querySelectorAll(".select__option"), function (option) {
      option.classList.toggle("is-selected", (option.getAttribute("data-value") || "") === kindInput.value);
    });
  }

  function addOption(label, value) {
    var item = document.createElement("li");
    var option = document.createElement("button");
    option.type = "button";
    option.className = "select__option";
    option.textContent = label;
    option.setAttribute("data-value", value || "");
    item.appendChild(option);
    targetList.appendChild(item);
    return option;
  }

  function selectTarget(value, label) {
    targetInput.value = value || "";
    if (targetLabel) targetLabel.textContent = label || "연결 대상";
    Array.prototype.forEach.call(targetList.querySelectorAll(".select__option"), function (option) {
      option.classList.toggle("is-selected", (option.getAttribute("data-value") || "") === targetInput.value);
    });
  }

  function setBoard(board) {
    if (boardInput) boardInput.value = board || "";
    if (boardLabel) boardLabel.textContent = boardLabels[board] || "게시판";
    if (!boardList) return;
    Array.prototype.forEach.call(boardList.querySelectorAll(".select__option"), function (option) {
      option.classList.toggle("is-selected", (option.getAttribute("data-value") || "") === (board || ""));
    });
  }

  function showBoard(show) {
    if (!boardSelect) return;
    boardSelect.hidden = !show;
    if (boardButton) boardButton.disabled = !show;
    if (!show) setBoard("");
  }

  function chooseSaved(preferred, emptyLabel) {
    if (!preferred) {
      selectTarget("", emptyLabel);
      return;
    }
    var saved = "";
    try {
      saved = JSON.stringify(preferred);
    } catch (error) {
      saved = "";
    }
    var found = Array.prototype.find.call(targetList.querySelectorAll(".select__option"), function (option) {
      var value = option.getAttribute("data-value") || "";
      if (!value) return false;
      try {
        return sameTarget(JSON.parse(value), preferred);
      } catch (error) {
        return value === saved;
      }
    });
    if (!found && saved) found = addOption("기존 연결 (공개·삭제 상태 확인 필요)", saved);
    selectTarget(found ? found.getAttribute("data-value") : "", found ? found.textContent : emptyLabel);
  }

  function fillTargets(kind, preferred) {
    targetList.replaceChildren();
    targetButton.disabled = !kind;
    targetInput.disabled = false;
    if (!kind) {
      selectTarget("", "연결 대상");
      return;
    }
    addOption("선택 안 함", "");
    (catalog[kind] || []).forEach(function (item) {
      addOption(item.label, JSON.stringify(item.value));
    });
    chooseSaved(preferred, "선택 안 함");
  }

  function fillPosts(board, preferred) {
    targetList.replaceChildren();
    targetInput.disabled = false;
    if (!board) {
      targetButton.disabled = true;
      selectTarget("", "게시글");
      return;
    }
    targetButton.disabled = false;
    addOption("선택 안 함", "");
    catalog.post.filter(function (item) { return item.category === board; }).forEach(function (item) {
      addOption(item.label, JSON.stringify(item.value));
    });
    chooseSaved(preferred, "선택 안 함");
  }

  function applyKind(kind, preferred) {
    setKind(kind);
    if (kind !== "post") {
      showBoard(false);
      fillTargets(kind, preferred);
      return;
    }
    showBoard(true);
    var match = preferred ? catalog.post.find(function (item) { return sameTarget(item.value, preferred); }) : null;
    if (match) {
      setBoard(match.category);
      fillPosts(match.category, preferred);
      return;
    }
    setBoard("");
    if (!preferred) {
      fillPosts("", null);
      return;
    }
    targetList.replaceChildren();
    targetButton.disabled = false;
    addOption("선택 안 함", "");
    chooseSaved(preferred, "선택 안 함");
  }

  function fail(message) {
    targetButton.disabled = true;
    var kindButton = kindInput.closest(".select") && kindInput.closest(".select").querySelector(".select__button");
    if (kindButton) kindButton.disabled = true;
    targetInput.disabled = true;
    if (!guide || !guide.parentNode) return;
    var error = document.createElement("p");
    error.className = "flow-error";
    error.textContent = message;
    guide.parentNode.appendChild(error);
  }

  var catalog = { video: [], post: [], orchard: [], calendar: [] };

  try {
    // 1) 영상 목록 (DB: proc/video_proc.asp?action=list)
    try {
      var vRes = await fetch("proc/video_proc.asp?action=list");
      var vData = await vRes.json();
      if (vData && vData.success && Array.isArray(vData.items)) {
        catalog.video = vData.items.map(function (v) {
          var title = v.displayTitle || v.originalTitle || ("영상 " + v.id);
          return { label: title, value: { kind: "video", type: "video", id: String(v.id) } };
        });
      }
    } catch (ve) {
      console.warn("DB 영상 목록 조회 실패:", ve);
    }

    // 2) 게시글 목록 (DB: proc/board_proc.asp?action=list)
    try {
      var bRes = await fetch("proc/board_proc.asp?action=list");
      var bData = await bRes.json();
      if (bData && bData.success && Array.isArray(bData.items)) {
        catalog.post = bData.items.filter(function (post) {
          return post.category !== "과원관리" && String(post.id) !== String(current || "");
        }).map(function (post) {
          var title = String(post.title || "").trim() ? post.title : "(제목 없음)";
          return { label: title, category: post.category, value: { kind: "post", type: "post", id: String(post.id) } };
        });
      }
    } catch (be) {
      console.warn("DB 게시글 목록 조회 실패:", be);
    }

    // 3) 월별 과원관리 목록 (DB: proc/orchard_proc.asp?action=list)
    try {
      var oRes = await fetch("proc/orchard_proc.asp?action=list");
      var oData = await oRes.json();
      if (oData && oData.success && Array.isArray(oData.items)) {
        var year = oData.year || 2026;
        catalog.orchard = oData.items.map(function (item) {
          var m = Number(item.month);
          var label = item.title ? (year + "년 " + m + "월: " + item.title) : (year + "년 " + m + "월 과원관리");
          return {
            label: label,
            value: { kind: "orchard", type: "orchard", year: Number(year), month: m, id: year + ":" + m }
          };
        }).sort(function (a, b) { return a.value.month - b.value.month; });
      }
    } catch (oe) {
      console.warn("DB 과원관리 목록 조회 실패:", oe);
    }

    // 4) 상시 재배력 (DB: proc/calendar_proc.asp?action=get)
    try {
      var cRes = await fetch("proc/calendar_proc.asp?action=get");
      var cData = await cRes.json();
      var calTitle = (cData && cData.success && cData.item && cData.item.title) ? cData.item.title : "복숭아 재배력";
      catalog.calendar = [{
        label: calTitle,
        value: { kind: "calendar", type: "calendar", id: "calendar" }
      }];
    } catch (ce) {
      console.warn("DB 상시 재배력 조회 실패:", ce);
    }
  } catch (error) {
    fail("연결 자료를 불러오지 못했습니다. 새로고침 후 다시 확인해 주세요.");
    return;
  }

  var savedTarget = editing && editing.relatedTarget ? editing.relatedTarget : null;
  var savedKind = knownKind(savedTarget);
  var selectedKind = "";
  if (savedTarget && !savedKind) {
    targetButton.disabled = true;
    targetInput.disabled = false;
    try {
      targetInput.value = JSON.stringify(savedTarget);
    } catch (error) {
      targetInput.value = "";
    }
    if (targetLabel) targetLabel.textContent = "기존 연결 (공개·삭제 상태 확인 필요)";
  } else if (savedKind) {
    selectedKind = savedKind;
    applyKind(savedKind, savedTarget);
  }

  kindInput.closest(".select").addEventListener("select:change", function () {
    if (kindInput.value !== selectedKind) {
      selectedKind = kindInput.value;
      applyKind(selectedKind, null);
    }
    form.dispatchEvent(new Event("input", { bubbles: true }));
  });
  if (boardSelect) {
    boardSelect.addEventListener("select:change", function () {
      fillPosts(boardInput.value, null);
      form.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  targetInput.closest(".select").addEventListener("select:change", function () {
    form.dispatchEvent(new Event("input", { bubbles: true }));
  });

  window.previewPostAttachment = async function (root) {
    root.replaceChildren();
    var entries = typeof form.getAttachmentEntries === "function" ? form.getAttachmentEntries() : [];
    if (!entries.length && editing && editing.attachment) entries = [{ meta: editing.attachment }];
    var urls = [];
    for (var index = 0; index < entries.length; index += 1) {
      var entry = entries[index];
      var file = entry.file || null;
      if (!file && entry.meta && entry.meta.resourceKey) {
        try {
          file = (await ResourceStore.get(entry.meta.resourceKey) || {}).file;
        } catch (error) {
          var failed = document.createElement("p");
          failed.textContent = "첨부 원본을 불러오지 못했습니다.";
          root.appendChild(failed);
          continue;
        }
      }
      if (file instanceof Blob) {
        var url = URL.createObjectURL(file);
        var link = document.createElement("a");
        link.textContent = "첨부자료 열기: " + file.name;
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener";
        link.className = "btn";
        root.appendChild(link);
        urls.push(url);
      } else if (entry.meta) {
        var kept = document.createElement("p");
        kept.textContent = "기존 첨부는 파일명만 남아 있습니다. 원본을 다시 선택해 저장해 주세요." + (entry.meta.name ? " (" + entry.meta.name + ")" : "");
        root.appendChild(kept);
      }
    }
    if (urls.length) {
      var modal = document.querySelector("#modal-contents-preview");
      if (modal) {
        modal.addEventListener("click", function closePreview(event) {
          if (!event.target.closest("[data-modal-close]")) return;
          urls.forEach(function (url) { URL.revokeObjectURL(url); });
          modal.removeEventListener("click", closePreview);
        });
      }
    }
    if (targetInput.value && !targetInput.disabled) {
      var hint = document.createElement("p");
      hint.textContent = "연결 자료: " + (targetLabel ? targetLabel.textContent : "");
      root.appendChild(hint);
    }
  };
});
