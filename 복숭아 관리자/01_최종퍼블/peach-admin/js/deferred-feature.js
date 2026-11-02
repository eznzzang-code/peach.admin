/* 2026.10.19 확정: 행사·설문은 추후 반영 예정입니다.
 * 원래 HTML과 업무 코드는 보존합니다.
 * 각 HTML의 이 파일 script 참조를 제거하면 안내를 없앨 수 있습니다.
 */
(function () {
  "use strict";
  function showDeferredFeature() {
    if (document.getElementById("deferred-feature-notice")) return;
    var style = document.createElement("style");
    style.textContent = ".deferred-feature{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:32px;background:rgba(255,248,248,.94);color:#862433;font-family:Pretendard,'Malgun Gothic',sans-serif;box-sizing:border-box}.deferred-feature__content{max-width:900px;text-align:center}.deferred-feature h1{font-size:clamp(44px,7vw,88px);line-height:1.25;margin:0 0 30px;font-weight:800;letter-spacing:-.04em}.deferred-feature p{font-size:24px;line-height:1.7;margin:12px 0}.deferred-feature small{display:block;margin:20px 0 32px;font-size:17px;color:#66545a}.deferred-feature a{display:inline-block;padding:16px 28px;background:#862433;color:#fff;border-radius:8px;font-size:20px;text-decoration:none}.deferred-feature a:focus-visible{outline:4px solid #245e42;outline-offset:5px}@media print{.deferred-feature{position:fixed;background:#fff}.deferred-feature a{display:none}}";
    document.head.appendChild(style);
    var notice = document.createElement("section");
    notice.id = "deferred-feature-notice";
    notice.className = "deferred-feature";
    notice.setAttribute("aria-labelledby", "deferred-feature-title");
    notice.innerHTML = '<div class="deferred-feature__content"><h1 id="deferred-feature-title" tabindex="-1">추후 반영 예정</h1><p>행사 신청·설문 참여는 추후 제공할 예정입니다.</p><p>기존 페이지는 보존하며 이번 운영 범위에서 제외합니다.</p><small>2026.10.19 기획 기준</small><a href="contents-list.html">게시물 관리로 이동</a></div>';
    Array.prototype.forEach.call(document.body.children, function (el) { el.inert = true; });
    document.body.appendChild(notice);
    document.getElementById("deferred-feature-title").focus({ preventScroll: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", showDeferredFeature);
  else showDeferredFeature();
})();
