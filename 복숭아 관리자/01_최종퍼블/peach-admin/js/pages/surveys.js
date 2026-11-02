/* 설문 목록. 상태와 검색은 화면에서만 거르고, 저장이나 다른 화면 이동은 연결하지 않습니다. */

function parseSurveyDateTime(value) {
  var matched = String(value || "").match(/^(\d{4})\.(\d{2})\.(\d{2}) (\d{2}):(\d{2})$/);
  if (!matched) return null;
  var date = new Date(
    Number(matched[1]),
    Number(matched[2]) - 1,
    Number(matched[3]),
    Number(matched[4]),
    Number(matched[5]),
    0,
    0
  );
  if (!isSameDatePart(date, Number(matched[1]), Number(matched[2]), Number(matched[3]))) return null;
  return date;
}

function parseSurveyDay(value, endOfDay) {
  var matched = String(value || "").match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
  if (!matched) return null;
  var year = Number(matched[1]);
  var month = Number(matched[2]);
  var day = Number(matched[3]);
  var date = new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  if (!isSameDatePart(date, year, month, day)) return null;
  return date;
}

function parseSurveyClock(value) {
  var matched = String(value || "").match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!matched) return null;
  return { hours: Number(matched[1]), minutes: Number(matched[2]) };
}

function combineSurveyDateTime(dateValue, timeValue) {
  var day = parseSurveyDay(dateValue, false);
  var clock = parseSurveyClock(timeValue);
  if (!day || !clock) return null;
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), clock.hours, clock.minutes, 0, 0);
}

function isSameDatePart(date, year, month, day) {
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function addCalendarMonths(date, months) {
  var result = new Date(date.getTime());
  var day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  var lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

function recentSurveyPeriod(months, searchedAt) {
  var end = searchedAt instanceof Date ? new Date(searchedAt.getTime()) : new Date();
  var start = addCalendarMonths(end, -months);
  start.setHours(0, 0, 0, 0);
  return { start: start, end: end };
}

function getSurveyStatus(survey, now) {
  var current = now instanceof Date ? now : new Date();
  if (!survey) return null;
  var start = parseSurveyDateTime(survey.startAt);
  var end = survey.noEnd === true ? null : parseSurveyDateTime(survey.endAt);
  if (!start || (survey.noEnd !== true && !end)) {
    console.error("설문 날짜 형식이 올바르지 않습니다.", survey.id, survey.startAt, survey.endAt);
    return null;
  }
  if (survey.manualClosed === true) return "종료";
  if (survey.noEnd !== true && current.getTime() >= end.getTime()) return "종료";
  if (current.getTime() < start.getTime()) return "진행예정";
  return "진행중";
}

function isSurveyDraftReady(item, now) {
  if (!item) return false;
  var current = now instanceof Date ? now : new Date();
  if (!String(item.title || "").trim() || !String(item.intro || "").trim()) return false;
  var start = parseSurveyDateTime(item.startAt);
  if (String(item.startAt || "").trim() && !start) console.error("설문 시작일시 형식이 올바르지 않습니다.", item.id, item.startAt);
  if (!start || start.getTime() < current.getTime()) return false;
  if (item.noEnd !== true) {
    var end = parseSurveyDateTime(item.endAt);
    if (String(item.endAt || "").trim() && !end) console.error("설문 종료일시 형식이 올바르지 않습니다.", item.id, item.endAt);
    if (!end || end.getTime() <= current.getTime() || end.getTime() <= start.getTime()) return false;
  }
  if (!surveyTargetReady(item)) return false;
  var questions = item.questions || [];
  if (!questions.length) return false;
  return questions.every(surveyQuestionReady);
}

function surveyTargetReady(item) {
  var target = item.target;
  if (target && typeof target === "object" && target.mode) {
    if (target.mode === "all") return true;
    if (target.mode === "conditions") return (target.regions || []).length > 0 || (target.memberTypes || []).length > 0;
    return false;
  }
  var label = String(item.targetLabel || "").trim();
  return label !== "" && label !== "미설정" && label !== "선택된 조건이 없습니다.";
}

function surveyQuestionIssueParts(question) {
  var issue = { title: "", type: "", count: "", choices: {} };
  if (!question || !String(question.title || "").trim()) issue.title = "문항 제목을 입력해 주세요.";
  var type = question && question.type;
  var textType = type === "text" || type === "주관식";
  var choiceType = type === "single" || type === "multi" || type === "단일 선택" || type === "복수 선택";
  if (!textType && !choiceType) {
    issue.type = "지원하지 않는 문항 유형입니다.";
    return issue;
  }
  if (textType) return issue;
  var choices = question.choices || [];
  if (choices.length < 2) issue.count = "선택지는 2개 이상 입력해 주세요.";
  else if (choices.length > 10) issue.count = "선택지는 10개까지 입력할 수 있습니다.";
  choices.forEach(function (choice) {
    if (!String((choice && choice.text) || "").trim()) {
      issue.choices[choice && choice.id ? choice.id : ""] = "선택지 문구를 입력해 주세요.";
    }
  });
  return issue;
}

function surveyQuestionIssue(question) {
  var issue = surveyQuestionIssueParts(question);
  if (issue.title) return issue.title;
  if (issue.type) return issue.type;
  if (issue.count) return issue.count;
  for (var key in issue.choices) {
    if (Object.prototype.hasOwnProperty.call(issue.choices, key) && issue.choices[key]) return issue.choices[key];
  }
  return "";
}

function surveyQuestionsIssue(questions) {
  if (!questions || !questions.length) return "문항을 1개 이상 등록해 주세요.";
  for (var index = 0; index < questions.length; index += 1) {
    var issue = surveyQuestionIssue(questions[index]);
    if (issue) return issue;
  }
  return "";
}

function surveyQuestionReady(question) {
  return surveyQuestionIssue(question) === "";
}

function compareSurveyDrafts(a, b) {
  var aTime = String(a.updatedAt || "");
  var bTime = String(b.updatedAt || "");
  if (aTime !== bTime) return aTime < bTime ? 1 : -1;
  return String(b.id).localeCompare(String(a.id), "en", { numeric: true });
}

function escapeSurveyText(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function splitSurveyStamp(value) {
  var matched = String(value || "").match(/^(\d{4}\.\d{2}\.\d{2}) (\d{2}:\d{2})$/);
  if (!matched) return { date: "", time: "" };
  return { date: matched[1], time: matched[2] };
}

function surveyAudienceLabel(item) {
  if (!item) return "대상 정보 없음";
  var target = item.target;
  if (target && typeof target === "object" && target.mode) {
    if (target.mode === "all") return "전체 회원";
    if (target.mode === "conditions") {
      var parts = [];
      if (target.regions && target.regions.length) parts.push("지역: " + surveyAudienceNames(target.regions, surveyAudienceOptions.regions));
      if (target.memberTypes && target.memberTypes.length) parts.push("회원 구분: " + surveyAudienceNames(target.memberTypes, surveyAudienceOptions.memberTypes));
      return parts.length ? parts.join(" / ") : "대상 정보 없음";
    }
    return "대상 정보 없음";
  }
  var label = String(item.targetLabel || "").trim();
  if (!label || label === "미설정" || label === "선택된 조건이 없습니다.") return "대상 정보 없음";
  return label;
}

var surveyAudienceOptions = {
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

function surveyAudienceNames(ids, options) {
  return (ids || []).map(function (id) {
    var matched = options.filter(function (option) { return option.id === id; })[0];
    return matched ? matched.label : id;
  }).join("·");
}

function surveyQuestionType(type) {
  if (type === "multi" || type === "복수 선택") return "multi";
  if (type === "text" || type === "주관식") return "text";
  return "single";
}

function surveyQuestionTypeLabel(type) {
  var normalized = surveyQuestionType(type);
  if (normalized === "multi") return "복수 선택";
  if (normalized === "text") return "주관식";
  return "단일 선택";
}

function buildSurveyPreviewMarkup(current, questions) {
  var title = String(current.title || "").trim();
  var intro = String(current.intro || "").trim();
  var items = questions && questions.length ? questions.map(function (question, index) {
    return surveyPreviewQuestionMarkup(question, index);
  }).join("") : '<p class="survey-preview__empty">등록된 문항이 없습니다.</p>';
  return '<h3 class="survey-preview__heading' + (title ? "" : " survey-preview__missing") + '">' + escapeSurveyText(title || "(설문명 미입력)") + "</h3>" +
    '<p class="survey-preview__intro' + (intro ? "" : " survey-preview__missing") + '">' + escapeSurveyText(intro || "(설문 소개 미입력)") + "</p>" +
    '<div class="survey-preview__meta">' +
    '<p' + (current.periodMissing ? ' class="survey-preview__missing"' : "") + ">설문 기간: " + escapeSurveyText(current.periodText) + "</p>" +
    '<p' + (current.audienceMissing ? ' class="survey-preview__missing"' : "") + ">참여 대상: " + escapeSurveyText(current.audienceText) + "</p>" +
    "</div>" + items;
}

function surveyPreviewQuestionMarkup(question, index) {
  var normalized = surveyQuestionType(question.type);
  var title = String(question.title || "").trim();
  var description = String(question.description || "").trim();
  var required = question.required !== false ? '<span class="required">*</span>' : "";
  var body = normalized === "text" ? surveyPreviewTextMarkup() : surveyPreviewChoicesMarkup(question, index, normalized);
  return '<section class="survey-preview__question">' +
    '<h3><span class="survey-preview__number">' + (index + 1) + ". </span>" +
    '<span class="' + (title ? "" : "survey-preview__missing") + '">' + escapeSurveyText(title || "(문항 제목 미입력)") + "</span>" + required + "</h3>" +
    (description ? '<p class="survey-preview__desc">' + escapeSurveyText(description) + "</p>" : "") +
    body + "</section>";
}

function surveyPreviewChoicesMarkup(question, index, normalized) {
  var choices = question.choices || [];
  if (!choices.length) return '<p class="survey-preview__missing">(선택지 미입력)</p>';
  var type = normalized === "multi" ? "checkbox" : "radio";
  var className = type === "checkbox" ? "checkbox" : "radio";
  return '<div class="survey-preview__choices">' + choices.map(function (choice) {
    var text = String(choice.text || "").trim();
    return '<label class="' + className + '">' +
      '<input type="' + type + '" name="survey-preview-' + index + '" disabled>' +
      '<span class="' + className + '__box" aria-hidden="true"></span>' +
      '<span class="' + className + "__text" + (text ? "" : " survey-preview__missing") + '">' + escapeSurveyText(text || "(선택지 미입력)") + "</span></label>";
  }).join("") + "</div>";
}

function surveyPreviewTextMarkup() {
  return '<textarea class="input input--block" rows="4" disabled aria-label="주관식 답변"></textarea>' +
    '<p class="survey-preview__limit">최대 1,000자</p>';
}

function findRegisteredSurvey(id) {
  var key = String(id == null ? "" : id).trim();
  if (!key || !window.MockData || !MockData.surveys) return null;
  return MockData.surveys.filter(function (survey) {
    return String(survey.id) === key;
  })[0] || null;
}

function surveyQuestionResult(survey, index) {
  var records = survey && survey.questionResults;
  if (!Array.isArray(records)) return null;
  var record = records[index];
  if (!record || typeof record !== "object") return null;
  return record;
}

function surveyIntegerCount(value) {
  if (typeof value === "boolean" || value == null || value === "") return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !/^\d+$/.test(String(value).trim())) return null;
  var number = Number(value);
  if (!isFinite(number) || number < 0 || Math.floor(number) !== number) return null;
  return number;
}

function surveyChoiceStats(question, record) {
  var choices = question.choices || [];
  var respondents = surveyIntegerCount(record && record.respondentCount);
  var counts = record && Array.isArray(record.choices) ? record.choices : null;
  if (respondents == null || !counts || counts.length !== choices.length) return null;
  var parsed = counts.map(function (item) {
    return surveyIntegerCount(item && typeof item === "object" ? item.count : item);
  });
  if (parsed.some(function (count) { return count == null; })) return null;
  if (parsed.some(function (count) { return count > respondents; })) return null;
  if (respondents === 0 && parsed.some(function (count) { return count !== 0; })) return null;
  var sum = parsed.reduce(function (total, count) { return total + count; }, 0);
  if (surveyQuestionType(question.type) === "single" && sum !== respondents) return null;
  return { respondents: respondents, counts: parsed };
}

function surveyChoicePercent(count, respondents) {
  if (!respondents) return 0;
  return Math.round((count / respondents) * 1000) / 10;
}

function surveyPercentText(value) {
  return Number(value).toFixed(1) + "%";
}

function surveyResultBarWidth(percent) {
  return percent + "%";
}

function surveyResultAnswers(record) {
  var answers = record && record.answers;
  if (!Array.isArray(answers)) return [];
  return answers.map(function (answer) {
    var source = answer && typeof answer === "object" ? answer : {};
    return {
      text: source.text == null ? "" : String(source.text),
      submittedAt: source.submittedAt == null ? "" : String(source.submittedAt)
    };
  });
}

function surveySortedAnswers(record) {
  return surveyResultAnswers(record).sort(function (left, right) {
    var leftTime = parseSurveyDateTime(left.submittedAt);
    var rightTime = parseSurveyDateTime(right.submittedAt);
    if (leftTime && rightTime) return rightTime.getTime() - leftTime.getTime();
    if (leftTime) return -1;
    if (rightTime) return 1;
    return 0;
  });
}

function surveyChoiceResultMarkup(question, record) {
  var choices = question.choices || [];
  if (!choices.length) return '<p class="survey-results__empty">선택지가 없습니다.</p>';
  var stats = surveyChoiceStats(question, record);
  if (!stats) return '<p class="survey-results__invalid">응답 통계가 올바르지 않아 결과를 표시할 수 없습니다.</p>';
  var rows = choices.map(function (choice, index) {
    var count = stats.counts[index];
    var percent = surveyChoicePercent(count, stats.respondents);
    return "<tr><td>" + escapeSurveyText(choice.text || "") + "</td><td>" + count + "</td><td>" + surveyPercentText(percent) + "</td><td>" +
      '<div class="survey-results__track" aria-hidden="true"><span style="width:' + surveyResultBarWidth(percent) + '"></span></div></td></tr>';
  }).join("");
  return '<table class="table survey-results__table survey-results__table--choices"><thead><tr><th scope="col">선택지</th><th scope="col">응답 수</th><th scope="col">비율</th><th scope="col">그래프</th></tr></thead><tbody>' + rows + "</tbody></table>";
}

function surveyTextResultMarkup(record, page) {
  var answers = surveySortedAnswers(record);
  if (!answers.length) return '<p class="survey-results__empty">등록된 주관식 응답이 없습니다.</p>';
  var pageSize = 10;
  var totalPages = Math.ceil(answers.length / pageSize);
  var current = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  var start = (current - 1) * pageSize;
  var rows = answers.slice(start, start + pageSize).map(function (answer, index) {
    return "<tr><td>" + (start + index + 1) + '</td><td class="survey-results__answer">' + escapeSurveyText(answer.text) + "</td><td>" + escapeSurveyText(answer.submittedAt || "-") + "</td></tr>";
  }).join("");
  return '<table class="table survey-results__table survey-results__table--text"><thead><tr><th scope="col">No</th><th scope="col">응답 내용</th><th scope="col">제출일시</th></tr></thead><tbody>' + rows + "</tbody></table>" +
    '<nav class="pagination survey-results__pager" data-pagination data-current="' + current + '" data-total="' + totalPages + '" aria-label="주관식 응답 페이지"></nav>';
}

function surveyResultRespondentText(question, record) {
  if (!record) return "—";
  if (surveyQuestionType(question.type) === "text") {
    if (record.respondentCount == null || record.respondentCount === "") return "—";
    var textCount = surveyIntegerCount(record.respondentCount);
    return textCount == null ? "—" : textCount + "건";
  }
  var stats = surveyChoiceStats(question, record);
  return stats ? stats.respondents + "건" : "—";
}

function surveyResultPanelMarkup(question, index, record, page, demo) {
  var type = surveyQuestionType(question.type);
  var required = question.required !== false;
  var countLabel = demo ? "테스트 유효 응답 수" : "유효 응답 수";
  var body = !record
    ? '<p class="survey-results__pending">문항별 응답 데이터가 연결되지 않았습니다.</p>'
    : (type === "text" ? surveyTextResultMarkup(record, page) : surveyChoiceResultMarkup(question, record));
  return '<p class="survey-results__kicker">' + (index + 1) + ". " + escapeSurveyText(surveyQuestionTypeLabel(question.type)) + " · " + (required ? "필수응답" : "선택응답") + "</p>" +
    "<h2>" + escapeSurveyText(String(question.title || "").trim()) + (required ? '<span class="required">*</span>' : "") + "</h2>" +
    '<p class="survey-results__count">' + countLabel + " <strong>" + surveyResultRespondentText(question, record) + "</strong></p>" + body;
}

function findSurveyDraft(id) {
  var key = String(id == null ? "" : id).trim();
  if (!key || !window.MockData || !MockData.surveyDrafts) return null;
  return MockData.surveyDrafts.filter(function (item) {
    return String(item.id) === key;
  })[0] || null;
}

function surveyDeletable(survey) {
  return !!survey && Number(survey.responseCount || 0) === 0;
}

function surveyCloseable(survey) {
  return getSurveyStatus(survey, new Date()) === "진행중";
}

function openSurveyActionNotice(message) {
  var notice = document.getElementById("survey-action-notice");
  if (notice) notice.textContent = message;
  if (window.AdminUI) AdminUI.openModal("modal-survey-action-notice");
}

function confirmSurveyAction(button, allowed, blockedMessage, unavailableMessage) {
  if (!button || button.disabled) return;
  button.disabled = true;
  openSurveyActionNotice(allowed() ? unavailableMessage : blockedMessage);
}

function surveyEditDraft(item) {
  var source = JSON.parse(JSON.stringify(item));
  var start = splitSurveyStamp(source.startAt);
  var end = splitSurveyStamp(source.endAt);
  var closed = source.noEnd === true;
  return {
    title: source.title || "",
    intro: source.intro || "",
    startDate: start.date,
    startTime: start.time,
    endDate: closed ? "" : end.date,
    endTime: closed ? "" : end.time,
    noEnd: closed,
    target: surveyEditTarget(source),
    questions: surveyEditQuestions(source.questions || [])
  };
}

function surveyEditTarget(item) {
  var target = item.target;
  if (target && typeof target === "object" && target.mode) {
    return {
      mode: target.mode,
      regions: (target.regions || []).slice(),
      memberTypes: (target.memberTypes || []).slice()
    };
  }
  var label = String(item.targetLabel || "").trim();
  if (label === "전체 회원") return { mode: "all", regions: [], memberTypes: [] };
  var parsed = parseSurveyAudienceLabel(label);
  if (parsed) return parsed;
  return { mode: "unset", regions: [], memberTypes: [] };
}

function parseSurveyAudienceLabel(label) {
  if (!label || label === "미설정" || label === "대상 정보 없음" || label === "선택된 조건이 없습니다.") return null;
  var regions = [];
  var memberTypes = [];
  var matched = false;
  label.split("/").forEach(function (part) {
    var text = part.trim();
    if (text.indexOf("지역:") === 0) {
      matched = true;
      regions = surveyAudienceIds(text.slice("지역:".length), surveyAudienceOptions.regions);
    } else if (text.indexOf("회원 구분:") === 0) {
      matched = true;
      memberTypes = surveyAudienceIds(text.slice("회원 구분:".length), surveyAudienceOptions.memberTypes);
    }
  });
  if (!matched) return null;
  return { mode: "conditions", regions: regions, memberTypes: memberTypes };
}

function surveyAudienceIds(text, options) {
  return String(text || "").split("·").map(function (name) {
    var label = name.trim();
    if (!label) return "";
    var found = options.filter(function (option) { return option.label === label; })[0];
    return found ? found.id : "";
  }).filter(Boolean);
}

function surveyEditQuestions(list) {
  var choiceSeq = 0;
  return (list || []).map(function (question, index) {
    var type = surveyQuestionType(question.type);
    var choices = type === "text" ? [] : (question.choices || []).map(function (choice) {
      choiceSeq += 1;
      return { id: "c" + choiceSeq, text: choice && choice.text ? choice.text : "" };
    });
    return {
      id: "q" + (index + 1),
      type: type,
      title: question.title || "",
      description: question.description || "",
      required: question.required !== false,
      choices: choices,
      order: index + 1
    };
  });
}

function surveyQuestionArticles(questions) {
  if (!questions.length) return '<p class="surveys-detail__empty">등록된 문항이 없습니다.</p>';
  return questions.map(function (question, index) {
    var type = surveyQuestionType(question.type);
    var title = String(question.title || "").trim();
    var description = String(question.description || "").trim();
    var required = question.required !== false;
    var choices = type === "text"
      ? '<p class="surveys-detail__subjective">주관식 문항</p>'
      : surveyChoiceList(question.choices || []);
    return '<article class="surveys-detail__question">' +
      "<h2><span>" + (index + 1) + ". </span>" + escapeSurveyText(title) +
      (required ? '<span class="required">*</span>' : "") + "</h2>" +
      '<p class="surveys-detail__question-meta">' + escapeSurveyText(surveyQuestionTypeLabel(question.type)) + " · " + (required ? "필수응답" : "선택응답") + "</p>" +
      (description ? '<p class="surveys-detail__desc">' + escapeSurveyText(description) + "</p>" : "") +
      choices + "</article>";
  }).join("");
}

function surveyChoiceList(choices) {
  if (!choices.length) return '<p class="surveys-detail__empty">선택지 없음</p>';
  return '<ol class="surveys-detail__choices">' + choices.map(function (choice, index) {
    return "<li><span class=\"surveys-detail__choice-no\">" + (index + 1) + ". </span>" + escapeSurveyText(choice.text || "") + "</li>";
  }).join("") + "</ol>";
}

Admin.ready(function () {
  var table = Admin.qs("#surveys-table");
  if (!table || !window.MockData || !MockData.surveys) return;

  var pageSize = 10;
  var state = { page: 1, status: "" };
  var now = new Date();
  var applied = { period: "all", customStart: "", customEnd: "", field: "titleBody", keyword: "" };
  var sorted = MockData.surveys.slice().sort(function (a, b) {
    if (a.registeredAt !== b.registeredAt) return a.registeredAt < b.registeredAt ? 1 : -1;
    return b.id - a.id;
  });
  var filtered = sorted.slice();

  var draftButton = Admin.qs("#surveys-drafts");
  if (draftButton) {
    var draftCount = MockData.surveyDrafts ? MockData.surveyDrafts.length : 0;
    draftButton.textContent = "임시저장 (" + draftCount + ")";
  }

  var nav = Admin.qs(".surveys-page [data-pagination]");
  var keywordInput = Admin.qs('.surveys-page [name="keyword"]');
  var customRow = Admin.qs("#surveys-custom-period");
  var periodError = Admin.qs("#surveys-period-error");
  var periodSelect = closestSelect("period");
  var statusSelect = closestSelect("status");

  if (nav) {
    nav.addEventListener("pagination:change", function (event) {
      state.page = event.detail.page;
      renderRows();
    });
  }

  Admin.qsa(".surveys-page [data-survey-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      applyStatus(statusFromTab(tab), false);
    });
  });
  if (statusSelect) {
    statusSelect.addEventListener("select:change", function (event) {
      applyStatus(event.detail.value || "", true);
    });
  }
  if (periodSelect) {
    periodSelect.addEventListener("select:change", function (event) {
      if (customRow) customRow.hidden = event.detail.value !== "custom";
      if (event.detail.value !== "custom") clearPeriodError();
    });
  }
  var surveyFilters = Admin.qs(".surveys-page .list-filters");
  if (surveyFilters) {
    surveyFilters.addEventListener("select:change", function (event) {
      if (event.detail && event.detail.value === "custom") return;
      runSearch();
    });
  }

  var searchButton = Admin.qs("#surveys-search");
  if (searchButton) searchButton.addEventListener("click", runSearch);
  if (keywordInput) {
    keywordInput.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      runSearch();
    });
  }
  var resetButton = Admin.qs("#surveys-reset");
  if (resetButton) resetButton.addEventListener("click", resetFilters);

  var listDelete = Admin.qs("#surveys-delete");
  var listDeleteNote = Admin.qs("#surveys-delete-note");
  var listDeleteConfirm = Admin.qs("#survey-delete-confirm");
  if (listDelete) {
    listDelete.addEventListener("click", function (event) {
      event.preventDefault();
      if (listDelete.disabled) return;
      var selected = selectedListSurveys();
      if (!selected.length || selected.some(function (survey) { return !surveyDeletable(survey); })) {
        syncListDelete();
        return;
      }
      if (listDeleteConfirm) listDeleteConfirm.disabled = false;
      if (window.AdminUI) AdminUI.openModal("modal-survey-delete");
    });
  }
  if (listDeleteConfirm) {
    listDeleteConfirm.addEventListener("click", function () {
      var selected = selectedListSurveys();
      confirmSurveyAction(listDeleteConfirm, function () {
        var current = selectedListSurveys();
        return current.length > 0 && current.every(surveyDeletable);
      }, selected.length ? "응답이 있는 설문은 삭제할 수 없습니다." : "삭제할 설문을 선택해 주세요.", "서버가 연결되지 않아 설문을 삭제할 수 없습니다.");
    });
  }
  table.addEventListener("change", syncListDelete);

  refresh();

  function applyStatus(status, fromDropdown) {
    state.status = status;
    state.page = 1;
    setTabs(status);
    if (!fromDropdown) setSelect("status", status);
    refresh();
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
      var range = recentSurveyPeriod(months, new Date());
      next.rangeStart = range.start.getTime();
      next.rangeEnd = range.end.getTime();
    }
    clearPeriodError();
    applied = next;
    return true;
  }

  function resetFilters() {
    state.status = "";
    state.page = 1;
    applied = { period: "all", customStart: "", customEnd: "", field: "titleBody", keyword: "" };
    setTabs("");
    setSelect("status", "");
    setSelect("period", "all");
    setSelect("field", "titleBody");
    if (keywordInput) keywordInput.value = "";
    setFieldValue("periodStart", "");
    setFieldValue("periodEnd", "");
    if (customRow) customRow.hidden = true;
    clearPeriodError();
    refresh();
  }

  function refresh() {
    now = new Date();
    filtered = sorted.filter(matches);
    syncPagination();
    renderRows();
  }

  function matches(item) {
    var status = getSurveyStatus(item, now);
    if (state.status && status !== state.status) return false;
    if (!matchesPeriod(item)) return false;
    return matchesKeyword(item);
  }

  function matchesPeriod(item) {
    if (!applied.period || applied.period === "all") return true;
    var start = parseSurveyDateTime(item.startAt);
    if (!start) return false;
    if (applied.period === "custom") {
      var from = parseSurveyDay(applied.customStart, false);
      var to = parseSurveyDay(applied.customEnd, true);
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
    var intro = String(item.intro || "").toLowerCase();
    if (applied.field === "title") return title.indexOf(needle) !== -1;
    if (applied.field === "body") return intro.indexOf(needle) !== -1;
    return title.indexOf(needle) !== -1 || intro.indexOf(needle) !== -1;
  }

  function customPeriodError(startValue, endValue) {
    if (!startValue || !endValue) return "시작일과 종료일을 모두 선택해 주세요.";
    var start = parseSurveyDay(startValue, false);
    var end = parseSurveyDay(endValue, true);
    if (!start || !end) {
      console.error("직접 기간의 날짜 형식이 올바르지 않습니다.", startValue, endValue);
      return "날짜 형식이 올바르지 않습니다.";
    }
    if (parseSurveyDay(startValue, false).getTime() > parseSurveyDay(endValue, false).getTime()) {
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
      var message = sorted.length ? "검색 결과가 없습니다." : "등록된 설문이 없습니다.";
      tbody.innerHTML = '<tr><td class="surveys-empty" colspan="7">' + message + "</td></tr>";
      syncListDelete();
      return;
    }
    var start = (state.page - 1) * pageSize;
    var rows = filtered.slice(start, start + pageSize);
    tbody.innerHTML = rows.map(function (item, index) {
      var status = getSurveyStatus(item, now);
      var scheduled = status === "진행예정";
      var displayNo = filtered.length - start - index;
      var statusText = status || "날짜 오류";
      return (
        "<tr>" +
          '<td class="table__check"><label class="checkbox"><input type="checkbox" data-survey-id="' + escapeHtml(item.id) + '"><span class="checkbox__box" aria-hidden="true"></span><span class="sr-only">' + displayNo + '번 선택</span></label></td>' +
          "<td>" + displayNo + "</td>" +
          '<td><a class="surveys-title" href="surveys-detail.html?id=' + encodeURIComponent(item.id) + '" title="' + escapeHtml(item.title) + '">' + escapeHtml(item.title) + "</a></td>" +
          '<td><span class="' + statusClass(status) + '">' + statusText + "</span></td>" +
          "<td>" + escapeHtml(formatPeriod(item)) + "</td>" +
          "<td>" + (scheduled ? "-" : String(item.responseCount || 0)) + "</td>" +
          "<td>" + responseButton(item, status) + "</td>" +
        "</tr>"
      );
    }).join("");
    syncListDelete();
  }

  function selectedListSurveys() {
    return Admin.qsa("#surveys-table tbody input[data-survey-id]:checked").map(function (box) {
      return findRegisteredSurvey(box.getAttribute("data-survey-id"));
    }).filter(Boolean);
  }

  function syncListDelete() {
    if (!listDelete) return;
    var selected = selectedListSurveys();
    var blocked = selected.some(function (survey) { return !surveyDeletable(survey); });
    listDelete.disabled = !selected.length || blocked;
    if (listDeleteNote) listDeleteNote.hidden = !blocked;
    if (blocked) listDelete.setAttribute("aria-describedby", "surveys-delete-note");
    else listDelete.removeAttribute("aria-describedby");
  }

  function responseButton(item, status) {
    if (status !== "진행중" && status !== "종료") {
      return '<button type="button" class="btn btn--sm" disabled>응답보기</button>';
    }
    return '<a class="btn btn--sm" href="surveys-results.html?id=' + encodeURIComponent(item.id) + '">응답보기</a>';
  }

  function statusClass(status) {
    if (status === "진행예정") return "surveys-status surveys-status--scheduled";
    if (status === "종료") return "surveys-status surveys-status--ended";
    if (status === "진행중") return "surveys-status surveys-status--live";
    return "surveys-status surveys-status--invalid";
  }

  function formatPeriod(survey) {
    var start = formatPoint(survey.startAt);
    if (survey.noEnd === true) return start + " - 종료일 없음";
    return start + " - " + formatPoint(survey.endAt);
  }

  function formatPoint(value) {
    var date = parseSurveyDateTime(value);
    if (!date) return "";
    return String(date.getFullYear()).slice(2) + "/" + pad(date.getMonth() + 1) + "/" + pad(date.getDate()) + " " + pad(date.getHours()) + ":" + pad(date.getMinutes());
  }

  function setTabs(status) {
    var selected = status || "전체";
    Admin.qsa(".surveys-page [data-survey-tab]").forEach(function (tab) {
      var active = tab.getAttribute("data-survey-tab") === selected;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function statusFromTab(tab) {
    var name = tab.getAttribute("data-survey-tab");
    return name === "전체" ? "" : name;
  }

  function setSelect(name, value) {
    var hidden = Admin.qs('.surveys-page [name="' + name + '"]');
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
    hidden.value = matched ? value : "";
    if (label && matched) label.textContent = matched.textContent;
  }

  function closestSelect(name) {
    var hidden = Admin.qs('.surveys-page [name="' + name + '"]');
    return hidden ? hidden.closest(".select") : null;
  }

  function fieldValue(name) {
    var input = Admin.qs('.surveys-page [name="' + name + '"]');
    return input ? String(input.value || "").trim() : "";
  }

  function setFieldValue(name, value) {
    var input = Admin.qs('.surveys-page [name="' + name + '"]');
    if (input) input.value = value;
  }

  function pad(value) {
    return (value < 10 ? "0" : "") + value;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
});

Admin.ready(function () {
  var form = Admin.qs("#survey-form");
  if (!form) return;

  var draft = {
    target: { mode: "unset", regions: [], memberTypes: [] },
    questions: []
  };
  var titleInput = Admin.qs("#survey-title");
  var introInput = Admin.qs("#survey-intro");
  var startDateInput = Admin.qs("#survey-start-date");
  var startTimeInput = Admin.qs("#survey-start-time");
  var endDateInput = Admin.qs("#survey-end-date");
  var endTimeInput = Admin.qs("#survey-end-time");
  var noEndInput = Admin.qs("#survey-no-end");
  var targetLabel = Admin.qs("#survey-target-label");
  var questionCount = Admin.qs("#survey-question-count");
  var initialSnapshot = "";
  var pendingHref = "surveys-list.html";
  var allowUnload = false;
  var editMode = !!Admin.qs("#survey-edit");
  var editLive = false;
  var editSourceId = "";

  if (editMode && !loadSurveyEdit()) return;

  initSurveyTimePickers();
  renderDraftState();
  syncNoEnd();
  if (editLive) lockLiveSurveyEdit();
  initialSnapshot = snapshot();

  form.addEventListener("submit", function (event) {
    event.preventDefault();
  });

  if (noEndInput) {
    noEndInput.addEventListener("change", function () {
      if (noEndInput.checked) {
        if (endDateInput) endDateInput.value = "";
        if (endTimeInput) endTimeInput.value = "";
      }
      syncNoEnd();
      clearError("survey-end-error", [endDateInput, endTimeInput]);
    });
  }

  var targetButton = Admin.qs("#survey-target");
  if (targetButton) {
    targetButton.addEventListener("click", function (event) {
      event.preventDefault();
      if (editLive) return;
      openTargetModal();
    });
  }
  var questionButton = Admin.qs("#survey-questions");
  if (questionButton) {
    questionButton.addEventListener("click", function (event) {
      event.preventDefault();
      if (editLive) return;
      openQuestionEditor();
    });
  }
  Admin.qs("#survey-preview").addEventListener("click", function (event) {
    event.preventDefault();
    openSurveyPreview(false);
  });
  var draftButton = Admin.qs("#survey-draft");
  if (draftButton) {
    draftButton.addEventListener("click", function (event) {
      event.preventDefault();
      // TODO: 설문 임시저장 API 연동. 저장 완료로 처리하지 않습니다.
      var notice = document.getElementById("survey-save-notice");
      if (notice) notice.textContent = "서버가 연결되지 않아 임시저장할 수 없습니다.";
      if (window.AdminUI) AdminUI.openModal("modal-survey-save-notice");
    });
  }
  Admin.qs("#survey-submit").addEventListener("click", function (event) {
    event.preventDefault();
    if (editMode && !refreshEditStatus()) return;
    if (!validateDraft()) return;
    // TODO: 설문 등록·수정 API 연동. 검증이 통과해도 저장 완료로 처리하지 않습니다.
    var saveNotice = document.getElementById("survey-save-notice");
    if (saveNotice) {
      saveNotice.textContent = editMode
        ? "서버가 연결되지 않아 수정 내용을 저장할 수 없습니다."
        : "서버가 연결되지 않아 설문을 등록할 수 없습니다.";
    }
    if (window.AdminUI) AdminUI.openModal("modal-survey-save-notice");
  });

  document.addEventListener("click", function (event) {
    if (allowUnload || event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest("a[href]");
    if (!link || link.target === "_blank") return;
    if (!link.closest(".sidebar, .header, .surveys-create, .surveys-edit")) return;
    var href = link.getAttribute("href") || "";
    if (!href || href.charAt(0) === "#") return;
    if (snapshot() === initialSnapshot) return;
    event.preventDefault();
    pendingHref = link.href;
    if (window.AdminUI) AdminUI.openModal("modal-survey-leave");
  });

  window.addEventListener("beforeunload", function (event) {
    if (allowUnload || snapshot() === initialSnapshot) return;
    event.preventDefault();
    event.returnValue = "";
  });

  var leaveConfirm = Admin.qs("#survey-leave-confirm");
  if (leaveConfirm) {
    leaveConfirm.addEventListener("click", function () {
      allowUnload = true;
      window.location.href = pendingHref;
    });
  }

  function refreshEditStatus() {
    var source = findRegisteredSurvey(editSourceId);
    var statusNow = source ? getSurveyStatus(source, new Date()) : null;
    if (statusNow === "진행예정" || statusNow === "진행중") {
      editLive = statusNow === "진행중";
      return true;
    }
    var saveNotice = document.getElementById("survey-save-notice");
    if (saveNotice) {
      saveNotice.textContent = source && statusNow === "종료"
        ? "종료된 설문은 수정할 수 없습니다."
        : "설문을 찾을 수 없습니다.";
    }
    if (window.AdminUI) AdminUI.openModal("modal-survey-save-notice");
    return false;
  }

  function loadSurveyEdit() {
    var rawId = new URLSearchParams(window.location.search).get("id");
    var editId = rawId == null ? "" : String(rawId).trim();
    editSourceId = editId;
    var source = findRegisteredSurvey(editId);
    var editStatus = source ? getSurveyStatus(source, new Date()) : null;
    var editable = editStatus === "진행예정" || editStatus === "진행중";
    if (!source || !editable) {
      form.hidden = true;
      var missing = Admin.qs("#survey-edit-missing");
      var missingText = Admin.qs("#survey-edit-missing-text");
      var missingLink = Admin.qs("#survey-edit-missing-link");
      if (missingText) {
        missingText.textContent = source && editStatus === "종료"
          ? "종료된 설문은 수정할 수 없습니다."
          : "설문을 찾을 수 없습니다.";
      }
      if (missingLink && source) missingLink.href = "surveys-detail.html?id=" + encodeURIComponent(source.id);
      var blockedDetail = Admin.qs("#survey-edit-detail-link");
      if (blockedDetail && source) blockedDetail.href = "surveys-detail.html?id=" + encodeURIComponent(source.id);
      if (missing) missing.hidden = false;
      return false;
    }
    draft = surveyEditDraft(source);
    editLive = editStatus === "진행중";
    pendingHref = "surveys-detail.html?id=" + encodeURIComponent(source.id);
    if (titleInput) titleInput.value = draft.title;
    if (introInput) introInput.value = draft.intro;
    if (startDateInput) startDateInput.value = draft.startDate;
    if (startTimeInput) startTimeInput.value = draft.startTime;
    if (endDateInput) endDateInput.value = draft.endDate;
    if (endTimeInput) endTimeInput.value = draft.endTime;
    if (noEndInput) noEndInput.checked = draft.noEnd;
    var detailLink = Admin.qs("#survey-edit-detail-link");
    var cancelLink = Admin.qs("#survey-edit-cancel");
    if (detailLink) detailLink.href = pendingHref;
    if (cancelLink) cancelLink.href = pendingHref;
    var statusNode = Admin.qs("#survey-edit-status");
    if (statusNode) {
      statusNode.textContent = editStatus;
      statusNode.className = editLive ? "surveys-status surveys-status--live" : "surveys-status surveys-status--scheduled";
    }
    form.hidden = false;
    return true;
  }

  function lockLiveSurveyEdit() {
    [startDateInput, startTimeInput].forEach(function (input) {
      if (!input) return;
      input.disabled = true;
      var picker = input.closest(".datepicker, .survey-time");
      if (picker) picker.classList.add("is-disabled");
    });
    var liveTarget = Admin.qs("#survey-target");
    var liveQuestions = Admin.qs("#survey-questions");
    if (liveTarget) liveTarget.disabled = true;
    if (liveQuestions) liveQuestions.hidden = true;
    var readonlyQuestions = Admin.qs("#survey-edit-readonly-questions");
    if (readonlyQuestions) {
      readonlyQuestions.hidden = false;
      readonlyQuestions.innerHTML = surveyQuestionArticles(draft.questions);
    }
  }

  function renderDraftState() {
    if (targetLabel) {
      targetLabel.value = targetText(draft.target, 3);
      targetLabel.title = targetText(draft.target, 0);
      targetLabel.classList.toggle("is-set", !!(draft.target && draft.target.mode !== "unset"));
    }
    if (questionCount) questionCount.textContent = draft.questions.length + "개";
  }

  function targetText(target, limit) {
    if (!target || target.mode === "unset") return "미설정";
    if (target.mode === "all") return "전체 회원";
    var parts = [];
    if (target.regions && target.regions.length) parts.push("지역: " + joinTargetLabels(target.regions, SURVEY_TARGET_OPTIONS.regions, limit));
    if (target.memberTypes && target.memberTypes.length) parts.push("회원 구분: " + joinTargetLabels(target.memberTypes, SURVEY_TARGET_OPTIONS.memberTypes, limit));
    if (!parts.length) return "선택된 조건이 없습니다.";
    return parts.join(" / ");
  }

  function initSurveyTimePickers() {
    Admin.qsa("[data-survey-time]").forEach(function (picker) {
      var input = picker.querySelector("input");
      if (!input) return;
      var popup = document.createElement("div");
      popup.className = "survey-time__popup";
      popup.hidden = true;
      popup.setAttribute("role", "dialog");
      popup.setAttribute("aria-label", input.getAttribute("aria-label") || "시간 선택");
      popup.innerHTML = '<div class="survey-time__col"><span class="survey-time__caption">시</span><div class="survey-time__frame"><div class="survey-time__list" data-survey-time-part="hour"></div></div></div>' +
        '<div class="survey-time__col"><span class="survey-time__caption">분</span><div class="survey-time__frame"><div class="survey-time__list" data-survey-time-part="minute"></div></div></div>';
      picker.appendChild(popup);
      var hourList = popup.querySelector('[data-survey-time-part="hour"]');
      var minuteList = popup.querySelector('[data-survey-time-part="minute"]');
      fillSurveyTimeList(hourList, 24);
      fillSurveyTimeList(minuteList, 60);

      input.addEventListener("click", function () {
        openSurveyTime(picker);
      });
      input.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openSurveyTime(picker);
        }
      });
      popup.addEventListener("click", function (event) {
        event.stopPropagation();
        var option = event.target.closest("[data-value]");
        if (!option) return;
        var list = option.closest(".survey-time__list");
        scrollSurveyTimeItem(list, option);
        applySurveyTime(picker);
      });
      [hourList, minuteList].forEach(function (list) {
        var timer = 0;
        var touched = false;
        list.addEventListener("pointerdown", function () {
          touched = true;
        });
        list.addEventListener("wheel", function () {
          touched = true;
        }, { passive: true });
        list.addEventListener("scroll", function () {
          if (!touched || picker.getAttribute("data-positioning") === "true") return;
          window.clearTimeout(timer);
          timer = window.setTimeout(function () {
            if (!popup.hidden) applySurveyTime(picker);
          }, 80);
        });
      });
    });

    document.addEventListener("click", function (event) {
      if (event.target.closest("[data-survey-time]")) return;
      Admin.qsa("[data-survey-time].is-open").forEach(closeSurveyTime);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      var openPicker = Admin.qs("[data-survey-time].is-open");
      if (!openPicker) return;
      event.preventDefault();
      event.stopPropagation();
      closeSurveyTime(openPicker);
      var input = openPicker.querySelector("input");
      if (input) input.focus();
    });
  }

  function fillSurveyTimeList(list, count) {
    var html = '<div class="survey-time__pad"></div>';
    for (var value = 0; value < count; value += 1) {
      html += '<button type="button" class="survey-time__option" data-value="' + value + '">' + surveyTimePad(value) + "</button>";
    }
    html += '<div class="survey-time__pad"></div>';
    list.innerHTML = html;
  }

  function surveyTimePad(value) {
    return value < 10 ? "0" + value : String(value);
  }

  function openSurveyTime(picker) {
    var input = picker.querySelector("input");
    if (!input || input.disabled || picker.classList.contains("is-disabled")) return;
    Admin.qsa("[data-survey-time].is-open").forEach(function (other) {
      if (other !== picker) closeSurveyTime(other);
    });
    var clock = parseSurveyClock(input.value) || { hours: 0, minutes: 0 };
    var popup = picker.querySelector(".survey-time__popup");
    picker.setAttribute("data-positioning", "true");
    popup.hidden = false;
    picker.classList.add("is-open");
    input.setAttribute("aria-expanded", "true");
    scrollSurveyTimePart(picker, "hour", clock.hours);
    scrollSurveyTimePart(picker, "minute", clock.minutes);
    markSurveyTime(picker, clock.hours, clock.minutes);
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        picker.removeAttribute("data-positioning");
      });
    });
  }

  function closeSurveyTime(picker) {
    if (!picker) return;
    var popup = picker.querySelector(".survey-time__popup");
    var input = picker.querySelector("input");
    if (popup) popup.hidden = true;
    picker.classList.remove("is-open");
    picker.removeAttribute("data-positioning");
    if (input) input.setAttribute("aria-expanded", "false");
  }

  function scrollSurveyTimePart(picker, part, value) {
    var list = picker.querySelector('[data-survey-time-part="' + part + '"]');
    var option = list.querySelector('[data-value="' + value + '"]');
    scrollSurveyTimeItem(list, option);
  }

  function scrollSurveyTimeItem(list, option) {
    if (!list || !option) return;
    list.scrollTop = option.offsetTop - (list.clientHeight - option.offsetHeight) / 2;
  }

  function centeredSurveyTime(list) {
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

  function applySurveyTime(picker) {
    var input = picker.querySelector("input");
    var hours = centeredSurveyTime(picker.querySelector('[data-survey-time-part="hour"]'));
    var minutes = centeredSurveyTime(picker.querySelector('[data-survey-time-part="minute"]'));
    var next = surveyTimePad(hours) + ":" + surveyTimePad(minutes);
    markSurveyTime(picker, hours, minutes);
    if (input.value === next) return;
    input.value = next;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function markSurveyTime(picker, hours, minutes) {
    markSurveyTimeList(picker.querySelector('[data-survey-time-part="hour"]'), hours);
    markSurveyTimeList(picker.querySelector('[data-survey-time-part="minute"]'), minutes);
  }

  function markSurveyTimeList(list, value) {
    Array.prototype.forEach.call(list.querySelectorAll("[data-value]"), function (option) {
      var selected = Number(option.getAttribute("data-value")) === value;
      option.classList.toggle("is-selected", selected);
      option.setAttribute("aria-selected", selected ? "true" : "false");
    });
  }

  function syncNoEnd() {
    var closed = !!(noEndInput && noEndInput.checked);
    [endDateInput, endTimeInput].forEach(function (input) {
      if (!input) return;
      input.disabled = closed;
      var picker = input.closest(".datepicker");
      if (picker) picker.classList.toggle("is-disabled", closed);
      var timePicker = input.closest(".survey-time");
      if (timePicker) {
        timePicker.classList.toggle("is-disabled", closed);
        if (closed) closeSurveyTime(timePicker);
      }
    });
  }

  function readDraft() {
    var closed = !!(noEndInput && noEndInput.checked);
    return {
      title: titleInput ? titleInput.value : "",
      intro: introInput ? introInput.value : "",
      startDate: startDateInput ? startDateInput.value : "",
      startTime: startTimeInput ? startTimeInput.value : "",
      endDate: closed || !endDateInput ? "" : endDateInput.value,
      endTime: closed || !endTimeInput ? "" : endTimeInput.value,
      noEnd: closed,
      target: draft.target,
      questions: draft.questions
    };
  }

  function snapshot() {
    return JSON.stringify(readDraft());
  }

  function validateDraft() {
    clearAllErrors();
    var current = readDraft();
    var errors = [];
    var now = new Date();
    var startDate = String(current.startDate || "").trim();
    var startTime = String(current.startTime || "").trim();
    var start = null;

    if (!startDate) {
      errors.push({ id: "survey-start-error", fields: [startDateInput], message: "시작일을 선택해 주세요.", focus: startDateInput });
    } else if (!parseSurveyDay(startDate, false)) {
      errors.push({ id: "survey-start-error", fields: [startDateInput], message: "시작일이 올바르지 않습니다.", focus: startDateInput });
    } else if (!startTime) {
      errors.push({ id: "survey-start-error", fields: [startTimeInput], message: "시작시간을 선택해 주세요.", focus: startTimeInput });
    } else if (!parseSurveyClock(startTime)) {
      errors.push({ id: "survey-start-error", fields: [startTimeInput], message: "시작시간은 HH:MM 형식으로 입력해 주세요.", focus: startTimeInput });
    } else {
      start = combineSurveyDateTime(startDate, startTime);
      if (!start) {
        errors.push({ id: "survey-start-error", fields: [startDateInput, startTimeInput], message: "시작일시가 올바르지 않습니다.", focus: startDateInput });
      } else if (!editLive && start.getTime() < now.getTime()) {
        errors.push({ id: "survey-start-error", fields: [startDateInput, startTimeInput], message: "시작일시는 현재 또는 미래만 선택할 수 있습니다.", focus: startDateInput });
      }
    }

    if (!current.noEnd) {
      var endDate = String(current.endDate || "").trim();
      var endTime = String(current.endTime || "").trim();
      if (!endDate) {
        errors.push({ id: "survey-end-error", fields: [endDateInput], message: "종료일을 선택해 주세요.", focus: endDateInput });
      } else if (!parseSurveyDay(endDate, false)) {
        errors.push({ id: "survey-end-error", fields: [endDateInput], message: "종료일이 올바르지 않습니다.", focus: endDateInput });
      } else if (!endTime) {
        errors.push({ id: "survey-end-error", fields: [endTimeInput], message: "종료시간을 선택해 주세요.", focus: endTimeInput });
      } else if (!parseSurveyClock(endTime)) {
        errors.push({ id: "survey-end-error", fields: [endTimeInput], message: "종료시간은 HH:MM 형식으로 입력해 주세요.", focus: endTimeInput });
      } else {
        var end = combineSurveyDateTime(endDate, endTime);
        if (!end) {
          errors.push({ id: "survey-end-error", fields: [endDateInput, endTimeInput], message: "종료일시가 올바르지 않습니다.", focus: endDateInput });
        } else if (end.getTime() <= now.getTime()) {
          errors.push({ id: "survey-end-error", fields: [endDateInput, endTimeInput], message: "종료일시는 현재보다 이후여야 합니다.", focus: endDateInput });
        } else if (start && end.getTime() <= start.getTime()) {
          errors.push({ id: "survey-end-error", fields: [endDateInput, endTimeInput], message: "종료일시는 시작일시보다 늦어야 합니다.", focus: endDateInput });
        }
      }
    }

    if (!String(current.title || "").trim()) {
      errors.push({ id: "survey-title-error", fields: [titleInput], message: "설문명을 입력해 주세요.", focus: titleInput });
    }
    if (!String(current.intro || "").trim()) {
      errors.push({ id: "survey-intro-error", fields: [introInput], message: "설문 소개를 입력해 주세요.", focus: introInput });
    }
    if (!editLive && (!current.target || current.target.mode === "unset")) {
      errors.push({ id: "survey-target-error", fields: [targetLabel], message: "참여 대상을 선택해 주세요.", focus: Admin.qs("#survey-target") });
    } else if (!editLive && current.target.mode === "conditions" && !current.target.regions.length && !current.target.memberTypes.length) {
      errors.push({ id: "survey-target-error", fields: [targetLabel], message: "지역 또는 회원 구분을 1개 이상 선택해 주세요.", focus: Admin.qs("#survey-target") });
    }
    if (!editLive) {
      var questionIssue = surveyQuestionsIssue(current.questions);
      if (questionIssue) {
        errors.push({ id: "survey-question-error", fields: [], message: questionIssue, focus: Admin.qs("#survey-questions") });
      }
    }

    errors.forEach(function (error) {
      var node = document.getElementById(error.id);
      if (node) {
        node.textContent = error.message;
        node.hidden = false;
      }
      error.fields.forEach(function (field) {
        if (field) field.classList.add("is-invalid");
      });
    });
    if (errors.length && errors[0].focus) errors[0].focus.focus();
    // TODO: 설문 등록 API 연동. 검증이 통과해도 등록 완료로 처리하지 않습니다.
    return errors.length === 0;
  }

  function clearAllErrors() {
    clearError("survey-start-error", [startDateInput, startTimeInput]);
    clearError("survey-end-error", [endDateInput, endTimeInput]);
    clearError("survey-title-error", [titleInput]);
    clearError("survey-intro-error", [introInput]);
    clearError("survey-target-error", [targetLabel]);
    clearError("survey-question-error", []);
  }

  function clearError(id, fields) {
    var node = document.getElementById(id);
    if (node) {
      node.textContent = "";
      node.hidden = true;
    }
    fields.forEach(function (field) {
      if (field) field.classList.remove("is-invalid");
    });
  }

  // TODO: 지역·회원 구분 옵션은 확정된 업무 데이터가 아닙니다. UI 검증용 Mock이며 실제 옵션으로 교체합니다.
  var SURVEY_TARGET_OPTIONS = {
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
  var targetDraft = cloneTarget(draft.target);
  var targetBaseline = targetSnapshot();
  var targetModal = Admin.qs("#modal-survey-target");
  var targetDiscard = Admin.qs("#survey-target-discard");
  var targetRegionGroup = Admin.qs("#survey-target-region-group");
  var targetMemberGroup = Admin.qs("#survey-target-member-group");
  var targetFields = Admin.qs("#survey-target-fields");
  var targetSummary = Admin.qs("#survey-target-summary");
  var targetModalError = Admin.qs("#survey-target-modal-error");

  renderTargetOptions();
  Admin.qs("#survey-target-cancel").addEventListener("click", requestCloseTargetModal);
  Admin.qs("#survey-target-apply").addEventListener("click", applyTargetModal);
  Admin.qs("#survey-target-discard-ok").addEventListener("click", discardTargetModal);
  if (targetModal) {
    targetModal.addEventListener("change", function () {
      readTargetDraft();
      hideTargetError();
      renderTargetModal();
    });
  }
  if (targetDiscard) {
    targetDiscard.addEventListener("click", function (event) {
      if (event.target.closest("[data-survey-target-dismiss]")) hideTargetDiscard();
    });
  }

  document.addEventListener("click", function (event) {
    if (!targetModal || targetModal.hidden) return;
    var closer = event.target.closest("[data-modal-close]");
    if (!closer || !targetModal.contains(closer)) return;
    event.preventDefault();
    event.stopPropagation();
    requestCloseTargetModal();
  }, true);

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape" || previewIsOpen()) return;
    if (targetDiscard && !targetDiscard.hidden) {
      event.preventDefault();
      event.stopPropagation();
      hideTargetDiscard();
      return;
    }
    if (!targetModal || targetModal.hidden) return;
    if (questionModal && !questionModal.hidden) return;
    event.preventDefault();
    event.stopPropagation();
    requestCloseTargetModal();
  }, true);

  function openTargetModal() {
    if (editLive) return;
    targetDraft = cloneTarget(draft.target);
    hideTargetError();
    hideTargetDiscard();
    renderTargetModal();
    targetBaseline = targetSnapshot();
    if (window.AdminUI) AdminUI.openModal("modal-survey-target");
  }

  function applyTargetModal() {
    readTargetDraft();
    if (targetDraft.mode === "unset") {
      showTargetError("참여 대상을 선택해 주세요.");
      return;
    }
    if (targetDraft.mode === "conditions" && !targetDraft.regions.length && !targetDraft.memberTypes.length) {
      showTargetError("지역 또는 회원 구분을 1개 이상 선택해 주세요.");
      return;
    }
    var next = cloneTarget(targetDraft);
    if (next.mode === "all") {
      next.regions = [];
      next.memberTypes = [];
    }
    draft.target = next;
    renderDraftState();
    clearError("survey-target-error", [targetLabel]);
    hideTargetDiscard();
    targetBaseline = targetSnapshot();
    if (window.AdminUI) AdminUI.closeModal("modal-survey-target");
  }

  function requestCloseTargetModal() {
    readTargetDraft();
    if (targetSnapshot() === targetBaseline) {
      hideTargetDiscard();
      if (window.AdminUI) AdminUI.closeModal("modal-survey-target");
      return;
    }
    if (targetDiscard) targetDiscard.hidden = false;
  }

  function discardTargetModal() {
    hideTargetDiscard();
    targetDraft = cloneTarget(draft.target);
    if (window.AdminUI) AdminUI.closeModal("modal-survey-target");
  }

  function hideTargetDiscard() {
    if (targetDiscard) targetDiscard.hidden = true;
  }

  function renderTargetOptions() {
    var regions = Admin.qs("#survey-target-regions");
    var members = Admin.qs("#survey-target-members");
    if (regions) regions.innerHTML = SURVEY_TARGET_OPTIONS.regions.map(function (option) {
      return targetCheckbox("region", option);
    }).join("");
    if (members) members.innerHTML = SURVEY_TARGET_OPTIONS.memberTypes.map(function (option) {
      return targetCheckbox("member", option);
    }).join("");
  }

  function targetCheckbox(group, option) {
    return '<label class="checkbox"><input type="checkbox" value="' + option.id + '" data-target-group="' + group + '"><span class="checkbox__box" aria-hidden="true"></span><span class="checkbox__text">' + escapeQuestionText(option.label) + "</span></label>";
  }

  function renderTargetModal() {
    Admin.qsa('input[name="survey-target-mode"]').forEach(function (input) {
      input.checked = input.value === targetDraft.mode;
    });
    Admin.qsa("[data-target-group='region']").forEach(function (input) {
      input.checked = targetDraft.regions.indexOf(input.value) !== -1;
    });
    Admin.qsa("[data-target-group='member']").forEach(function (input) {
      input.checked = targetDraft.memberTypes.indexOf(input.value) !== -1;
    });
    var enabled = targetDraft.mode === "conditions";
    if (targetRegionGroup) targetRegionGroup.disabled = !enabled;
    if (targetMemberGroup) targetMemberGroup.disabled = !enabled;
    if (targetFields) targetFields.classList.toggle("is-disabled", !enabled);
    if (targetSummary) targetSummary.textContent = "선택 결과: " + targetText(targetDraft, 0);
  }

  function readTargetDraft() {
    var selectedMode = document.querySelector('input[name="survey-target-mode"]:checked');
    targetDraft.mode = selectedMode ? selectedMode.value : "unset";
    targetDraft.regions = checkedTargetValues("region");
    targetDraft.memberTypes = checkedTargetValues("member");
  }

  function checkedTargetValues(group) {
    return Admin.qsa("[data-target-group='" + group + "']:checked").map(function (input) {
      return input.value;
    });
  }

  function cloneTarget(target) {
    return {
      mode: target && target.mode ? target.mode : "unset",
      regions: target && target.regions ? target.regions.slice() : [],
      memberTypes: target && target.memberTypes ? target.memberTypes.slice() : []
    };
  }

  function targetSnapshot() {
    return JSON.stringify(cloneTarget(targetDraft));
  }

  function joinTargetLabels(ids, options, limit) {
    var labels = ids.map(function (id) {
      var matched = options.filter(function (option) { return option.id === id; })[0];
      return matched ? matched.label : id;
    });
    if (!limit || labels.length <= limit) return labels.join("·");
    return labels.slice(0, limit).join("·") + " 외 " + (labels.length - limit);
  }

  function showTargetError(message) {
    if (!targetModalError) return;
    targetModalError.textContent = message;
    targetModalError.hidden = false;
  }

  function hideTargetError() {
    if (!targetModalError) return;
    targetModalError.textContent = "";
    targetModalError.hidden = true;
  }

  var editorQuestions = [];
  var selectedQuestionId = "";
  var questionSeq = 0;
  var choiceSeq = 0;
  var editorBaseline = "[]";
  var questionErrorMap = {};
  var questionEmptyError = false;
  var dragQuestionId = "";
  var suppressQuestionClick = false;
  var questionTitle = Admin.qs("#survey-q-title");
  var questionDescription = Admin.qs("#survey-q-description");
  var questionRequired = Admin.qs("#survey-q-required");
  var questionTypeSelect = Admin.qs("#survey-q-type") ? Admin.qs("#survey-q-type").closest(".select") : null;
  var questionItems = Admin.qs("#survey-question-items");
  var questionEmpty = Admin.qs("#survey-question-empty");
  var questionEmptyErrorNode = Admin.qs("#survey-question-empty-error");
  var questionEditor = Admin.qs("#survey-question-editor");
  var questionPlaceholder = Admin.qs("#survey-question-placeholder");
  var questionEditorTitle = Admin.qs("#survey-question-editor-title");
  var questionTitleError = Admin.qs("#survey-q-title-error");
  var questionChoiceError = Admin.qs("#survey-q-choice-error");
  var choiceFields = Admin.qs("#survey-choice-fields");
  var choiceList = Admin.qs("#survey-choice-list");
  var choiceAdd = Admin.qs("#survey-choice-add");
  var textAnswer = Admin.qs("#survey-text-answer");
  var questionWarn = Admin.qs("#survey-question-warn");
  var questionDeleteConfirm = Admin.qs("#survey-question-delete-confirm");
  var questionDiscard = Admin.qs("#survey-question-discard");
  var questionModal = Admin.qs("#modal-survey-questions");

  Admin.qs("#survey-question-add").addEventListener("click", addQuestion);
  Admin.qs("#survey-choice-add").addEventListener("click", addChoice);
  Admin.qs("#survey-question-delete-cancel").addEventListener("click", hideDeleteConfirm);
  Admin.qs("#survey-question-delete-ok").addEventListener("click", confirmDeleteQuestion);
  if (questionDeleteConfirm) {
    questionDeleteConfirm.addEventListener("click", function (event) {
      if (event.target.closest("[data-question-delete-dismiss]")) hideDeleteConfirm();
    });
  }
  Admin.qs("#survey-question-discard-cancel").addEventListener("click", hideDiscardConfirm);
  Admin.qs("#survey-question-discard-ok").addEventListener("click", discardQuestionEditor);
  Admin.qs("#survey-question-warn-cancel").addEventListener("click", hideQuestionWarn);
  Admin.qs("#survey-question-warn-ok").addEventListener("click", confirmTextType);
  Admin.qsa(".js-survey-question-close").forEach(function (button) {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      requestCloseQuestionEditor();
    });
  });
  Admin.qs("#survey-question-preview").addEventListener("click", function (event) {
    event.preventDefault();
    openSurveyPreview(true);
  });
  Admin.qs("#survey-question-apply").addEventListener("click", function (event) {
    event.preventDefault();
    applyQuestionEditor();
  });
  if (questionTypeSelect) {
    questionTypeSelect.addEventListener("select:change", function (event) {
      changeQuestionType(event.detail.value);
    });
  }
  if (questionTitle) {
    questionTitle.addEventListener("input", function () {
      var question = selectedQuestion();
      if (!question) return;
      question.title = questionTitle.value;
      var issue = questionErrorMap[question.id];
      if (issue && String(question.title || "").trim()) {
        issue.title = "";
        questionTitle.classList.remove("is-invalid");
        if (questionTitleError) questionTitleError.hidden = true;
        if (!issue.count && choiceIssueCount(issue) === 0) delete questionErrorMap[question.id];
      }
      renderQuestionList();
    });
  }
  if (questionDescription) {
    questionDescription.addEventListener("input", function () {
      var question = selectedQuestion();
      if (!question) return;
      question.description = questionDescription.value;
    });
  }
  if (questionRequired) {
    questionRequired.addEventListener("change", function () {
      var question = selectedQuestion();
      if (!question) return;
      question.required = questionRequired.checked;
    });
  }
  if (choiceList) {
    choiceList.addEventListener("input", function (event) {
      var input = event.target.closest("[data-choice-id]");
      var question = selectedQuestion();
      if (!input || !question) return;
      question.choices.forEach(function (choice) {
        if (choice.id === input.getAttribute("data-choice-id")) choice.text = input.value;
      });
      clearChoiceIssue(question, input.getAttribute("data-choice-id"), input);
    });
    choiceList.addEventListener("click", function (event) {
      var button = event.target.closest("[data-choice-remove]");
      if (!button || button.disabled) return;
      removeChoice(button.getAttribute("data-choice-remove"));
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
        duplicateQuestion(questionId);
        return;
      }
      if (event.target.closest("[data-question-delete]")) {
        askDeleteQuestion(questionId);
        return;
      }
      selectQuestion(questionId);
    });
    questionItems.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      var text = event.target.closest(".survey-question-item__text");
      if (!text || event.target !== text) return;
      event.preventDefault();
      selectQuestion(text.closest("[data-question-id]").getAttribute("data-question-id"));
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
      if (!item) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      var rect = item.getBoundingClientRect();
      var after = event.clientY >= rect.top + rect.height / 2;
      clearDropMarkers();
      item.classList.add(after ? "is-drop-after" : "is-drop-before");
    });
    questionItems.addEventListener("drop", function (event) {
      if (!dragQuestionId) return;
      event.preventDefault();
      var item = event.target.closest("[data-question-id]");
      if (!item) return;
      var fromId = dragQuestionId;
      var toId = item.getAttribute("data-question-id");
      var after = item.classList.contains("is-drop-after");
      dragQuestionId = "";
      window.setTimeout(function () {
        suppressQuestionClick = false;
        moveQuestion(fromId, toId, after);
      }, 0);
    });
    questionItems.addEventListener("dragend", function () {
      dragQuestionId = "";
      clearDragStyles();
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
    requestCloseQuestionEditor();
  }, true);

  document.addEventListener("keydown", function (event) {
    if (previewIsOpen()) return;
    if (!questionModal || questionModal.hidden || event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    if (questionDiscard && !questionDiscard.hidden) {
      hideDiscardConfirm();
      return;
    }
    if (questionDeleteConfirm && !questionDeleteConfirm.hidden) {
      hideDeleteConfirm();
      return;
    }
    requestCloseQuestionEditor();
  }, true);

  var previewModal = Admin.qs("#survey-preview-modal");
  var previewBody = Admin.qs("#survey-preview-body");
  var previewReturnFocus = null;

  if (previewModal) {
    previewModal.addEventListener("click", function (event) {
      if (event.target.closest("[data-survey-preview-close]")) closeSurveyPreview();
    });
  }

  document.addEventListener("keydown", function (event) {
    if (!previewIsOpen()) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeSurveyPreview();
      return;
    }
    if (event.key !== "Tab" || !previewModal) return;
    var dialog = previewModal.querySelector(".survey-preview__dialog");
    var focusable = Admin.qsa("button, [href], textarea, [tabindex]", dialog).filter(function (el) {
      return !el.disabled && el.getAttribute("tabindex") !== "-1" && !el.hidden;
    });
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
  }, true);

  function previewIsOpen() {
    return !!(previewModal && !previewModal.hidden);
  }

  function openSurveyPreview(fromEditor) {
    if (fromEditor) commitQuestionFields();
    var questions = fromEditor ? cloneQuestions(editorQuestions) : cloneQuestions(draft.questions);
    renderSurveyPreview(readDraft(), questions);
    if (!previewModal) return;
    previewReturnFocus = document.activeElement;
    Admin.qsa("body > *").forEach(function (node) {
      if (node !== previewModal) node.setAttribute("inert", "");
    });
    previewModal.hidden = false;
    document.body.classList.add("is-modal-open");
    var closeButton = Admin.qs("#survey-preview-close");
    if (closeButton) closeButton.focus();
  }

  function closeSurveyPreview() {
    if (previewModal) previewModal.hidden = true;
    Admin.qsa("body > *").forEach(function (node) {
      node.removeAttribute("inert");
    });
    var questionOpen = questionModal && !questionModal.hidden;
    var targetOpen = targetModal && !targetModal.hidden;
    var leaveModal = document.getElementById("modal-survey-leave");
    var leaveOpen = leaveModal && !leaveModal.hidden;
    if (!questionOpen && !targetOpen && !leaveOpen) document.body.classList.remove("is-modal-open");
    if (previewReturnFocus && typeof previewReturnFocus.focus === "function") previewReturnFocus.focus();
    previewReturnFocus = null;
  }

  function renderSurveyPreview(current, questions) {
    if (!previewBody) return;
    var period = previewPeriod(current);
    var target = previewTarget(current.target);
    previewBody.innerHTML = buildSurveyPreviewMarkup({
      title: current.title,
      intro: current.intro,
      periodText: period.text,
      periodMissing: period.missing,
      audienceText: target.text,
      audienceMissing: target.missing
    }, questions);
  }

  function previewPeriod(current) {
    var start = [String(current.startDate || "").trim(), String(current.startTime || "").trim()].filter(Boolean).join(" ");
    var end = current.noEnd ? "종료일 없음" : [String(current.endDate || "").trim(), String(current.endTime || "").trim()].filter(Boolean).join(" ");
    if (!start && (current.noEnd || !end)) return { text: "기간 미설정", missing: true };
    return { text: (start || "(시작일시 미입력)") + " ~ " + (end || "(종료일시 미입력)"), missing: false };
  }

  function previewTarget(target) {
    if (!target || target.mode === "unset") return { text: "참여 대상 미설정", missing: true };
    return { text: targetText(target, 0), missing: false };
  }

  function openQuestionEditor() {
    if (editLive) return;
    editorQuestions = cloneQuestions(draft.questions);
    questionSeq = 0;
    choiceSeq = 0;
    editorQuestions.forEach(rememberQuestionIds);
    selectedQuestionId = editorQuestions.length ? editorQuestions[0].id : "";
    questionErrorMap = {};
    questionEmptyError = false;
    hideQuestionWarn();
    hideDeleteConfirm();
    hideDiscardConfirm();
    normalizeQuestionOrder();
    renderQuestionEditor();
    editorBaseline = editorSnapshot();
    if (window.AdminUI) AdminUI.openModal("modal-survey-questions");
  }

  function applyQuestionEditor() {
    commitQuestionFields();
    var result = validateEditorQuestions();
    questionErrorMap = result.map;
    questionEmptyError = result.empty;
    if (result.firstId) selectedQuestionId = result.firstId;
    renderQuestionEditor();
    if (result.empty || result.firstId) {
      focusEditorIssue(result);
      return;
    }
    draft.questions = cloneQuestions(editorQuestions);
    renderDraftState();
    clearError("survey-question-error", []);
    editorBaseline = editorSnapshot();
    hideDiscardConfirm();
    if (window.AdminUI) AdminUI.closeModal("modal-survey-questions");
  }

  function requestCloseQuestionEditor() {
    if (questionDeleteConfirm && !questionDeleteConfirm.hidden) {
      hideDeleteConfirm();
      return;
    }
    commitQuestionFields();
    if (editorSnapshot() === editorBaseline) {
      hideDiscardConfirm();
      if (window.AdminUI) AdminUI.closeModal("modal-survey-questions");
      return;
    }
    hideDeleteConfirm();
    if (questionDiscard) questionDiscard.hidden = false;
  }

  function discardQuestionEditor() {
    hideDiscardConfirm();
    editorQuestions = cloneQuestions(draft.questions);
    if (window.AdminUI) AdminUI.closeModal("modal-survey-questions");
  }

  function hideDiscardConfirm() {
    if (questionDiscard) questionDiscard.hidden = true;
  }

  function addQuestion() {
    commitQuestionFields();
    questionEmptyError = false;
    questionSeq += 1;
    var question = {
      id: "q" + questionSeq,
      type: "single",
      title: "",
      description: "",
      required: true,
      choices: [newChoice(), newChoice()],
      order: editorQuestions.length + 1
    };
    editorQuestions.push(question);
    selectedQuestionId = question.id;
    hideQuestionWarn();
    hideDeleteConfirm();
    renderQuestionEditor();
  }

  function duplicateQuestion(sourceId) {
    commitQuestionFields();
    var index = questionIndex(sourceId || selectedQuestionId);
    var source = index < 0 ? null : editorQuestions[index];
    if (!source || index < 0) return;
    questionSeq += 1;
    var copy = cloneQuestion(source);
    copy.id = "q" + questionSeq;
    copy.choices = copy.choices.map(function (choice) {
      choiceSeq += 1;
      return { id: "c" + choiceSeq, text: choice.text };
    });
    editorQuestions.splice(index + 1, 0, copy);
    selectedQuestionId = copy.id;
    hideQuestionWarn();
    hideDeleteConfirm();
    renderQuestionEditor();
  }

  function askDeleteQuestion(sourceId) {
    if (sourceId && sourceId !== selectedQuestionId) selectQuestion(sourceId);
    if (!selectedQuestion()) return;
    hideQuestionWarn();
    hideDiscardConfirm();
    if (questionDeleteConfirm) {
      questionDeleteConfirm.hidden = false;
      var deleteCancel = Admin.qs("#survey-question-delete-cancel");
      if (deleteCancel) deleteCancel.focus();
    }
  }

  function hideDeleteConfirm() {
    if (questionDeleteConfirm) questionDeleteConfirm.hidden = true;
  }

  function confirmDeleteQuestion() {
    var index = questionIndex(selectedQuestionId);
    if (index < 0) {
      hideDeleteConfirm();
      return;
    }
    var removedId = editorQuestions[index].id;
    editorQuestions.splice(index, 1);
    delete questionErrorMap[removedId];
    if (!editorQuestions.length) selectedQuestionId = "";
    else if (index >= editorQuestions.length) selectedQuestionId = editorQuestions[editorQuestions.length - 1].id;
    else selectedQuestionId = editorQuestions[index].id;
    hideDeleteConfirm();
    hideQuestionWarn();
    renderQuestionEditor();
  }

  function selectQuestion(id) {
    if (!id || id === selectedQuestionId) return;
    commitQuestionFields();
    selectedQuestionId = id;
    hideQuestionWarn();
    renderQuestionEditor();
  }

  function moveQuestion(fromId, toId, after) {
    commitQuestionFields();
    var from = questionIndex(fromId);
    var to = questionIndex(toId);
    if (from < 0 || to < 0 || from === to) return;
    var moved = editorQuestions.splice(from, 1)[0];
    to = questionIndex(toId);
    editorQuestions.splice(after ? to + 1 : to, 0, moved);
    renderQuestionEditor();
  }

  function clearDropMarkers() {
    if (!questionItems) return;
    Admin.qsa(".survey-question-item", questionItems).forEach(function (item) {
      item.classList.remove("is-drop-before", "is-drop-after");
    });
  }

  function clearDragStyles() {
    if (!questionItems) return;
    Admin.qsa(".survey-question-item", questionItems).forEach(function (item) {
      item.classList.remove("is-dragging", "is-drop-before", "is-drop-after");
    });
  }

  function newChoice() {
    choiceSeq += 1;
    return { id: "c" + choiceSeq, text: "" };
  }

  function questionIndex(id) {
    for (var i = 0; i < editorQuestions.length; i += 1) {
      if (editorQuestions[i].id === id) return i;
    }
    return -1;
  }

  function rememberQuestionIds(question) {
    var questionNumber = /^q(\d+)$/.exec(question.id);
    if (questionNumber) questionSeq = Math.max(questionSeq, Number(questionNumber[1]));
    (question.choices || []).forEach(function (choice) {
      var choiceNumber = /^c(\d+)$/.exec(choice.id);
      if (choiceNumber) choiceSeq = Math.max(choiceSeq, Number(choiceNumber[1]));
    });
  }

  function cloneQuestions(list) {
    return (list || []).map(cloneQuestion);
  }

  function cloneQuestion(question) {
    return {
      id: question.id,
      type: question.type,
      title: question.title,
      description: question.description,
      required: question.required !== false,
      choices: (question.choices || []).map(function (choice) {
        return { id: choice.id, text: choice.text };
      }),
      order: question.order
    };
  }

  function normalizeQuestionOrder() {
    editorQuestions.forEach(function (question, index) {
      question.order = index + 1;
    });
  }

  function editorSnapshot() {
    normalizeQuestionOrder();
    return JSON.stringify(cloneQuestions(editorQuestions));
  }

  function validateEditorQuestions() {
    var map = {};
    var firstId = "";
    if (!editorQuestions.length) return { empty: true, map: map, firstId: "" };
    editorQuestions.forEach(function (question) {
      var issue = surveyQuestionIssueParts(question);
      if (issue.type) issue.count = issue.type;
      if (issue.title || issue.type || issue.count || choiceIssueCount(issue) > 0) {
        map[question.id] = issue;
        if (!firstId) firstId = question.id;
      }
    });
    return { empty: false, map: map, firstId: firstId };
  }

  function choiceIssueCount(issue) {
    var count = 0;
    if (!issue || !issue.choices) return 0;
    for (var key in issue.choices) {
      if (Object.prototype.hasOwnProperty.call(issue.choices, key)) count += 1;
    }
    return count;
  }

  function focusEditorIssue(result) {
    window.setTimeout(function () {
      if (result.empty) {
        var addButton = Admin.qs("#survey-question-add");
        if (addButton) addButton.focus();
        return;
      }
      var question = selectedQuestion();
      var issue = question ? questionErrorMap[question.id] : null;
      if (issue && issue.title && questionTitle) {
        questionTitle.focus();
        return;
      }
      var field = choiceList ? choiceList.querySelector(".is-invalid") : null;
      if (field) field.focus();
    }, 0);
  }

  function selectedQuestion() {
    return editorQuestions.filter(function (question) {
      return question.id === selectedQuestionId;
    })[0] || null;
  }

  function commitQuestionFields() {
    var question = selectedQuestion();
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

  function addChoice() {
    var question = selectedQuestion();
    if (!question || question.type === "text" || question.choices.length >= 10) return;
    commitQuestionFields();
    question.choices.push(newChoice());
    renderChoices(question);
  }

  function removeChoice(choiceId) {
    var question = selectedQuestion();
    if (!question || question.choices.length <= 2) return;
    commitQuestionFields();
    question.choices = question.choices.filter(function (choice) {
      return choice.id !== choiceId;
    });
    renderChoices(question);
  }

  function changeQuestionType(nextType) {
    var question = selectedQuestion();
    if (!question || !nextType || question.type === nextType) return;
    commitQuestionFields();
    var objective = question.type === "single" || question.type === "multi";
    if (objective && nextType === "text") {
      setQuestionType(question.type);
      questionWarn.hidden = false;
      return;
    }
    applyQuestionType(question, nextType);
  }

  function confirmTextType() {
    var question = selectedQuestion();
    hideQuestionWarn();
    if (!question) return;
    applyQuestionType(question, "text");
  }

  function hideQuestionWarn() {
    if (questionWarn) questionWarn.hidden = true;
  }

  function applyQuestionType(question, nextType) {
    var previous = question.type;
    if ((previous === "single" || previous === "multi") && (nextType === "single" || nextType === "multi")) {
      question.type = nextType;
    } else if (nextType === "text") {
      question.type = "text";
      question.choices = [];
    } else {
      question.type = nextType;
      question.choices = [newChoice(), newChoice()];
    }
    hideQuestionWarn();
    renderQuestionEditor();
  }

  function clearChoiceIssue(question, choiceId, input) {
    var issue = questionErrorMap[question.id];
    if (!issue || !issue.choices || !issue.choices[choiceId]) return;
    if (!String(input.value || "").trim()) return;
    delete issue.choices[choiceId];
    input.classList.remove("is-invalid");
    var error = input.parentNode ? input.parentNode.querySelector(".field-error") : null;
    if (error) error.hidden = true;
    if (!issue.title && !issue.count && choiceIssueCount(issue) === 0) delete questionErrorMap[question.id];
    renderQuestionList();
  }

  function renderQuestionEditor() {
    normalizeQuestionOrder();
    renderQuestionList();
    var question = selectedQuestion();
    var hasQuestion = !!question;
    if (questionEditor) questionEditor.hidden = !hasQuestion;
    if (questionPlaceholder) questionPlaceholder.hidden = hasQuestion;
    if (questionEmptyErrorNode) {
      questionEmptyErrorNode.hidden = !questionEmptyError;
      questionEmptyErrorNode.textContent = questionEmptyError ? "문항을 1개 이상 등록해 주세요." : "";
    }
    if (!question) return;
    var issue = questionErrorMap[question.id];
    if (questionEditorTitle) questionEditorTitle.textContent = "문항 " + question.order + " 편집";
    if (questionTitle) {
      questionTitle.value = question.title;
      questionTitle.classList.toggle("is-invalid", !!(issue && issue.title));
    }
    if (questionTitleError) {
      questionTitleError.hidden = !(issue && issue.title);
      questionTitleError.textContent = issue && issue.title ? issue.title : "";
    }
    if (questionDescription) questionDescription.value = question.description;
    if (questionRequired) questionRequired.checked = question.required !== false;
    setQuestionType(question.type);
    var subjective = question.type === "text";
    if (choiceFields) choiceFields.hidden = subjective;
    if (textAnswer) textAnswer.hidden = !subjective;
    if (questionChoiceError) {
      questionChoiceError.hidden = !(issue && issue.count);
      questionChoiceError.textContent = issue && issue.count ? issue.count : "";
    }
    if (!subjective) renderChoices(question);
  }

  function renderQuestionList() {
    if (questionEmpty) questionEmpty.hidden = editorQuestions.length > 0;
    if (!questionItems) return;
    questionItems.innerHTML = editorQuestions.map(function (question) {
      var prefix = question.type === "multi" ? "복수" : question.type === "text" ? "주관" : "단일";
      var title = String(question.title || "").trim();
      var label = "(" + prefix + ") 문항" + question.order + (title ? " - " + title : "");
      var selected = question.id === selectedQuestionId ? " is-selected" : "";
      var invalid = questionErrorMap[question.id] ? " is-invalid" : "";
      var ariaInvalid = questionErrorMap[question.id] ? ' aria-invalid="true"' : "";
      return '<div class="survey-question-item' + selected + invalid + '" data-question-id="' + question.id + '"' + ariaInvalid + ">" +
        '<span class="survey-question-item__grip" draggable="true" aria-hidden="true"></span>' +
        '<span class="survey-question-item__text" role="button" tabindex="0">' + escapeQuestionText(label) + "</span>" +
        '<span class="survey-question-item__tools">' +
        '<button type="button" class="survey-question-item__tool" data-question-duplicate="' + question.id + '" aria-label="복제">' +
        '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="6" y="6" width="7.5" height="7.5" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"></rect><path d="M10 6V3.5a1 1 0 0 0-1-1H3.5a1 1 0 0 0-1 1V9a1 1 0 0 0 1 1H6" fill="none" stroke="currentColor" stroke-width="1.2"></path></svg></button>' +
        '<button type="button" class="survey-question-item__tool" data-question-delete="' + question.id + '" aria-label="삭제">' +
        '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 4.5h9M6.2 4.4V3.2h3.6v1.2M4.8 4.5l.6 8h5.2l.6-8" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path></svg></button>' +
        "</span></div>";
    }).join("");
  }

  function renderChoices(question) {
    if (!choiceList) return;
    var issue = questionErrorMap[question.id];
    var atMinimum = question.choices.length <= 2;
    choiceList.innerHTML = question.choices.map(function (choice, index) {
      var message = issue && issue.choices ? issue.choices[choice.id] : "";
      return '<div class="survey-choice">' +
        '<label for="survey-choice-' + choice.id + '">응답' + (index + 1) + "</label>" +
        '<div class="survey-choice__input">' +
        '<input class="input' + (message ? " is-invalid" : "") + '" id="survey-choice-' + choice.id + '" data-choice-id="' + choice.id + '" type="text" value="' + escapeQuestionText(choice.text) + '">' +
        '<p class="field-error"' + (message ? "" : " hidden") + ">" + escapeQuestionText(message) + "</p></div>" +
        '<button type="button" class="btn" data-choice-remove="' + choice.id + '"' + (atMinimum ? " disabled" : "") + ">삭제</button></div>";
    }).join("");
    if (choiceAdd) choiceAdd.disabled = question.choices.length >= 10;
  }

  function setQuestionType(value) {
    var hidden = Admin.qs("#survey-q-type");
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

  function escapeQuestionText(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
});

Admin.ready(function () {
  var table = Admin.qs("#surveys-draft-table");
  if (!table || !window.MockData) return;

  var pageSize = 10;
  var page = 1;
  var drafts = (MockData.surveyDrafts || []).slice().sort(compareSurveyDrafts);
  var nav = Admin.qs(".surveys-drafts [data-pagination]");
  var notice = document.getElementById("survey-draft-notice");

  if (nav) {
    nav.addEventListener("pagination:change", function (event) {
      page = event.detail.page;
      renderDraftRows();
    });
  }

  table.addEventListener("click", function (event) {
    var resume = event.target.closest("[data-survey-draft-continue]");
    if (resume) {
      event.preventDefault();
      // TODO: 임시저장 이어 작성 API 연동. 저장된 설문을 불러오지 않습니다.
      openDraftNotice("서버가 연결되지 않아 이어 작성할 수 없습니다.");
      return;
    }
    var remove = event.target.closest("[data-survey-draft-delete]");
    if (!remove) return;
    event.preventDefault();
    if (deleteConfirm) deleteConfirm.disabled = false;
    if (window.AdminUI) AdminUI.openModal("modal-survey-draft-delete");
  });

  var deleteConfirm = Admin.qs("#survey-draft-delete-confirm");
  if (deleteConfirm) {
    deleteConfirm.addEventListener("click", function () {
      if (deleteConfirm.disabled) return;
      deleteConfirm.disabled = true;
      // TODO: 임시저장 삭제 API 연동. 확인 후에도 Mock Data를 삭제하지 않습니다.
      openDraftNotice("서버가 연결되지 않아 삭제할 수 없습니다.");
    });
  }

  renderDraftRows();

  function openDraftNotice(message) {
    if (notice) notice.textContent = message;
    if (window.AdminUI) AdminUI.openModal("modal-survey-draft-notice");
  }

  function renderDraftRows() {
    var tbody = Admin.qs("tbody", table);
    var totalPages = Math.ceil(drafts.length / pageSize);
    if (nav) {
      if (!totalPages) {
        nav.hidden = true;
      } else {
        nav.hidden = false;
        if (page > totalPages) page = totalPages;
        if (page < 1) page = 1;
        nav.setAttribute("data-current", String(page));
        nav.setAttribute("data-total", String(totalPages));
        if (window.AdminUI) AdminUI.refreshPagination(nav);
      }
    }
    if (!drafts.length) {
      tbody.innerHTML = '<tr><td class="surveys-empty" colspan="7">임시저장된 설문이 없습니다.</td></tr>';
      return;
    }
    var start = (page - 1) * pageSize;
    tbody.innerHTML = drafts.slice(start, start + pageSize).map(function (item, index) {
      var displayNo = drafts.length - start - index;
      var title = String(item.title || "").trim();
      var ready = isSurveyDraftReady(item, new Date());
      var titleHtml = title
        ? escapeDraftText(title)
        : '<span class="surveys-draft-title is-empty">(제목 없음)</span>';
      return "<tr>" +
        "<td>" + displayNo + "</td>" +
        "<td>" + titleHtml + "</td>" +
        "<td>" + escapeDraftText(item.updatedAt || "-") + "</td>" +
        "<td>" + String((item.questions || []).length) + "</td>" +
        '<td><span class="surveys-draft-status ' + (ready ? "surveys-draft-status--ready" : "surveys-draft-status--need") + '">' + (ready ? "등록 가능" : "입력 필요") + "</span></td>" +
        '<td><button type="button" class="btn btn--sm" data-survey-draft-continue="' + escapeDraftText(item.id) + '">이어 작성</button></td>' +
        '<td><button type="button" class="btn btn--sm" data-survey-draft-delete="' + escapeDraftText(item.id) + '">삭제</button></td>' +
        "</tr>";
    }).join("");
  }

  function escapeDraftText(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
});

Admin.ready(function () {
  var detail = Admin.qs("#survey-detail");
  if (!detail || !window.MockData) return;

  var missing = Admin.qs("#survey-detail-missing");
  var rawId = new URLSearchParams(window.location.search).get("id");
  var id = rawId == null ? "" : String(rawId).trim();
  var item = id ? (MockData.surveys || []).filter(function (survey) {
    return String(survey.id) === id;
  })[0] : null;
  var previewModal = Admin.qs("#survey-preview-modal");
  var previewBody = Admin.qs("#survey-preview-body");
  var previewReturnFocus = null;

  if (!item) {
    detail.hidden = true;
    if (missing) missing.hidden = false;
    return;
  }

  renderSurveyDetail(item);
  detail.hidden = false;

  var previewButton = Admin.qs("#survey-detail-preview");
  if (previewButton) {
    previewButton.addEventListener("click", function () {
      openDetailPreview(item);
    });
  }
  if (previewModal) {
    previewModal.addEventListener("click", function (event) {
      if (event.target.closest("[data-survey-preview-close]")) closeDetailPreview();
    });
  }
  document.addEventListener("keydown", function (event) {
    if (!detailPreviewOpen() || event.key !== "Escape") return;
    event.preventDefault();
    closeDetailPreview();
  });
  var detailDelete = Admin.qs("#survey-detail-delete");
  var detailClose = Admin.qs("#survey-detail-close");
  var detailDeleteConfirm = Admin.qs("#survey-delete-confirm");
  var detailCloseConfirm = Admin.qs("#survey-close-confirm");
  if (detailDelete) {
    detailDelete.addEventListener("click", function (event) {
      event.preventDefault();
      if (detailDelete.disabled || !surveyDeletable(item)) return;
      if (detailDeleteConfirm) detailDeleteConfirm.disabled = false;
      if (window.AdminUI) AdminUI.openModal("modal-survey-delete");
    });
  }
  if (detailDeleteConfirm) {
    detailDeleteConfirm.addEventListener("click", function () {
      // TODO: 설문 삭제 API 연동. 확인 후에도 Mock Data를 삭제하지 않습니다.
      confirmSurveyAction(detailDeleteConfirm, function () {
        return surveyDeletable(item);
      }, "응답이 있는 설문은 삭제할 수 없습니다.", "서버가 연결되지 않아 설문을 삭제할 수 없습니다.");
    });
  }
  if (detailClose) {
    detailClose.addEventListener("click", function (event) {
      event.preventDefault();
      if (detailClose.hidden || !surveyCloseable(item)) return;
      if (detailCloseConfirm) detailCloseConfirm.disabled = false;
      if (window.AdminUI) AdminUI.openModal("modal-survey-close");
    });
  }
  if (detailCloseConfirm) {
    detailCloseConfirm.addEventListener("click", function () {
      // TODO: 설문 수동 종료 API 연동. 확인 후에도 상태와 기간을 바꾸지 않습니다.
      confirmSurveyAction(detailCloseConfirm, function () {
        return surveyCloseable(item);
      }, "진행 중인 설문만 종료할 수 있습니다.", "서버가 연결되지 않아 설문을 종료할 수 없습니다.");
    });
  }

  function renderSurveyDetail(survey) {
    var status = getSurveyStatus(survey, new Date());
    var statusNode = Admin.qs("#survey-detail-status");
    if (statusNode) {
      statusNode.textContent = status || "날짜 오류";
      statusNode.className = detailStatusClass(status);
    }
    var closeButton = Admin.qs("#survey-detail-close");
    if (closeButton) closeButton.hidden = status !== "진행중";
    var editButton = Admin.qs("#survey-detail-edit");
    if (editButton) {
      var editable = status === "진행중" || status === "진행예정";
      editButton.hidden = !editable;
      if (editable) editButton.href = "surveys-edit.html?id=" + encodeURIComponent(survey.id);
    }
    var deleteButton = Admin.qs("#survey-detail-delete");
    var deleteNote = Admin.qs("#survey-detail-delete-note");
    var canDelete = Number(survey.responseCount || 0) === 0;
    if (deleteButton) {
      deleteButton.disabled = !canDelete;
      if (canDelete) deleteButton.removeAttribute("aria-describedby");
      else deleteButton.setAttribute("aria-describedby", "survey-detail-delete-note");
    }
    if (deleteNote) deleteNote.hidden = canDelete;

    var start = splitSurveyStamp(survey.startAt);
    var end = splitSurveyStamp(survey.endAt);
    setValue("survey-detail-start-date", start.date);
    setValue("survey-detail-start-time", start.time);
    var noEndText = Admin.qs("#survey-detail-no-end-text");
    var closed = survey.noEnd === true;
    setValue("survey-detail-end-date", closed ? "" : end.date);
    setValue("survey-detail-end-time", closed ? "" : end.time);
    if (endDateInputNode()) endDateInputNode().hidden = closed;
    if (endTimeInputNode()) endTimeInputNode().hidden = closed;
    if (noEndText) noEndText.hidden = !closed;
    var noEnd = Admin.qs("#survey-detail-no-end");
    if (noEnd) noEnd.checked = closed;
    ["survey-detail-end-date", "survey-detail-end-time"].forEach(function (fieldId) {
      var field = document.getElementById(fieldId);
      if (field) field.disabled = closed;
    });
    setValue("survey-detail-title", survey.title || "");
    var titleField = document.getElementById("survey-detail-title");
    if (titleField) titleField.title = survey.title || "";
    setValue("survey-detail-intro", survey.intro || "");
    var audience = surveyAudienceLabel(survey);
    var audienceInput = Admin.qs("#survey-detail-target");
    if (audienceInput) {
      audienceInput.value = audience;
      audienceInput.title = audience;
      audienceInput.classList.toggle("is-set", audience !== "대상 정보 없음");
    }
    var count = Admin.qs("#survey-detail-question-count");
    if (count) count.textContent = (survey.questions || []).length + "개";
    var responses = Admin.qs("#survey-detail-response-count");
    if (responses) responses.textContent = String(survey.responseCount || 0) + "건";
    var questions = Admin.qs("#survey-detail-questions");
    if (questions) questions.innerHTML = surveyQuestionArticles(survey.questions || []);
  }

  function detailStatusClass(status) {
    if (status === "진행예정") return "surveys-status surveys-status--scheduled";
    if (status === "종료") return "surveys-status surveys-status--ended";
    if (status === "진행중") return "surveys-status surveys-status--live";
    return "surveys-status surveys-status--invalid";
  }

  function setValue(fieldId, value) {
    var field = document.getElementById(fieldId);
    if (field) field.value = value;
  }

  function endDateInputNode() {
    return document.getElementById("survey-detail-end-date");
  }

  function endTimeInputNode() {
    return document.getElementById("survey-detail-end-time");
  }

  function openDetailPreview(survey) {
    if (!previewModal || !previewBody) return;
    var start = String(survey.startAt || "").trim();
    var end = survey.noEnd === true ? "종료일 없음" : String(survey.endAt || "").trim();
    var periodMissing = !start && (survey.noEnd === true || !end);
    var audience = surveyAudienceLabel(survey);
    previewBody.innerHTML = buildSurveyPreviewMarkup({
      title: survey.title,
      intro: survey.intro,
      periodText: periodMissing ? "기간 미설정" : (start || "(시작일시 미입력)") + " ~ " + (end || "(종료일시 미입력)"),
      periodMissing: periodMissing,
      audienceText: audience,
      audienceMissing: audience === "대상 정보 없음"
    }, survey.questions || []);
    previewReturnFocus = document.activeElement;
    Admin.qsa("body > *").forEach(function (node) {
      if (node !== previewModal) node.setAttribute("inert", "");
    });
    previewModal.hidden = false;
    document.body.classList.add("is-modal-open");
    var closeButton = Admin.qs("#survey-preview-close");
    if (closeButton) closeButton.focus();
  }

  function closeDetailPreview() {
    if (previewModal) previewModal.hidden = true;
    Admin.qsa("body > *").forEach(function (node) {
      node.removeAttribute("inert");
    });
    document.body.classList.remove("is-modal-open");
    if (previewReturnFocus && typeof previewReturnFocus.focus === "function") previewReturnFocus.focus();
    previewReturnFocus = null;
  }

  function detailPreviewOpen() {
    return !!(previewModal && !previewModal.hidden);
  }
});

Admin.ready(function () {
  var root = Admin.qs("#survey-results");
  if (!root || !window.MockData) return;

  var missing = Admin.qs("#survey-results-missing");
  var missingText = Admin.qs("#survey-results-missing-text");
  var questionList = Admin.qs("#survey-results-questions");
  var panel = Admin.qs("#survey-results-panel");
  var rawId = new URLSearchParams(window.location.search).get("id");
  var id = rawId == null ? "" : String(rawId).trim();
  var survey = findRegisteredSurvey(id);
  var status = survey ? getSurveyStatus(survey, new Date()) : null;
  var allowed = status === "진행중" || status === "종료";

  if (!survey || !allowed) {
    root.hidden = true;
    if (missingText) {
      if (findSurveyDraft(id)) missingText.textContent = "임시저장된 설문은 응답 결과를 조회할 수 없습니다.";
      else if (survey && status === "진행예정") missingText.textContent = "진행예정 설문은 응답 결과를 조회할 수 없습니다.";
      else if (survey) missingText.textContent = "응답 결과를 조회할 수 없습니다.";
      else missingText.textContent = "설문을 찾을 수 없습니다.";
    }
    if (missing) missing.hidden = false;
    return;
  }

  var questions = survey.questions || [];
  var selectedIndex = 0;
  var textPages = {};
  var demoSupported = !!(window.SurveyResultsDemo && SurveyResultsDemo.supports(survey));
  var demoRecords = demoSupported ? SurveyResultsDemo.build(survey) : null;
  var demoOn = false;
  var demoToggle = document.getElementById("survey-results-demo");
  var demoNote = document.getElementById("survey-results-demo-note");
  var demoUnsupported = document.getElementById("survey-results-demo-unsupported");
  var appliedRange = null;
  var title = Admin.qs("#survey-results-title");
  var statusNode = Admin.qs("#survey-results-status");
  var total = Admin.qs("#survey-results-total");
  var filters = Admin.qs("#survey-results-filters");
  var periodSelect = Admin.qs("#survey-results-period");
  var customPeriod = Admin.qs("#survey-results-custom");
  var periodError = Admin.qs("#survey-results-period-error");
  var startInput = document.getElementById("survey-results-start");
  var endInput = document.getElementById("survey-results-end");
  if (title) title.textContent = survey.title || "";
  if (statusNode) {
    statusNode.textContent = status;
    statusNode.className = status === "종료" ? "surveys-status surveys-status--ended" : "surveys-status surveys-status--live";
  }
  if (total) total.textContent = String(survey.responseCount || 0) + "건";
  if (demoToggle) demoToggle.disabled = !demoSupported;
  if (demoUnsupported) demoUnsupported.hidden = demoSupported;
  root.hidden = false;
  renderResultQuestions();
  if (demoToggle) {
    demoToggle.addEventListener("change", function () {
      if (!demoSupported) {
        demoToggle.checked = false;
        demoOn = false;
        return;
      }
      demoOn = demoToggle.checked;
      textPages[selectedIndex] = 1;
      if (demoNote) demoNote.hidden = !demoOn;
      renderResultPanel();
    });
  }

  if (questionList) {
    questionList.addEventListener("click", function (event) {
      var button = event.target.closest("[data-result-index]");
      if (!button || !questionList.contains(button)) return;
      var nextIndex = Number(button.getAttribute("data-result-index"));
      if (nextIndex !== selectedIndex) textPages[nextIndex] = 1;
      selectedIndex = nextIndex;
      renderResultQuestions();
    });
  }
  if (panel) {
    panel.addEventListener("pagination:change", function (event) {
      textPages[selectedIndex] = event.detail.page;
      renderResultPanel();
    });
  }
  if (periodSelect) {
    periodSelect.addEventListener("select:change", function (event) {
      if (customPeriod) customPeriod.hidden = event.detail.value !== "custom";
      clearResultPeriodError();
      if (event.detail && event.detail.value === "custom") return;
      runResultSearch();
    });
  }
  if (filters) {
    filters.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" || event.target.closest("button")) return;
      event.preventDefault();
      runResultSearch();
    });
  }
  var searchButton = document.getElementById("survey-results-search");
  if (searchButton) {
    searchButton.addEventListener("click", function (event) {
      event.preventDefault();
      runResultSearch();
    });
  }
  var excelButton = document.getElementById("survey-results-excel");
  if (excelButton) {
    excelButton.addEventListener("click", function (event) {
      event.preventDefault();
      // TODO: Excel은 문항 집계만 담고, 주관식 원문과 응답자 개인정보는 제외합니다. 이번 단계에서는 파일을 만들지 않습니다.
      openResultsNotice("서버가 연결되지 않아 Excel 파일을 다운로드할 수 없습니다.");
    });
  }

  function renderResultQuestions() {
    if (!questions.length) {
      if (questionList) questionList.innerHTML = '<p class="survey-results__empty">등록된 문항이 없습니다.</p>';
      if (panel) panel.innerHTML = '<p class="survey-results__empty">표시할 문항이 없습니다.</p>';
      return;
    }
    if (selectedIndex < 0 || selectedIndex >= questions.length) selectedIndex = 0;
    if (questionList) {
      questionList.innerHTML = questions.map(function (question, index) {
        var selected = index === selectedIndex;
        return '<button type="button" class="survey-results__question' + (selected ? " is-selected" : "") + '" data-result-index="' + index + '"' + (selected ? ' aria-current="true"' : "") + ">" +
          '<span class="survey-results__number">' + (index + 1) + "</span>" +
          '<span class="survey-results__question-title">' + escapeSurveyText(String(question.title || "").trim()) + "</span>" +
          '<span class="survey-results__question-type">' + escapeSurveyText(surveyQuestionTypeLabel(question.type)) + "</span></button>";
      }).join("");
    }
    renderResultPanel();
  }

  function renderResultPanel() {
    if (!panel || !questions.length) return;
    var question = questions[selectedIndex];
    var record = demoOn && demoRecords ? demoRecords[selectedIndex] || null : surveyQuestionResult(survey, selectedIndex);
    panel.innerHTML = surveyResultPanelMarkup(question, selectedIndex, record, textPages[selectedIndex] || 1, demoOn);
    var pager = panel.querySelector("[data-pagination]");
    if (pager && window.AdminUI) AdminUI.refreshPagination(pager);
  }

  function runResultSearch() {
    var period = resultPeriodValue();
    var searchedAt = new Date();
    if (period === "custom") {
      var startText = startInput ? startInput.value.trim() : "";
      var endText = endInput ? endInput.value.trim() : "";
      var start = parseSurveyDay(startText, false);
      var end = parseSurveyDay(endText, true);
      if (!startText || !endText) {
        showResultPeriodError("시작일과 종료일을 모두 선택해 주세요.");
        return;
      }
      if (!start || !end) {
        showResultPeriodError("날짜 형식이 올바르지 않습니다.");
        return;
      }
      if (start.getTime() > end.getTime()) {
        showResultPeriodError("시작일은 종료일보다 늦을 수 없습니다.");
        return;
      }
      appliedRange = { mode: "custom", start: start, end: end };
    } else if (period === "1" || period === "3" || period === "6") {
      var range = recentSurveyPeriod(Number(period), searchedAt);
      appliedRange = { mode: "recent", months: Number(period), start: range.start, end: range.end };
    } else {
      appliedRange = { mode: "all" };
    }
    clearResultPeriodError();
    // TODO: 응답 제출일시 기준 서버 조회. 조건을 확정해도 화면의 응답 수는 바꾸지 않습니다.
    openResultsNotice("서버가 연결되지 않아 선택한 기간의 응답 결과를 조회할 수 없습니다.");
  }

  function resultPeriodValue() {
    var hidden = periodSelect ? periodSelect.querySelector('input[name="resultPeriod"]') : null;
    return hidden && hidden.value ? hidden.value : "all";
  }

  function showResultPeriodError(message) {
    if (!periodError) return;
    periodError.textContent = message;
    periodError.hidden = false;
  }

  function clearResultPeriodError() {
    if (!periodError) return;
    periodError.textContent = "";
    periodError.hidden = true;
  }

  function openResultsNotice(message) {
    var notice = document.getElementById("survey-results-notice");
    if (notice) notice.textContent = message;
    if (window.AdminUI) AdminUI.openModal("modal-survey-results-notice");
  }
});
