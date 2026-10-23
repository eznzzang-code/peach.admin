function parseEventDateTime(value) {
  var matched = String(value || "").match(/^(\d{4})\.(\d{2})\.(\d{2}) (\d{2}):(\d{2})$/);
  if (!matched) return null;
  var year = Number(matched[1]);
  var month = Number(matched[2]);
  var day = Number(matched[3]);
  var hours = Number(matched[4]);
  var minutes = Number(matched[5]);
  var date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  if (date.getHours() !== hours || date.getMinutes() !== minutes) return null;
  return date;
}

function parseEventDay(value, endOfDay) {
  var matched = String(value || "").match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
  if (!matched) return null;
  var year = Number(matched[1]);
  var month = Number(matched[2]);
  var day = Number(matched[3]);
  var date = new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function addEventCalendarMonths(date, months) {
  var result = new Date(date.getTime());
  var day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  var lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

function recentEventPeriod(months, searchedAt) {
  var end = searchedAt instanceof Date ? new Date(searchedAt.getTime()) : new Date();
  var start = addEventCalendarMonths(end, -months);
  start.setHours(0, 0, 0, 0);
  return { start: start, end: end };
}

function getEventStatus(eventItem, now) {
  var current = now instanceof Date ? now : new Date();
  if (!eventItem) return null;
  if (eventItem.cancelledByOrganizer === true) return "기관취소";
  var start = parseEventDateTime(eventItem.recruitStartAt);
  var end = eventItem.noRecruitEnd === true ? null : parseEventDateTime(eventItem.recruitEndAt);
  if (!start || (eventItem.noRecruitEnd !== true && !end)) {
    console.error("행사 모집 일시를 해석할 수 없습니다.", eventItem.id);
    return null;
  }
  if (eventItem.noRecruitEnd !== true && current.getTime() >= end.getTime()) return "기간마감";
  if (eventItem.capacity != null && Number(eventItem.confirmedCount || 0) >= Number(eventItem.capacity)) return "정원마감";
  if (current.getTime() < start.getTime()) return "모집예정";
  return "모집중";
}

function formatEventCapacity(eventItem) {
  var confirmed = Number(eventItem.confirmedCount || 0);
  if (eventItem.capacity == null) return confirmed + "/무제한";
  return confirmed + "/" + eventItem.capacity;
}

function parseEventClock(value) {
  var matched = String(value || "").match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!matched) return null;
  return { hours: Number(matched[1]), minutes: Number(matched[2]) };
}

function combineEventDateTime(dateValue, timeValue) {
  var day = parseEventDay(dateValue, false);
  var clock = parseEventClock(timeValue);
  if (!day || !clock) return null;
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), clock.hours, clock.minutes, 0, 0);
}

// 화면 검증용 로컬 시각입니다. 초는 버리고 분 단위로 맞춥니다.
// 서버 연동 시에는 이 값을 저장 기준으로 쓰지 않고, 같은 규칙을 서버 시각으로 다시 검증해야 합니다.
function eventLocalNow(now) {
  var current = now instanceof Date ? new Date(now.getTime()) : new Date();
  current.setSeconds(0, 0);
  return current;
}

// 설문 관리 surveyAudienceOptions와 같은 항목입니다. 새 지역·회원 유형을 추가하지 않습니다.
var eventAudienceOptions = {
  regions: [
    { id: "gyeonggi", label: "경기" },
    { id: "gangwon", label: "강원" },
    { id: "chungbuk", label: "충북" },
    { id: "chungnam", label: "충남" },
    { id: "jeonbuk", label: "전북" },
    { id: "jeonnam", label: "전남" },
    { id: "gyeongbuk", label: "경북" },
    { id: "gyeongnam", label: "경남" }
  ],
  memberTypes: [
    { id: "farm", label: "농가" },
    { id: "company", label: "법인" },
    { id: "distribution", label: "유통" },
    { id: "other", label: "기타" }
  ]
};

function eventAudienceIssue(audience) {
  if (!audience || audience.mode == null || audience.mode === "unset") return "대상조건을 선택해 주세요.";
  if (audience.mode === "all") return "";
  if (audience.mode === "conditions") {
    var regions = audience.regions || [];
    var members = audience.memberTypes || [];
    if (!regions.length && !members.length) return "지역 또는 회원 구분을 1개 이상 선택해 주세요.";
    return "";
  }
  return "대상조건을 선택해 주세요.";
}

function eventAudienceNames(ids, options) {
  return (ids || []).map(function (id) {
    var matched = (options || []).filter(function (option) { return option.id === id; })[0];
    return matched ? matched.label : id;
  }).join("·");
}

function eventAudienceLabel(audience) {
  if (eventAudienceIssue(audience)) return "선택한 대상이 없습니다";
  if (audience.mode === "all") return "전체 회원";
  var parts = [];
  if (audience.regions && audience.regions.length) {
    parts.push("지역: " + eventAudienceNames(audience.regions, eventAudienceOptions.regions));
  }
  if (audience.memberTypes && audience.memberTypes.length) {
    parts.push("회원 구분: " + eventAudienceNames(audience.memberTypes, eventAudienceOptions.memberTypes));
  }
  return parts.length ? parts.join(" / ") : "선택한 대상이 없습니다";
}

function eventDraftIdFromLocation() {
  if (!window.URLSearchParams) return "";
  return new URLSearchParams(window.location.search).get("draft") || "";
}

function findEventDraft(id) {
  if (!id || !window.MockData || !MockData.eventDrafts) return null;
  for (var index = 0; index < MockData.eventDrafts.length; index += 1) {
    if (String(MockData.eventDrafts[index].id) === String(id)) return MockData.eventDrafts[index];
  }
  return null;
}

function splitEventStamp(value) {
  var date = parseEventDateTime(value);
  if (!date) return { date: "", time: "" };
  return {
    date: date.getFullYear() + "." + eventPad(date.getMonth() + 1) + "." + eventPad(date.getDate()),
    time: eventPad(date.getHours()) + ":" + eventPad(date.getMinutes())
  };
}

function formatEventStamp(value) {
  var date = parseEventDateTime(value);
  if (!date) return "";
  return String(date.getFullYear()).slice(2) + "/" + eventPad(date.getMonth() + 1) + "/" + eventPad(date.getDate()) + " " + eventPad(date.getHours()) + ":" + eventPad(date.getMinutes());
}

function eventPad(value) {
  return (value < 10 ? "0" : "") + value;
}

function eventQuestionTypeLabel(type) {
  var normalized = eventQuestionType(type);
  if (normalized === "multi") return "복수 선택";
  if (normalized === "text") return "주관식";
  if (normalized === "single") return "단일 선택";
  return "미입력";
}

function eventQuestionType(type) {
  if (type === "multi" || type === "복수 선택") return "multi";
  if (type === "text" || type === "주관식") return "text";
  if (type === "single" || type === "단일 선택") return "single";
  return "";
}

function eventQuestionIssueParts(question) {
  var issue = { title: "", type: "", count: "", choices: {} };
  if (!question || !String(question.title || "").trim()) issue.title = "질문 제목을 입력해 주세요.";
  var type = eventQuestionType(question && question.type);
  if (!type) {
    issue.type = "지원하지 않는 질문 유형입니다.";
    return issue;
  }
  if (type === "text") return issue;
  var choices = question.choices || [];
  if (choices.length < 2) issue.count = "선택지는 2개 이상 입력해 주세요.";
  else if (choices.length > 10) issue.count = "선택지는 10개까지 입력할 수 있습니다.";
  choices.forEach(function (choice, index) {
    if (!String((choice && choice.text) || "").trim()) {
      issue.choices[choice && choice.id ? choice.id : "index-" + index] = "선택지 문구를 입력해 주세요.";
    }
  });
  return issue;
}

function eventQuestionIssueMessage(issue) {
  if (!issue) return "";
  if (issue.title) return issue.title;
  if (issue.type) return issue.type;
  if (issue.count) return issue.count;
  for (var key in issue.choices) {
    if (Object.prototype.hasOwnProperty.call(issue.choices, key) && issue.choices[key]) return issue.choices[key];
  }
  return "";
}

// 추가질문은 행사 참가 신청용입니다. 설문 문항과 저장소를 공유하지 않습니다.
// 형식: { id, type, title, description, required, choices: [{ id, text }], order }
function eventExtraQuestionsIssue(questions) {
  if (questions == null) return "";
  if (!Array.isArray(questions)) return "추가질문을 확인할 수 없습니다.";
  if (!questions.length) return "";
  var seen = {};
  for (var index = 0; index < questions.length; index += 1) {
    var question = questions[index];
    if (question && question.order != null && String(question.order) !== "") {
      var orderKey = String(question.order);
      if (seen[orderKey]) return "질문 순서가 중복되었습니다.";
      seen[orderKey] = true;
    }
  }
  for (var issueIndex = 0; issueIndex < questions.length; issueIndex += 1) {
    var message = eventQuestionIssueMessage(eventQuestionIssueParts(questions[issueIndex]));
    if (message) return message;
  }
  return "";
}

function eventCreateDeferredChecks() {
  return [];
}

function eventIdFromLocation() {
  if (!window.URLSearchParams) return "";
  return new URLSearchParams(window.location.search).get("id") || "";
}

function findEventById(id) {
  if (id == null || id === "" || !window.MockData || !MockData.events) return null;
  for (var index = 0; index < MockData.events.length; index += 1) {
    if (String(MockData.events[index].id) === String(id)) return MockData.events[index];
  }
  return null;
}

// 향후 엑셀에는 신청자 기본 정보, 신청 상태, 추가질문 답변을 포함합니다. 이번 단계에서는 파일을 만들지 않습니다.
var eventApplicantExportColumns = ["applicationId", "memberId", "name", "memberType", "phone", "appliedAt", "status", "answers"];

function eventApplicationsSource() {
  if (!window.MockData || !Array.isArray(MockData.eventApplications)) return [];
  return MockData.eventApplications;
}

function eventApplicationsFor(eventId) {
  var allowedType = { "농가": true, "법인": true, "유통": true, "기타": true };
  var seenValid = {};
  return eventApplicationsSource().filter(function (row) {
    if (!row || String(row.eventId) !== String(eventId)) return false;
    if (row.status !== "신청확정" && row.status !== "신청취소") {
      console.error("지원하지 않는 신청 상태입니다.", row.applicationId);
      return false;
    }
    if (!allowedType[row.memberType]) {
      console.error("지원하지 않는 회원 구분입니다.", row.applicationId);
      return false;
    }
    if (row.status === "신청확정") {
      var key = String(row.memberId);
      if (seenValid[key]) {
        console.error("같은 행사의 유효 신청이 중복되었습니다.", eventId, row.memberId);
        return false;
      }
      seenValid[key] = true;
    }
    return true;
  });
}

function eventApplicantCancelCount(eventId) {
  var rows = eventApplicationsFor(eventId);
  if (!rows.length) return null;
  return rows.filter(function (row) { return row.status === "신청취소"; }).length;
}

function maskEventApplicantPhone(value) {
  var digits = String(value == null ? "" : value).replace(/\D/g, "");
  if (digits.length < 7) return "-";
  return digits.slice(0, 3) + "-****-" + digits.slice(-4);
}

function eventApplicantQuestionView(eventItem, application) {
  var questions = eventItem && eventItem.questions;
  if (!Array.isArray(questions) || !questions.length) return { kind: "none" };
  var answers = application && Array.isArray(application.answers) ? application.answers : [];
  return {
    kind: "list",
    rows: questions.map(function (question) {
      var matched = null;
      for (var index = 0; index < answers.length; index += 1) {
        if (String(answers[index] && answers[index].questionId) === String(question && question.id)) matched = answers[index];
      }
      var raw = matched && matched.value != null ? String(matched.value).trim() : "";
      return {
        title: String(question && question.title || "").trim() || "미입력",
        type: eventQuestionTypeLabel(question && question.type),
        required: question && question.required === false ? "선택" : "필수",
        answer: raw || "-"
      };
    })
  };
}

function eventCalendarDayKey(date) {
  return date.getFullYear() + "-" + eventPad(date.getMonth() + 1) + "-" + eventPad(date.getDate());
}

function eventCalendarMonthStart(date) {
  var source = date instanceof Date ? date : new Date();
  return new Date(source.getFullYear(), source.getMonth(), 1);
}

function eventCalendarShiftMonth(date, amount) {
  var source = eventCalendarMonthStart(date);
  return new Date(source.getFullYear(), source.getMonth() + amount, 1);
}

function eventCalendarStatusClass(status) {
  if (status === "모집예정") return "surveys-status--scheduled";
  if (status === "모집중") return "surveys-status--live";
  if (status === "기간마감") return "surveys-status--ended";
  if (status === "정원마감") return "is-capacity-full";
  if (status === "기관취소") return "is-cancelled";
  return "";
}

// 달력은 행사 시작일에만 배치합니다. 여러 날에 걸친 막대는 그리지 않습니다.
function buildEventCalendar(events, monthDate, now, visibleLimit) {
  var limit = visibleLimit == null ? 3 : visibleLimit;
  var current = now instanceof Date ? now : new Date();
  var month = eventCalendarMonthStart(monthDate);
  var gridStart = new Date(month.getFullYear(), month.getMonth(), 1);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  var monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  var gridEnd = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate());
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));
  var byDay = {};
  (events || []).forEach(function (item) {
    var startAt = parseEventDateTime(item && item.eventAt);
    if (!startAt) return;
    if (startAt.getFullYear() !== month.getFullYear() || startAt.getMonth() !== month.getMonth()) return;
    var key = eventCalendarDayKey(startAt);
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push({
      id: item.id,
      title: item.title || "미등록",
      time: eventPad(startAt.getHours()) + ":" + eventPad(startAt.getMinutes()),
      status: getEventStatus(item, current) || "날짜 오류",
      sort: startAt.getTime()
    });
  });
  Object.keys(byDay).forEach(function (key) {
    byDay[key].sort(function (left, right) {
      if (left.sort !== right.sort) return left.sort - right.sort;
      return Number(left.id) - Number(right.id);
    });
  });
  var cells = [];
  var cursor = new Date(gridStart.getTime());
  while (cursor.getTime() <= gridEnd.getTime()) {
    var key = eventCalendarDayKey(cursor);
    var items = byDay[key] || [];
    cells.push({
      key: key,
      day: cursor.getDate(),
      inMonth: cursor.getMonth() === month.getMonth() && cursor.getFullYear() === month.getFullYear(),
      isToday: key === eventCalendarDayKey(current),
      events: items.slice(0, limit),
      hiddenCount: Math.max(0, items.length - limit),
      all: items
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return {
    year: month.getFullYear(),
    month: month.getMonth() + 1,
    label: month.getFullYear() + "년 " + (month.getMonth() + 1) + "월",
    cells: cells
  };
}

function eventApplicantExportNotice() {
  if (eventApplicantExportColumns.indexOf("status") === -1 || eventApplicantExportColumns.indexOf("answers") === -1) return "";
  return "신청자 엑셀 다운로드 기능은 서버 연동 후 제공됩니다.";
}

function eventInputMatchesStamp(dateText, timeText, stamp) {
  if (!stamp) return false;
  var parts = splitEventStamp(stamp);
  if (!parts.date || !parts.time) return false;
  return String(dateText || "").trim() === parts.date && String(timeText || "").trim() === parts.time;
}

// 확정 신청 인원이 1명 이상이면 행사일시, 모집기간, 모집인원, 대상조건, 추가질문을 수정할 수 없습니다.
// 화면에서 비활성화하는 것과 별개로, 서버 저장 시에도 같은 기준으로 다시 검증해야 합니다.
function getEventEditRestriction(eventItem) {
  var count = eventItem ? Number(eventItem.confirmedCount || 0) : 0;
  var hasApplicants = count >= 1;
  return {
    hasApplicants: hasApplicants,
    confirmedCount: Number.isFinite(count) ? count : 0,
    lockedFields: hasApplicants ? ["eventSchedule", "recruitPeriod", "capacity", "audience", "questions"] : []
  };
}

// 저장된 값이 날짜 순서 정책과 충돌하는 항목입니다. Mock Data는 바꾸지 않습니다.
// 서버 연동 시 기존 데이터 오류는 이 화면 검증과 별도 정책으로 처리해야 합니다.
function eventStoredScheduleIssues(eventItem) {
  var issues = [];
  if (!eventItem) return issues;
  var eventStart = parseEventDateTime(eventItem.eventAt);
  var eventEnd = eventItem.eventNoEnd === true ? null : parseEventDateTime(eventItem.eventEndAt);
  var recruitStart = parseEventDateTime(eventItem.recruitStartAt);
  var recruitEnd = eventItem.noRecruitEnd === true ? null : parseEventDateTime(eventItem.recruitEndAt);
  if (eventStart && eventEnd && eventEnd.getTime() <= eventStart.getTime()) {
    issues.push("행사 종료일시가 시작일시보다 이릅니다.");
  }
  if (eventStart && recruitStart && recruitStart.getTime() > eventStart.getTime()) {
    issues.push("모집 시작일시가 행사 시작일시보다 늦습니다.");
  }
  if (recruitStart && recruitEnd && recruitEnd.getTime() <= recruitStart.getTime()) {
    issues.push("모집 마감일시가 모집 시작일시보다 이릅니다.");
  }
  if (eventStart && recruitEnd && recruitEnd.getTime() > eventStart.getTime()) {
    issues.push("모집 마감일시가 행사 시작일시보다 늦습니다.");
  }
  return issues;
}

function eventScheduleNotice(eventItem) {
  var issues = eventStoredScheduleIssues(eventItem);
  if (!issues.length) return "";
  var text = issues.join(" ");
  if (eventItem.cancelledByOrganizer === true) {
    return text + " 기관취소된 행사는 상세 조회만 가능하여 날짜를 정정할 수 없습니다. 별도 운영자 확인이 필요합니다.";
  }
  if (getEventEditRestriction(eventItem).hasApplicants) {
    return text + " 확정 신청자가 있어 날짜를 정정할 수 없습니다. 별도 운영자 확인이 필요합니다.";
  }
  return text + " 신청자가 없어 수정 화면에서 날짜를 정정할 수 있습니다.";
}

function eventEditNotices(eventItem) {
  var notes = [];
  if (!eventItem) return notes;
  var restriction = getEventEditRestriction(eventItem);
  if (restriction.hasApplicants) {
    notes.push("확정 신청 인원 " + restriction.confirmedCount + "명입니다. 행사일시, 모집기간, 모집인원, 대상조건, 추가질문은 수정할 수 없습니다.");
  }
  var scheduleNotice = eventScheduleNotice(eventItem);
  if (scheduleNotice) notes.push(scheduleNotice);
  if (!eventItem.audience) {
    notes.push(restriction.hasApplicants
      ? "참가 대상조건이 등록되어 있지 않습니다. 확정 신청자가 있어 대상조건은 변경할 수 없습니다."
      : "참가 대상조건이 등록되어 있지 않습니다. 수정하려면 대상조건을 선택해 주세요.");
  }
  return notes;
}

function validateEventCreate(input, now, original, options) {
  var source = input || {};
  var errors = [];
  var current = eventLocalNow(now);
  // skipLocked는 확정 신청자가 있는 수정입니다. 잠긴 날짜·대상 오류가 행사명 등 수정 가능 항목을 막지 않습니다.
  // 서버 연동 시에는 같은 제한을 서버에서 다시 검증해야 합니다.
  var skipLocked = !!(options && options.skipLocked);
  if (!String(source.title || "").trim()) addEventCreateError(errors, "title", "행사명을 입력해 주세요.");
  if (!String(source.intro || "").trim()) addEventCreateError(errors, "intro", "소개를 입력해 주세요.");
  if (skipLocked) {
    return { errors: errors, deferred: eventCreateDeferredChecks(source) };
  }
  var keepEventStart = !!(original && eventInputMatchesStamp(source.eventStartDate, source.eventStartTime, original.eventAt));
  var eventStart = readEventEndpoint(source, "eventStart", "행사 시작", errors, current, !keepEventStart);
  var eventEnd = readOptionalEventEnd(source, errors);
  if (source.eventNoEnd !== true && eventStart && eventEnd && eventEnd.getTime() <= eventStart.getTime()) {
    addEventCreateError(errors, "eventEnd", "행사 종료일시는 시작일시보다 이후여야 합니다.");
  }

  var keepRecruitStart = !!(original && eventInputMatchesStamp(source.recruitStartDate, source.recruitStartTime, original.recruitStartAt));
  var recruitStart = readEventEndpoint(source, "recruitStart", "모집 시작", errors, current, !keepRecruitStart);
  if (eventStart && recruitStart && recruitStart.getTime() > eventStart.getTime()) {
    addEventCreateError(errors, "recruitStart", "모집 시작일시는 행사 시작일시보다 늦을 수 없습니다.");
  }
  readEventEndpoint(source, "recruitEnd", "모집 마감", errors, current, false);
  var recruitEnd = source.recruitNoEnd === true ? null : combineEventDateTime(source.recruitEndDate, source.recruitEndTime);
  if (source.recruitNoEnd !== true && recruitStart && recruitEnd && recruitEnd.getTime() <= recruitStart.getTime()) {
    addEventCreateError(errors, "recruitEnd", "모집 마감일시는 모집 시작일시보다 이후여야 합니다.");
  } else if (source.recruitNoEnd !== true && eventStart && recruitEnd && recruitEnd.getTime() > eventStart.getTime()) {
    addEventCreateError(errors, "recruitEnd", "모집 마감일시는 행사 시작일시보다 늦을 수 없습니다.");
  }

  if (source.unlimited !== true) {
    var capacityText = String(source.capacityText == null ? "" : source.capacityText).trim();
    if (!capacityText) addEventCreateError(errors, "capacity", "모집인원을 입력해 주세요.");
    else if (!/^\d+$/.test(capacityText) || Number(capacityText) < 1) {
      addEventCreateError(errors, "capacity", "모집인원은 1명 이상의 정수로 입력해 주세요.");
    }
  }

  var audienceIssue = eventAudienceIssue(source.audience);
  if (audienceIssue) addEventCreateError(errors, "audience", audienceIssue);

  var questionIssue = eventExtraQuestionsIssue(source.questions);
  if (questionIssue) addEventCreateError(errors, "questions", questionIssue);

  return {
    errors: errors,
    deferred: eventCreateDeferredChecks(source)
  };
}

function readOptionalEventEnd(source, errors) {
  if (source.eventNoEnd === true) return null;
  if (!String(source.eventEndDate || "").trim()) return null;
  return readEventEndpoint(source, "eventEnd", "행사 종료", errors, eventLocalNow(), false);
}

function readEventEndpoint(source, key, label, errors, now, requiredFuture) {
  var skipped = (key === "eventEnd" && source.eventNoEnd === true) || (key === "recruitEnd" && source.recruitNoEnd === true);
  if (skipped) return null;
  var dateKey = key + "Date";
  var timeKey = key + "Time";
  var dateText = String(source[dateKey] || "").trim();
  var timeText = String(source[timeKey] || "").trim();
  if (!dateText) {
    addEventCreateError(errors, key, label + "일을 선택해 주세요.");
    return null;
  }
  if (!parseEventDay(dateText, false)) {
    addEventCreateError(errors, key, label + "일이 올바르지 않습니다.");
    return null;
  }
  if (!timeText) {
    addEventCreateError(errors, key, label + "시간을 선택해 주세요.");
    return null;
  }
  if (!parseEventClock(timeText)) {
    addEventCreateError(errors, key, label + "시간은 HH:MM 형식으로 입력해 주세요.");
    return null;
  }
  var date = combineEventDateTime(dateText, timeText);
  if (!date) {
    addEventCreateError(errors, key, label + "일시가 올바르지 않습니다.");
    return null;
  }
  if (requiredFuture && date.getTime() < now.getTime()) {
    addEventCreateError(errors, key, label + "일시는 현재 또는 미래만 선택할 수 있습니다.");
  }
  return date;
}

function addEventCreateError(errors, key, message) {
  if (errors.some(function (item) { return item.key === key; })) return;
  errors.push({ key: key, message: message });
}

Admin.ready(function () {
  var table = Admin.qs("#events-table");
  if (!table || !window.MockData || !MockData.events) return;

  var pageSize = 10;
  var state = { page: 1, status: "" };
  var now = new Date();
  var applied = { period: "all", customStart: "", customEnd: "", field: "titleBody", keyword: "" };
  var sorted = MockData.events.slice().sort(function (a, b) {
    if (a.registeredAt !== b.registeredAt) return a.registeredAt < b.registeredAt ? 1 : -1;
    return b.id - a.id;
  });
  var filtered = sorted.slice();

  var draftButton = Admin.qs("#events-drafts");
  var noticeNode = document.getElementById("event-notice");
  if (draftButton) {
    var draftCount = MockData.eventDrafts ? MockData.eventDrafts.length : 0;
    draftButton.textContent = "임시저장 (" + draftCount + ")";
  }

  var nav = Admin.qs(".events-page [data-pagination]");
  var keywordInput = Admin.qs('.events-page [name="keyword"]');
  var customRow = Admin.qs("#events-custom-period");
  var periodError = Admin.qs("#events-period-error");
  var periodSelect = closestSelect("period");
  var deleteButton = Admin.qs("#events-delete");
  var deleteConfirm = Admin.qs("#event-delete-confirm");

  if (nav) {
    nav.addEventListener("pagination:change", function (event) {
      state.page = event.detail.page;
      renderRows();
    });
  }

  Admin.qsa(".events-page [data-event-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      state.status = tab.getAttribute("data-event-tab") || "";
      state.page = 1;
      setTabs(state.status);
      refresh();
    });
  });
  if (periodSelect) {
    periodSelect.addEventListener("select:change", function (event) {
      if (customRow) customRow.hidden = event.detail.value !== "custom";
      if (event.detail.value !== "custom") clearPeriodError();
    });
  }
  var eventsFilters = Admin.qs(".events-page .list-filters");
  if (eventsFilters) {
    eventsFilters.addEventListener("select:change", function (event) {
      if (event.detail && event.detail.value === "custom") return;
      runSearch();
    });
  }

  var searchButton = Admin.qs("#events-search");
  if (searchButton) searchButton.addEventListener("click", runSearch);
  if (keywordInput) {
    keywordInput.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      runSearch();
    });
  }
  if (deleteButton) {
    deleteButton.addEventListener("click", function (event) {
      event.preventDefault();
      if (deleteButton.disabled) return;
      if (!selectedEvents().length) {
        syncDelete();
        return;
      }
      if (deleteConfirm) deleteConfirm.disabled = false;
      if (window.AdminUI) AdminUI.openModal("modal-event-delete");
    });
  }
  if (deleteConfirm) {
    deleteConfirm.addEventListener("click", function () {
      deleteConfirm.disabled = true;
      var selected = selectedEvents();
      if (!selected.length) {
        openNotice("삭제할 행사를 선택해 주세요.");
        return;
      }
      // TODO: 행사 삭제 API 연동. 확인 후에도 목록 데이터는 바꾸지 않습니다.
      openNotice("서버가 연결되지 않아 행사를 삭제할 수 없습니다.");
    });
  }
  table.addEventListener("change", syncDelete);

  refresh();

  function openNotice(message) {
    if (noticeNode) noticeNode.textContent = message;
    if (window.AdminUI) AdminUI.openModal("modal-event-notice");
  }

  function runSearch() {
    if (!commitInputs()) return;
    state.page = 1;
    refresh();
  }

  function commitInputs() {
    var period = fieldValue("period") || "all";
    var next = {
      period: period,
      customStart: "",
      customEnd: "",
      field: fieldValue("field") || "titleBody",
      keyword: keywordInput ? keywordInput.value.trim() : ""
    };
    if (period === "custom") {
      next.customStart = fieldValue("periodStart");
      next.customEnd = fieldValue("periodEnd");
      var error = customPeriodError(next.customStart, next.customEnd);
      if (error) {
        showPeriodError(error);
        return false;
      }
    }
    var months = Number(period);
    if (months === 1 || months === 3 || months === 6) {
      var range = recentEventPeriod(months, new Date());
      next.rangeStart = range.start.getTime();
      next.rangeEnd = range.end.getTime();
    }
    clearPeriodError();
    applied = next;
    return true;
  }

  function refresh() {
    now = new Date();
    filtered = sorted.filter(matches);
    syncPagination();
    renderRows();
  }

  function matches(item) {
    var status = getEventStatus(item, now);
    if (state.status && status !== state.status) return false;
    if (!matchesPeriod(item)) return false;
    return matchesKeyword(item);
  }

  function matchesPeriod(item) {
    if (!applied.period || applied.period === "all") return true;
    // 기간 검색은 행사 시작일시 기준입니다. 모집기간과는 별개입니다.
    var start = parseEventDateTime(item.eventAt);
    if (!start) return false;
    if (applied.period === "custom") {
      var from = parseEventDay(applied.customStart, false);
      var to = parseEventDay(applied.customEnd, true);
      if (!from || !to) return false;
      return start.getTime() >= from.getTime() && start.getTime() <= to.getTime();
    }
    var months = Number(applied.period);
    if (months !== 1 && months !== 3 && months !== 6) return true;
    if (typeof applied.rangeStart !== "number" || typeof applied.rangeEnd !== "number") return false;
    return start.getTime() >= applied.rangeStart && start.getTime() <= applied.rangeEnd;
  }

  function matchesKeyword(item) {
    if (!applied.keyword) return true;
    var needle = applied.keyword.toLowerCase();
    var title = String(item.title || "").toLowerCase();
    var body = String(item.body || "").toLowerCase();
    if (applied.field === "title") return title.indexOf(needle) !== -1;
    if (applied.field === "body") return body.indexOf(needle) !== -1;
    return title.indexOf(needle) !== -1 || body.indexOf(needle) !== -1;
  }

  function customPeriodError(startValue, endValue) {
    if (!startValue || !endValue) return "시작일과 종료일을 모두 선택해 주세요.";
    var start = parseEventDay(startValue, false);
    var end = parseEventDay(endValue, true);
    if (!start || !end) {
      console.error("직접 기간의 날짜 형식이 올바르지 않습니다.", startValue, endValue);
      return "날짜 형식이 올바르지 않습니다.";
    }
    if (parseEventDay(startValue, false).getTime() > parseEventDay(endValue, false).getTime()) {
      return "시작일은 종료일보다 늦을 수 없습니다.";
    }
    return "";
  }

  function showPeriodError(message) {
    if (!periodError) return;
    periodError.textContent = message;
    periodError.hidden = false;
  }

  function clearPeriodError() {
    if (!periodError) return;
    periodError.textContent = "";
    periodError.hidden = true;
  }

  function syncPagination() {
    if (!nav) return;
    var totalPages = Math.ceil(filtered.length / pageSize);
    if (!totalPages) {
      nav.hidden = true;
      return;
    }
    nav.hidden = false;
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;
    nav.setAttribute("data-current", String(state.page));
    nav.setAttribute("data-total", String(totalPages));
    if (window.AdminUI) AdminUI.refreshPagination(nav);
  }

  function renderRows() {
    var tbody = Admin.qs("tbody", table);
    var master = Admin.qs("[data-check-all]", table);
    if (master) {
      master.checked = false;
      master.indeterminate = false;
    }
    if (!filtered.length) {
      var message = sorted.length ? "검색 결과가 없습니다." : "등록된 행사가 없습니다.";
      tbody.innerHTML = '<tr><td class="events-empty" colspan="7">' + message + "</td></tr>";
      syncDelete();
      return;
    }
    var start = (state.page - 1) * pageSize;
    var rows = filtered.slice(start, start + pageSize);
    tbody.innerHTML = rows.map(function (item, index) {
      var status = getEventStatus(item, now);
      var displayNo = filtered.length - start - index;
      var statusText = status || "날짜 오류";
      var recruit = formatRecruit(item);
      var rowClass = status === "정원마감" ? ' class="is-capacity-full"' : "";
      return (
        "<tr" + rowClass + ">" +
          '<td class="table__check"><label class="checkbox"><input type="checkbox" data-event-id="' + escapeHtml(item.id) + '"><span class="checkbox__box" aria-hidden="true"></span><span class="sr-only">' + displayNo + '번 선택</span></label></td>' +
          "<td>" + displayNo + "</td>" +
          '<td><a class="events-title" href="events-detail.html?id=' + encodeURIComponent(item.id) + '" title="' + escapeHtml(item.title) + '">' + escapeHtml(item.title) + "</a></td>" +
          "<td>" + escapeHtml(formatEventAt(item.eventAt)) + "</td>" +
          '<td title="' + escapeHtml(recruit) + '">' + escapeHtml(recruit) + "</td>" +
          "<td>" + escapeHtml(formatEventCapacity(item)) + "</td>" +
          "<td>" + escapeHtml(statusText) + "</td>" +
        "</tr>"
      );
    }).join("");
    syncDelete();
  }

  function selectedEvents() {
    return Admin.qsa("#events-table tbody input[data-event-id]:checked").map(function (box) {
      var id = box.getAttribute("data-event-id");
      return sorted.filter(function (item) { return String(item.id) === String(id); })[0];
    }).filter(Boolean);
  }

  function syncDelete() {
    if (!deleteButton) return;
    deleteButton.disabled = selectedEvents().length === 0;
  }

  function setTabs(status) {
    Admin.qsa(".events-page [data-event-tab]").forEach(function (tab) {
      var active = (tab.getAttribute("data-event-tab") || "") === status;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function closestSelect(name) {
    var input = Admin.qs('.events-page [name="' + name + '"]');
    return input ? input.closest("[data-select]") : null;
  }

  function fieldValue(name) {
    var input = Admin.qs('.events-page [name="' + name + '"]');
    return input ? input.value : "";
  }

  function formatEventAt(value) {
    var date = parseEventDateTime(value);
    if (!date) return "";
    return shortDate(date, "/") + " " + pad(date.getHours()) + ":" + pad(date.getMinutes());
  }

  function formatRecruit(item) {
    var start = parseEventDateTime(item.recruitStartAt);
    if (!start) return "";
    var startText = shortDate(start, ".");
    if (item.noRecruitEnd === true) return startText + " ~ 종료일 없음";
    var end = parseEventDateTime(item.recruitEndAt);
    if (!end) return startText;
    return startText + " ~ " + shortDate(end, ".");
  }

  function shortDate(date, separator) {
    return String(date.getFullYear()).slice(2) + separator + pad(date.getMonth() + 1) + separator + pad(date.getDate());
  }

  function pad(value) {
    return (value < 10 ? "0" : "") + value;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
});

Admin.ready(function () {
  var form = Admin.qs("#event-form");
  if (!form) return;

  var eventCreateState = {
    audience: null,
    questions: []
  };
  var selectedFiles = [];
  var restoredFiles = [];
  var eventCreateMode = "create";
  var sourceEvent = null;
  var initialSnapshot = "";
  var pendingHref = "events-list.html";
  var allowUnload = false;

  var titleInput = Admin.qs("#event-title");
  var introInput = Admin.qs("#event-intro");
  var placeInput = Admin.qs("#event-place");
  var eventStartDate = Admin.qs("#event-start-date");
  var eventStartTime = Admin.qs("#event-start-time");
  var eventEndDate = Admin.qs("#event-end-date");
  var eventEndTime = Admin.qs("#event-end-time");
  var eventNoEnd = Admin.qs("#event-no-end");
  var recruitStartDate = Admin.qs("#event-recruit-start-date");
  var recruitStartTime = Admin.qs("#event-recruit-start-time");
  var recruitEndDate = Admin.qs("#event-recruit-end-date");
  var recruitEndTime = Admin.qs("#event-recruit-end-time");
  var recruitNoEnd = Admin.qs("#event-recruit-no-end");
  var capacityInput = Admin.qs("#event-capacity");
  var unlimitedInput = Admin.qs("#event-unlimited");
  var targetLabel = Admin.qs("#event-target-label");
  var questionCount = Admin.qs("#event-question-count");

  var requestedEventId = eventIdFromLocation();
  if (requestedEventId) sourceEvent = findEventById(requestedEventId);
  if (requestedEventId && (!sourceEvent || sourceEvent.cancelledByOrganizer === true)) {
    presentEventCreateBlocked(sourceEvent);
    return;
  }

  initEventTimePickers();
  var requestedDraftId = requestedEventId ? "" : eventDraftIdFromLocation();
  var sourceDraft = findEventDraft(requestedDraftId);
  if (sourceEvent) applyEventRecord(sourceEvent);
  else if (sourceDraft) applyEventDraft(sourceDraft);
  form.setAttribute("data-event-mode", eventCreateMode);
  bindEventFiles();
  renderEventCreateState();
  syncEventClosed(eventNoEnd, eventEndDate, eventEndTime);
  syncEventClosed(recruitNoEnd, recruitEndDate, recruitEndTime);
  syncEventCapacity();
  if (sourceEvent && getEventEditRestriction(sourceEvent).hasApplicants) lockEventEditFields();
  initialSnapshot = eventCreateSnapshot();
  if (requestedDraftId && !sourceDraft) {
    openEventCreateNotice("임시저장 행사를 찾을 수 없습니다.");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
  });

  var eventEndMemory = { date: "", time: "18:00" };
  var recruitEndMemory = { date: "", time: "18:00" };
  if (eventNoEnd) {
    eventNoEnd.addEventListener("change", function () {
      toggleEventNoEnd(eventNoEnd, eventEndDate, eventEndTime, eventEndMemory);
      clearEventError("eventEnd");
    });
  }
  if (recruitNoEnd) {
    recruitNoEnd.addEventListener("change", function () {
      toggleEventNoEnd(recruitNoEnd, recruitEndDate, recruitEndTime, recruitEndMemory);
      clearEventError("recruitEnd");
    });
  }
  if (unlimitedInput) {
    unlimitedInput.addEventListener("change", function () {
      syncEventCapacity();
      clearEventError("capacity");
    });
  }

  bindEventCreateModals();
  Admin.qs("#event-preview").addEventListener("click", function () {
    openEventPreview();
  });
  Admin.qs("#event-draft").addEventListener("click", function () {
    openEventCreateNotice("서버가 연결되지 않아 임시저장할 수 없습니다.");
  });
  Admin.qs("#event-submit").addEventListener("click", function () {
    clearEventErrors();
    var original = eventCreateMode === "edit" ? sourceEvent : null;
    var restriction = original ? getEventEditRestriction(original) : null;
    var result = validateEventCreate(readEventCreateInput(), new Date(), original, {
      skipLocked: !!(restriction && restriction.hasApplicants)
    });
    if (result.errors.length) {
      showEventErrors(result.errors);
      return;
    }
    openEventCreateNotice(eventCreateMode === "edit"
      ? "서버가 연결되지 않아 행사 정보를 수정할 수 없습니다."
      : "서버가 연결되지 않아 행사를 등록할 수 없습니다.");
  });

  document.addEventListener("click", function (event) {
    if (allowUnload || event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest("a[href]");
    if (!link || link.target === "_blank") return;
    if (!link.closest(".sidebar, .header, .events-create")) return;
    var href = link.getAttribute("href") || "";
    if (!href || href.charAt(0) === "#") return;
    if (eventCreateSnapshot() === initialSnapshot) return;
    event.preventDefault();
    pendingHref = link.href;
    if (window.AdminUI) AdminUI.openModal("modal-event-leave");
  });

  window.addEventListener("beforeunload", function (event) {
    if (allowUnload || eventCreateSnapshot() === initialSnapshot) return;
    event.preventDefault();
    event.returnValue = "";
  });

  var leaveConfirm = Admin.qs("#event-leave-confirm");
  if (leaveConfirm) {
    leaveConfirm.addEventListener("click", function () {
      allowUnload = true;
      window.location.href = pendingHref;
    });
  }

  function applyEventDraft(draft) {
    eventCreateMode = "resume";
    var modeLabel = document.getElementById("event-page-mode");
    if (modeLabel) modeLabel.textContent = "이어 작성";
    document.title = "행사 이어 작성 | 복숭아자조금 관리자";
    restoreEventFields(draft);
  }

  function applyEventRecord(record) {
    eventCreateMode = "edit";
    var modeLabel = document.getElementById("event-page-mode");
    if (modeLabel) modeLabel.textContent = "수정";
    document.title = "행사 수정 | 복숭아자조금 관리자";
    var submitButton = document.getElementById("event-submit");
    if (submitButton) submitButton.textContent = "수정";
    var draftButton = document.getElementById("event-draft");
    if (draftButton) draftButton.hidden = true;
    form.setAttribute("data-event-id", String(record.id));
    restoreEventFields(record);
    var restriction = getEventEditRestriction(record);
    form.setAttribute("data-event-lock-fields", restriction.lockedFields.join(" "));
    var limitNote = document.getElementById("event-edit-limit");
    var notices = eventEditNotices(record);
    if (limitNote && notices.length) {
      limitNote.hidden = false;
      limitNote.textContent = notices.join("\n");
    }
  }

  function presentEventCreateBlocked(record) {
    form.hidden = true;
    var limitNote = document.getElementById("event-edit-limit");
    if (limitNote) limitNote.hidden = true;
    var modeLabel = document.getElementById("event-page-mode");
    var separator = document.querySelector(".events-create .page-title__sep");
    if (modeLabel) modeLabel.hidden = true;
    if (separator) separator.hidden = true;
    var panel = document.getElementById("event-create-blocked");
    var message = document.getElementById("event-create-blocked-message");
    var detailLink = document.getElementById("event-create-blocked-detail");
    if (message) {
      message.textContent = record
        ? "기관취소된 행사는 상세 조회만 할 수 있습니다."
        : "행사를 찾을 수 없습니다.";
    }
    if (detailLink) {
      if (record) {
        detailLink.hidden = false;
        detailLink.href = "events-detail.html?id=" + encodeURIComponent(record.id);
      } else {
        detailLink.hidden = true;
      }
    }
    if (panel) panel.hidden = false;
    document.title = record ? "행사 상세 | 복숭아자조금 관리자" : "행사 수정 | 복숭아자조금 관리자";
  }

  function lockEventEditFields() {
    [eventStartDate, eventStartTime, eventEndDate, eventEndTime, eventNoEnd, recruitStartDate, recruitStartTime, recruitEndDate, recruitEndTime, recruitNoEnd, capacityInput, unlimitedInput].forEach(function (input) {
      if (!input) return;
      input.disabled = true;
      var picker = input.closest(".datepicker, .event-time");
      if (picker) picker.classList.add("is-disabled");
    });
    var targetButton = document.getElementById("event-target");
    var questionButton = document.getElementById("event-questions");
    if (targetButton) targetButton.disabled = true;
    if (questionButton) questionButton.disabled = true;
  }

  function restoreEventFields(draft) {
    if (titleInput && draft.title != null) titleInput.value = String(draft.title);
    if (introInput) {
      if (draft.body != null) introInput.value = String(draft.body);
      else if (draft.intro != null) introInput.value = String(draft.intro);
    }
    if (placeInput && draft.place != null) placeInput.value = String(draft.place);
    restoreEventStamp(draft.eventAt, eventStartDate, eventStartTime);
    if (draft.eventNoEnd === true && eventNoEnd) eventNoEnd.checked = true;
    else restoreEventStamp(draft.eventEndAt, eventEndDate, eventEndTime);
    restoreEventStamp(draft.recruitStartAt, recruitStartDate, recruitStartTime);
    if (draft.noRecruitEnd === true && recruitNoEnd) recruitNoEnd.checked = true;
    else restoreEventStamp(draft.recruitEndAt, recruitEndDate, recruitEndTime);
    if (Object.prototype.hasOwnProperty.call(draft, "capacity")) {
      if (draft.capacity == null) {
        if (unlimitedInput) unlimitedInput.checked = true;
        if (capacityInput) capacityInput.value = "";
      } else {
        if (unlimitedInput) unlimitedInput.checked = false;
        if (capacityInput) capacityInput.value = String(draft.capacity);
      }
    }
    if (draft.audience && typeof draft.audience === "object") {
      eventCreateState.audience = {
        mode: draft.audience.mode || "unset",
        regions: (draft.audience.regions || []).slice(),
        memberTypes: (draft.audience.memberTypes || []).slice()
      };
    }
    if (Array.isArray(draft.questions)) eventCreateState.questions = cloneEventDraftQuestions(draft.questions);
    if (Array.isArray(draft.files)) {
      restoredFiles = draft.files.map(function (file) {
        if (typeof file === "string") return { name: file };
        return { name: file && file.name ? String(file.name) : "" };
      }).filter(function (file) { return file.name; });
    }
  }

  function restoreEventStamp(value, dateInput, timeInput) {
    if (!value) return;
    var parts = splitEventStamp(value);
    if (dateInput && parts.date) dateInput.value = parts.date;
    if (timeInput && parts.time) timeInput.value = parts.time;
  }

  function cloneEventDraftQuestions(list) {
    return list.map(function (question) {
      return {
        id: question.id,
        type: question.type,
        title: question.title,
        description: question.description || "",
        required: question.required !== false,
        choices: (question.choices || []).map(function (choice) {
          return { id: choice.id, text: choice.text };
        }),
        order: question.order
      };
    });
  }

  function openEventPreview() {
    var body = document.getElementById("event-preview-body");
    var modal = document.getElementById("event-preview-modal");
    if (!body || !modal) return;
    body.innerHTML = renderEventPreviewMarkup(readEventCreateInput(), eventPreviewFileNames());
    modal.hidden = false;
    document.body.classList.add("is-modal-open");
    var closeButton = document.getElementById("event-preview-close");
    if (closeButton) closeButton.focus();
  }

  function closeEventPreview() {
    var modal = document.getElementById("event-preview-modal");
    if (modal) modal.hidden = true;
    if (!document.querySelector(".modal:not([hidden])")) document.body.classList.remove("is-modal-open");
    var previewButton = document.getElementById("event-preview");
    if (previewButton) previewButton.focus();
  }

  function eventPreviewFileNames() {
    return restoredFiles.map(function (file) { return file.name; }).concat(selectedFiles.map(function (file) { return file.name; }));
  }

  function renderEventPreviewMarkup(input, fileNames) {
    var period = eventPreviewRange(input.eventStartDate, input.eventStartTime, input.eventEndDate, input.eventEndTime, input.eventNoEnd);
    var recruit = eventPreviewRange(input.recruitStartDate, input.recruitStartTime, input.recruitEndDate, input.recruitEndTime, input.recruitNoEnd);
    var questions = input.questions || [];
    var questionMarkup = questions.length ? questions.map(function (question, index) {
      return eventPreviewQuestionMarkup(question, index);
    }).join("") : '<p class="survey-preview__empty">미입력</p>';
    return eventPreviewLine("행사명", input.title) +
      eventPreviewLine("행사 소개", input.intro, true) +
      eventPreviewLine("행사일시", period.text, false, period.missing) +
      eventPreviewLine("행사 장소", input.place) +
      eventPreviewLine("모집기간", recruit.text, false, recruit.missing) +
      eventPreviewLine("모집인원", eventPreviewCapacity(input)) +
      eventPreviewLine("참가 대상", eventAudienceIssue(input.audience) ? "" : eventAudienceLabel(input.audience)) +
      eventPreviewLine("첨부파일", fileNames.length ? fileNames.join(", ") : "") +
      '<h3 class="survey-preview__heading">추가질문</h3>' + questionMarkup;
  }

  function eventPreviewLine(label, value, preserve, forceMissing) {
    var text = String(value == null ? "" : value).trim();
    var missing = !text || forceMissing === true;
    var shown = text || "미입력";
    return '<p class="survey-preview__meta"><span>' + escapeEventText(label) + ": </span><span" + (missing ? ' class="survey-preview__missing"' : "") + ">" + (preserve && !missing ? escapeEventText(shown).replace(/\n/g, "<br>") : escapeEventText(shown)) + "</span></p>";
  }

  function eventPreviewRange(startDate, startTime, endDate, endTime, noEnd) {
    var startDateText = String(startDate || "").trim();
    var endDateText = String(endDate || "").trim();
    var start = [startDateText, String(startTime || "").trim()].filter(Boolean).join(" ");
    var end = noEnd === true ? "종료일 없음" : [endDateText, String(endTime || "").trim()].filter(Boolean).join(" ");
    if (!startDateText && noEnd !== true && !endDateText) return { text: "", missing: true };
    return {
      text: (startDateText ? start : "미입력") + " ~ " + (noEnd === true || endDateText ? end : "미입력"),
      missing: !startDateText || (noEnd !== true && !endDateText)
    };
  }

  function eventPreviewCapacity(input) {
    if (input.unlimited === true) return "정원 제한 없음";
    var text = String(input.capacityText == null ? "" : input.capacityText).trim();
    if (!text || text === "0") return "";
    return text + "명";
  }

  function eventPreviewQuestionMarkup(question, index) {
    var title = String(question.title || "").trim();
    var description = String(question.description || "").trim();
    var type = eventQuestionTypeLabel(question.type);
    var required = question.required !== false;
    var choices = question.type === "text" ? "" : (question.choices || []).map(function (choice, choiceIndex) {
      var choiceText = String(choice && choice.text || "").trim();
      return "<li>" + escapeEventText(choiceText || "미입력") + "</li>";
    }).join("");
    return '<section class="survey-preview__question">' +
      "<h3>" + (index + 1) + ". " + (title ? escapeEventText(title) : '<span class="survey-preview__missing">미입력</span>') +
      (required ? ' <span class="required">*</span> 필수' : " 선택") + "</h3>" +
      (description ? '<p class="survey-preview__desc">' + escapeEventText(description) + "</p>" : "") +
      "<p>유형: " + escapeEventText(type) + (question.type === "text" ? " · 최대 1,000자" : "") + "</p>" +
      (choices ? "<ol>" + choices + "</ol>" : "") +
      "</section>";
  }

  var previewModal = document.getElementById("event-preview-modal");
  if (previewModal) {
    previewModal.addEventListener("click", function (event) {
      if (event.target.closest("[data-event-preview-close]")) closeEventPreview();
    });
  }
  document.addEventListener("keydown", function (event) {
    if (!previewModal || previewModal.hidden || event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    closeEventPreview();
  }, true);

  function renderEventCreateState() {
    if (targetLabel) {
      var label = eventAudienceLabel(eventCreateState.audience);
      targetLabel.value = label;
      targetLabel.title = label;
      targetLabel.classList.toggle("is-set", !eventAudienceIssue(eventCreateState.audience));
    }
    if (questionCount) questionCount.textContent = eventCreateState.questions.length + "개";
  }

  function readEventCreateInput() {
    return {
      title: titleInput ? titleInput.value : "",
      intro: introInput ? introInput.value : "",
      place: placeInput ? placeInput.value : "",
      eventStartDate: valueOf(eventStartDate),
      eventStartTime: valueOf(eventStartTime),
      eventEndDate: eventNoEnd && eventNoEnd.checked ? "" : valueOf(eventEndDate),
      eventEndTime: eventNoEnd && eventNoEnd.checked ? "" : valueOf(eventEndTime),
      eventNoEnd: !!(eventNoEnd && eventNoEnd.checked),
      recruitStartDate: valueOf(recruitStartDate),
      recruitStartTime: valueOf(recruitStartTime),
      recruitEndDate: recruitNoEnd && recruitNoEnd.checked ? "" : valueOf(recruitEndDate),
      recruitEndTime: recruitNoEnd && recruitNoEnd.checked ? "" : valueOf(recruitEndTime),
      recruitNoEnd: !!(recruitNoEnd && recruitNoEnd.checked),
      capacityText: capacityInput ? capacityInput.value : "",
      unlimited: !!(unlimitedInput && unlimitedInput.checked),
      audience: eventCreateState.audience,
      questions: eventCreateState.questions
    };
  }

  function eventCreateSnapshot() {
    var input = readEventCreateInput();
    input.files = selectedFiles.map(function (file) { return file.name + ":" + file.size; });
    input.restoredFiles = restoredFiles.map(function (file) { return file.name; });
    return JSON.stringify(input);
  }

  function valueOf(input) {
    return input ? input.value : "";
  }

  function toggleEventNoEnd(checkbox, dateInput, timeInput, memory) {
    if (checkbox.checked) {
      memory.date = dateInput ? dateInput.value : "";
      memory.time = timeInput && timeInput.value ? timeInput.value : memory.time;
      if (dateInput) dateInput.value = "";
      if (timeInput) timeInput.value = "";
    } else {
      if (dateInput && !dateInput.value) dateInput.value = memory.date;
      if (timeInput && !timeInput.value) timeInput.value = memory.time || "18:00";
    }
    syncEventClosed(checkbox, dateInput, timeInput);
  }

  function syncEventClosed(checkbox, dateInput, timeInput) {
    var closed = !!(checkbox && checkbox.checked);
    [dateInput, timeInput].forEach(function (input) {
      if (!input) return;
      input.disabled = closed;
      var picker = input.closest(".datepicker, .event-time");
      if (picker) picker.classList.toggle("is-disabled", closed);
      if (closed && picker && picker.hasAttribute("data-event-time")) closeEventTime(picker);
    });
  }

  function syncEventCapacity() {
    var unlimited = !!(unlimitedInput && unlimitedInput.checked);
    if (!capacityInput) return;
    capacityInput.disabled = unlimited;
  }

  function showEventErrors(errors) {
    var focusTarget = null;
    errors.forEach(function (error) {
      var node = document.getElementById(eventErrorId(error.key));
      if (node) {
        node.textContent = error.message;
        node.hidden = false;
      }
      eventErrorFields(error.key).forEach(function (input) {
        if (input) input.classList.add("is-invalid");
      });
      if (!focusTarget) focusTarget = eventErrorFields(error.key)[0] || document.getElementById(eventErrorButton(error.key));
    });
    if (focusTarget && typeof focusTarget.focus === "function") focusTarget.focus();
  }

  function clearEventErrors() {
    ["eventStart", "eventEnd", "title", "intro", "recruitStart", "recruitEnd", "capacity", "audience", "questions"].forEach(clearEventError);
  }

  function clearEventError(key) {
    var node = document.getElementById(eventErrorId(key));
    if (node) {
      node.textContent = "";
      node.hidden = true;
    }
    eventErrorFields(key).forEach(function (input) {
      if (input) input.classList.remove("is-invalid");
    });
  }

  function eventErrorId(key) {
    var ids = {
      eventStart: "event-start-error",
      eventEnd: "event-end-error",
      title: "event-title-error",
      intro: "event-intro-error",
      recruitStart: "event-recruit-start-error",
      recruitEnd: "event-recruit-end-error",
      capacity: "event-capacity-error",
      audience: "event-audience-error",
      questions: "event-question-error"
    };
    return ids[key] || "";
  }

  function eventErrorFields(key) {
    var fields = {
      eventStart: [eventStartDate, eventStartTime],
      eventEnd: [eventEndDate, eventEndTime],
      title: [titleInput],
      intro: [introInput],
      recruitStart: [recruitStartDate, recruitStartTime],
      recruitEnd: [recruitEndDate, recruitEndTime],
      capacity: [capacityInput],
      audience: [targetLabel],
      questions: []
    };
    return fields[key] || [];
  }

  function eventErrorButton(key) {
    if (key === "audience") return "event-target";
    if (key === "questions") return "event-questions";
    return "";
  }

  function openEventCreateNotice(message) {
    var notice = document.getElementById("event-create-notice");
    if (notice) notice.textContent = message;
    if (window.AdminUI) AdminUI.openModal("modal-event-create-notice");
  }

  function bindEventFiles() {
    var zone = Admin.qs("#event-file-upload");
    if (!zone) return;
    var input = zone.querySelector(".upload__input");
    var hint = zone.querySelector(".upload__hint");
    var icon = zone.querySelector(".upload__icon");
    var list = zone.querySelector(".events-files");
    var pick = zone.querySelector(".upload__pick");

    function paint() {
      var restoredMarkup = restoredFiles.map(function (file, index) {
        return "<li><span>" + escapeEventText(file.name) + '</span><button type="button" data-event-restored-remove="' + index + '">제거</button></li>';
      }).join("");
      var selectedMarkup = selectedFiles.map(function (file, index) {
        return "<li><span>" + escapeEventText(file.name) + '</span><button type="button" data-event-file-remove="' + index + '">제거</button></li>';
      }).join("");
      var hasFile = restoredFiles.length > 0 || selectedFiles.length > 0;
      zone.classList.toggle("is-selected", hasFile);
      if (hint) hint.hidden = hasFile;
      if (icon) icon.hidden = hasFile;
      if (list) {
        list.hidden = !hasFile;
        list.innerHTML = restoredMarkup + selectedMarkup;
      }
      if (typeof DataTransfer === "function" && input) {
        var transfer = new DataTransfer();
        selectedFiles.forEach(function (file) {
          if (typeof File !== "undefined" && file instanceof File) transfer.items.add(file);
        });
        input.files = transfer.files;
      }
    }

    zone.addEventListener("click", function (event) {
      if (event.target.closest(".upload__pick") || event.target.closest("[data-event-file-remove]") || event.target === input) return;
      input.click();
    });
    if (pick) {
      pick.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        input.click();
      });
    }
    input.addEventListener("change", function () {
      selectedFiles = Array.prototype.slice.call(input.files || []);
      paint();
    });
    list.addEventListener("click", function (event) {
      var restoredButton = event.target.closest("[data-event-restored-remove]");
      var button = event.target.closest("[data-event-file-remove]");
      if (!restoredButton && !button) return;
      event.preventDefault();
      event.stopPropagation();
      if (restoredButton) restoredFiles.splice(Number(restoredButton.getAttribute("data-event-restored-remove")), 1);
      else selectedFiles.splice(Number(button.getAttribute("data-event-file-remove")), 1);
      paint();
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
      selectedFiles = selectedFiles.concat(Array.prototype.slice.call(event.dataTransfer.files));
      paint();
    });
    paint();
  }

  function initEventTimePickers() {
    Admin.qsa("[data-event-time]").forEach(function (picker) {
      var input = picker.querySelector("input");
      if (!input) return;
      var popup = document.createElement("div");
      popup.className = "event-time__popup";
      popup.hidden = true;
      popup.setAttribute("role", "dialog");
      popup.setAttribute("aria-label", input.getAttribute("aria-label") || "시간 선택");
      popup.innerHTML = '<div class="event-time__col"><span class="event-time__caption">시</span><div class="event-time__frame"><div class="event-time__list" data-event-time-part="hour"></div></div></div>' +
        '<div class="event-time__col"><span class="event-time__caption">분</span><div class="event-time__frame"><div class="event-time__list" data-event-time-part="minute"></div></div></div>';
      picker.appendChild(popup);
      fillEventTimeList(popup.querySelector('[data-event-time-part="hour"]'), 24);
      fillEventTimeList(popup.querySelector('[data-event-time-part="minute"]'), 60);
      input.addEventListener("click", function () { openEventTime(picker); });
      input.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openEventTime(picker);
      });
      popup.addEventListener("click", function (event) {
        event.stopPropagation();
        var option = event.target.closest("[data-value]");
        if (!option) return;
        scrollEventTimeItem(option.closest(".event-time__list"), option);
        applyEventTime(picker);
      });
    });
    document.addEventListener("click", function (event) {
      if (event.target.closest("[data-event-time]")) return;
      Admin.qsa("[data-event-time].is-open").forEach(closeEventTime);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      var openPicker = Admin.qs("[data-event-time].is-open");
      if (!openPicker) return;
      event.preventDefault();
      closeEventTime(openPicker);
    });
  }

  function fillEventTimeList(list, count) {
    var html = '<div class="event-time__pad"></div>';
    for (var value = 0; value < count; value += 1) {
      html += '<button type="button" class="event-time__option" data-value="' + value + '">' + eventTimePad(value) + "</button>";
    }
    html += '<div class="event-time__pad"></div>';
    list.innerHTML = html;
  }

  function eventTimePad(value) {
    return value < 10 ? "0" + value : String(value);
  }

  function openEventTime(picker) {
    var input = picker.querySelector("input");
    if (!input || input.disabled || picker.classList.contains("is-disabled")) return;
    Admin.qsa("[data-event-time].is-open").forEach(function (other) {
      if (other !== picker) closeEventTime(other);
    });
    var clock = parseEventClock(input.value) || { hours: 0, minutes: 0 };
    var popup = picker.querySelector(".event-time__popup");
    popup.hidden = false;
    picker.classList.add("is-open");
    input.setAttribute("aria-expanded", "true");
    scrollEventTimePart(picker, "hour", clock.hours);
    scrollEventTimePart(picker, "minute", clock.minutes);
    markEventTime(picker, clock.hours, clock.minutes);
  }

  function closeEventTime(picker) {
    var popup = picker.querySelector(".event-time__popup");
    var input = picker.querySelector("input");
    if (popup) popup.hidden = true;
    picker.classList.remove("is-open");
    if (input) input.setAttribute("aria-expanded", "false");
  }

  function scrollEventTimePart(picker, part, value) {
    var list = picker.querySelector('[data-event-time-part="' + part + '"]');
    scrollEventTimeItem(list, list.querySelector('[data-value="' + value + '"]'));
  }

  function scrollEventTimeItem(list, option) {
    if (!list || !option) return;
    list.scrollTop = option.offsetTop - (list.clientHeight - option.offsetHeight) / 2;
  }

  function applyEventTime(picker) {
    var input = picker.querySelector("input");
    var hours = centeredEventTime(picker.querySelector('[data-event-time-part="hour"]'));
    var minutes = centeredEventTime(picker.querySelector('[data-event-time-part="minute"]'));
    var next = eventTimePad(hours) + ":" + eventTimePad(minutes);
    markEventTime(picker, hours, minutes);
    if (input.value === next) return;
    input.value = next;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function centeredEventTime(list) {
    var options = list.querySelectorAll("[data-value]");
    var middle = list.getBoundingClientRect().top + list.clientHeight / 2;
    var selected = options[0];
    var distance = Infinity;
    Array.prototype.forEach.call(options, function (option) {
      var rect = option.getBoundingClientRect();
      var gap = Math.abs(rect.top + rect.height / 2 - middle);
      if (gap < distance) {
        distance = gap;
        selected = option;
      }
    });
    return selected ? Number(selected.getAttribute("data-value")) : 0;
  }

  function markEventTime(picker, hours, minutes) {
    markEventTimeList(picker.querySelector('[data-event-time-part="hour"]'), hours);
    markEventTimeList(picker.querySelector('[data-event-time-part="minute"]'), minutes);
  }

  function markEventTimeList(list, value) {
    Array.prototype.forEach.call(list.querySelectorAll("[data-value]"), function (option) {
      var selected = Number(option.getAttribute("data-value")) === value;
      option.classList.toggle("is-selected", selected);
    });
  }

  function escapeEventText(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function bindEventCreateModals() {
    var targetButton = Admin.qs("#event-target");
    var questionButton = Admin.qs("#event-questions");
    var targetModal = Admin.qs("#modal-event-target");
    var questionModal = Admin.qs("#modal-event-questions");
    if (targetButton) targetButton.addEventListener("click", openEventTargetModal);
    if (questionButton) questionButton.addEventListener("click", openEventQuestionEditor);
    if (!targetModal && !questionModal) return;

    var targetDraft = cloneEventAudience(null);
    var targetBaseline = "";
    var targetRegionGroup = Admin.qs("#event-target-region-group");
    var targetMemberGroup = Admin.qs("#event-target-member-group");
    var targetFields = Admin.qs("#event-target-fields");
    var targetSummary = Admin.qs("#event-target-summary");
    var targetModalError = Admin.qs("#event-target-modal-error");
    var targetDiscard = Admin.qs("#event-target-discard");

    var editorQuestions = [];
    var selectedQuestionId = "";
    var questionSeq = 0;
    var choiceSeq = 0;
    var questionErrorMap = {};
    var editorBaseline = "";
    var dragQuestionId = "";
    var suppressQuestionClick = false;
    var questionItems = Admin.qs("#event-question-items");
    var questionEmpty = Admin.qs("#event-question-empty");
    var questionEditor = Admin.qs("#event-question-editor");
    var questionPlaceholder = Admin.qs("#event-question-placeholder");
    var questionEditorTitle = Admin.qs("#event-question-editor-title");
    var questionTitle = Admin.qs("#event-q-title");
    var questionDescription = Admin.qs("#event-q-description");
    var questionRequired = Admin.qs("#event-q-required");
    var questionTitleError = Admin.qs("#event-q-title-error");
    var questionChoiceError = Admin.qs("#event-q-choice-error");
    var choiceFields = Admin.qs("#event-choice-fields");
    var choiceList = Admin.qs("#event-choice-list");
    var choiceAdd = Admin.qs("#event-choice-add");
    var textAnswer = Admin.qs("#event-text-answer");
    var questionWarn = Admin.qs("#event-question-warn");
    var questionDeleteConfirm = Admin.qs("#event-question-delete-confirm");
    var questionDiscard = Admin.qs("#event-question-discard");
    var questionTypeSelect = Admin.qs("#event-q-type") ? Admin.qs("#event-q-type").closest(".select") : null;

    renderEventTargetOptions();

    var targetApply = Admin.qs("#event-target-apply");
    var targetCancel = Admin.qs("#event-target-cancel");
    var targetDiscardOk = Admin.qs("#event-target-discard-ok");
    if (targetApply) targetApply.addEventListener("click", applyEventTargetModal);
    if (targetCancel) targetCancel.addEventListener("click", requestCloseEventTargetModal);
    if (targetDiscardOk) targetDiscardOk.addEventListener("click", discardEventTargetModal);
    if (targetDiscard) {
      targetDiscard.addEventListener("click", function (event) {
        if (event.target.closest("[data-event-target-dismiss]")) hideEventTargetDiscard();
      });
    }
    if (targetModal) {
      targetModal.addEventListener("change", function (event) {
        if (!event.target.closest("#modal-event-target")) return;
        readEventTargetDraft();
        paintEventTargetModal();
        hideEventTargetError();
      });
    }

    var questionAdd = Admin.qs("#event-question-add");
    var questionApply = Admin.qs("#event-question-apply");
    if (questionAdd) questionAdd.addEventListener("click", addEventQuestion);
    if (choiceAdd) choiceAdd.addEventListener("click", addEventChoice);
    var questionDeleteCancel = Admin.qs("#event-question-delete-cancel");
    var questionDeleteOk = Admin.qs("#event-question-delete-ok");
    var questionDiscardCancel = Admin.qs("#event-question-discard-cancel");
    var questionDiscardOk = Admin.qs("#event-question-discard-ok");
    var questionWarnCancel = Admin.qs("#event-question-warn-cancel");
    var questionWarnOk = Admin.qs("#event-question-warn-ok");
    if (questionDeleteCancel) questionDeleteCancel.addEventListener("click", hideEventQuestionDelete);
    if (questionDeleteOk) questionDeleteOk.addEventListener("click", confirmDeleteEventQuestion);
    if (questionDeleteConfirm) {
      questionDeleteConfirm.addEventListener("click", function (event) {
        if (event.target.closest("[data-event-question-delete-dismiss]")) hideEventQuestionDelete();
      });
    }
    if (questionDiscardCancel) questionDiscardCancel.addEventListener("click", hideEventQuestionDiscard);
    if (questionDiscardOk) questionDiscardOk.addEventListener("click", discardEventQuestionEditor);
    if (questionWarnCancel) questionWarnCancel.addEventListener("click", hideEventQuestionWarn);
    if (questionWarnOk) questionWarnOk.addEventListener("click", confirmEventTextType);
    Admin.qsa(".js-event-question-close").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        requestCloseEventQuestionEditor();
      });
    });
    if (questionApply) {
      questionApply.addEventListener("click", function (event) {
        event.preventDefault();
        applyEventQuestionEditor();
      });
    }
    if (questionTypeSelect) {
      questionTypeSelect.addEventListener("select:change", function (event) {
        changeEventQuestionType(event.detail.value);
      });
    }
    if (questionTitle) {
      questionTitle.addEventListener("input", function () {
        var question = selectedEventQuestion();
        if (!question) return;
        question.title = questionTitle.value;
        var issue = questionErrorMap[question.id];
        if (issue && String(question.title || "").trim()) {
          issue.title = "";
          questionTitle.classList.remove("is-invalid");
          if (questionTitleError) questionTitleError.hidden = true;
          if (!issue.count && eventChoiceIssueCount(issue) === 0) delete questionErrorMap[question.id];
        }
        renderEventQuestionList();
      });
    }
    if (questionDescription) {
      questionDescription.addEventListener("input", function () {
        var question = selectedEventQuestion();
        if (!question) return;
        question.description = questionDescription.value;
      });
    }
    if (questionRequired) {
      questionRequired.addEventListener("change", function () {
        var question = selectedEventQuestion();
        if (!question) return;
        question.required = questionRequired.checked;
      });
    }
    if (choiceList) {
      choiceList.addEventListener("input", function (event) {
        var input = event.target.closest("[data-choice-id]");
        var question = selectedEventQuestion();
        if (!input || !question) return;
        question.choices.forEach(function (choice) {
          if (choice.id === input.getAttribute("data-choice-id")) choice.text = input.value;
        });
        clearEventChoiceIssue(question, input.getAttribute("data-choice-id"), input);
      });
      choiceList.addEventListener("click", function (event) {
        var button = event.target.closest("[data-choice-remove]");
        if (!button || button.disabled) return;
        removeEventChoice(button.getAttribute("data-choice-remove"));
      });
    }
    if (questionItems) {
      questionItems.addEventListener("click", function (event) {
        if (suppressQuestionClick) {
          suppressQuestionClick = false;
          return;
        }
        var item = event.target.closest("[data-question-id]");
        if (!item) return;
        var questionId = item.getAttribute("data-question-id");
        if (event.target.closest("[data-question-duplicate]")) {
          duplicateEventQuestion(questionId);
          return;
        }
        if (event.target.closest("[data-question-delete]")) {
          askDeleteEventQuestion(questionId);
          return;
        }
        selectEventQuestion(questionId);
      });
      questionItems.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        var text = event.target.closest(".survey-question-item__text");
        if (!text || event.target !== text) return;
        event.preventDefault();
        selectEventQuestion(text.closest("[data-question-id]").getAttribute("data-question-id"));
      });
      questionItems.addEventListener("dragstart", function (event) {
        var grip = event.target.closest(".survey-question-item__grip");
        var item = grip ? grip.closest("[data-question-id]") : null;
        if (!grip || !item || !event.dataTransfer) {
          event.preventDefault();
          return;
        }
        dragQuestionId = item.getAttribute("data-question-id");
        suppressQuestionClick = true;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", dragQuestionId);
        if (event.dataTransfer.setDragImage) event.dataTransfer.setDragImage(item, 16, 16);
        item.classList.add("is-dragging");
      });
      questionItems.addEventListener("dragover", function (event) {
        if (!dragQuestionId) return;
        var item = event.target.closest("[data-question-id]");
        if (!item || !questionItems.contains(item)) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
        var rect = item.getBoundingClientRect();
        var after = event.clientY >= rect.top + rect.height / 2;
        clearEventDropMarkers();
        item.classList.add(after ? "is-drop-after" : "is-drop-before");
      });
      questionItems.addEventListener("drop", function (event) {
        if (!dragQuestionId) return;
        event.preventDefault();
        var item = event.target.closest("[data-question-id]");
        if (!item || !questionItems.contains(item)) return;
        var fromId = dragQuestionId;
        var toId = item.getAttribute("data-question-id");
        var after = item.classList.contains("is-drop-after");
        dragQuestionId = "";
        window.setTimeout(function () {
          suppressQuestionClick = false;
          moveEventQuestion(fromId, toId, after);
        }, 0);
      });
      questionItems.addEventListener("dragend", function () {
        dragQuestionId = "";
        clearEventDragStyles();
        window.setTimeout(function () {
          suppressQuestionClick = false;
        }, 0);
      });
    }

    document.addEventListener("click", function (event) {
      if (!questionModal || questionModal.hidden) return;
      var closer = event.target.closest("[data-modal-close]");
      if (!closer || !questionModal.contains(closer)) return;
      event.preventDefault();
      event.stopPropagation();
      requestCloseEventQuestionEditor();
    }, true);

    document.addEventListener("keydown", function (event) {
      if (!questionModal || questionModal.hidden || event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      if (questionDiscard && !questionDiscard.hidden) {
        hideEventQuestionDiscard();
        return;
      }
      if (questionDeleteConfirm && !questionDeleteConfirm.hidden) {
        hideEventQuestionDelete();
        return;
      }
      requestCloseEventQuestionEditor();
    }, true);

    document.addEventListener("click", function (event) {
      if (!targetModal || targetModal.hidden) return;
      var closer = event.target.closest("[data-modal-close]");
      if (!closer || !targetModal.contains(closer)) return;
      event.preventDefault();
      event.stopPropagation();
      requestCloseEventTargetModal();
    }, true);

    document.addEventListener("keydown", function (event) {
      if (!targetModal || targetModal.hidden || event.key !== "Escape") return;
      if (questionModal && !questionModal.hidden) return;
      event.preventDefault();
      event.stopPropagation();
      if (targetDiscard && !targetDiscard.hidden) {
        hideEventTargetDiscard();
        return;
      }
      requestCloseEventTargetModal();
    }, true);

    function openEventTargetModal() {
      targetDraft = cloneEventAudience(eventCreateState.audience);
      hideEventTargetError();
      hideEventTargetDiscard();
      paintEventTargetModal();
      targetBaseline = eventTargetSnapshot();
      if (window.AdminUI) AdminUI.openModal("modal-event-target");
    }

    function applyEventTargetModal() {
      readEventTargetDraft();
      if (targetDraft.mode === "unset") {
        showEventTargetError("대상조건을 선택해 주세요.");
        return;
      }
      if (targetDraft.mode === "conditions" && !targetDraft.regions.length && !targetDraft.memberTypes.length) {
        showEventTargetError("지역 또는 회원 구분을 1개 이상 선택해 주세요.");
        return;
      }
      var next = cloneEventAudience(targetDraft);
      if (next.mode === "all") {
        next.regions = [];
        next.memberTypes = [];
      }
      eventCreateState.audience = next;
      renderEventCreateState();
      clearEventError("audience");
      hideEventTargetDiscard();
      targetBaseline = eventTargetSnapshot();
      if (window.AdminUI) AdminUI.closeModal("modal-event-target");
    }

    function requestCloseEventTargetModal() {
      readEventTargetDraft();
      if (eventTargetSnapshot() === targetBaseline) {
        hideEventTargetDiscard();
        if (window.AdminUI) AdminUI.closeModal("modal-event-target");
        return;
      }
      if (targetDiscard) targetDiscard.hidden = false;
    }

    function discardEventTargetModal() {
      hideEventTargetDiscard();
      targetDraft = cloneEventAudience(eventCreateState.audience);
      if (window.AdminUI) AdminUI.closeModal("modal-event-target");
    }

    function hideEventTargetDiscard() {
      if (targetDiscard) targetDiscard.hidden = true;
    }

    function renderEventTargetOptions() {
      var regions = Admin.qs("#event-target-regions");
      var members = Admin.qs("#event-target-members");
      if (regions) {
        regions.innerHTML = eventAudienceOptions.regions.map(function (option) {
          return eventTargetCheckbox("region", option);
        }).join("");
      }
      if (members) {
        members.innerHTML = eventAudienceOptions.memberTypes.map(function (option) {
          return eventTargetCheckbox("member", option);
        }).join("");
      }
    }

    function eventTargetCheckbox(group, option) {
      return '<label class="checkbox"><input type="checkbox" value="' + option.id + '" data-event-target-group="' + group + '"><span class="checkbox__box" aria-hidden="true"></span><span class="checkbox__text">' + escapeEventText(option.label) + "</span></label>";
    }

    function paintEventTargetModal() {
      Admin.qsa('input[name="event-target-mode"]').forEach(function (input) {
        input.checked = input.value === targetDraft.mode;
      });
      Admin.qsa("[data-event-target-group='region']").forEach(function (input) {
        input.checked = targetDraft.regions.indexOf(input.value) !== -1;
      });
      Admin.qsa("[data-event-target-group='member']").forEach(function (input) {
        input.checked = targetDraft.memberTypes.indexOf(input.value) !== -1;
      });
      var enabled = targetDraft.mode === "conditions";
      if (targetRegionGroup) targetRegionGroup.disabled = !enabled;
      if (targetMemberGroup) targetMemberGroup.disabled = !enabled;
      if (targetFields) targetFields.classList.toggle("is-disabled", !enabled);
      if (targetSummary) targetSummary.textContent = "선택 결과: " + eventAudienceDraftLabel(targetDraft);
    }

    function readEventTargetDraft() {
      var selectedMode = document.querySelector('input[name="event-target-mode"]:checked');
      targetDraft.mode = selectedMode ? selectedMode.value : "unset";
      targetDraft.regions = checkedEventTargetValues("region");
      targetDraft.memberTypes = checkedEventTargetValues("member");
    }

    function checkedEventTargetValues(group) {
      return Admin.qsa("[data-event-target-group='" + group + "']:checked").map(function (input) {
        return input.value;
      });
    }

    function eventTargetSnapshot() {
      return JSON.stringify(cloneEventAudience(targetDraft));
    }

    function showEventTargetError(message) {
      if (!targetModalError) return;
      targetModalError.textContent = message;
      targetModalError.hidden = false;
    }

    function hideEventTargetError() {
      if (!targetModalError) return;
      targetModalError.textContent = "";
      targetModalError.hidden = true;
    }

    function openEventQuestionEditor() {
      editorQuestions = cloneEventQuestions(eventCreateState.questions);
      questionSeq = 0;
      choiceSeq = 0;
      editorQuestions.forEach(rememberEventQuestionIds);
      selectedQuestionId = editorQuestions.length ? editorQuestions[0].id : "";
      questionErrorMap = {};
      hideEventQuestionWarn();
      hideEventQuestionDelete();
      hideEventQuestionDiscard();
      normalizeEventQuestionOrder();
      renderEventQuestionEditor();
      editorBaseline = eventQuestionSnapshot();
      if (window.AdminUI) AdminUI.openModal("modal-event-questions");
    }

    function applyEventQuestionEditor() {
      commitEventQuestionFields();
      normalizeEventQuestionOrder();
      var result = validateEventQuestionEditor();
      questionErrorMap = result.map;
      if (result.firstId) selectedQuestionId = result.firstId;
      renderEventQuestionEditor();
      if (result.firstId) {
        focusEventQuestionIssue();
        return;
      }
      eventCreateState.questions = cloneEventQuestions(editorQuestions);
      renderEventCreateState();
      clearEventError("questions");
      editorBaseline = eventQuestionSnapshot();
      hideEventQuestionDiscard();
      if (window.AdminUI) AdminUI.closeModal("modal-event-questions");
    }

    function requestCloseEventQuestionEditor() {
      if (questionDeleteConfirm && !questionDeleteConfirm.hidden) {
        hideEventQuestionDelete();
        return;
      }
      commitEventQuestionFields();
      if (eventQuestionSnapshot() === editorBaseline) {
        hideEventQuestionDiscard();
        if (window.AdminUI) AdminUI.closeModal("modal-event-questions");
        return;
      }
      hideEventQuestionDelete();
      if (questionDiscard) questionDiscard.hidden = false;
    }

    function discardEventQuestionEditor() {
      hideEventQuestionDiscard();
      editorQuestions = cloneEventQuestions(eventCreateState.questions);
      if (window.AdminUI) AdminUI.closeModal("modal-event-questions");
    }

    function hideEventQuestionDiscard() {
      if (questionDiscard) questionDiscard.hidden = true;
    }

    function addEventQuestion() {
      commitEventQuestionFields();
      questionSeq += 1;
      var question = {
        id: "eq" + questionSeq,
        type: "single",
        title: "",
        description: "",
        required: true,
        choices: [newEventChoice(), newEventChoice()],
        order: editorQuestions.length + 1
      };
      editorQuestions.push(question);
      selectedQuestionId = question.id;
      hideEventQuestionWarn();
      hideEventQuestionDelete();
      renderEventQuestionEditor();
    }

    function duplicateEventQuestion(sourceId) {
      commitEventQuestionFields();
      var index = eventQuestionIndex(sourceId || selectedQuestionId);
      var source = index < 0 ? null : editorQuestions[index];
      if (!source || index < 0) return;
      questionSeq += 1;
      var copy = cloneEventQuestion(source);
      copy.id = "eq" + questionSeq;
      copy.choices = (copy.choices || []).map(function (choice) {
        choiceSeq += 1;
        return { id: "ec" + choiceSeq, text: choice.text };
      });
      editorQuestions.splice(index + 1, 0, copy);
      selectedQuestionId = copy.id;
      hideEventQuestionWarn();
      hideEventQuestionDelete();
      renderEventQuestionEditor();
    }

    function askDeleteEventQuestion(sourceId) {
      if (sourceId && sourceId !== selectedQuestionId) selectEventQuestion(sourceId);
      if (!selectedEventQuestion()) return;
      hideEventQuestionWarn();
      hideEventQuestionDiscard();
      if (questionDeleteConfirm) {
        questionDeleteConfirm.hidden = false;
        if (questionDeleteCancel) questionDeleteCancel.focus();
      }
    }

    function hideEventQuestionDelete() {
      if (questionDeleteConfirm) questionDeleteConfirm.hidden = true;
    }

    function confirmDeleteEventQuestion() {
      var index = eventQuestionIndex(selectedQuestionId);
      if (index < 0) {
        hideEventQuestionDelete();
        return;
      }
      var removedId = editorQuestions[index].id;
      editorQuestions.splice(index, 1);
      delete questionErrorMap[removedId];
      if (!editorQuestions.length) selectedQuestionId = "";
      else if (index >= editorQuestions.length) selectedQuestionId = editorQuestions[editorQuestions.length - 1].id;
      else selectedQuestionId = editorQuestions[index].id;
      hideEventQuestionDelete();
      hideEventQuestionWarn();
      renderEventQuestionEditor();
    }

    function selectEventQuestion(id) {
      if (!id || id === selectedQuestionId) return;
      commitEventQuestionFields();
      selectedQuestionId = id;
      hideEventQuestionWarn();
      renderEventQuestionEditor();
    }

    function moveEventQuestion(fromId, toId, after) {
      commitEventQuestionFields();
      var from = eventQuestionIndex(fromId);
      var to = eventQuestionIndex(toId);
      if (from < 0 || to < 0 || from === to) return;
      var moved = editorQuestions.splice(from, 1)[0];
      to = eventQuestionIndex(toId);
      editorQuestions.splice(after ? to + 1 : to, 0, moved);
      renderEventQuestionEditor();
    }

    function clearEventDropMarkers() {
      if (!questionItems) return;
      Admin.qsa(".survey-question-item", questionItems).forEach(function (item) {
        item.classList.remove("is-drop-before", "is-drop-after");
      });
    }

    function clearEventDragStyles() {
      if (!questionItems) return;
      Admin.qsa(".survey-question-item", questionItems).forEach(function (item) {
        item.classList.remove("is-dragging", "is-drop-before", "is-drop-after");
      });
    }

    function newEventChoice() {
      choiceSeq += 1;
      return { id: "ec" + choiceSeq, text: "" };
    }

    function eventQuestionIndex(id) {
      for (var i = 0; i < editorQuestions.length; i += 1) {
        if (editorQuestions[i].id === id) return i;
      }
      return -1;
    }

    function rememberEventQuestionIds(question) {
      var questionNumber = /^eq(\d+)$/.exec(question.id || "");
      if (questionNumber) questionSeq = Math.max(questionSeq, Number(questionNumber[1]));
      (question.choices || []).forEach(function (choice) {
        var choiceNumber = /^ec(\d+)$/.exec(choice.id || "");
        if (choiceNumber) choiceSeq = Math.max(choiceSeq, Number(choiceNumber[1]));
      });
    }

    function cloneEventQuestions(list) {
      return (list || []).map(cloneEventQuestion);
    }

    function cloneEventQuestion(question) {
      return {
        id: question.id,
        type: question.type,
        title: question.title,
        description: question.description || "",
        required: question.required !== false,
        choices: (question.choices || []).map(function (choice) {
          return { id: choice.id, text: choice.text };
        }),
        order: question.order
      };
    }

    function normalizeEventQuestionOrder() {
      editorQuestions.forEach(function (question, index) {
        question.order = index + 1;
      });
    }

    function eventQuestionSnapshot() {
      normalizeEventQuestionOrder();
      return JSON.stringify(cloneEventQuestions(editorQuestions));
    }

    function validateEventQuestionEditor() {
      var map = {};
      var firstId = "";
      var orders = {};
      editorQuestions.forEach(function (question) {
        var issue = eventQuestionIssueParts(question);
        if (issue.type) issue.count = issue.type;
        if (question.order != null && String(question.order) !== "") {
          var orderKey = String(question.order);
          if (orders[orderKey]) issue.count = issue.count || "질문 순서가 중복되었습니다.";
          orders[orderKey] = true;
        }
        if (issue.title || issue.type || issue.count || eventChoiceIssueCount(issue) > 0) {
          map[question.id] = issue;
          if (!firstId) firstId = question.id;
        }
      });
      return { map: map, firstId: firstId };
    }

    function eventChoiceIssueCount(issue) {
      var count = 0;
      if (!issue || !issue.choices) return 0;
      for (var key in issue.choices) {
        if (Object.prototype.hasOwnProperty.call(issue.choices, key)) count += 1;
      }
      return count;
    }

    function focusEventQuestionIssue() {
      window.setTimeout(function () {
        var question = selectedEventQuestion();
        var issue = question ? questionErrorMap[question.id] : null;
        if (issue && issue.title && questionTitle) {
          questionTitle.focus();
          return;
        }
        var field = choiceList ? choiceList.querySelector(".is-invalid") : null;
        if (field) field.focus();
      }, 0);
    }

    function selectedEventQuestion() {
      return editorQuestions.filter(function (question) {
        return question.id === selectedQuestionId;
      })[0] || null;
    }

    function commitEventQuestionFields() {
      var question = selectedEventQuestion();
      if (!question || !questionTitle) return;
      question.title = questionTitle.value;
      question.description = questionDescription ? questionDescription.value : "";
      question.required = !!(questionRequired && questionRequired.checked);
      if (!choiceList || question.type === "text") return;
      Admin.qsa("[data-choice-id]", choiceList).forEach(function (input) {
        question.choices.forEach(function (choice) {
          if (choice.id === input.getAttribute("data-choice-id")) choice.text = input.value;
        });
      });
    }

    function addEventChoice() {
      var question = selectedEventQuestion();
      if (!question || question.type === "text" || question.choices.length >= 10) return;
      commitEventQuestionFields();
      question.choices.push(newEventChoice());
      renderEventChoices(question);
    }

    function removeEventChoice(choiceId) {
      var question = selectedEventQuestion();
      if (!question || question.choices.length <= 2) return;
      commitEventQuestionFields();
      question.choices = question.choices.filter(function (choice) {
        return choice.id !== choiceId;
      });
      renderEventChoices(question);
    }

    function changeEventQuestionType(nextType) {
      var question = selectedEventQuestion();
      if (!question || !nextType || question.type === nextType) return;
      commitEventQuestionFields();
      var objective = question.type === "single" || question.type === "multi";
      if (objective && nextType === "text") {
        setEventQuestionType(question.type);
        if (questionWarn) questionWarn.hidden = false;
        return;
      }
      applyEventQuestionType(question, nextType);
    }

    function confirmEventTextType() {
      var question = selectedEventQuestion();
      hideEventQuestionWarn();
      if (!question) return;
      applyEventQuestionType(question, "text");
    }

    function hideEventQuestionWarn() {
      if (questionWarn) questionWarn.hidden = true;
    }

    function applyEventQuestionType(question, nextType) {
      var previous = question.type;
      if ((previous === "single" || previous === "multi") && (nextType === "single" || nextType === "multi")) {
        question.type = nextType;
      } else if (nextType === "text") {
        question.type = "text";
        question.choices = [];
      } else {
        question.type = nextType;
        question.choices = [newEventChoice(), newEventChoice()];
      }
      hideEventQuestionWarn();
      renderEventQuestionEditor();
    }

    function clearEventChoiceIssue(question, choiceId, input) {
      var issue = questionErrorMap[question.id];
      if (!issue || !issue.choices || !issue.choices[choiceId]) return;
      if (!String(input.value || "").trim()) return;
      delete issue.choices[choiceId];
      input.classList.remove("is-invalid");
      var error = input.parentNode ? input.parentNode.querySelector(".field-error") : null;
      if (error) error.hidden = true;
      if (!issue.title && !issue.count && eventChoiceIssueCount(issue) === 0) delete questionErrorMap[question.id];
      renderEventQuestionList();
    }

    function renderEventQuestionEditor() {
      normalizeEventQuestionOrder();
      renderEventQuestionList();
      var question = selectedEventQuestion();
      var hasQuestion = !!question;
      if (questionEditor) questionEditor.hidden = !hasQuestion;
      if (questionPlaceholder) questionPlaceholder.hidden = hasQuestion;
      if (!question) return;
      var issue = questionErrorMap[question.id];
      if (questionEditorTitle) questionEditorTitle.textContent = "질문 " + question.order + " 편집";
      if (questionTitle) {
        questionTitle.value = question.title || "";
        questionTitle.classList.toggle("is-invalid", !!(issue && issue.title));
      }
      if (questionTitleError) {
        questionTitleError.hidden = !(issue && issue.title);
        questionTitleError.textContent = issue && issue.title ? issue.title : "";
      }
      if (questionDescription) questionDescription.value = question.description || "";
      if (questionRequired) questionRequired.checked = question.required !== false;
      setEventQuestionType(question.type);
      var subjective = question.type === "text";
      if (choiceFields) choiceFields.hidden = subjective;
      if (textAnswer) textAnswer.hidden = !subjective;
      if (questionChoiceError) {
        questionChoiceError.hidden = !(issue && issue.count);
        questionChoiceError.textContent = issue && issue.count ? issue.count : "";
      }
      if (!subjective) renderEventChoices(question);
    }

    function renderEventQuestionList() {
      if (questionEmpty) questionEmpty.hidden = editorQuestions.length > 0;
      if (!questionItems) return;
      questionItems.innerHTML = editorQuestions.map(function (question) {
        var prefix = question.type === "multi" ? "복수" : question.type === "text" ? "주관" : "단일";
        var title = String(question.title || "").trim();
        var label = "(" + prefix + ") 질문" + question.order + (title ? " - " + title : "");
        var selected = question.id === selectedQuestionId ? " is-selected" : "";
        var invalid = questionErrorMap[question.id] ? " is-invalid" : "";
        var ariaInvalid = questionErrorMap[question.id] ? ' aria-invalid="true"' : "";
        return '<div class="survey-question-item' + selected + invalid + '" data-question-id="' + escapeEventText(question.id) + '"' + ariaInvalid + ">" +
          '<span class="survey-question-item__grip" draggable="true" aria-hidden="true"></span>' +
          '<span class="survey-question-item__text" role="button" tabindex="0">' + escapeEventText(label) + "</span>" +
          '<span class="survey-question-item__tools">' +
          '<button type="button" class="survey-question-item__tool" data-question-duplicate="' + escapeEventText(question.id) + '" aria-label="복제">' +
          '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="6" y="6" width="7.5" height="7.5" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"></rect><path d="M10 6V3.5a1 1 0 0 0-1-1H3.5a1 1 0 0 0-1 1V9a1 1 0 0 0 1 1H6" fill="none" stroke="currentColor" stroke-width="1.2"></path></svg></button>' +
          '<button type="button" class="survey-question-item__tool" data-question-delete="' + escapeEventText(question.id) + '" aria-label="삭제">' +
          '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 4.5h9M6.2 4.4V3.2h3.6v1.2M4.8 4.5l.6 8h5.2l.6-8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path></svg></button>' +
          "</span></div>";
      }).join("");
    }

    function renderEventChoices(question) {
      if (!choiceList) return;
      var issue = questionErrorMap[question.id];
      var atMinimum = question.choices.length <= 2;
      choiceList.innerHTML = question.choices.map(function (choice, index) {
        var message = issue && issue.choices ? issue.choices[choice.id] : "";
        return '<div class="survey-choice">' +
          '<label for="event-choice-' + escapeEventText(choice.id) + '">선택지' + (index + 1) + "</label>" +
          '<div class="survey-choice__input">' +
          '<input class="input' + (message ? " is-invalid" : "") + '" id="event-choice-' + escapeEventText(choice.id) + '" data-choice-id="' + escapeEventText(choice.id) + '" type="text" value="' + escapeEventText(choice.text) + '">' +
          '<p class="field-error"' + (message ? "" : " hidden") + ">" + escapeEventText(message) + "</p></div>" +
          '<button type="button" class="btn" data-choice-remove="' + escapeEventText(choice.id) + '"' + (atMinimum ? " disabled" : "") + ">삭제</button></div>";
      }).join("");
      if (choiceAdd) choiceAdd.disabled = question.choices.length >= 10;
    }

    function setEventQuestionType(value) {
      var hidden = Admin.qs("#event-q-type");
      if (!hidden) return;
      var select = hidden.closest(".select");
      var label = select ? select.querySelector(".select__label") : null;
      var matched = null;
      if (select) {
        Admin.qsa(".select__option", select).forEach(function (option) {
          var selected = option.getAttribute("data-value") === value;
          option.classList.toggle("is-selected", selected);
          if (selected) matched = option;
        });
      }
      hidden.value = matched ? value : "single";
      if (label && matched) label.textContent = matched.textContent;
    }
  }

  function cloneEventAudience(audience) {
    return {
      mode: audience && audience.mode ? audience.mode : "unset",
      regions: audience && audience.regions ? audience.regions.slice() : [],
      memberTypes: audience && audience.memberTypes ? audience.memberTypes.slice() : []
    };
  }

  function eventAudienceDraftLabel(audience) {
    if (!audience || !audience.mode || audience.mode === "unset") return "선택한 대상이 없습니다";
    if (audience.mode === "all") return "전체 회원";
    var parts = [];
    if (audience.regions && audience.regions.length) {
      parts.push("지역: " + eventAudienceNames(audience.regions, eventAudienceOptions.regions));
    }
    if (audience.memberTypes && audience.memberTypes.length) {
      parts.push("회원 구분: " + eventAudienceNames(audience.memberTypes, eventAudienceOptions.memberTypes));
    }
    return parts.length ? parts.join(" / ") : "조건을 선택해 주세요";
  }
});

Admin.ready(function () {
  var table = Admin.qs("#events-draft-table");
  if (!table || !window.MockData) return;
  var tbody = table.querySelector("tbody");
  if (!tbody) return;
  var drafts = (MockData.eventDrafts || []).slice().sort(function (a, b) {
    var left = a && a.updatedAt ? String(a.updatedAt) : "";
    var right = b && b.updatedAt ? String(b.updatedAt) : "";
    if (left === right) return 0;
    return left < right ? 1 : -1;
  });
  if (!drafts.length) {
    tbody.innerHTML = '<tr><td class="events-empty" colspan="6">임시저장된 행사가 없습니다.</td></tr>';
    return;
  }
  tbody.innerHTML = drafts.map(function (draft, index) {
    var href = "events-create.html?draft=" + encodeURIComponent(draft.id);
    var title = String(draft.title || "").trim();
    return "<tr>" +
      "<td>" + (index + 1) + "</td>" +
      '<td><a class="events-title" href="' + href + '">' + escapeEventDraftText(title || "미입력") + "</a></td>" +
      "<td>" + escapeEventDraftText(eventDraftCell(draft.eventAt, formatEventStamp)) + "</td>" +
      "<td>" + escapeEventDraftText(eventDraftCell(draft.updatedAt, formatEventStamp)) + "</td>" +
      "<td>" + escapeEventDraftText(eventDraftStatus(draft)) + "</td>" +
      '<td><a class="btn" href="' + href + '">이어 작성</a></td>' +
      "</tr>";
  }).join("");

  function eventDraftCell(value, formatter) {
    if (value == null || String(value).trim() === "") return "-";
    var formatted = formatter ? formatter(value) : "";
    return formatted || String(value);
  }

  function eventDraftStatus(draft) {
    var status = draft.writeStatus != null ? draft.writeStatus : draft.progress;
    if (status == null || String(status).trim() === "") return "-";
    return String(status);
  }

  function escapeEventDraftText(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
});

Admin.ready(function () {
  var detail = document.getElementById("event-detail");
  if (!detail) return;
  var missing = document.getElementById("event-detail-missing");
  var requestedId = eventIdFromLocation();
  var eventItem = findEventById(requestedId);
  if (!eventItem) {
    if (missing) missing.hidden = false;
    return;
  }

  detail.hidden = false;
  setDetailValue("event-detail-title", eventItem.title || "미등록");
  var status = document.getElementById("event-detail-status");
  if (status) status.textContent = getEventStatus(eventItem, new Date()) || "-";
  fillDetailStamp("event-detail-start-date", "event-detail-start-time", eventItem.eventAt);
  if (eventItem.eventNoEnd === true) {
    var noEnd = document.getElementById("event-detail-no-end");
    if (noEnd) noEnd.checked = true;
    setDetailValue("event-detail-end-date", "");
    setDetailValue("event-detail-end-time", "");
  } else {
    fillDetailStamp("event-detail-end-date", "event-detail-end-time", eventItem.eventEndAt);
  }
  setDetailValue("event-detail-intro", eventItem.body || eventItem.intro || "미등록");
  setDetailValue("event-detail-place", eventItem.place || "미등록");
  fillDetailStamp("event-detail-recruit-start-date", "event-detail-recruit-start-time", eventItem.recruitStartAt);
  if (eventItem.noRecruitEnd === true) {
    var recruitNoEnd = document.getElementById("event-detail-recruit-no-end");
    if (recruitNoEnd) recruitNoEnd.checked = true;
    setDetailValue("event-detail-recruit-end-date", "");
    setDetailValue("event-detail-recruit-end-time", "");
  } else {
    fillDetailStamp("event-detail-recruit-end-date", "event-detail-recruit-end-time", eventItem.recruitEndAt);
  }
  setDetailValue("event-detail-capacity", eventDetailCapacity(eventItem));
  var confirmed = document.getElementById("event-detail-confirmed");
  if (confirmed) {
    confirmed.textContent = Object.prototype.hasOwnProperty.call(eventItem, "confirmedCount")
      ? String(eventItem.confirmedCount) + "명"
      : "미등록";
  }
  setDetailValue("event-detail-audience", eventItem.audience ? (eventAudienceIssue(eventItem.audience) ? "미등록" : eventAudienceLabel(eventItem.audience)) : "미등록");
  renderDetailQuestions(eventItem.questions);
  renderDetailFiles(eventItem.files);

  var detailAlerts = document.getElementById("event-detail-alerts");
  var scheduleNotice = eventScheduleNotice(eventItem);
  if (detailAlerts && scheduleNotice) {
    detailAlerts.hidden = false;
    detailAlerts.textContent = scheduleNotice;
  }
  var editLink = document.getElementById("event-detail-edit");
  var cancelled = eventItem.cancelledByOrganizer === true;
  if (editLink) {
    if (cancelled) editLink.hidden = true;
    else editLink.href = "events-create.html?id=" + encodeURIComponent(eventItem.id);
  }
  var applicantsLink = document.getElementById("event-detail-applicants");
  if (applicantsLink) {
    applicantsLink.href = "events-applicants.html?id=" + encodeURIComponent(eventItem.id);
  }
  var cancelButton = document.getElementById("event-detail-cancel");
  if (cancelButton && cancelled) cancelButton.hidden = true;
  if (cancelButton && !cancelled) {
    cancelButton.addEventListener("click", function () {
      var name = document.getElementById("event-cancel-name");
      var reason = document.getElementById("event-cancel-reason");
      var reasonError = document.getElementById("event-cancel-reason-error");
      if (name) name.textContent = eventItem.title || "미등록";
      if (reason) reason.value = "";
      if (reasonError) reasonError.hidden = true;
      if (window.AdminUI) AdminUI.openModal("modal-event-cancel");
    });
  }
  var cancelConfirm = document.getElementById("event-cancel-confirm");
  if (cancelConfirm) {
    cancelConfirm.addEventListener("click", function () {
      var reason = document.getElementById("event-cancel-reason");
      var reasonError = document.getElementById("event-cancel-reason-error");
      var text = reason ? String(reason.value || "").trim() : "";
      if (!text) {
        if (reasonError) reasonError.hidden = false;
        return;
      }
      if (reasonError) reasonError.hidden = true;
      openEventDetailNotice("서버가 연결되지 않아 행사를 취소할 수 없습니다.");
    });
  }

  function setDetailValue(id, value) {
    var node = document.getElementById(id);
    if (!node) return;
    if ("value" in node) node.value = value;
    else node.textContent = value;
  }

  function fillDetailStamp(dateId, timeId, stamp) {
    var parts = splitEventStamp(stamp);
    setDetailValue(dateId, parts.date || "-");
    setDetailValue(timeId, parts.time || "-");
  }

  function eventDetailCapacity(item) {
    if (!Object.prototype.hasOwnProperty.call(item, "capacity")) return "미등록";
    if (item.capacity == null) return "정원 제한 없음";
    return String(item.capacity) + "명";
  }

  function renderDetailQuestions(questions) {
    var box = document.getElementById("event-detail-questions");
    if (!box) return;
    if (!Array.isArray(questions)) {
      box.textContent = "미등록";
      return;
    }
    if (!questions.length) {
      box.textContent = "-";
      return;
    }
    box.innerHTML = "<ol class=\"events-detail__list\">" + questions.map(function (question) {
      var title = String(question && question.title || "").trim() || "미입력";
      var required = question && question.required !== false ? "필수" : "선택";
      return "<li>" + escapeEventDetailText(title) + " · " + escapeEventDetailText(eventQuestionTypeLabel(question && question.type)) + " · " + required + "</li>";
    }).join("") + "</ol>";
  }

  function renderDetailFiles(files) {
    var box = document.getElementById("event-detail-files");
    if (!box) return;
    if (!Array.isArray(files)) {
      box.textContent = "미등록";
      return;
    }
    var names = files.map(function (file) {
      if (typeof file === "string") return file;
      return file && file.name ? String(file.name) : "";
    }).filter(function (name) { return String(name).trim(); });
    if (!names.length) {
      box.textContent = "-";
      return;
    }
    box.innerHTML = "<ul class=\"events-detail__list\">" + names.map(function (name) {
      return "<li>" + escapeEventDetailText(name) + "</li>";
    }).join("") + "</ul>";
  }

  function openEventDetailNotice(message) {
    var notice = document.getElementById("event-detail-notice");
    if (notice) notice.textContent = message;
    if (window.AdminUI) AdminUI.openModal("modal-event-detail-notice");
  }

  function escapeEventDetailText(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
});

Admin.ready(function () {
  var root = document.getElementById("event-applicants");
  if (!root) return;
  // 신청자 관리는 관리자 전용 화면입니다. 실제 권한 검증은 서버 연동 시 구현합니다.
  var missing = document.getElementById("event-applicants-missing");
  var requestedId = eventIdFromLocation();
  var eventItem = findEventById(requestedId);
  if (!eventItem) {
    if (missing) missing.hidden = false;
    return;
  }

  root.hidden = false;
  var pageSize = 10;
  var state = { page: 1, status: "" };
  var applied = { period: "all", customStart: "", customEnd: "", field: "name", keyword: "" };
  var source = eventApplicationsFor(eventItem.id).slice().sort(function (left, right) {
    var leftAt = String(left.appliedAt || "");
    var rightAt = String(right.appliedAt || "");
    if (leftAt === rightAt) return String(left.applicationId).localeCompare(String(right.applicationId));
    return leftAt < rightAt ? 1 : -1;
  });
  var filtered = source.slice();
  var selected = null;

  var detailLink = document.getElementById("event-applicants-detail");
  if (detailLink) detailLink.href = "events-detail.html?id=" + encodeURIComponent(eventItem.id);
  setText("event-applicants-title", eventItem.title || "미등록");
  setText("event-applicants-event-at", formatEventStamp(eventItem.eventAt) || "-");
  setText("event-applicants-recruit", applicantRecruitText(eventItem));
  setText("event-applicants-status", getEventStatus(eventItem, new Date()) || "-");
  setText("event-applicants-capacity", applicantCapacityText(eventItem));
  setText("event-applicants-confirmed", Object.prototype.hasOwnProperty.call(eventItem, "confirmedCount") ? String(eventItem.confirmedCount) + "명" : "미등록");
  var cancelCount = eventApplicantCancelCount(eventItem.id);
  setText("event-applicants-cancelled", cancelCount == null ? "-" : String(cancelCount) + "명");
  var note = document.getElementById("event-applicants-note");
  if (note) {
    note.textContent = source.length
      ? "테스트용 일부 신청 내역입니다. 실존 인물의 정보가 아니며, 이 목록으로 확정 신청 인원을 다시 계산하지 않습니다. 신청 취소 인원은 아래 테스트 이력의 신청취소만 계산했습니다. 연락처는 마스킹하며, 주민등록번호와 상세 주소는 수집하지 않습니다."
      : "연결된 테스트용 신청 내역이 없습니다. 확정 신청 인원은 행사에 기록된 값을 표시하고, 신청 취소 인원은 이력이 없어 계산하지 않습니다.";
  }

  var table = document.getElementById("event-applicants-table");
  var nav = document.querySelector(".events-applicants [data-pagination]");
  var keywordInput = document.querySelector('.events-applicants [name="applicantKeyword"]');
  var customRow = document.getElementById("event-applicants-custom");
  var periodError = document.getElementById("event-applicants-period-error");
  var periodInput = document.querySelector('.events-applicants [name="applicantPeriod"]');
  var periodSelect = periodInput ? periodInput.closest("[data-select]") : null;
  var noticeNode = document.getElementById("event-applicants-notice");
  var excelButton = document.getElementById("event-applicants-excel");
  var searchButton = document.getElementById("event-applicants-search");
  var cancelOpen = document.getElementById("event-applicant-cancel-open");
  var cancelConfirm = document.getElementById("event-applicant-cancel-confirm");

  if (nav) {
    nav.addEventListener("pagination:change", function (event) {
      state.page = event.detail.page;
      renderRows();
    });
  }
  document.querySelectorAll(".events-applicants [data-applicant-status]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      state.status = tab.getAttribute("data-applicant-status") || "";
      state.page = 1;
      setTabs(state.status);
      refresh();
    });
  });
  if (periodSelect) {
    periodSelect.addEventListener("select:change", function (event) {
      if (customRow) customRow.hidden = event.detail.value !== "custom";
      if (event.detail.value !== "custom") clearPeriodError();
    });
  }
  var applicantFilters = document.querySelector(".events-applicants .list-filters");
  if (applicantFilters) {
    applicantFilters.addEventListener("select:change", function (event) {
      if (event.detail && event.detail.value === "custom") return;
      runSearch();
    });
  }
  if (searchButton) searchButton.addEventListener("click", runSearch);
  if (keywordInput) {
    keywordInput.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      runSearch();
    });
  }
  if (excelButton) {
    excelButton.addEventListener("click", function () {
      openNotice(eventApplicantExportNotice());
    });
  }
  if (table) {
    table.addEventListener("click", function (event) {
      var button = event.target.closest("[data-application-id]");
      if (!button) return;
      openDetail(button.getAttribute("data-application-id"));
    });
  }
  if (cancelOpen) {
    cancelOpen.addEventListener("click", function () {
      if (!selected || selected.status !== "신청확정") return;
      var summary = document.getElementById("event-applicant-cancel-summary");
      var reason = document.getElementById("event-applicant-cancel-reason");
      var reasonError = document.getElementById("event-applicant-cancel-reason-error");
      if (summary) summary.textContent = (selected.name || "-") + " 님의 「" + (eventItem.title || "미등록") + "」 신청을 취소합니다.";
      if (reason) reason.value = "";
      if (reasonError) reasonError.hidden = true;
      if (window.AdminUI) AdminUI.openModal("modal-event-applicant-cancel");
    });
  }
  if (cancelConfirm) {
    cancelConfirm.addEventListener("click", function () {
      var reason = document.getElementById("event-applicant-cancel-reason");
      var reasonError = document.getElementById("event-applicant-cancel-reason-error");
      var text = reason ? String(reason.value || "").trim() : "";
      if (!text) {
        if (reasonError) reasonError.hidden = false;
        return;
      }
      if (reasonError) reasonError.hidden = true;
      // 화면에서 버튼을 숨기는 것만으로 충분하지 않습니다. 서버에서도 신청확정 여부와 중복 취소를 다시 검증해야 합니다.
      // 이번 단계에서는 신청 상태와 확정 인원을 바꾸지 않습니다.
      openNotice("서버가 연결되지 않아 신청을 취소할 수 없습니다.");
    });
  }

  refresh();

  function runSearch() {
    if (!commitInputs()) return;
    state.page = 1;
    refresh();
  }

  function commitInputs() {
    var period = fieldValue("applicantPeriod") || "all";
    var next = {
      period: period,
      customStart: "",
      customEnd: "",
      field: fieldValue("applicantField") || "name",
      keyword: keywordInput ? keywordInput.value.trim() : ""
    };
    if (period === "custom") {
      next.customStart = fieldValue("applicantPeriodStart");
      next.customEnd = fieldValue("applicantPeriodEnd");
      var error = customPeriodError(next.customStart, next.customEnd);
      if (error) {
        showPeriodError(error);
        return false;
      }
    }
    var months = Number(period);
    if (months === 1 || months === 3 || months === 6) {
      var range = recentEventPeriod(months, new Date());
      next.rangeStart = range.start.getTime();
      next.rangeEnd = range.end.getTime();
    }
    clearPeriodError();
    applied = next;
    return true;
  }

  function refresh() {
    filtered = source.filter(matches);
    syncPagination();
    renderRows();
  }

  function matches(item) {
    if (state.status && item.status !== state.status) return false;
    if (!matchesPeriod(item)) return false;
    return matchesKeyword(item);
  }

  function matchesPeriod(item) {
    if (!applied.period || applied.period === "all") return true;
    var appliedAt = parseEventDateTime(item.appliedAt);
    if (!appliedAt) return false;
    if (applied.period === "custom") {
      var from = parseEventDay(applied.customStart, false);
      var to = parseEventDay(applied.customEnd, true);
      if (!from || !to) return false;
      return appliedAt.getTime() >= from.getTime() && appliedAt.getTime() <= to.getTime();
    }
    var months = Number(applied.period);
    if (months !== 1 && months !== 3 && months !== 6) return true;
    if (typeof applied.rangeStart !== "number" || typeof applied.rangeEnd !== "number") return false;
    return appliedAt.getTime() >= applied.rangeStart && appliedAt.getTime() <= applied.rangeEnd;
  }

  function matchesKeyword(item) {
    if (!applied.keyword) return true;
    if (applied.field === "phone") {
      var digits = String(item.phone || "").replace(/\D/g, "");
      var needle = applied.keyword.replace(/\D/g, "");
      return needle ? digits.indexOf(needle) !== -1 : false;
    }
    return String(item.name || "").indexOf(applied.keyword) !== -1;
  }

  function customPeriodError(startValue, endValue) {
    if (!startValue || !endValue) return "시작일과 종료일을 모두 선택해 주세요.";
    var start = parseEventDay(startValue, false);
    var end = parseEventDay(endValue, true);
    if (!start || !end) return "날짜 형식이 올바르지 않습니다.";
    if (parseEventDay(startValue, false).getTime() > parseEventDay(endValue, false).getTime()) {
      return "시작일은 종료일보다 늦을 수 없습니다.";
    }
    return "";
  }

  function showPeriodError(message) {
    if (!periodError) return;
    periodError.textContent = message;
    periodError.hidden = false;
  }

  function clearPeriodError() {
    if (!periodError) return;
    periodError.textContent = "";
    periodError.hidden = true;
  }

  function syncPagination() {
    if (!nav) return;
    var totalPages = Math.ceil(filtered.length / pageSize);
    if (!totalPages) {
      nav.hidden = true;
      return;
    }
    nav.hidden = false;
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;
    nav.setAttribute("data-current", String(state.page));
    nav.setAttribute("data-total", String(totalPages));
    if (window.AdminUI) AdminUI.refreshPagination(nav);
  }

  function renderRows() {
    var tbody = table ? table.querySelector("tbody") : null;
    if (!tbody) return;
    if (!filtered.length) {
      var message = source.length ? "검색 결과가 없습니다." : "테스트용 신청 내역이 없습니다.";
      tbody.innerHTML = '<tr><td class="events-empty" colspan="7">' + message + "</td></tr>";
      return;
    }
    var start = (state.page - 1) * pageSize;
    tbody.innerHTML = filtered.slice(start, start + pageSize).map(function (item, index) {
      var displayNo = filtered.length - start - index;
      return "<tr>" +
        "<td>" + displayNo + "</td>" +
        "<td>" + escapeApplicantText(item.name) + "</td>" +
        "<td>" + escapeApplicantText(item.memberType) + "</td>" +
        "<td>" + escapeApplicantText(maskEventApplicantPhone(item.phone)) + "</td>" +
        "<td>" + escapeApplicantText(formatEventStamp(item.appliedAt) || "-") + "</td>" +
        "<td>" + escapeApplicantText(item.status) + "</td>" +
        '<td><button type="button" class="btn btn--sm" data-application-id="' + escapeApplicantText(item.applicationId) + '">상세 보기</button></td>' +
        "</tr>";
    }).join("");
  }

  function openDetail(applicationId) {
    selected = source.filter(function (item) { return String(item.applicationId) === String(applicationId); })[0] || null;
    if (!selected) return;
    setText("applicant-detail-name", selected.name || "-");
    setText("applicant-detail-type", selected.memberType || "-");
    setText("applicant-detail-phone", maskEventApplicantPhone(selected.phone));
    setText("applicant-detail-applied", formatEventStamp(selected.appliedAt) || "-");
    setText("applicant-detail-status", selected.status || "-");
    fillQuestions(eventItem, selected);
    var history = document.getElementById("applicant-detail-cancel-history");
    if (history) history.hidden = selected.status !== "신청취소";
    if (selected.status === "신청취소") {
      var cancelledAt = selected.cancelledAt ? formatEventStamp(selected.cancelledAt) : "";
      var reason = selected.cancelReason != null ? String(selected.cancelReason).trim() : "";
      setText("applicant-detail-cancelled-at", cancelledAt || "-");
      setText("applicant-detail-cancel-reason", reason || "-");
    }
    if (cancelOpen) cancelOpen.hidden = selected.status !== "신청확정";
    if (window.AdminUI) AdminUI.openModal("modal-event-applicant");
  }

  function fillQuestions(item, application) {
    var box = document.getElementById("applicant-detail-questions");
    if (!box) return;
    box.textContent = "";
    var view = eventApplicantQuestionView(item, application);
    if (view.kind !== "list") {
      box.textContent = "추가질문 없음";
      return;
    }
    view.rows.forEach(function (row) {
      var block = document.createElement("div");
      block.className = "events-applicants__qa";
      addQuestionLine(block, "질문 제목", row.title);
      addQuestionLine(block, "질문 유형", row.type);
      addQuestionLine(block, "필수 여부", row.required);
      addQuestionLine(block, "답변", row.answer);
      box.appendChild(block);
    });
  }

  function addQuestionLine(block, label, value) {
    var line = document.createElement("p");
    line.textContent = label + " " + value;
    block.appendChild(line);
  }

  function setTabs(status) {
    document.querySelectorAll(".events-applicants [data-applicant-status]").forEach(function (tab) {
      var active = (tab.getAttribute("data-applicant-status") || "") === status;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function fieldValue(name) {
    var input = document.querySelector('.events-applicants [name="' + name + '"]');
    return input ? input.value : "";
  }

  function applicantRecruitText(item) {
    var start = formatEventStamp(item.recruitStartAt) || "-";
    if (item.noRecruitEnd === true) return start + " ~ 종료일 없음";
    var end = formatEventStamp(item.recruitEndAt);
    return end ? start + " ~ " + end : start;
  }

  function applicantCapacityText(item) {
    if (!Object.prototype.hasOwnProperty.call(item, "capacity")) return "미등록";
    if (item.capacity == null) return "정원 제한 없음";
    return String(item.capacity) + "명";
  }

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function openNotice(message) {
    if (noticeNode) noticeNode.textContent = message;
    if (window.AdminUI) AdminUI.openModal("modal-event-applicants-notice");
  }

  function escapeApplicantText(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
});

Admin.ready(function () {
  var grid = document.getElementById("events-calendar-grid");
  if (!grid || !window.MockData || !MockData.events) return;
  var label = document.getElementById("events-calendar-label");
  var body = grid.querySelector("tbody");
  var month = eventCalendarMonthStart(new Date());
  var model = null;
  var moreTitle = document.getElementById("events-calendar-more-title");
  var moreList = document.getElementById("events-calendar-more-list");
  var prevButton = document.getElementById("events-calendar-prev");
  var nextButton = document.getElementById("events-calendar-next");
  var todayButton = document.getElementById("events-calendar-today");

  if (prevButton) {
    prevButton.addEventListener("click", function () {
      month = eventCalendarShiftMonth(month, -1);
      render();
    });
  }
  if (nextButton) {
    nextButton.addEventListener("click", function () {
      month = eventCalendarShiftMonth(month, 1);
      render();
    });
  }
  if (todayButton) {
    todayButton.addEventListener("click", function () {
      month = eventCalendarMonthStart(new Date());
      render();
    });
  }
  grid.addEventListener("click", function (event) {
    var more = event.target.closest("[data-calendar-day]");
    if (!more) return;
    openMore(more.getAttribute("data-calendar-day"));
  });
  render();

  function render() {
    model = buildEventCalendar(MockData.events, month, new Date(), 3);
    if (label) label.textContent = model.label;
    if (!body) return;
    var rows = [];
    for (var index = 0; index < model.cells.length; index += 7) {
      rows.push("<tr>" + model.cells.slice(index, index + 7).map(renderCell).join("") + "</tr>");
    }
    body.innerHTML = rows.join("");
  }

  function renderCell(cell) {
    var classes = "events-calendar__cell";
    if (!cell.inMonth) classes += " is-outside";
    if (cell.isToday) classes += " is-today";
    var events = cell.inMonth ? cell.events.map(renderEvent).join("") : "";
    var more = cell.inMonth && cell.hiddenCount
      ? '<button type="button" class="events-calendar__more" data-calendar-day="' + cell.key + '">+' + cell.hiddenCount + "건</button>"
      : "";
    return '<td class="' + classes + '"' + (cell.isToday ? ' aria-current="date"' : "") + '><span class="events-calendar__day">' + cell.day + "</span>" + events + more + "</td>";
  }

  function renderEvent(item) {
    var statusClass = eventCalendarStatusClass(item.status);
    var chipClass = "events-calendar__event" + (item.status === "정원마감" ? " is-capacity-full" : "");
    var badgeClass = "badge" + (statusClass && statusClass !== "is-capacity-full" ? " " + statusClass : "");
    return '<a class="' + chipClass + '" href="events-detail.html?id=' + encodeURIComponent(item.id) + '">' +
      '<span class="events-calendar__line"><span class="events-calendar__time">' + escapeCalendarText(item.time) + '</span><span class="events-calendar__name">' + escapeCalendarText(item.title) + "</span></span>" +
      '<span class="' + badgeClass + '">' + escapeCalendarText(item.status) + "</span></a>";
  }

  function openMore(key) {
    if (!model) return;
    var cell = null;
    for (var index = 0; index < model.cells.length; index += 1) {
      if (model.cells[index].key === key) cell = model.cells[index];
    }
    if (!cell) return;
    if (moreTitle) moreTitle.textContent = model.year + "년 " + model.month + "월 " + cell.day + "일";
    if (moreList) moreList.innerHTML = cell.all.map(function (item) { return "<li>" + renderEvent(item) + "</li>"; }).join("");
    if (window.AdminUI) AdminUI.openModal("modal-event-calendar-more");
  }

  function escapeCalendarText(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
});
