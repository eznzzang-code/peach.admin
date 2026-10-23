var MockData = {
  // TODO: 로그인 사용자 정보 API 연동
  currentUser: {
    name: "정유현"
  },

  // TODO: 콘텐츠 목록 조회 API 연동
  // 각 게시판 첫 화면에서 고정 공지, 긴급, 채널, 게시예정·게시중·게시종료·비공개가 보이도록 맞춘 시연입니다.
  // 긴급 글자는 공개 중이고 긴급 기간 안인 글에만 붙습니다. 이미 수정한 시연 글은 덮어쓰지 않습니다.
  contents: [
    { id: 10, category: "공지", title: "과원관리 요령", body: "과원관리 요령 안내입니다.", channels: ["Web", "App"], status: "게시중", author: "김복숭", updatedAt: "2026.10.21", pinned: true, urgentUse: true, urgentStart: "2026.01.01", urgentEnd: "2027.12.31", publishStart: "2026.01.01", noEnd: true },
    { id: 9, category: "복숭아정보", title: "과원관리 요령", body: "복숭아 과원관리 요령입니다.", channels: ["Web"], status: "게시중", author: "김복숭", updatedAt: "2026.10.20", urgentUse: true, urgentStart: "2026.01.01", urgentEnd: "2027.12.31", publishStart: "2026.01.01", noEnd: true },
    { id: 8, category: "복숭아정보", title: "과원관리 요령", body: "복숭아 과원관리 요령입니다.", channels: ["App"], status: "게시종료", author: "김복숭", updatedAt: "2026.10.14", publishStart: "2026.01.01", publishEnd: "2026.09.30", noEnd: false },
    { id: 7, category: "과원관리", title: "과원관리 요령", body: "과원관리 요령 안내입니다.", channels: ["Web", "App"], status: "게시중", author: "김복숭", updatedAt: "2026.10.07" },
    { id: 6, category: "공지", title: "과원관리 요령", body: "과원관리 요령 임시저장 본문입니다.", channels: ["Web", "App"], status: "임시저장", author: "김복숭", updatedAt: "2026.10.07" },
    { id: 5, category: "재배자료", title: "과원관리 요령", body: "재배자료 과원관리 요령입니다.", channels: ["Web"], status: "게시중", author: "김복숭", updatedAt: "2026.10.20", urgentUse: true, urgentStart: "2026.01.01", urgentEnd: "2027.12.31", publishStart: "2026.01.01", noEnd: true },
    { id: 4, category: "공지", title: "과원관리 요령", body: "과원관리 요령 안내입니다.", channels: ["Web"], status: "게시중", author: "김복숭", updatedAt: "2026.10.20", pinned: true, publishStart: "2026.01.01", noEnd: true },
    { id: 3, category: "공지", title: "과원관리 요령", body: "과원관리 요령 안내입니다.", channels: ["Web"], status: "게시중", author: "김복숭", updatedAt: "2026.10.19", urgentUse: true, urgentStart: "2026.01.01", urgentEnd: "2027.12.31", publishStart: "2026.01.01", noEnd: true },
    { id: 2, category: "과원관리", title: "과원관리 요령", body: "과원관리 요령 안내입니다.", channels: ["App"], status: "게시중", author: "김복숭", updatedAt: "2026.10.07" },
    { id: 1, category: "공지", title: "신규 공지", body: "신규 공지 본문입니다.", channels: ["Web", "App"], status: "임시저장", author: "김순아", updatedAt: "2026.10.07" },
    { id: 20, category: "공지", title: "수확 후 과원 정리", body: "수확이 끝난 과원 정리 안내입니다.", channels: ["App"], status: "게시중", author: "김순아", updatedAt: "2026.10.18", urgentUse: true, urgentStart: "2026.01.01", urgentEnd: "2027.12.31", publishStart: "2026.01.01", noEnd: true },
    { id: 19, category: "복숭아정보", title: "품종별 특성 안내", body: "주요 복숭아 품종 특성입니다.", channels: ["Web", "App"], status: "게시중", author: "이재배", updatedAt: "2026.10.21", urgentUse: true, urgentStart: "2026.01.01", urgentEnd: "2027.12.31", publishStart: "2026.01.01", noEnd: true },
    { id: 18, category: "과원관리", title: "가을 거름 주는 시기", body: "가을 시비 요령입니다.", channels: ["App"], status: "비공개", author: "김복숭", updatedAt: "2026.09.20" },
    { id: 17, category: "재배자료", title: "병해충 방제 자료", body: "복숭아 병해충 방제 자료입니다.", channels: ["Web", "App"], status: "게시중", author: "김복숭", updatedAt: "2026.10.18", publishStart: "2026.01.01", noEnd: true },
    { id: 16, category: "공지", title: "교육 일정 안내", body: "재배 교육 일정 공지입니다.", channels: ["Web", "App"], status: "임시저장", author: "김순아", updatedAt: "2026.09.20" },
    { id: 15, category: "복숭아정보", title: "당도 관리 방법", body: "수확기 당도 관리 방법입니다.", channels: ["App"], status: "게시중", author: "이재배", updatedAt: "2026.10.19", urgentUse: true, urgentStart: "2026.01.01", urgentEnd: "2027.12.31", publishStart: "2026.01.01", noEnd: true },
    { id: 14, category: "과원관리", title: "배수로 점검", body: "장마 이후 배수로 점검 안내입니다.", channels: ["Web"], status: "게시중", author: "김복숭", updatedAt: "2026.09.20" },
    { id: 13, category: "재배자료", title: "전정 기초 자료", body: "겨울 전정을 위한 기초 자료입니다.", channels: ["Web", "App"], status: "게시예정", author: "김순아", updatedAt: "2026.10.15", publishStart: "2026.11.01", noEnd: true },
    { id: 12, category: "공지", title: "자조금 소식", body: "복숭아 자조금 소식입니다.", channels: ["Web", "App"], status: "게시중", author: "김복숭", updatedAt: "2026.10.11", urgentUse: true, urgentStart: "2026.01.01", urgentEnd: "2027.12.31", publishStart: "2026.01.01", noEnd: true },
    { id: 11, category: "과원관리", title: "토양 수분 관리", body: "토양 수분 관리 요령입니다.", channels: ["App"], status: "임시저장", author: "이재배", updatedAt: "2026.09.20" },
    { id: 35, category: "재배자료", title: "여름 전정 매뉴얼", body: "여름 전정 매뉴얼입니다.", channels: ["Web", "App"], status: "게시중", author: "김복숭", updatedAt: "2026.10.21", urgentUse: true, urgentStart: "2026.01.01", urgentEnd: "2027.12.31", publishStart: "2026.01.01", noEnd: true },
    { id: 34, category: "공지", title: "폭염 대비 안내", body: "폭염 대비 과원 관리 공지입니다.", channels: ["Web"], status: "게시중", author: "김순아", updatedAt: "2026.10.15", publishStart: "2026.01.01", noEnd: true },
    { id: 33, category: "복숭아정보", title: "숙기 판별 기준", body: "복숭아 숙기 판별 기준입니다.", channels: ["Web"], status: "비공개", author: "이재배", updatedAt: "2026.10.12" },
    { id: 32, category: "과원관리", title: "봉지 씌우기", body: "봉지 씌우기 작업 안내입니다.", channels: ["Web", "App"], status: "게시중", author: "김복숭", updatedAt: "2026.08.12" },
    { id: 31, category: "재배자료", title: "잎 관리 자료", body: "광합성 유지를 위한 잎 관리 자료입니다.", channels: ["Web"], status: "임시저장", author: "김순아", updatedAt: "2026.08.12" },
    { id: 30, category: "공지", title: "현장 상담 안내", body: "과원 현장 상담 안내입니다.", channels: ["App"], status: "게시중", author: "김복숭", updatedAt: "2026.10.16", publishStart: "2026.01.01", noEnd: true },
    { id: 29, category: "복숭아정보", title: "주요 병해 증상", body: "주요 병해 증상 비교입니다.", channels: ["Web"], status: "게시중", author: "이재배", updatedAt: "2026.10.17", publishStart: "2026.01.01", noEnd: true },
    { id: 28, category: "과원관리", title: "잡초 관리", body: "여름철 잡초 관리 요령입니다.", channels: ["Web", "App"], status: "비공개", author: "김복숭", updatedAt: "2026.08.12" },
    { id: 27, category: "재배자료", title: "관수 간격 자료", body: "생육 단계별 관수 간격입니다.", channels: ["App"], status: "게시중", author: "김순아", updatedAt: "2026.10.19", urgentUse: true, urgentStart: "2026.01.01", urgentEnd: "2027.12.31", publishStart: "2026.01.01", noEnd: true },
    { id: 26, category: "공지", title: "품질 평가회", body: "복숭아 품질 평가회 안내입니다.", channels: ["Web"], status: "임시저장", author: "이재배", updatedAt: "2026.08.12" },
    { id: 25, category: "과원관리", title: "가지 유인", body: "가지 유인 작업 안내입니다.", channels: ["Web", "App"], status: "게시중", author: "김복숭", updatedAt: "2026.08.12" },
    { id: 24, category: "복숭아정보", title: "착과량 조절", body: "착과량 조절 기준입니다.", channels: ["Web", "App"], status: "게시예정", author: "김순아", updatedAt: "2026.10.15", publishStart: "2026.11.01", noEnd: true },
    { id: 23, category: "재배자료", title: "칼슘 공급 자료", body: "생리장해 예방을 위한 칼슘 공급입니다.", channels: ["Web"], status: "게시종료", author: "김복숭", updatedAt: "2026.10.14", publishStart: "2026.01.01", publishEnd: "2026.09.30", noEnd: false },
    { id: 22, category: "공지", title: "수매 일정", body: "올해 수매 일정 공지입니다.", channels: ["Web"], status: "게시예정", author: "이재배", updatedAt: "2026.10.14", publishStart: "2026.11.01", noEnd: true },
    { id: 21, category: "과원관리", title: "웃자람 관리", body: "도장지 웃자람 관리 요령입니다.", channels: ["Web"], status: "게시중", author: "김복숭", updatedAt: "2026.08.12" },
    { id: 50, category: "재배자료", title: "봄 거름 자료", body: "봄 시비 자료입니다.", channels: ["Web"], status: "게시중", author: "김복숭", updatedAt: "2026.10.17", publishStart: "2026.01.01", noEnd: true },
    { id: 49, category: "공지", title: "개화기 저온 주의", body: "개화기 저온 피해 주의 공지입니다.", channels: ["App"], status: "게시종료", author: "김순아", updatedAt: "2026.10.13", publishStart: "2026.01.01", publishEnd: "2026.09.30", noEnd: false },
    { id: 48, category: "복숭아정보", title: "꽃눈 발달", body: "꽃눈 발달 단계 설명입니다.", channels: ["App"], status: "비공개", author: "이재배", updatedAt: "2026.10.13" },
    { id: 47, category: "과원관리", title: "월동 병해충", body: "월동 병해충 관리입니다.", channels: ["Web"], status: "게시중", author: "김복숭", updatedAt: "2026.06.03" },
    { id: 46, category: "재배자료", title: "정지전정 자료", body: "겨울 정지전정 자료입니다.", channels: ["Web", "App"], status: "임시저장", author: "김순아", updatedAt: "2026.06.03" },
    { id: 45, category: "공지", title: "회원 교육 신청", body: "상반기 회원 교육 신청 안내입니다.", channels: ["Web", "App"], status: "비공개", author: "이재배", updatedAt: "2026.10.12" },
    { id: 44, category: "복숭아정보", title: "대목 선택", body: "대목 선택 기준입니다.", channels: ["App"], status: "게시중", author: "김복숭", updatedAt: "2026.10.16", publishStart: "2026.01.01", noEnd: true },
    { id: 43, category: "과원관리", title: "동해 예방", body: "동해 예방 관리 요령입니다.", channels: ["Web", "App"], status: "비공개", author: "김순아", updatedAt: "2026.06.03" },
    { id: 42, category: "재배자료", title: "토양 검정 자료", body: "토양 검정 활용 자료입니다.", channels: ["App"], status: "게시중", author: "이재배", updatedAt: "2026.10.16", publishStart: "2026.01.01", noEnd: true },
    { id: 41, category: "공지", title: "영농 일지 안내", body: "영농 일지 작성 안내입니다.", channels: ["App"], status: "임시저장", author: "김복숭", updatedAt: "2026.06.03" },
    { id: 40, category: "과원관리", title: "가지치기 후 관리", body: "가지치기 후 상처 관리입니다.", channels: ["Web"], status: "게시중", author: "김순아", updatedAt: "2026.06.03" },
    { id: 39, category: "복숭아정보", title: "수형 만들기", body: "복숭아 수형 구성입니다.", channels: ["Web", "App"], status: "게시중", author: "이재배", updatedAt: "2026.10.18", publishStart: "2026.01.01", noEnd: true },
    { id: 38, category: "재배자료", title: "비료 성분 자료", body: "비료 성분표 자료입니다.", channels: ["App"], status: "비공개", author: "김복숭", updatedAt: "2026.10.13" },
    { id: 37, category: "공지", title: "봄철 과원 점검", body: "봄철 과원 점검 공지입니다.", channels: ["Web", "App"], status: "게시중", author: "김순아", updatedAt: "2026.10.17", publishStart: "2026.01.01", noEnd: true },
    { id: 36, category: "과원관리", title: "관수 시설 점검", body: "관수 시설 점검 요령입니다.", channels: ["Web"], status: "게시중", author: "이재배", updatedAt: "2026.06.03" },
    { id: 51, category: "복숭아정보", title: "선별 작업 메모", body: "선별 작업 메모 임시저장입니다.", channels: ["Web", "App"], status: "임시저장", author: "김순아", updatedAt: "2026.10.18" }
  ],

  // TODO: 외부 영상 수집 API 연동
  // id 10~1은 첫 페이지에서 홈 알약과 채널 배지 조합을 모두 보여 주는 시연입니다.
  // 홈 알약은 homeChannels이고, 채널 배지는 메인이 아니어도 공개된 channels입니다.
  videos: [
    { id: 10, originalTitle: "스마트과수원 홍보영상(전체)", displayTitle: "스마트과수원 홍보영상(전체)", duration: "4:49", collectionStatus: "정상", playable: true, category: "재배기술", visibility: "public", channels: ["Web", "App"], homeChannels: ["Web"], mainSelected: true, publishStart: "2020.01.01", publishEnd: "", noEnd: true, collectedAt: "2026.10.01" },
    { id: 9, originalTitle: "스마트과수원 홍보영상", displayTitle: "스마트과수원 홍보영상", duration: "1:00", collectionStatus: "정상", playable: true, category: "재배기술", visibility: "public", channels: ["Web", "App"], homeChannels: [], mainSelected: false, publishStart: "2020.01.01", publishEnd: "", noEnd: true, collectedAt: "2026.10.01" },
    { id: 8, originalTitle: "꽃눈이 좋아야 수정이 잘 되고 핵할이 없다", displayTitle: "꽃눈이 좋아야 수정이 잘 되고 핵할이 없다", duration: "7:48", collectionStatus: "정상", playable: true, category: "재배기술", visibility: "public", channels: ["Web", "App"], homeChannels: ["Web", "App"], mainSelected: true, publishStart: "2020.01.01", publishEnd: "", noEnd: true, collectedAt: "2026.10.01" },
    { id: 7, originalTitle: "꺾거나 비틀지 말고 지긋이 눌러라", displayTitle: "꺾거나 비틀지 말고 지긋이 눌러라", duration: "11:26", collectionStatus: "정상", playable: true, category: "재배기술", visibility: "public", channels: ["Web", "App"], homeChannels: ["App"], mainSelected: false, publishStart: "2020.01.01", publishEnd: "", noEnd: true, collectedAt: "2026.10.01" },
    { id: 6, originalTitle: "아간온도를 25도 이내로 떨어뜨려라", displayTitle: "아간온도를 25도 이내로 떨어뜨려라", duration: "13:54", collectionStatus: "정상", playable: true, category: "재배기술", visibility: "public", channels: ["App"], homeChannels: ["App"], mainSelected: false, publishStart: "2020.01.01", publishEnd: "", noEnd: true, collectedAt: "2026.10.01" },
    { id: 5, originalTitle: "부주에 바로 단과지 만들어라", displayTitle: "부주에 바로 단과지 만들어라", duration: "12:43", collectionStatus: "정상", playable: true, category: "재배기술", visibility: "public", channels: ["App"], homeChannels: [], mainSelected: false, publishStart: "2020.01.01", publishEnd: "", noEnd: true, collectedAt: "2026.10.01" },
    { id: 4, originalTitle: "고품질 과실생산의 출발은 토양관리", displayTitle: "고품질 과실생산의 출발은 토양관리", duration: "12:00", collectionStatus: "정상", playable: true, category: "재배기술", visibility: "public", channels: ["Web"], homeChannels: ["Web"], mainSelected: true, publishStart: "2020.01.01", publishEnd: "", noEnd: true, collectedAt: "2026.10.01" },
    { id: 3, originalTitle: "열과 없애고 당도 올리는 방법", displayTitle: "열과 없애고 당도 올리는 방법", duration: "14:22", collectionStatus: "정상", playable: true, category: "재배기술", visibility: "public", channels: ["Web"], homeChannels: [], mainSelected: false, publishStart: "2020.01.01", publishEnd: "", noEnd: true, collectedAt: "2026.10.01" },
    { id: 2, originalTitle: "가지가 땅으로 향하는 팔메트하수형", displayTitle: "가지가 땅으로 향하는 팔메트하수형", duration: "6:50", collectionStatus: "정상", playable: true, category: "", visibility: "private", channels: [], mainSelected: false, publishStart: "2020.01.01", publishEnd: "", noEnd: true, collectedAt: "2026.10.01" },
    { id: 1, originalTitle: "핵할의 주 원인이 되는 도장지 일시 제거", displayTitle: "핵할의 주 원인이 되는 도장지 일시 제거", duration: "10:38", collectionStatus: "정상", playable: true, category: "", visibility: "private", channels: [], mainSelected: false, publishStart: "2020.01.01", publishEnd: "", noEnd: true, collectedAt: "2026.10.01" }
  ]
};

// id 11~50은 5페이지 구성을 위한 시연용 가상 데이터입니다. 참고 디자인에 없는 행입니다.
(function () {
  var demoTitles = [
    "봄철 꽃눈 관리",
    "봉지 씌우기 요령",
    "수확 적기 판단",
    "여름 전정 기본",
    "토양 수분 확인",
    "병해충 예찰 방법",
    "당도 올리는 관리",
    "가지 유인 작업",
    "월동 준비 요령",
    "개화기 저온 대응",
    "적과 작업 순서",
    "배수로 점검",
    "웃자람 가지 정리",
    "잎 관리 요령",
    "관수 시설 점검",
    "가을 거름 주기",
    "도장지 제거 요령",
    "착과량 조절",
    "숙기 판별",
    "품질 관리 기초",
    "수형 구성",
    "동해 예방",
    "잡초 관리",
    "칼슘 공급",
    "전정 후 관리",
    "봉지 벗기는 시기",
    "수확 후 관리",
    "저장 전 선별",
    "과원 바닥 관리",
    "봄 거름 주기",
    "꽃가루 수분",
    "적뢰 작업",
    "새가지 정리",
    "일소 피해 예방",
    "장마 대비 관리",
    "낙과 줄이기",
    "수확 상자 정리",
    "과원 출입 관리",
    "교육 영상 안내",
    "시즌 준비 점검"
  ];
  var durations = ["3:20", "5:05", "8:12", "9:40", "6:18", "12:05", "4:33", "7:01", "10:15", "2:48"];

  demoTitles.forEach(function (title, index) {
    var id = index + 11;
    var collectedAt = "2026.05.08";
    if (id <= 20) collectedAt = "2026.09.20";
    else if (id <= 30) collectedAt = "2026.08.12";
    else if (id <= 40) collectedAt = "2026.06.03";

    MockData.videos.push({
      id: id,
      originalTitle: title,
      // id 50은 표시 제목이 비어 목록에 원본 제목이 보이는 시연 행입니다.
      displayTitle: id === 50 ? "" : title,
      duration: durations[index % durations.length],
      collectionStatus: "정상",
      playable: true,
      category: id % 8 === 0 ? "재배기술" : "",
      visibility: "private",
      channels: [],
      mainSelected: false,
      publishStart: "2020.01.01",
      publishEnd: "",
      noEnd: true,
      collectedAt: collectedAt
    });
  });

  // 원본 ID는 화면 시연용 식별자입니다. TODO: 외부 영상 원본 ID 연동
  MockData.videos.forEach(function (item) {
    item.originalId = "EXT-" + item.id;
    item.description = "";
    item.thumbnail = "";
    // 2페이지 이후 시연용입니다. 관리자 설정과 playable은 바꾸지 않습니다.
    if (item.id === 18 || item.id === 15) item.collectionStatus = "실패";
    if (item.id === 14 || item.id === 13) item.collectionStatus = "원본 없음";
  });
})();

(function () {
  // 날짜는 페이지를 연 시점의 오늘을 기준으로 계산합니다. 달력 날짜를 고정하면 나중에 상태가 바뀝니다.
  function pad(value) {
    return (value < 10 ? "0" : "") + value;
  }

  function at(offsetDays, time) {
    var date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offsetDays);
    var parts = String(time).split(":");
    date.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
    return date.getFullYear() + "." + pad(date.getMonth() + 1) + "." + pad(date.getDate()) + " " + pad(date.getHours()) + ":" + pad(date.getMinutes());
  }

  function choices(list) {
    return list.map(function (text) { return { text: text }; });
  }

  function question(type, title, choiceList) {
    return {
      type: type,
      title: title,
      description: "",
      required: true,
      choices: choiceList ? choices(choiceList) : []
    };
  }

  var bank = {
    single: question("단일 선택", "자주 보는 자료는 무엇인가요?", ["과원관리", "재배영상", "행사교육"]),
    multi: question("복수 선택", "개선이 필요한 항목을 선택해 주세요", ["교육", "정보", "상담"]),
    text: question("주관식", "추가 의견을 남겨주세요")
  };

  function cloneQuestion(source) {
    return {
      type: source.type,
      title: source.title,
      description: source.description,
      required: source.required,
      choices: source.choices.map(function (item) { return { text: item.text }; })
    };
  }

  function questionSet(kind) {
    if (kind === "all") {
      return [cloneQuestion(bank.single), cloneQuestion(bank.multi), cloneQuestion(bank.text)];
    }
    return [cloneQuestion(bank[kind])];
  }

  // startOffset, endOffset는 오늘 자정 기준 일수입니다. noEnd이면 종료일시는 비웁니다.
  var rows = [
    [25, "2026년 재배정보 만족도 조사", "올해 재배정보 제공에 대한 만족도 조사입니다.", -30, "09:00", 40, "18:00", false, false, 50, "all"],
    [24, "스마트과수원 이용 조사", "스마트과수원 기능 이용 경험 조사입니다.", -20, "09:00", 30, "18:00", false, false, 35, "single"],
    [23, "내년 교육 수요 조사", "내년 교육 과정을 정하기 위한 사전 조사입니다.", 5, "09:00", 40, "18:00", false, false, 0, "multi"],
    [22, "봄철 교육 만족도 조사", "봄철 교육 참여자 만족도 조사입니다.", -50, "07:00", -3, "16:00", false, false, 5, "text"],
    [21, "연중 현장 의견 조사", "종료일 없이 현장 의견을 받습니다.", -12, "09:00", 0, "18:00", true, false, 51, "all"],
    [20, "수확기 교육 사전 조사", "수확기 교육 참여 의향 조사입니다.", 12, "10:00", 45, "18:00", false, false, 0, "single"],
    [19, "병해충 정보 만족도 조사", "병해충 정보 제공 만족도 조사입니다.", -70, "07:00", -10, "16:00", false, false, 85, "multi"],
    [18, "상담 서비스 만족도 조사", "상담 서비스 이용 만족도 조사입니다.", -55, "09:00", -8, "18:00", false, false, 44, "text"],
    [17, "자료실 이용 조사", "자료실 이용 경험 조사입니다.", -48, "09:00", -6, "16:00", false, false, 51, "single"],
    [16, "지난 행사 참여 조사", "수동 종료된 행사 참여 조사입니다.", -7, "09:00", 20, "18:00", false, true, 0, "all"],
    [15, "과원 관리 교육 조사", "과원 관리 교육에 대한 조사입니다.", -18, "09:00", 25, "18:00", false, false, 12, "multi"],
    [14, "토양 관리 의견 조사", "토양 관리 방안에 대한 의견 조사입니다.", -9, "09:00", 15, "18:00", false, false, 0, "text"],
    [13, "겨울 교육 수요 조사", "겨울 교육 수요를 파악하는 사전 조사입니다.", 8, "09:00", 36, "18:00", false, false, 0, "single"],
    [12, "개화기 교육 만족도 조사", "개화기 교육 참여자 만족도 조사입니다.", -40, "07:00", -4, "16:00", false, false, 3, "multi"],
    [11, "중단된 품질 조사", "종료일시가 남아 있지만 수동 종료된 조사입니다.", -6, "09:00", 18, "18:00", false, true, 8, "text"],
    [10, "상시 건의 조사", "종료일 없이 건의를 받습니다.", -14, "09:00", 0, "18:00", true, false, 2, "all"],
    [9, "봉지 씌우기 교육 조사", "봉지 씌우기 교육에 대한 조사입니다.", -16, "09:00", 22, "18:00", false, false, 20, "single"],
    [8, "장마 대비 교육 조사", "장마 대비 교육 참여자 조사입니다.", -36, "07:00", -2, "16:00", false, false, 0, "multi"],
    [7, "내달 현장 견학 조사", "다음 달 현장 견학 참여 의향 조사입니다.", 3, "13:00", 28, "18:00", false, false, 0, "text"],
    [6, "가지 유인 교육 조사", "가지 유인 교육에 대한 조사입니다.", -11, "09:00", 19, "18:00", false, false, 7, "single"],
    [5, "관수 시설 점검 조사", "관수 시설 점검 교육에 대한 조사입니다.", -8, "09:00", 14, "18:00", false, false, 4, "multi"],
    [4, "여름 전정 교육 조사", "여름 전정 교육 참여자 조사입니다.", -33, "07:00", -5, "16:00", false, false, 15, "text"],
    [3, "상시 병해 제보 조사", "종료일 없이 병해 제보를 받습니다.", -21, "09:00", 0, "18:00", true, false, 1, "all"],
    [2, "내년 품평회 수요 조사", "내년 품평회 참여 수요 조사입니다.", 15, "09:00", 50, "18:00", false, false, 0, "single"],
    [1, "중단된 회원 의견 조사", "수동 종료된 회원 의견 조사입니다.", -4, "09:00", 12, "18:00", false, true, 6, "multi"]
  ];

  MockData.surveys = rows.map(function (row) {
    var noEnd = row[7] === true;
    return {
      id: row[0],
      title: row[1],
      intro: row[2],
      startAt: at(row[3], row[4]),
      endAt: noEnd ? "" : at(row[5], row[6]),
      noEnd: noEnd,
      manualClosed: row[8] === true,
      responseCount: row[9],
      targetLabel: "전체 회원",
      registeredAt: at(row[0] - 25, "09:00"),
      questions: questionSet(row[10])
    };
  });

  MockData.surveyDrafts = [
    {
      id: "D1",
      title: "",
      intro: "",
      startAt: "",
      endAt: "",
      noEnd: false,
      manualClosed: false,
      responseCount: 0,
      targetLabel: "",
      registeredAt: at(0, "11:20"),
      updatedAt: at(0, "11:20"),
      questions: []
    }
  ];
})();

(function () {
  // 행사 날짜는 페이지를 연 오늘을 기준으로 계산합니다. 확정 인원은 취소된 신청을 뺀 값입니다.
  function pad(value) {
    return (value < 10 ? "0" : "") + value;
  }

  function at(offsetDays, time) {
    var date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offsetDays);
    var parts = String(time).split(":");
    date.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
    return date.getFullYear() + "." + pad(date.getMonth() + 1) + "." + pad(date.getDate()) + " " + pad(date.getHours()) + ":" + pad(date.getMinutes());
  }

  // id, 제목, 내용, 행사일, 행사시각, 모집시작일, 모집종료일, 종료일 없음, 정원(null=무제한), 확정, 기관취소
  var specs = [
    [50, "재배기술 교육", "재배기술 교육 신청 안내입니다.", 4, "14:00", -11, 8, false, 50, 12, false],
    [49, "전정 실습", "전정 실습 행사 안내입니다.", 4, "14:00", -11, 8, false, 35, 7, false],
    [48, "과원 답사", "과원 답사 참가 안내입니다.", 4, "14:00", -11, 8, false, 20, 0, false],
    [47, "과원 답사", "과원 답사 참가 안내입니다.", 4, "14:00", -11, 8, false, 10, 5, false],
    [46, "과원 답사", "정원이 찬 과원 답사입니다.", 4, "14:00", -11, 8, false, 51, 51, false],
    [45, "전정 실습", "정원이 찬 전정 실습입니다.", 4, "14:00", -11, 8, false, 8, 8, false],
    [44, "재배기술 교육", "재배기술 교육 신청 안내입니다.", 4, "14:00", -11, 8, false, 22, 20, false],
    [43, "재배기술 교육", "재배기술 교육 신청 안내입니다.", 4, "14:00", -11, 8, false, 44, 12, false],
    [42, "전정 실습", "정원이 찬 전정 실습입니다.", 4, "14:00", -11, 8, false, 51, 51, false],
    [41, "전정 실습", "전정 실습 행사 안내입니다.", 4, "14:00", -11, 8, false, 5, 0, false],
    [40, "취소된 현장 교육", "주최 기관이 취소한 행사입니다. 모집 기간은 남아 있습니다.", 6, "10:00", -3, 12, false, 30, 4, true],
    [39, "지난 전정 교육", "모집 종료일이 지난 교육입니다.", -10, "09:00", -30, -2, false, 30, 10, false],
    [38, "내달 과원 답사", "모집 시작 전 과원 답사입니다.", 20, "13:00", 7, 18, false, 40, 0, false],
    [37, "상시 재배 상담", "정원 제한이 없는 상담 행사입니다.", 2, "15:00", -5, 20, false, null, 12, false],
    [36, "연중 과원 견학", "모집 종료일이 없는 견학입니다.", 3, "11:00", -7, 0, true, 30, 6, false],
    [35, "연중 실습 교육", "종료일이 없고 정원이 찬 실습입니다.", 8, "14:00", -4, 0, true, 20, 20, false],
    [34, "상시 기술 상담", "종료일과 정원 제한이 없는 상담입니다.", 1, "16:00", -20, 0, true, null, 4, false],
    [33, "취소된 지난 교육", "기간이 지났고 기관이 취소한 교육입니다.", -15, "09:00", -40, -5, false, 25, 25, true],
    [32, "마감된 정원 교육", "정원이 찼고 모집 기간도 지났습니다.", -8, "10:00", -25, -1, false, 15, 15, false]
  ];

  var fillers = [
    ["봄 전정 교육", "봄 전정 교육 신청입니다.", 5, "14:00", -2, 12, false, 40, 9, false],
    ["여름 병해 교육", "여름 병해 교육 신청입니다.", 12, "10:00", 4, 20, false, 25, 0, false],
    ["수확 평가회", "모집이 끝난 수확 평가회입니다.", -6, "15:00", -20, -3, false, 50, 18, false],
    ["회원 간담회", "기관이 취소한 간담회입니다.", 9, "11:00", -1, 14, false, 20, 3, true],
    ["토양 실습", "정원이 찬 토양 실습입니다.", 7, "14:00", -6, 10, false, 16, 16, false],
    ["현장 컨설팅", "정원 제한 없는 컨설팅입니다.", 3, "09:00", -8, 15, false, null, 7, false],
    ["연중 상담", "종료일 없는 상담입니다.", 2, "13:00", -15, 0, true, 100, 11, false]
  ];
  var nextId = 31;
  var index = 0;
  while (nextId >= 1) {
    var filler = fillers[index % fillers.length];
    specs.push([nextId, filler[0] + " " + nextId, filler[1], filler[2], filler[3], filler[4], filler[5], filler[6], filler[7], filler[8], filler[9]]);
    nextId -= 1;
    index += 1;
  }

  MockData.events = specs.map(function (row) {
    var noEnd = row[7] === true;
    return {
      id: row[0],
      title: row[1],
      body: row[2],
      eventAt: at(row[3], row[4]),
      recruitStartAt: at(row[5], "09:00"),
      recruitEndAt: noEnd ? "" : at(row[6], "18:00"),
      noRecruitEnd: noEnd,
      capacity: row[8],
      confirmedCount: row[9],
      cancelledByOrganizer: row[10] === true,
      registeredAt: at(row[0] - 80, "09:00")
    };
  });

  MockData.eventDrafts = [
    { id: "D1", title: "", body: "", updatedAt: at(0, "11:20") }
  ];
})();

(function () {
  // 테스트용 가상 신청자입니다. 실존 인물이 아니며 주민등록번호와 상세 주소는 두지 않습니다.
  // 일부 행사의 예시만 연결합니다. 행사 50건의 확정 인원을 바꾸거나 이 목록으로 다시 계산하지 않습니다.
  // 신청 이력이 없는 행사의 취소 인원은 만들지 않습니다.
  function pad(value) {
    return (value < 10 ? "0" : "") + value;
  }

  function at(offsetDays, time) {
    var date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offsetDays);
    var parts = String(time).split(":");
    date.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
    return date.getFullYear() + "." + pad(date.getMonth() + 1) + "." + pad(date.getDate()) + " " + pad(date.getHours()) + ":" + pad(date.getMinutes());
  }

  var memberTypes = ["농가", "법인", "유통", "기타"];
  var rows = [];
  var index;
  for (index = 1; index <= 9; index += 1) {
    rows.push({
      applicationId: "A-50-" + pad(index),
      eventId: 50,
      memberId: "TM-50-" + pad(index),
      name: "테스트회원" + pad(index),
      memberType: memberTypes[(index - 1) % memberTypes.length],
      phone: "010000010" + pad(index),
      appliedAt: at(-13 + index, "10:" + pad(index)),
      status: "신청확정"
    });
  }
  rows.push({
    applicationId: "A-50-10",
    eventId: 50,
    memberId: "TM-50-10",
    name: "테스트회원10",
    memberType: "농가",
    phone: "01000001010",
    appliedAt: at(-3, "09:10"),
    status: "신청취소",
    cancelledAt: at(-3, "16:20"),
    cancelReason: "테스트용 취소 사유"
  });
  rows.push({
    applicationId: "A-50-11",
    eventId: 50,
    memberId: "TM-50-11",
    name: "테스트회원11",
    memberType: "법인",
    phone: "01000001011",
    appliedAt: at(-2, "14:00"),
    status: "신청취소"
  });
  rows.push({
    applicationId: "A-50-12",
    eventId: 50,
    memberId: "TM-50-12",
    name: "테스트회원12",
    memberType: "유통",
    phone: "01000001012",
    appliedAt: at(-1, "11:30"),
    status: "신청취소",
    cancelledAt: at(-1, "15:10"),
    cancelReason: ""
  });
  rows.push({
    applicationId: "A-48-01",
    eventId: 48,
    memberId: "TM-48-01",
    name: "테스트회원48",
    memberType: "기타",
    phone: "01000001048",
    appliedAt: at(-6, "13:00"),
    status: "신청취소",
    cancelledAt: at(-5, "09:40"),
    cancelReason: "테스트용 취소 사유"
  });

  var seenApplication = {};
  var seenValid = {};
  rows.forEach(function (row) {
    if (seenApplication[row.applicationId]) console.error("신청 ID가 중복되었습니다.", row.applicationId);
    seenApplication[row.applicationId] = true;
    if (row.applicationId === row.memberId) console.error("신청 ID와 회원 ID가 같습니다.", row.applicationId);
    if (row.status !== "신청확정" && row.status !== "신청취소") console.error("지원하지 않는 신청 상태입니다.", row.applicationId);
    if (row.status === "신청확정") {
      var key = row.eventId + ":" + row.memberId;
      if (seenValid[key]) console.error("같은 행사의 유효 신청이 중복되었습니다.", key);
      seenValid[key] = true;
    }
  });

  MockData.eventApplications = rows;
})();

// 월별 콘텐츠 관리 테스트 데이터입니다. 게시글 MockData.contents와 저장소를 공유하지 않습니다.
// 홈페이지 노출 규칙과 별개로, 관리자 목록은 과거·미래 연도와 비공개 건을 함께 조회합니다.
// 대표 이미지는 url, name, alt로 둡니다. 샘플에는 실제 이미지 파일이 없어 state는 "없음"이고 url은 비웁니다.
(function () {
  function emptyImage() {
    return { url: "", name: "", alt: "", state: "없음" };
  }
  var rows = [
    { id: "MC-O-2025-05", type: "과원관리", year: 2025, month: 5, title: "테스트 2025년 5월 과원관리", body: "과거 연도 조회용 테스트 본문입니다.", image: emptyImage(), visibility: "공개", updatedAt: "2025.05.12" },
    { id: "MC-O-2025-09", type: "과원관리", year: 2025, month: 9, title: "테스트 2025년 9월 과원관리", body: "과거 연도 조회용 테스트 본문입니다.", image: emptyImage(), visibility: "비공개", updatedAt: "2025.09.03" },
    { id: "MC-O-2026-01", type: "과원관리", year: 2026, month: 1, title: "테스트 2026년 1월 과원관리", body: "겨울 정지 전 과원 점검 테스트 본문입니다.", image: emptyImage(), visibility: "공개", updatedAt: "2026.01.08" },
    { id: "MC-O-2026-03", type: "과원관리", year: 2026, month: 3, title: "테스트 2026년 3월 과원관리", body: "개화 전 과원 관리 테스트 본문입니다.", image: emptyImage(), visibility: "비공개", updatedAt: "2026.03.14" },
    { id: "MC-O-2026-06", type: "과원관리", year: 2026, month: 6, title: "테스트 2026년 6월 과원관리", body: "여름 과원 관리 테스트 본문입니다.", image: emptyImage(), visibility: "공개", updatedAt: "2026.06.02" },
    { id: "MC-O-2026-10", type: "과원관리", year: 2026, month: 10, title: "테스트 2026년 10월 과원관리", body: "수확 후 과원 관리 테스트 본문입니다.", image: emptyImage(), visibility: "공개", updatedAt: "2026.10.11" },
    { id: "MC-O-2027-03", type: "과원관리", year: 2027, month: 3, title: "테스트 2027년 3월 과원관리", body: "다음 연도 사전 등록 테스트 본문입니다.", image: emptyImage(), visibility: "공개", updatedAt: "2026.10.16" },
    { id: "MC-C-2025-07", type: "재배력", year: 2025, month: 7, title: "테스트 2025년 7월 재배력", body: "과거 연도 조회용 테스트 본문입니다.", image: emptyImage(), visibility: "공개", updatedAt: "2025.07.18" },
    { id: "MC-C-2026-02", type: "재배력", year: 2026, month: 2, title: "테스트 2026년 2월 재배력", body: "2월 재배 일정 테스트 본문입니다.", image: emptyImage(), visibility: "공개", updatedAt: "2026.02.05" },
    { id: "MC-C-2026-04", type: "재배력", year: 2026, month: 4, title: "테스트 2026년 4월 재배력", body: "4월 재배 일정 테스트 본문입니다.", image: emptyImage(), visibility: "비공개", updatedAt: "2026.04.09" },
    { id: "MC-C-2026-08", type: "재배력", year: 2026, month: 8, title: "테스트 2026년 8월 재배력", body: "8월 재배 일정 테스트 본문입니다.", image: emptyImage(), visibility: "공개", updatedAt: "2026.08.21" },
    { id: "MC-C-2026-11", type: "재배력", year: 2026, month: 11, title: "테스트 2026년 11월 재배력", body: "11월 재배 일정 테스트 본문입니다.", image: emptyImage(), visibility: "공개", updatedAt: "2026.11.01" }
  ];

  var seen = {};
  rows.forEach(function (row) {
    var key = row.type + ":" + row.year + ":" + row.month;
    if (seen[key]) console.error("월별 콘텐츠 키가 중복되었습니다.", key);
    seen[key] = true;
    if (row.visibility !== "공개" && row.visibility !== "비공개") {
      console.error("지원하지 않는 노출 상태입니다.", row.id);
    }
    if (!row.image || row.image.state !== "없음" || row.image.url || (typeof File !== "undefined" && row.image instanceof File)) {
      console.error("테스트 콘텐츠에는 실제 이미지 파일을 넣지 않습니다.", row.id);
    }
  });

  MockData.monthlyContents = rows;
})();

// 운영자·권한 조회용 시연 데이터입니다. 게시글·행사·월별 콘텐츠와 저장소를 공유하지 않습니다.
// 업무와 권한 항목은 참고 화면에서 확인된 구성만 둡니다. 이 데이터는 화면 표시용이며 저장하지 않습니다.
(function () {
  var tasks = [
    { id: "content", name: "콘텐츠", actions: ["write", "publish"] },
    { id: "video", name: "영상", actions: ["write", "publish"] },
    { id: "organization", name: "기관 정보", actions: ["write", "publish"] },
    { id: "survey", name: "설문", actions: ["write", "publish", "result", "download"] },
    { id: "event", name: "행사", actions: ["write", "publish", "result", "download"] }
  ];
  var actions = [
    { id: "write", name: "작성" },
    { id: "publish", name: "게시" },
    { id: "result", name: "결과 조회" },
    { id: "download", name: "다운로드" }
  ];
  var operators = [
    {
      id: "operator-a",
      name: "운영자 A",
      status: "사용",
      permissions: {
        content: { write: true, publish: false },
        video: { write: true, publish: true },
        organization: { write: false, publish: true },
        survey: { write: false, publish: false, result: true, download: true },
        event: { write: true, publish: false, result: false, download: false }
      }
    },
    {
      id: "operator-b",
      name: "운영자 B",
      status: "사용",
      permissions: {
        content: { write: false, publish: true },
        video: { write: false, publish: false },
        organization: { write: true, publish: false },
        survey: { write: true, publish: true, result: false, download: false },
        event: { write: false, publish: true, result: true, download: false }
      }
    },
    {
      id: "operator-c",
      name: "운영자 C",
      status: "미사용",
      permissions: {
        content: { write: true, publish: true },
        video: { write: true, publish: false },
        organization: { write: false, publish: false },
        survey: { write: false, publish: true, result: true, download: false },
        event: { write: false, publish: false, result: false, download: true }
      }
    }
  ];

  var seen = {};
  operators.forEach(function (operator) {
    if (!operator.id || seen[operator.id]) console.error("운영자 ID가 없거나 중복되었습니다.", operator.id);
    seen[operator.id] = true;
    if (operator.status !== "사용" && operator.status !== "미사용") {
      console.error("지원하지 않는 운영자 상태입니다.", operator.id);
    }
    tasks.forEach(function (task) {
      var row = operator.permissions && operator.permissions[task.id];
      if (!row) console.error("운영자 권한이 없습니다.", operator.id, task.id);
      actions.forEach(function (action) {
        var allowed = task.actions.indexOf(action.id) !== -1;
        var hasValue = row && Object.prototype.hasOwnProperty.call(row, action.id);
        if (allowed && (!hasValue || typeof row[action.id] !== "boolean")) {
          console.error("업무 권한이 없습니다.", operator.id, task.id, action.id);
        }
        if (!allowed && hasValue) {
          console.error("참고 화면에 없는 권한 항목입니다.", operator.id, task.id, action.id);
        }
      });
    });
  });

  MockData.permissionTasks = tasks;
  MockData.permissionActions = actions;
  MockData.operators = operators;
})();
