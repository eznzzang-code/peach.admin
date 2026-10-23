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
  var editing = current && window.ContentStore ? ContentStore.get(current) : null;
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
    if (!left || !right || left.kind !== right.kind) return false;
    if (left.kind === "video" || left.kind === "post") return String(left.id) === String(right.id);
    if (left.kind === "orchard") return Number(left.year) === Number(right.year) && Number(left.month) === Number(right.month);
    if (left.kind === "calendar") return true;
    return JSON.stringify(left) === JSON.stringify(right);
  }

  function knownKind(target) {
    if (!target || !kindLabels[target.kind]) return "";
    return target.kind;
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
    var records = await ResourceStore.all();
    var videos = (window.MockData && Array.isArray(MockData.videos) ? MockData.videos.slice() : []);
    var videoIds = {};
    videos.forEach(function (video) { videoIds[String(video.id)] = true; });
    records.filter(function (record) { return record.kind === "video" && record.id != null && !videoIds[String(record.id)]; }).forEach(function (record) {
      videos.push(record);
    });
    catalog.video = videos.map(function (video) {
      var stored = records.find(function (record) {
        return record.kind === "video" && String(record.id) === String(video.id);
      });
      var title = (stored && (stored.displayTitle || stored.originalTitle)) || video.displayTitle || video.originalTitle || ("영상 " + video.id);
      return { label: title, value: { kind: "video", id: video.id } };
    });

    catalog.post = (window.ContentStore ? ContentStore.list() : []).filter(function (post) {
      return post.category !== "과원관리" && String(post.id) !== String(current || "");
    }).map(function (post) {
      var title = String(post.title || "").trim() ? post.title : "(제목 없음)";
      return { label: title, category: post.category, value: { kind: "post", id: post.id } };
    });

    var orchardMap = {};
    records.filter(function (record) {
      return record.kind === "orchard" && record.year && record.month;
    }).forEach(function (record) {
      orchardMap[record.year + ":" + record.month] = {
        label: record.title || (record.year + "년 " + record.month + "월 과원관리"),
        value: { kind: "orchard", year: Number(record.year), month: Number(record.month) }
      };
    });
    for (var month = 1; month <= 12; month += 1) {
      var key = "2026:" + month;
      if (!orchardMap[key]) {
        orchardMap[key] = {
          label: "2026년 " + month + "월 중점 과원관리",
          value: { kind: "orchard", year: 2026, month: month }
        };
      }
    }
    catalog.orchard = Object.keys(orchardMap).map(function (key) { return orchardMap[key]; }).sort(function (left, right) {
      if (left.value.year !== right.value.year) return right.value.year - left.value.year;
      return left.value.month - right.value.month;
    });

    var calendar = records.find(function (record) { return record.kind === "calendar" || record.key === "calendar"; });
    catalog.calendar = [{
      label: calendar && calendar.title ? calendar.title : "복숭아 재배력",
      value: { kind: "calendar" }
    }];
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
