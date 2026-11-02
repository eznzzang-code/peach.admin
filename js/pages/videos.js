/* 교육영상은 관리자가 입력한 유튜브 주소를 웹·앱에 함께 노출합니다.
   메인 노출은 채널과 관계없이 하나의 설정이며, 공개·재생 가능·게시기간 안이며 유효한 유튜브 URL이 있는 영상만 최대 3개로 셉니다.
   목록의 메인 배지는 지금 그 조건을 모두 충족한 영상에만 붙습니다. 설정만 켜진 영상은 노출 불가로 남기고 저장값은 지우지 않습니다.
   게시 시작일이 나중이거나 기존 기간이 끝나도, 같은 날에 노출될 영상이 3개를 넘으면 저장하지 않습니다. */
(function () {
  'use strict';
  var MAIN_LIMIT = 3;
  var MAIN_LIMIT_MESSAGE = '메인 노출 영상은 최대 3개까지 설정할 수 있습니다. 기존 메인 노출 영상을 해제한 후 다시 시도해 주세요.';
  var videos = [], current, attachment, dirty = false, creating = false;
  var q = function (s, r) { return (r || document).querySelector(s); };
  var value = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
  var checked = function (id) { return !!document.getElementById(id)?.checked; };
  var escapeText = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  function today() {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }).replaceAll('-', '.');
  }
  function isMainSetting(item) {
    if (!item || item.deleted === true) return false;
    if (item.mainSelected === true) return true;
    return Array.isArray(item.homeChannels) && item.homeChannels.length > 0;
  }
  function inPublishPeriod(item) {
    return !!item && item.publishStart <= today() && (item.noEnd || item.publishEnd >= today());
  }
  function youtubeId(url) {
    var text = String(url || '').trim();
    if (!text) return '';
    var parsed;
    try { parsed = new URL(text); } catch (e) { return ''; }
    var host = parsed.hostname.replace(/^www\./, '').replace(/^m\./, '');
    var id = '';
    if (host === 'youtu.be') {
      id = (parsed.pathname.split('/').filter(Boolean)[0] || '').split('?')[0];
    } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      var parts = parsed.pathname.split('/').filter(Boolean);
      if (parsed.pathname === '/watch') id = parsed.searchParams.get('v') || '';
      else if ((parts[0] === 'embed' || parts[0] === 'shorts') && parts[1]) id = parts[1];
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : '';
  }
  function storedVideoUrl(item) {
    if (!item) return '';
    var values = [];
    ['originalUrl', 'youtubeUrl', 'url', 'sourceUrl', 'videoUrl'].forEach(function (name) {
      if (item[name]) values.push(item[name]);
    });
    if (/^[A-Za-z0-9_-]{11}$/.test(item.youtubeId || '')) {
      values.push('https://www.youtube.com/watch?v=' + item.youtubeId);
    }
    for (var i = 0; i < values.length; i++) {
      if (youtubeId(values[i])) return String(values[i]).trim();
    }
    return '';
  }
  function hasPlayableUrl(item) {
    return !!storedVideoUrl(item);
  }
  function occupiesMain(item) {
    return isMainSetting(item) && item.visibility === 'public' && item.playable === true && hasPlayableUrl(item) && inPublishPeriod(item);
  }
  function dayAfter(dot) {
    if (!dot || dot >= '9999.12.31') return '9999.99.99';
    var parts = String(dot).split('.');
    var date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
    if (isNaN(date.getTime())) return '9999.99.99';
    date.setUTCDate(date.getUTCDate() + 1);
    return date.getUTCFullYear() + '.' + String(date.getUTCMonth() + 1).padStart(2, '0') + '.' + String(date.getUTCDate()).padStart(2, '0');
  }
  function isMainEligible(item) {
    if (!isMainSetting(item) || item.visibility !== 'public' || item.playable !== true || !hasPlayableUrl(item)) return false;
    if (!/^\d{4}\.\d{2}\.\d{2}$/.test(item.publishStart || '')) return false;
    if (item.noEnd) return true;
    return /^\d{4}\.\d{2}\.\d{2}$/.test(item.publishEnd || '') && item.publishEnd >= item.publishStart;
  }
  function maxConcurrent(list) {
    var events = [];
    (list || []).forEach(function (item) {
      if (!isMainEligible(item)) return;
      events.push({ day: item.publishStart, delta: 1 });
      events.push({ day: dayAfter(item.noEnd ? '9999.12.31' : item.publishEnd), delta: -1 });
    });
    events.sort(function (a, b) {
      if (a.day < b.day) return -1;
      if (a.day > b.day) return 1;
      return a.delta - b.delta;
    });
    var count = 0, max = 0;
    events.forEach(function (event) {
      count += event.delta;
      if (count > max) max = count;
    });
    return max;
  }
  function mainBlockers(item) {
    var reasons = [];
    if (item.visibility !== 'public') reasons.push('비공개');
    if (!inPublishPeriod(item)) reasons.push(item.publishStart > today() ? '게시예정' : '게시종료');
    if (!hasPlayableUrl(item)) reasons.push('URL 미등록');
    else if (item.playable !== true) reasons.push('재생 불가');
    return reasons;
  }
  function mainCount(list, excludeId) {
    return (list || []).filter(function (item) {
      if (excludeId != null && String(item.id) === String(excludeId)) return false;
      return occupiesMain(item);
    }).length;
  }
  function notice(message) {
    q('#video-notice-message').textContent = message;
    AdminUI.openModal('modal-video-notice');
  }
  function showUrlError(message) {
    var input = q('#video-youtube-url');
    var error = q('#video-url-error');
    var urlError = !!message && message.indexOf('유튜브') !== -1;
    if (input) input.classList.toggle('is-invalid', urlError);
    if (error) {
      error.hidden = !urlError;
      error.textContent = urlError ? message : '';
    }
    if (urlError && input) input.focus();
    return urlError;
  }
  function paintThumb(id, fallback) {
    var frame = q('#video-thumbnail');
    if (!frame) return;
    var token = String(Date.now());
    frame.dataset.thumbToken = token;
    frame.style.backgroundImage = fallback ? 'url("' + encodeURI(fallback) + '")' : '';
    if (!id) return;
    var sources = ['maxresdefault', 'hqdefault', 'mqdefault'];
    var index = 0;
    function next() {
      if (frame.dataset.thumbToken !== token) return;
      if (index >= sources.length) {
        frame.style.backgroundImage = fallback ? 'url("' + encodeURI(fallback) + '")' : '';
        return;
      }
      var src = 'https://i.ytimg.com/vi/' + id + '/' + sources[index] + '.jpg';
      index += 1;
      var img = new Image();
      img.onload = function () {
        if (frame.dataset.thumbToken !== token) return;
        if (img.naturalWidth > 0 && img.naturalWidth <= 120) next();
        else frame.style.backgroundImage = 'url("' + src + '")';
      };
      img.onerror = next;
      img.src = src;
    }
    next();
  }
  function select(id, v) {
    var input = document.getElementById(id);
    if (!input) return;
    input.value = v;
    var root = input.closest('.select');
    root?.querySelectorAll('.select__option').forEach(function (o) {
      o.classList.toggle('is-selected', o.dataset.value === v);
      if (o.dataset.value === v) q('.select__label', root).textContent = o.textContent;
    });
  }
  function formValue() {
    var mainOn = checked('video-main');
    var channels = ['Web', 'App'];
    var homeChannels = mainOn ? ['Web', 'App'] : [];
    var url = value('video-youtube-url').trim();
    var id = youtubeId(url);
    var title = value('video-display-title').trim();
    var record = Object.assign({}, current, {
      key: 'video:' + current.id,
      kind: 'video',
      displayTitle: title,
      originalTitle: current.originalTitle || title,
      description: value('video-description'),
      visibility: value('video-visibility'),
      category: value('video-category'),
      publishStart: value('video-publish-start'),
      publishEnd: value('video-publish-end'),
      noEnd: checked('video-no-end'),
      channels: channels,
      homeChannels: homeChannels,
      mainSelected: mainOn,
      originalUrl: url,
      youtubeId: id,
      thumbnail: id ? 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg' : (current.thumbnail || ''),
      playable: id ? true : current.playable === true,
      collectionStatus: current.collectionStatus || '직접 등록',
      attachment: attachment
    });
    delete record.isNew;
    return record;
  }
  function validation(v) {
    if (!v.displayTitle) return '영상 제목을 입력해 주세요.';
    if (!v.originalUrl) return '유튜브 URL을 입력해 주세요.';
    if (!youtubeId(v.originalUrl)) return '유튜브 주소 형식을 확인해 주세요. 시청 주소, 공유 주소, Shorts, 임베드 주소를 입력할 수 있습니다.';
    if (!['재배기술', '생육단계'].includes(v.category)) return '영상 분류를 선택해 주세요.';
    if (!/^\d{4}\.\d{2}\.\d{2}$/.test(v.publishStart)) return '게시 시작일을 선택해 주세요.';
    if (!v.noEnd && !/^\d{4}\.\d{2}\.\d{2}$/.test(v.publishEnd)) return '게시 종료일을 선택해 주세요.';
    if (!v.noEnd && v.publishEnd < v.publishStart) return '게시 종료일은 시작일과 같거나 이후여야 합니다.';
    return '';
  }
  function mainLimitMessage(v, list) {
    if (!isMainEligible(v)) return '';
    var others = (list || []).filter(function (item) { return String(item.id) !== String(v.id); });
    var nextMax = maxConcurrent(others.concat([v]));
    if (nextMax <= MAIN_LIMIT) return '';
    if (current && String(current.id) === String(v.id) && isMainEligible(current) && nextMax <= maxConcurrent(others.concat([current]))) return '';
    return MAIN_LIMIT_MESSAGE;
  }
  function showAttachment() {
    var list = q('#video-attachment-list');
    if (!list) return;
    list.replaceChildren();
    if (!attachment || !attachment.name) return;
    var item = document.createElement('li');
    item.className = 'upload-list__item';
    var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'upload__icon');
    icon.setAttribute('viewBox', '0 0 18 18');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<path d="M5 2.5h5.2L13 5.2V15.5H5z" fill="none" stroke="currentColor" stroke-width="1.2"></path><path d="M10 2.5V5.5h3" fill="none" stroke="currentColor" stroke-width="1.2"></path>';
    var name = document.createElement('span');
    name.className = 'upload-list__name';
    if (attachment.path) {
      var a = document.createElement('a');
      a.href = attachment.path;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = attachment.name;
      name.appendChild(a);
    } else {
      name.textContent = attachment.name;
    }
    name.title = attachment.name;
    var remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'upload__remove';
    remove.textContent = '제거';
    remove.addEventListener('click', function () {
      attachment = null;
      var input = q('#video-attachment');
      if (input) input.value = '';
      dirty = true;
      showAttachment();
    });
    item.append(icon, name, remove);
    list.append(item);
  }
  async function detail() {
    var params = new URLSearchParams(location.search);
    creating = params.get('new') === '1';
    if (creating) {
      current = {
        id: 0,
        originalTitle: '',
        displayTitle: '',
        description: '',
        duration: '',
        collectionStatus: '직접 등록',
        playable: false,
        category: '재배기술',
        visibility: 'public',
        channels: ['Web', 'App'],
        homeChannels: [],
        mainSelected: false,
        publishStart: today(),
        publishEnd: '',
        noEnd: true,
        collectedAt: today(),
        originalUrl: '',
        thumbnail: ''
      };
    } else {
      var targetId = params.get('id');
      current = videos.find(function (v) { return String(v.id) === String(targetId); });
      if (targetId) {
        try {
          var getRes = await fetch('proc/video_proc.asp?action=get&id=' + encodeURIComponent(targetId));
          var getJson = await getRes.json();
          if (getJson && getJson.success && getJson.item) {
            current = Object.assign({}, current || {}, getJson.item);
          }
        } catch (e) {}
      }
    }
    var form = q('#video-form');
    if (!current) {
      form.hidden = true;
      q('#video-missing').hidden = false;
      return;
    }
    attachment = current.attachment || null;
    ['original-title', 'duration'].forEach(function (name) {
      var key = { 'original-title': 'originalTitle', duration: 'duration' }[name];
      var el = q('#video-' + name);
      if (el) el.textContent = current[key] || '';
    });
    select('video-visibility', current.visibility);
    select('video-category', current.category || '');
    q('#video-main').checked = isMainSetting(current);
    q('#video-publish-start').value = current.publishStart;
    q('#video-publish-end').value = current.publishEnd || '';
    q('#video-no-end').checked = current.noEnd;
    q('#video-no-end').dispatchEvent(new Event('change', { bubbles: true }));
    q('#video-display-title').value = current.displayTitle || current.originalTitle || '';
    q('#video-description').value = current.description || '';
    var urlInput = q('#video-youtube-url');
    urlInput.value = storedVideoUrl(current);
    function refreshFromUrl() {
      showUrlError('');
      var raw = urlInput.value.trim();
      var id = youtubeId(raw);
      var idEl = q('#video-original-id');
      var playEl = q('#video-playable');
      if (idEl) idEl.textContent = id || (raw ? '확인 필요' : '—');
      if (playEl) playEl.textContent = id ? '재생 가능' : (raw ? '주소 확인' : 'URL 미등록');
      var open = q('#video-original-open');
      if (open) {
        open.disabled = !id;
        open.title = id ? '' : '유튜브 URL을 입력하면 이동할 수 있습니다.';
        open.onclick = function (e) {
          e.preventDefault();
          var next = youtubeId(urlInput.value.trim());
          if (next) window.open('https://www.youtube.com/watch?v=' + next, '_blank', 'noopener');
        };
      }
      var kept = current.thumbnail && String(current.thumbnail).indexOf('ytimg.com') === -1 ? current.thumbnail : '';
      paintThumb(id, kept);
    }
    urlInput.addEventListener('input', refreshFromUrl);
    refreshFromUrl();
    showAttachment();
    form.hidden = false;
    form.onsubmit = function (e) { e.preventDefault(); };
    form.addEventListener('input', function () { dirty = true; });
    form.addEventListener('change', function () { dirty = true; });
    q('#video-attachment').onchange = function () {
      var file = this.files && this.files[0];
      if (!file) return;
      if (!(/\.pdf$/i.test(file.name) || /^image\/(png|jpeg)$/.test(file.type))) {
        this.value = '';
        notice('PDF·PNG·JPG 관련자료를 선택해 주세요.');
        return;
      }
      attachment = file;
      dirty = true;
      showAttachment();
    };
    q('#video-save').onclick = async function () {
      var v = formValue(), error = validation(v);
      if (error) {
        if (!showUrlError(error)) notice(error);
        return;
      }
      showUrlError('');
      this.disabled = true;
      try {
        var limitError = mainLimitMessage(v, videos);
        if (limitError) {
          notice(limitError);
          return;
        }
        var fd = new FormData();
        fd.append('action', 'save');
        fd.append('id', String(creating ? 0 : current.id));
        fd.append('youtubeId', v.youtubeId || '');
        fd.append('originalUrl', v.originalUrl || '');
        fd.append('displayTitle', v.displayTitle || '');
        fd.append('originalTitle', v.originalTitle || v.displayTitle || '');
        fd.append('category', v.category || '');
        fd.append('description', v.description || '');
        fd.append('thumbnail', v.thumbnail || '');
        fd.append('duration', v.duration || '');
        fd.append('visibility', v.visibility || 'public');
        fd.append('mainSelected', v.mainSelected ? 'true' : 'false');
        fd.append('publishStart', v.publishStart || '');
        fd.append('publishEnd', v.publishEnd || '');
        fd.append('noEnd', v.noEnd ? 'true' : 'false');
        if (attachment instanceof File || attachment instanceof Blob) {
          fd.append('attachment_file', attachment, attachment.name || 'attachment');
        } else if (attachment && attachment.name) {
          fd.append('attachmentName', attachment.name || '');
          fd.append('attachmentPath', attachment.path || '');
        }
        var res = await fetch('proc/video_proc.asp', { method: 'POST', body: fd });
        var json = await res.json();
        if (!json || !json.success) {
          throw new Error((json && json.message) || '저장 실패');
        }
        try { await ResourceStore.putMany([v]); } catch (e) {}
        dirty = false;
        location.href = 'videos-list.asp?saved=1';
      } catch (e) {
        notice('저장하지 못했습니다. 입력 내용은 유지됩니다. 서버 연결을 확인해 주세요.');
      } finally {
        this.disabled = false;
      }
    };
    q('#video-preview').onclick = function () {
      var v = formValue(), error = validation(v);
      if (error) {
        if (!showUrlError(error)) notice(error);
        return;
      }
      showUrlError('');
      preview(v);
    };
    q('#video-list').onclick = function (e) {
      if (dirty) {
        e.preventDefault();
        AdminUI.openModal('modal-video-leave');
      }
    };
    var videoDelete = q('#video-delete');
    if (videoDelete) {
      videoDelete.onclick = function () {
        AdminUI.openModal('modal-video-delete');
      };
    }
    var videoDeleteConfirm = q('#video-delete-confirm');
    if (videoDeleteConfirm) {
      videoDeleteConfirm.onclick = async function () {
        if (creating) {
          dirty = false;
          location.href = 'videos-list.asp';
          return;
        }
        videoDeleteConfirm.disabled = true;
        try {
          var fd = new URLSearchParams();
          fd.append('action', 'delete');
          fd.append('id', String(current.id));
          var res = await fetch('proc/video_proc.asp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            body: fd.toString()
          });
          var json = await res.json();
          if (!json || !json.success) throw new Error('삭제 실패');
          try { await ResourceStore.put({ key: 'video:' + current.id, kind: 'video', id: current.id, deleted: true }); } catch (e) {}
          dirty = false;
          location.href = 'videos-list.asp?deleted=1';
        } catch (e) {
          videoDeleteConfirm.disabled = false;
          notice('삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        }
      };
    }
    q('#video-leave-confirm').onclick = function () {
      dirty = false;
      location.href = 'videos-list.asp';
    };
    window.addEventListener('beforeunload', function (e) {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }
  function preview(v) {
    var d = q('#video-app-preview');
    if (!d) {
      d = document.createElement('dialog');
      d.id = 'video-app-preview';
      d.className = 'flow-preview-dialog';
      d.innerHTML = '<header><h2>App 교육영상 미리보기</h2><button type="button" class="btn">닫기</button></header><div class="flow-phone"><div class="flow-phone__header">‹ 교육영상</div><div class="flow-phone__body"></div></div>';
      d.querySelector('header button').onclick = function () { d.close(); };
      document.body.append(d);
    }
    var body = q('.flow-phone__body', d);
    body.replaceChildren();
    if (v.thumbnail) {
      var im = document.createElement('img');
      im.src = v.thumbnail;
      im.alt = v.displayTitle;
      body.append(im);
    }
    var title = document.createElement('h3');
    title.textContent = v.displayTitle;
    var meta = document.createElement('p');
    meta.textContent = v.category + (v.duration ? ' · ' + v.duration : '');
    var text = document.createElement('p');
    text.textContent = v.description;
    body.append(title, meta, text);
    if (v.attachment) {
      var file = document.createElement((v.attachment instanceof Blob || v.attachment.path) ? 'a' : 'p');
      file.textContent = '첨부자료: ' + v.attachment.name;
      if (v.attachment instanceof Blob) {
        var fileUrl = URL.createObjectURL(v.attachment);
        file.href = fileUrl;
        file.target = '_blank';
        file.rel = 'noopener';
        file.className = 'btn';
        d.addEventListener('close', function () { URL.revokeObjectURL(fileUrl); }, { once: true });
      } else if (v.attachment.path) {
        file.href = v.attachment.path;
        file.target = '_blank';
        file.rel = 'noopener';
        file.className = 'btn';
      }
      body.append(file);
    }
    var hint = document.createElement('p');
    hint.className = 'flow-guide';
    hint.textContent = '메인 노출 ' + (isMainSetting(v) ? '설정' : '해제') + '. 공개 전 검수용 화면이며 영상 재생은 연동 예정입니다.';
    body.append(hint);
    d.showModal();
  }
  function list() {
    var page = 1, pageSize = 10, catalog = videos.filter(hasPlayableUrl), filtered = catalog.slice(), nav = q('[data-pagination]'), tbody = q('#videos-table tbody');
    var info = document.createElement('p');
    info.className = 'flow-guide';
    info.textContent = '관리자가 입력한 유튜브 주소가 있는 영상만 목록에 표시합니다. 메인 배지는 공개·재생 가능·게시기간 안인 영상만 표시하고, 상단 개수와 같습니다. 메인 설정은 켜져 있으나 비공개이거나 게시기간이 아니면 노출 불가로 표시합니다.';
    q('#videos-table').closest('.table-wrap').before(info);
    var listQuery = new URLSearchParams(location.search);
    if (listQuery.get('saved') === '1' || listQuery.get('deleted') === '1') {
      var saved = document.createElement('p');
      saved.className = 'flow-guide';
      saved.setAttribute('role', 'status');
      saved.textContent = listQuery.get('deleted') === '1' ? '영상을 삭제했습니다.' : '영상 정보를 저장했습니다.';
      info.before(saved);
    }
    function search() {
      var f = function (n) { return q('.videos-page [name="' + n + '"]').value; };
      var exposure = f('mainExposure'), category = f('category'), keyword = f('keyword').trim().toLowerCase();
      filtered = catalog.filter(function (v) {
        var exposed = occupiesMain(v);
        var videoCategory = v.category || '미분류';
        return (!exposure || (exposure === '노출' && exposed) || (exposure === '미노출' && !exposed)) &&
               (!category || videoCategory === category) &&
               (!keyword || (v.displayTitle + ' ' + v.originalTitle).toLowerCase().includes(keyword));
      });
      page = 1;
      render();
    }
    function ordered() {
      return filtered.slice().sort(function (a, b) {
        var aHome = occupiesMain(a), bHome = occupiesMain(b);
        if (aHome !== bHome) return aHome ? -1 : 1;
        return (b.collectedAt || '').localeCompare(a.collectedAt || '') || b.id - a.id;
      });
    }
    function mainCell(v) {
      if (!isMainSetting(v)) return '—';
      if (occupiesMain(v)) return '<span class="badge">메인</span>';
      var reasons = mainBlockers(v);
      return '<span class="videos-main"><span class="badge videos-main__blocked">노출 불가</span><span class="videos-main__reason">' + escapeText(reasons.join(' · ') || '조건 미충족') + '</span></span>';
    }
    function durationCell(v) {
      if (!v.duration) return '—';
      return '<span class="videos-duration"><svg class="videos-duration__icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.2"></circle><path d="M6.8 5.2v5.6L11.3 8 6.8 5.2Z" fill="currentColor"></path></svg>' + escapeText(v.duration) + '</span>';
    }
    function render() {
      var count = q('#videos-main-count');
      if (count) count.textContent = '메인 노출 ' + mainCount(videos) + '/' + MAIN_LIMIT + '개';
      tbody.innerHTML = ordered().slice((page - 1) * pageSize, page * pageSize).map(function (v) {
        var home = occupiesMain(v);
        return '<tr' + (home ? ' class="is-notice"' : '') + '><td>' + String(v.id) + '</td><td>' + escapeText(v.category || '미분류') + '</td><td><a class="videos-title" href="videos-detail.asp?id=' + encodeURIComponent(v.id) + '">' + escapeText(v.displayTitle || v.originalTitle) + '</a></td><td>' + mainCell(v) + '</td><td>' + durationCell(v) + '</td></tr>';
      }).join('') || '<tr><td colspan="5">검색 결과가 없습니다.</td></tr>';
      var pages = Math.ceil(filtered.length / pageSize);
      nav.hidden = !pages;
      nav.dataset.current = page;
      nav.dataset.total = pages || 1;
      AdminUI.refreshPagination(nav);
    }
    q('#videos-search').onclick = search;
    q('.videos-page .list-filters').addEventListener('select:change', search);
    q('.videos-page [name="keyword"]').onkeydown = function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        search();
      }
    };
    nav.addEventListener('pagination:change', function (e) {
      page = e.detail.page;
      render();
    });
    render();
  }
  Admin.ready(async function () {
    try {
      var dbItems = null;
      try {
        var res = await fetch('proc/video_proc.asp?action=list');
        var json = await res.json();
        if (json && json.success && Array.isArray(json.items)) {
          dbItems = json.items;
        }
      } catch (e) {}

      if (dbItems && dbItems.length > 0) {
        videos = dbItems.map(function (v) {
          return Object.assign({}, v, {
            homeChannels: v.homeChannels || (v.mainSelected ? ['Web', 'App'] : []),
            channels: v.channels || ['Web', 'App'],
            mainSelected: v.mainSelected === true || (Array.isArray(v.homeChannels) && v.homeChannels.length > 0)
          });
        });
      } else {
        var saved = (await ResourceStore.all()).filter(function (v) { return v.kind === 'video'; });
        videos = MockData.videos.map(function (v) {
          var stored = saved.find(function (r) { return String(r.id) === String(v.id); });
          return stored || Object.assign({}, v, {
            homeChannels: v.homeChannels || (v.mainSelected ? ['Web'] : []),
            channels: v.channels || [],
            thumbnail: v.id === 8 ? 'assets/app-video-1.png' : v.id === 7 ? 'assets/app-video-2.png' : v.thumbnail
          });
        });
      }
      videos = videos.filter(function (v) { return v.deleted !== true; }).sort(function (a, b) {
        return (b.collectedAt || '').localeCompare(a.collectedAt || '') || b.id - a.id;
      });
      if (q('#videos-table')) list();
      if (q('#video-form')) await detail();
    } catch (e) {
      var error = document.createElement('p');
      error.className = 'flow-error';
      error.setAttribute('role', 'alert');
      error.textContent = '영상 데이터를 불러오지 못했습니다.';
      q('main').prepend(error);
    }
  });
})();
