/* 홈페이지 메인 미리보기용 데이터입니다.
   출처: peach-web/js/home-data.js, peach-web/js/monthly-data.js, peach-web 이미지.
   관리자 localStorage·IndexedDB와 저장 형식이 다릅니다. 서버 연동 시 이 객체만 교체하면 됩니다. */
window.HomePreviewData = {
  orchardDescription: "협회에서 제공하는 이달의 과원 관리 중점 사항을 확인하세요.",
  orchardEmptyDescription: "등록된 콘텐츠가 없습니다.",
  orchardLines: {
    1: "새로운 한 해의 시작을 준비할 때",
    2: "한 해의 결실을 준비할 때",
    3: "봄의 시작을 맞이할 때",
    4: "새로운 생명이 피어나는 때",
    5: "건강한 열매를 가꾸는 때",
    6: "여름의 생장을 살펴볼 때",
    7: "정성의 결실이 익어가는 때",
    8: "달콤한 수확의 기쁨을 나눌 때",
    9: "풍성한 결실을 마무리할 때",
    10: "수확을 마치고 내년을 준비할 때",
    11: "한 해의 과원을 돌아볼 때",
    12: "새로운 계절을 준비하는 때"
  },
  orchard: [
    { type: "orchard", year: 2026, month: 1, published: true, image: "assets/home/orchard-01-thumb.png", sourceId: "peach-web:orchard:2026:1", manageUrl: "monthly-content-form.asp?type=orchard&year=2026&month=1&mode=edit" },
    { type: "orchard", year: 2026, month: 2, published: true, image: "assets/home/orchard-02-thumb.png", sourceId: "peach-web:orchard:2026:2", manageUrl: "monthly-content-form.asp?type=orchard&year=2026&month=2&mode=edit" },
    { type: "orchard", year: 2026, month: 3, published: true, image: "assets/home/orchard-03-thumb.png", sourceId: "peach-web:orchard:2026:3", manageUrl: "monthly-content-form.asp?type=orchard&year=2026&month=3&mode=edit" },
    { type: "orchard", year: 2026, month: 4, published: true, image: "assets/home/orchard-04-thumb.png", sourceId: "peach-web:orchard:2026:4", manageUrl: "monthly-content-form.asp?type=orchard&year=2026&month=4&mode=edit" },
    { type: "orchard", year: 2026, month: 5, published: true, image: "assets/home/orchard-05-thumb.png", sourceId: "peach-web:orchard:2026:5", manageUrl: "monthly-content-form.asp?type=orchard&year=2026&month=5&mode=edit" },
    { type: "orchard", year: 2026, month: 6, published: true, image: "assets/home/orchard-06-thumb.png", sourceId: "peach-web:orchard:2026:6", manageUrl: "monthly-content-form.asp?type=orchard&year=2026&month=6&mode=edit" },
    { type: "orchard", year: 2026, month: 7, published: true, image: "assets/home/orchard-07-thumb.png", sourceId: "peach-web:orchard:2026:7", manageUrl: "monthly-content-form.asp?type=orchard&year=2026&month=7&mode=edit" },
    { type: "orchard", year: 2026, month: 8, published: true, image: "assets/home/orchard-08-thumb.png", sourceId: "peach-web:orchard:2026:8", manageUrl: "monthly-content-form.asp?type=orchard&year=2026&month=8&mode=edit" },
    { type: "orchard", year: 2026, month: 9, published: true, image: "assets/home/orchard-09-thumb.png", sourceId: "peach-web:orchard:2026:9", manageUrl: "monthly-content-form.asp?type=orchard&year=2026&month=9&mode=edit" },
    { type: "orchard", year: 2026, month: 10, published: true, image: "assets/home/orchard-10-thumb.png", sourceId: "peach-web:orchard:2026:10", manageUrl: "monthly-content-form.asp?type=orchard&year=2026&month=10&mode=edit" },
    { type: "orchard", year: 2026, month: 11, published: true, image: "assets/home/orchard-11-thumb.png", sourceId: "peach-web:orchard:2026:11", manageUrl: "monthly-content-form.asp?type=orchard&year=2026&month=11&mode=edit" },
    { type: "orchard", year: 2026, month: 12, published: true, image: "assets/home/orchard-12-thumb.png", sourceId: "peach-web:orchard:2026:12", manageUrl: "monthly-content-form.asp?type=orchard&year=2026&month=12&mode=edit" }
  ],
  cultivation: {
    type: "cultivation",
    year: 2026,
    published: true,
    title: "복숭아 재배력",
    headline: "한눈에 살펴보는 복숭아의 1년",
    description: "월별 생육 단계와 주요 재배관리 정보를 확인하세요.",
    emptyDescription: "등록된 콘텐츠가 없습니다.",
    image: "assets/home/cultivation-thumbnail.png",
    sourceId: "peach-web:cultivation:2026",
    manageUrl: "cultivation-content.asp"
  },
  videos: [
    {
      type: "video",
      sourceId: "cultivation-1",
      title: "꽃눈이 좋아야 수정이 잘 되고 핵할이 없다",
      sourceUrl: "https://youtu.be/1VmE5mcH23Y",
      youtubeId: "1VmE5mcH23Y",
      image: "https://i.ytimg.com/vi/1VmE5mcH23Y/hqdefault.jpg",
      published: true,
      publishedAt: "",
      mainSelected: true
    },
    {
      type: "video",
      sourceId: "cultivation-2",
      title: "꺾거나 비틀지 말고 지긋이 눌러라",
      sourceUrl: "https://youtu.be/cbMvoHudBCI",
      youtubeId: "cbMvoHudBCI",
      image: "https://i.ytimg.com/vi/cbMvoHudBCI/hqdefault.jpg",
      published: true,
      publishedAt: "",
      mainSelected: true
    },
    {
      type: "video",
      sourceId: "cultivation-3",
      title: "야간온도를 25도 이내로 떨어뜨려라",
      sourceUrl: "https://youtu.be/6EU_I5MZLaU",
      youtubeId: "6EU_I5MZLaU",
      image: "https://i.ytimg.com/vi/6EU_I5MZLaU/hqdefault.jpg",
      published: true,
      publishedAt: "",
      mainSelected: true
    }
  ]
};
