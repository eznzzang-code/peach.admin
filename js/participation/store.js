(function(global){
  'use strict';
  const API_URL = 'proc/participation_proc.asp';
  const M = global.PeachSurveyModel;
  let memForms = [];
  let memConsentDefaults = M.consentDefaults();
  let savedSnapshotById = new Map();
  let lastFetchAt = 0;

  function applyPayload(data) {
    if (data && data.consentDefaults) {
      memConsentDefaults = { ...M.consentDefaults(), ...data.consentDefaults };
    }
    if (data && Array.isArray(data.forms)) {
      memForms = data.forms.map(raw => M.prepare(M.clone(raw)));
      savedSnapshotById = new Map(memForms.map(f => [f.id, formSignature(f)]));
    }
    lastFetchAt = Date.now();
  }

  function formSignature(f) {
    return JSON.stringify({
      id: f.id,
      kind: f.kind,
      title: f.title,
      description: f.description,
      status: f.status,
      revision: f.revision,
      isPublic: !!f.isPublic,
      publishedAt: f.publishedAt || null,
      closedAt: f.closedAt || null,
      participationToken: f.participationToken || null,
      settings: f.settings,
      consent: f.consent,
      questions: f.questions
    });
  }

  function requestSync(method, action, paramsObj) {
    const xhr = new XMLHttpRequest();
    const url = method === 'GET'
      ? `${API_URL}?action=${encodeURIComponent(action)}&_=${Date.now()}`
      : `${API_URL}?action=${encodeURIComponent(action)}`;
    xhr.open(method, url, false);
    if (method === 'POST') {
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    }
    const body = method === 'POST' && paramsObj ? new URLSearchParams(paramsObj).toString() : null;
    try {
      xhr.send(body);
    } catch (e) {
      throw new Error('네트워크 연결을 확인해 주세요.');
    }
    if (xhr.status < 200 || xhr.status >= 300) {
      throw new Error(`서버 응답 오류가 발생했습니다. (HTTP ${xhr.status})`);
    }
    try {
      return JSON.parse(xhr.responseText);
    } catch (e) {
      if ((xhr.responseText || '').includes('[DB 연결 오류]')) {
        throw new Error('데이터베이스 연결 오류가 발생했습니다.');
      }
      throw new Error('서버 응답을 처리할 수 없습니다.');
    }
  }

  function refreshFromServer(force) {
    if (!force && lastFetchAt > 0 && (Date.now() - lastFetchAt) < 400) {
      return;
    }
    try {
      const data = requestSync('GET', 'list');
      if (data && data.ok !== false) {
        applyPayload(data);
      }
    } catch (e) {
      // Keep last known memory state if offline/transient error during read
    }
  }

  if (global.__PEACH_PARTICIPATION_BOOTSTRAP__) {
    try {
      applyPayload(global.__PEACH_PARTICIPATION_BOOTSTRAP__);
    } catch (e) {}
  }

  function load() {
    refreshFromServer(lastFetchAt === 0);
    return memForms.map(f => M.prepare(M.clone(f)));
  }

  function defaults() {
    if (lastFetchAt === 0) refreshFromServer(true);
    return { ...M.consentDefaults(), ...memConsentDefaults };
  }

  function save(forms, options = {}) {
    const saveConsentDef = !!options.consentDefaults;
    if (options.consentDefaults) {
      for (const k of ['purpose', 'items', 'retention']) {
        if (options.consentDefaults[k] !== undefined) {
          memConsentDefaults[k] = options.consentDefaults[k];
        }
      }
    }

    const targets = forms.filter(f => savedSnapshotById.get(f.id) !== formSignature(f));
    if (!targets.length && saveConsentDef && forms.length) {
      targets.push(forms[forms.length - 1]);
    }

    for (const f of targets) {
      const endVal = f.settings?.endMode === 'auto'
        ? M.autoEnd(f.settings?.start)
        : (f.settings?.end || '');
      const res = requestSync('POST', 'save', {
        form_id: f.id,
        form_kind: f.kind || 'survey',
        title: f.title || '',
        description: f.description || '',
        status: f.status || 'draft',
        revision: String(f.revision || 1),
        is_public: f.isPublic ? 'Y' : 'N',
        published_at: f.publishedAt || '',
        closed_at: f.closedAt || '',
        participation_token: f.participationToken || '',
        period_start: f.settings?.start || '',
        period_end: endVal || '',
        end_mode: f.settings?.endMode || 'auto',
        completion_msg: f.settings?.completion || '',
        event_type: f.settings?.eventType || '교육',
        schedule_mode: f.settings?.scheduleMode || 'single',
        event_date: f.settings?.date || '',
        event_end_date: f.settings?.eventEnd || '',
        event_place: f.settings?.place || '',
        capacity_enabled: f.settings?.capacityEnabled ? 'Y' : 'N',
        capacity_limit: String(f.settings?.capacity || 30),
        waitlist_enabled: f.settings?.waitlistEnabled ? 'Y' : 'N',
        consent_included: f.consent?.included === false ? 'N' : 'Y',
        consent_title: f.consent?.title || '개인정보 수집·이용 동의',
        consent_purpose: f.consent?.purpose || '',
        consent_items: f.consent?.items || '',
        consent_retention: f.consent?.retention || '',
        questions_json: JSON.stringify(f.questions || []),
        save_consent_def: saveConsentDef ? 'Y' : 'N'
      });
      if (!res || res.ok === false) {
        const err = new Error(res?.message || '저장에 실패했습니다.');
        if (res?.code) err.code = res.code;
        throw err;
      }
    }

    refreshFromServer(true);
  }

  function newForm(kind) {
    const f = M.seed(kind), d = new Date(), pad = n => String(n).padStart(2, '0');
    f.settings.start = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    f.settings.end = M.autoEnd(f.settings.start);
    if (kind === 'event') {
      f.settings.date = '';
      f.settings.eventEnd = '';
      f.settings.place = '';
    }
    f.consent = { ...defaults(), included: true };
    return f;
  }

  function remove(id) {
    const res = requestSync('POST', 'delete', { form_id: id });
    if (!res || res.ok === false) {
      return { ok: false, message: res?.message || '삭제에 실패했습니다.' };
    }
    refreshFromServer(true);
    return { ok: true };
  }

  function visitor() {
    const key = 'peach-survey-prototype:visitor';
    const cookieName = 'peach_survey_visitor=';
    let id = '';
    try { id = localStorage.getItem(key) || ''; } catch (e) {}
    if (!id) {
      try {
        const hit = (document.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(cookieName));
        if (hit) id = decodeURIComponent(hit.slice(cookieName.length));
      } catch (e) {}
    }
    if (!id) {
      id = M.uid();
    }
    try { localStorage.setItem(key, id); } catch (e) {}
    try { document.cookie = `${cookieName}${encodeURIComponent(id)}; max-age=31536000; path=/; SameSite=Lax`; } catch (e) {}
    return { id, name: '비회원 링크 참여' };
  }

  function submit(formId, response, { mode = 'preview', channel = 'app', actor = null, now = new Date() } = {}) {
    if (mode === 'preview') return { ok: true, preview: true };
    if (mode !== 'participation') return { ok: false, message: '잘못된 제출 경로입니다.' };

    refreshFromServer(true);
    const form = memForms.find(f => f.id === formId);
    if (!form) return { ok: false, message: '항목을 찾을 수 없습니다.' };

    const identity = form.kind === 'survey' ? (actor || visitor()) : actor;
    const replay = form.responses.find(r => r.submissionId === response.submissionId);
    if (replay && (form.kind === 'survey' ? replay.respondentId === identity?.id : replay.memberId === actor?.id)) {
      return { ok: true, response: M.clone(replay), replayed: true };
    }
    if (response.formRevision !== undefined && response.formRevision !== form.revision) {
      return { ok: false, message: '문서가 변경되었습니다. 상세에서 다시 시작해 주세요.' };
    }
    const gate = M.gate(form, { now, channel, actor: identity });
    if (!gate.allowed) return { ok: false, message: gate.message };

    const invalid = M.validateResponse(form, response);
    if (invalid) return { ok: false, message: invalid };

    if (form.consent.included && ['title', 'purpose', 'items', 'retention'].some(k => response.consent?.[k] !== form.consent[k])) {
      return { ok: false, message: '동의 안내가 변경되었습니다. 상세에서 다시 시작해 주세요.' };
    }
    if (!M.consentAllowsSubmit(form, response.consent?.agreed)) {
      return { ok: false, message: '개인정보 동의가 필요합니다.' };
    }

    const attendanceChoice = form.kind === 'event' ? M.attendanceOf(response) : '';
    const res = requestSync('POST', 'submit', {
      submission_id: response.submissionId,
      form_id: formId,
      form_revision: String(response.formRevision || form.revision || 1),
      member_id: form.kind === 'event' ? (actor?.id || '') : '',
      member_name: form.kind === 'event' ? (actor?.name || '') : '',
      member_phone: form.kind === 'event' ? (actor?.phone || '') : '',
      respondent_id: form.kind === 'survey' ? (identity?.id || '') : '',
      attendance_choice: attendanceChoice === 'legacy' ? '' : attendanceChoice,
      answers_json: JSON.stringify(response.answers || {}),
      path_json: JSON.stringify(response.path || []),
      consent_agreed: (!form.consent.included || response.consent?.agreed === true) ? 'Y' : 'N',
      consent_snapshot_json: response.consent ? JSON.stringify(response.consent) : ''
    });

    if (!res || res.ok === false) {
      return { ok: false, message: res?.message || '저장에 실패했습니다. 같은 요청으로 다시 제출할 수 있습니다.' };
    }

    refreshFromServer(true);
    const savedForm = memForms.find(f => f.id === formId);
    const savedResp = savedForm?.responses.find(r => r.submissionId === response.submissionId) || {
      ...response,
      enrollment: res.enrollment || null,
      source: 'participation',
      memberId: form.kind === 'event' ? actor?.id : null,
      memberName: form.kind === 'event' ? actor?.name : null,
      respondentId: form.kind === 'survey' ? identity?.id : null
    };
    return { ok: true, response: M.clone(savedResp), replayed: !!res.replayed };
  }

  global.PeachSurveyStore = {
    load,
    save,
    submit,
    newForm,
    defaults,
    visitor,
    remove,
    export: forms => JSON.stringify({ version: 4, forms, consentDefaults: defaults() }, null, 2)
  };
})(window);

