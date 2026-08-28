/* 공고 와처 — data/notices.json을 읽어 렌더링 (수집기는 crawler/collect_notices.py) */
(function () {
  "use strict";
  var listEl = document.getElementById("noticeList");
  var updEl = document.getElementById("noticeUpdated");
  var filterEl = document.getElementById("noticeFilters");
  if (!listEl) return;

  var all = [];
  var activeRegion = "전체";

  function readSeed() {
    var seed = document.getElementById("seedNotices");
    if (!seed) return null;
    try { return JSON.parse(seed.textContent); } catch (e) { return null; }
  }

  function fmt(dateStr) { return dateStr || ""; }

  function render() {
    var items = all.filter(function (n) {
      return activeRegion === "전체" || n.region === activeRegion;
    });
    listEl.innerHTML = "";
    if (!items.length) {
      var empty = document.createElement("p");
      empty.className = "msg";
      empty.textContent = "표시할 공고가 없습니다.";
      listEl.appendChild(empty);
      return;
    }
    items.forEach(function (n) {
      var card = document.createElement("div");
      card.className = "notice-item";

      var meta = document.createElement("div");
      meta.className = "notice-meta";
      var region = document.createElement("span");
      region.className = "region";
      region.textContent = n.region || "";
      meta.appendChild(region);
      meta.appendChild(document.createTextNode(
        (n.category ? " · " + n.category : "") + (n.date ? " · " + fmt(n.date) : "")
      ));
      card.appendChild(meta);

      var a = document.createElement("a");
      a.className = "title";
      a.href = n.link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = n.title;
      card.appendChild(a);

      listEl.appendChild(card);
    });
  }

  function renderFilters() {
    if (!filterEl) return;
    var regions = ["전체"];
    all.forEach(function (n) {
      if (n.region && regions.indexOf(n.region) < 0) regions.push(n.region);
    });
    filterEl.innerHTML = "";
    regions.forEach(function (r) {
      var b = document.createElement("button");
      b.className = "chip" + (r === activeRegion ? " active" : "");
      b.textContent = r;
      b.addEventListener("click", function () {
        activeRegion = r;
        renderFilters();
        render();
      });
      filterEl.appendChild(b);
    });
  }

  function apply(data) {
    if (!data || !data.notices) return;
    all = data.notices;
    if (updEl) {
      updEl.textContent = data.generated_at
        ? "마지막 갱신: " + data.generated_at + (data.source_note ? " · " + data.source_note : "")
        : (data.source_note || "");
    }
    renderFilters();
    render();
  }

  // 1) 페이지에 심어둔 기본 데이터 먼저 표시
  apply(readSeed());

  // 2) 수집기가 만든 최신 JSON이 있으면 교체 (로컬 file:// 환경에서는 생략됨)
  if (location.protocol !== "file:") {
    fetch("data/notices.json", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(apply)
      .catch(function () { /* JSON 없으면 기본 데이터 유지 */ });
  }
})();
