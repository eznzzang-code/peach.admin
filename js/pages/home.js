/* 홈페이지 메인 미리보기. 저장소에 쓰지 않습니다. */
(function () {
  var data = window.HomePreviewData || { orchard: [], videos: [] };

  function seoulToday() {
    var text = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
    var parts = text.split("-");
    return { year: Number(parts[0]), month: Number(parts[1]) };
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function youtubeIdFrom(value) {
    var match = String(value || "").match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/
    );
    if (match) return match[1];
    if (/^[A-Za-z0-9_-]{11}$/.test(String(value || ""))) return String(value);
    return "";
  }

  function adminVideoKeys(video) {
    var keys = [];
    ["url", "originalUrl", "youtubeUrl", "sourceUrl", "videoUrl", "youtubeId", "videoId"].forEach(function (name) {
      if (video && video[name]) keys.push(String(video[name]).trim());
    });
    return keys;
  }

  function normalizeTitle(value) {
    return String(value || "").replace(/\s+/g, "").replace(/아간온도/g, "야간온도");
  }

  function findAdminVideo(entry) {
    var videos = window.MockData && Array.isArray(MockData.videos) ? MockData.videos : [];
    var url = String(entry.sourceUrl || "").trim();
    var youtubeId = entry.youtubeId || youtubeIdFrom(url);
    var title = normalizeTitle(entry.title);
    var found = null;
    videos.some(function (video) {
      var matched = adminVideoKeys(video).some(function (key) {
        if (url && key === url) return true;
        return Boolean(youtubeId) && (key === youtubeId || youtubeIdFrom(key) === youtubeId);
      });
      if (!matched && title) {
        matched = normalizeTitle(video.displayTitle) === title || normalizeTitle(video.originalTitle) === title;
      }
      if (!matched) return false;
      found = video;
      return true;
    });
    return found;
  }

  function featuredVideos() {
    var items = (data.videos || []).filter(function (entry) {
      return entry.visibility !== "private" && entry.published !== false;
    });
    var featured = items.filter(function (entry) {
      return entry.mainSelected === true;
    });
    if (featured.length) items = featured;
    if (items.some(function (entry) { return entry.publishedAt; })) {
      items = items.slice().sort(function (a, b) {
        return String(b.publishedAt || "").localeCompare(String(a.publishedAt || ""));
      });
    }
    return items.slice(0, 3);
  }

  function media(image, alt, contain) {
    if (!image) {
      return '<div class="home-media__empty">이미지 없음</div>';
    }
    var fit = contain ? " is-contain" : "";
    return '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(alt) + '" class="' + fit.trim() + '">';
  }

  function renderOrchard(today) {
    var host = document.getElementById("home-orchard");
    if (!host) return;
    var record = (data.orchard || []).filter(function (item) {
      return item.published && Number(item.year) === today.year && Number(item.month) === today.month;
    })[0];
    var title = (record && record.title) || (data.orchardLines && data.orchardLines[today.month]) || "";
    var description = record ? data.orchardDescription : data.orchardEmptyDescription;
    var manageUrl = record && record.manageUrl
      ? record.manageUrl
      : "monthly-content-form.asp?type=orchard&year=" + today.year + "&month=" + today.month + "&mode=edit";
    var monthText = today.month < 10 ? "0" + today.month : String(today.month);
    host.innerHTML =
      '<div class="home-media">' + media(record && record.image, title || (today.year + "년 " + today.month + "월 과원관리"), true) + "</div>" +
      '<p class="home-card__period">' + today.year + "년 " + monthText + "월</p>" +
      '<h2 class="home-card__title">' + escapeHtml(title || today.month + "월 과원관리") + "</h2>" +
      '<div class="home-card__foot">' +
        '<div class="home-card__copy">' +
          '<p class="home-card__desc">' + escapeHtml(description || "") + "</p>" +
        "</div>" +
        '<a class="btn btn--primary home-card__action" href="' + escapeHtml(manageUrl) + '">수정</a>' +
      "</div>";
  }

  function renderCultivation(today) {
    var host = document.getElementById("home-cultivation");
    var source = data.cultivation || {};
    if (!host) return;
    var available = source.published && Number(source.year) === today.year;
    var description = available ? source.headline : source.emptyDescription;
    var detail = available ? source.description : "";
    host.innerHTML =
      '<div class="home-media">' + media(available ? source.image : "", source.title || "복숭아 재배력", true) + "</div>" +
      '<h2 class="home-card__title">' + escapeHtml(source.title || "복숭아 재배력") + "</h2>" +
      '<div class="home-card__foot">' +
        '<div class="home-card__copy">' +
          '<p class="home-card__desc">' + escapeHtml(description || "") + "</p>" +
          (detail ? '<p class="home-card__detail">' + escapeHtml(detail) + "</p>" : "") +
        "</div>" +
        '<a class="btn btn--primary home-card__action" href="' + escapeHtml(source.manageUrl || "cultivation-content.asp") + '">수정</a>' +
      "</div>";
  }

  function renderVideos() {
    var list = document.getElementById("home-videos");
    if (!list) return;
    var items = featuredVideos();
    if (!items.length) {
      list.innerHTML = '<p class="home-videos__empty">등록된 재배기술 영상이 없습니다.</p>';
      return;
    }
    list.innerHTML = items.map(function (entry) {
      var admin = findAdminVideo(entry);
      var href = admin ? "videos-detail.asp?id=" + encodeURIComponent(admin.id) : "videos-list.asp";
      return '<article class="home-video">' +
        '<div class="home-media home-media--video">' + media(entry.image, entry.title || "", false) + "</div>" +
        '<div class="home-card__foot">' +
          '<h3 class="home-video__title">' + escapeHtml(entry.title || "제목 없음") + "</h3>" +
          '<a class="btn btn--primary home-card__action" href="' + href + '">수정</a>' +
        "</div>" +
        "</article>";
    }).join("");
  }

  function boardHash(category) {
    if (category === "공지") return "#notice";
    if (category === "복숭아정보") return "#info";
    if (category === "재배자료") return "#material";
    return "";
  }

  function categoryLabel(category) {
    if (category === "공지") return "공지사항";
    return category || "";
  }

  var statusClass = {
    "게시예정": "contents-status--scheduled",
    "게시중": "contents-status--live",
    "게시종료": "contents-status--ended",
    "비공개": "contents-status--private",
    "임시저장": "contents-status--draft"
  };

  function renderRecentFromDB(posts) {
    var body = document.getElementById("home-recent-body");
    if (!body) return;
    if (!posts || !posts.length) {
      body.innerHTML = '<tr><td class="home-empty" colspan="4">표시할 게시글이 없습니다.</td></tr>';
      return;
    }
    body.innerHTML = posts.map(function (item) {
      var status = item.status || "게시중";
      var title = String(item.title || "").trim() ? item.title : "(제목 없음)";
      var href = "contents-edit.asp?id=" + encodeURIComponent(item.id) + boardHash(item.category);
      return "<tr>" +
        "<td>" + escapeHtml(categoryLabel(item.category)) + "</td>" +
        '<td><a class="home-recent__title" href="' + href + '">' + escapeHtml(title) + "</a></td>" +
        '<td><span class="contents-status ' + (statusClass[status] || "") + '">' + escapeHtml(status) + "</span></td>" +
        "<td>" + escapeHtml(item.updatedAt || "") + "</td>" +
        "</tr>";
    }).join("");
  }

  function renderRecent() {
    var body = document.getElementById("home-recent-body");
    if (!body || !window.ContentStore || !ContentStore.peek) return;
    var before = null;
    try { before = localStorage.getItem(ContentStore.storageKey); } catch (error) { before = null; }
    var items = ContentStore.peek();
    var after = null;
    try { after = localStorage.getItem(ContentStore.storageKey); } catch (error) { after = null; }
    if (before !== after) console.error("홈 조회 중 게시글 저장값이 변경되었습니다.");
    if (ContentStore.problem()) {
      body.innerHTML = '<tr><td class="home-empty" colspan="4">' + escapeHtml(ContentStore.problemMessage()) + "</td></tr>";
      return;
    }
    var posts = items.filter(function (item) {
      return item.category === "공지" || item.category === "복숭아정보" || item.category === "재배자료";
    }).sort(function (a, b) {
      if (a.updatedAt !== b.updatedAt) return a.updatedAt < b.updatedAt ? 1 : -1;
      return Number(b.id) - Number(a.id);
    }).slice(0, 3);
    if (!posts.length) {
      body.innerHTML = '<tr><td class="home-empty" colspan="4">표시할 게시글이 없습니다.</td></tr>';
      return;
    }
    body.innerHTML = posts.map(function (item) {
      var status = ContentStore.statusOf(item);
      var title = String(item.title || "").trim() ? item.title : "(제목 없음)";
      var href = "contents-edit.asp?id=" + encodeURIComponent(item.id) + boardHash(item.category);
      return "<tr>" +
        "<td>" + escapeHtml(categoryLabel(item.category)) + "</td>" +
        '<td><a class="home-recent__title" href="' + href + '">' + escapeHtml(title) + "</a></td>" +
        '<td><span class="contents-status ' + (statusClass[status] || "") + '">' + escapeHtml(status) + "</span></td>" +
        "<td>" + escapeHtml(item.updatedAt) + "</td>" +
        "</tr>";
    }).join("");
  }

  Admin.ready(function () {
    var today = seoulToday();

    // 1) 홈 대시보드 프로시저 API 호출 (USP_ADMIN_HOME_DATA)
    fetch("proc/home_proc.asp?year=" + today.year + "&month=" + today.month)
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (!json || !json.success) return;

        // DB 과원관리 자료 반영
        data.orchard = json.orchard ? [json.orchard] : [];

        // DB 재배력 자료 반영
        if (json.cultivation) {
          data.cultivation = Object.assign({}, data.cultivation || {}, json.cultivation);
        } else if (data.cultivation) {
          data.cultivation.published = false;
        }

        // DB 교육영상 반영
        if (Array.isArray(json.videos)) {
          var vList = document.getElementById("home-videos");
          if (vList) {
            if (!json.videos.length) {
              vList.innerHTML = '<p class="home-videos__empty">등록된 재배기술 영상이 없습니다.</p>';
            } else {
              vList.innerHTML = json.videos.map(function (v) {
                var href = "videos-detail.asp?id=" + encodeURIComponent(v.id);
                return '<article class="home-video">' +
                  '<div class="home-media home-media--video">' + media(v.thumbnail, v.title, false) + "</div>" +
                  '<div class="home-card__foot">' +
                    '<h3 class="home-video__title">' + escapeHtml(v.title || "제목 없음") + "</h3>" +
                    '<a class="btn btn--primary home-card__action" href="' + href + '">수정</a>' +
                  "</div>" +
                  "</article>";
              }).join("");
            }
          }
        } else {
          renderVideos();
        }

        // DB 최근 게시글 반영
        if (Array.isArray(json.recentPosts)) {
          renderRecentFromDB(json.recentPosts);
        } else {
          renderRecent();
        }

        renderOrchard(today);
        renderCultivation(today);
      })
      .catch(function () {
        renderOrchard(today);
        renderCultivation(today);
        renderVideos();
        renderRecent();
      });

    document.querySelectorAll(".home-media img").forEach(function (image) {
      image.addEventListener("error", function () {
        var empty = document.createElement("div");
        empty.className = "home-media__empty";
        empty.textContent = "이미지를 표시할 수 없습니다.";
        image.replaceWith(empty);
      });
    });
  });
})();
