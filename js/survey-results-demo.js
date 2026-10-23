/* 설문 25번 결과 화면 미리보기 전용. Mock Data와 localStorage는 변경하지 않습니다. */
var SurveyResultsDemo = (function () {
  var supportedId = "25";

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function singleCounts(length) {
    if (length === 3) return [14, 10, 6];
    var counts = [];
    var left = 30;
    var index;
    for (index = 0; index < length; index += 1) {
      var share = index === length - 1 ? left : Math.floor(30 / length);
      counts.push(share);
      left -= share;
    }
    return counts;
  }

  function multiCounts(length) {
    if (length === 3) return [24, 18, 12];
    var counts = [];
    var index;
    for (index = 0; index < length; index += 1) {
      counts.push(Math.min(30, Math.max(1, 22 - index * 4)));
    }
    return counts;
  }

  function choiceRecord(counts) {
    return {
      respondentCount: 30,
      choices: counts.slice()
    };
  }

  function textRecord() {
    var lines = [
      "시기별 관리 요령이 짧고 분명해서 좋았습니다.",
      "과원관리 자료가 작업 순서대로 정리되어 있습니다.",
      "재배영상은 길이가 적당해서 현장에서 다시 보기 좋았습니다.",
      "교육 일정이 달력과 함께 보이면 더 편하겠습니다.",
      "상담 답변이 다음 날 오전에 도착해서 작업 계획에 반영했습니다.",
      "병해 사진이 잎 앞뒤 모두 있으면 비교가 쉽겠습니다.",
      "수확기 전 물 관리 안내가 올해 날씨와 잘 맞았습니다.",
      "자료 검색은 작물 단계로도 찾을 수 있으면 좋겠습니다.",
      "행사 신청 안내 문장이 짧아서 한 번에 이해됐습니다.",
      "겨울 전정 영상이 초보 기준으로 설명되어 도움이 됐습니다.",
      "봉지 씌우기 시기를 지역별로 나눠 주면 더 정확하겠습니다.",
      "토양 검정 결과 읽는 법이 표와 함께 있어 이해가 쉬웠습니다.",
      "개화기 저온 대비 안내를 전날 저녁에 받아 서두를 수 있었습니다.",
      "상담 항목에 사진 첨부가 되면 증상 설명이 줄어들겠습니다.",
      "장마 전 배수로 점검 목록이 실제 작업과 같았습니다.",
      "재배정보는 월별보다 생육 단계별 묶음이 더 찾기 쉬웠습니다.",
      "교육 장소 약도가 글과 같이 있으면 처음 가는 곳도 괜찮았습니다.",
      "관수 시간 예시를 나무 나이별로 적어 주면 적용이 쉽겠습니다.",
      "병해충 정보는 약제 이름보다 확인 순서를 먼저 적어 주세요.",
      "자료실 글이 길어도 맨 위에 요약이 있어 필요한 부분만 볼 수 있었습니다.",
      "알림 주기가 적당했습니다.",
      "가지 유인 각도를 그림으로만 봐도 현장에 적용할 수 있었습니다.",
      "여름 전정 후 웃자람 관리를 일주일 단위로 적어 주시면 좋겠습니다.",
      "품종별 수확 적기 표가 올해 기온과 함께 있으면 판단이 쉬워집니다.",
      "추가 의견 예시입니다. 재배정보는 작업 전날 확인할 수 있을 만큼 시기가 잘 맞았습니다.\n다만 병해 사진이 흐린 날과 맑은 날로 나뉘어 있으면 잎 색을 비교하기 더 좋겠습니다. 교육 자료도 같은 제목으로 이어지면 현장에서 다시 찾기 쉽습니다.",
      "상담은 같은 질문을 다시 찾지 않아도 이전 답변을 이어서 볼 수 있으면 합니다.",
      "교육 후 배포 자료를 영상과 같은 제목으로 찾아 바로 저장했습니다.",
      "착색기 잎 따기 범위가 사진 기준으로 나와 과하게 따지 않을 수 있었습니다.",
      "병 의심 잎을 올렸을 때 비슷한 사례가 바로 보여 안심이 됐습니다. 다음 확인할 항목까지 함께 적혀 있어 현장에서 순서를 놓치지 않았습니다.",
      "행사 교육은 오전에 실습하고 오후에 질의하는 구성이 현장에 맞았습니다. 재배정보 알림은 하루에 한 번, 그날 확인할 항목만 오면 충분합니다."
    ];
    return {
      respondentCount: 30,
      answers: lines.map(function (text, index) {
        var day = lines.length - index;
        var hour = 9 + (index % 9);
        return {
          text: text,
          submittedAt: "2026.09." + pad(day) + " " + pad(hour) + ":20"
        };
      })
    };
  }

  function supports(survey) {
    return !!survey && String(survey.id) === supportedId;
  }

  function build(survey) {
    if (!supports(survey)) return null;
    return (survey.questions || []).map(function (question) {
      var type = String(question && question.type || "");
      var length = question && question.choices ? question.choices.length : 0;
      if (type === "주관식") return textRecord();
      if (type === "복수 선택") return choiceRecord(multiCounts(length));
      if (type === "단일 선택") return choiceRecord(singleCounts(length));
      return null;
    });
  }

  return {
    supports: supports,
    build: build
  };
})();
