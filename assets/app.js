/* Land Master Pro — 공통 스크립트: 진행도(XP)·퀴즈 엔진·검색·전면광고 슬롯 */
(function () {
  "use strict";
  var CFG = window.LMP_CONFIG || {};
  var FACTS = window.LMP_FACTS || [];
  var STORE_KEY = "lmp_progress_v1";
  var TOTAL_MODULES = 25;
  var XP_FIRST = 20;   // 첫 시도 정답
  var XP_RETRY = 10;   // 재시도 후 정답

  var LEVELS = [
    { xp: 0, name: "Lv.1 토지 견습생" },
    { xp: 80, name: "Lv.2 임장 초보" },
    { xp: 180, name: "Lv.3 서류 분석가" },
    { xp: 280, name: "Lv.4 맹지 탈출러" },
    { xp: 400, name: "Lv.5 용도지역 마스터" },
    { xp: 500, name: "Lv.MAX 토지 마스터" }
  ];

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* 저장소 미지원 환경 */ }
    return { xp: 0, modules: {}, seenFacts: {} };
  }
  function save(st) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(st)); } catch (e) {}
  }
  var state = load();
  if (!state.seenFacts) state.seenFacts = {};

  function updateStreak() {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var todayStr = today.toISOString().slice(0, 10);
    if (state.lastVisit === todayStr) return;
    if (state.lastVisit) {
      var prev = new Date(state.lastVisit); prev.setHours(0, 0, 0, 0);
      var diffDays = Math.round((today - prev) / 86400000);
      state.streak = diffDays === 1 ? (state.streak || 0) + 1 : 1;
    } else {
      state.streak = 1;
    }
    state.lastVisit = todayStr;
    save(state);
  }
  updateStreak();

  /* ---------- 정답 축하 연출: 컨페티 + XP 토스트 ---------- */
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function burstConfetti(x, y) {
    if (reduceMotion) return;
    var colors = ["#0EA672", "#16B981", "#E8A33D", "#E0524B", "#2EE6A8"];
    for (var i = 0; i < 12; i++) {
      (function (i) {
        var p = document.createElement("span");
        p.className = "confetti-piece";
        p.style.left = x + "px"; p.style.top = y + "px";
        p.style.background = colors[i % colors.length];
        document.body.appendChild(p);
        var angle = (Math.PI * 2 * i / 12) + (Math.random() * 0.5);
        var dist = 50 + Math.random() * 40;
        var tx = Math.cos(angle) * dist, ty = Math.sin(angle) * dist - 20;
        var anim = p.animate(
          [{ transform: "translate(0,0) rotate(0deg)", opacity: 1 },
           { transform: "translate(" + tx + "px," + ty + "px) rotate(" + Math.round(angle * 180) + "deg)", opacity: 0 }],
          { duration: 700 + Math.random() * 300, easing: "cubic-bezier(.2,.8,.3,1)" }
        );
        anim.onfinish = function () { p.remove(); };
      })(i);
    }
  }
  function showXpToast(x, y, amount) {
    var t = document.createElement("div");
    t.className = "xp-toast";
    t.style.left = x + "px"; t.style.top = y + "px";
    t.textContent = "+" + amount + " XP";
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 1200);
  }
  function celebrate(el, amount) {
    if (!el) return;
    var r = el.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top;
    burstConfetti(x, y);
    if (amount) showXpToast(x, y, amount);
  }

  function levelName(xp) {
    var name = LEVELS[0].name;
    for (var i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].xp) name = LEVELS[i].name;
    return name;
  }
  function doneCount(prefix) {
    var n = 0;
    for (var k in state.modules) {
      if (state.modules[k] && state.modules[k].done) {
        if (!prefix || k.indexOf(prefix + "-") === 0) n++;
      }
    }
    return n;
  }

  /* ---------- 헤더 XP 칩 & 진행 바 ---------- */
  function refreshWidgets() {
    var chip = document.getElementById("xpChip");
    if (chip) chip.textContent = "🧭 " + levelName(state.xp) + " · " + state.xp + " XP · " + doneCount() + "/" + TOTAL_MODULES + " 관문";
    var streakChip = document.getElementById("streakChip");
    if (streakChip) streakChip.textContent = "🔥 " + (state.streak || 1) + "일 연속";

    var bar = document.querySelector("[data-stage-progress]");
    if (bar) {
      var sn = bar.getAttribute("data-stage-progress");
      var d = doneCount(sn);
      var pct = Math.round((d / 5) * 100);
      var fill = bar.querySelector(".progress-bar-fill");
      var label = bar.querySelector("[data-progress-label]");
      if (fill) fill.style.width = pct + "%";
      if (label) label.textContent = d + "/5 관문 완료 (" + pct + "%)";
    }

    var pulseAssigned = false;
    document.querySelectorAll("[data-mini-stage]").forEach(function (el) {
      var sn = el.getAttribute("data-mini-stage");
      var d = doneCount(sn);
      var i = el.querySelector(".mini-bar i");
      var lab = el.querySelector(".mini-label");
      if (i) i.style.width = (d / 5) * 100 + "%";
      if (lab) lab.textContent = d + "/5 관문 완료";
      var badge = el.querySelector(".node-badge");
      if (badge) {
        badge.classList.remove("done", "current");
        if (d >= 5) { badge.classList.add("done"); }
        else if (!pulseAssigned) { badge.classList.add("current"); pulseAssigned = true; }
      }
    });

    document.querySelectorAll(".module-card[data-module]").forEach(function (card) {
      var id = card.getAttribute("data-module");
      if (state.modules[id] && state.modules[id].done) card.classList.add("completed");
    });

    var fc = document.getElementById("factSeenCount");
    if (fc) fc.textContent = Object.keys(state.seenFacts).length + "개 확인함";
  }

  /* ---------- 심화 퀴즈 (3지선다) ---------- */
  function initQuizzes() {
    document.querySelectorAll(".quiz-box").forEach(function (box) {
      var modId = box.getAttribute("data-module");
      var ans = parseInt(box.getAttribute("data-ans"), 10);
      var opts = box.querySelectorAll(".quiz-opt");
      var fb = box.querySelector(".quiz-feedback");
      var attempted = false;

      opts.forEach(function (btn, idx) {
        btn.addEventListener("click", function () {
          var already = state.modules[modId] && state.modules[modId].done;
          if (idx === ans) {
            opts.forEach(function (b) { b.disabled = true; });
            btn.classList.add("correct");
            var gained = 0;
            if (!already) {
              gained = attempted ? XP_RETRY : XP_FIRST;
              state.xp += gained;
              state.modules[modId] = { done: true, firstTry: !attempted };
              save(state);
            }
            fb.className = "quiz-feedback ok";
            fb.innerHTML = "🎉 <b>정답!</b> " + box.getAttribute("data-exp") +
              (gained ? ' <span class="xp-gain">+' + gained + " XP</span>" : " (이미 클리어한 관문)");
            celebrate(btn, gained);
            refreshWidgets();
          } else {
            attempted = true;
            btn.classList.add("wrong");
            btn.disabled = true;
            fb.className = "quiz-feedback no";
            fb.innerHTML = "❌ <b>오답입니다.</b> " + box.getAttribute("data-wrong") + "\n다른 보기를 다시 골라보세요.";
          }
        });
      });
    });
  }

  /* ---------- OX 상식 퀵체크 (모듈 카드, 더보기 펼침) ---------- */
  function markSeen(sub) {
    if (!state.seenFacts[sub]) { state.seenFacts[sub] = true; save(state); refreshWidgets(); }
  }
  function initOxCards() {
    document.querySelectorAll(".module-card[data-ox-answer]").forEach(function (card) {
      var sub = card.getAttribute("data-module");
      var row = card.querySelector(".ox-row");
      var fb = card.querySelector(".ox-feedback");
      if (!row) return;
      var answer = card.getAttribute("data-ox-answer") === "true";
      var buttons = row.querySelectorAll(".ox-btn");
      var retryBtn = card.querySelector(".ox-retry-btn");
      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var val = btn.getAttribute("data-val") === "true";
          buttons.forEach(function (b) { b.disabled = true; });
          if (val === answer) {
            btn.classList.add("correct");
            celebrate(btn);
          } else {
            btn.classList.add("wrong");
            buttons.forEach(function (b) { if (b.getAttribute("data-val") === String(answer)) b.classList.add("correct"); });
          }
          fb.className = "ox-feedback " + (val === answer ? "ok" : "no");
          fb.innerHTML = (val === answer
            ? "🎉 <b>정답이에요!</b> "
            : "😅 <b>아쉬워요, 틀렸어요!</b> 정답은 <b>'" + (answer ? "맞다" : "아니다") + "'</b>입니다. "
          ) + card.getAttribute("data-snap");
          if (retryBtn) retryBtn.classList.remove("hidden");
          markSeen(sub);
        });
      });
      if (retryBtn) {
        retryBtn.addEventListener("click", function () {
          buttons.forEach(function (b) { b.disabled = false; b.classList.remove("correct", "wrong"); });
          fb.className = "ox-feedback";
          fb.innerHTML = "";
          retryBtn.classList.add("hidden");
        });
      }
      var more = card.querySelector(".more-btn");
      var deep = card.querySelector(".deep-dive");
      if (more && deep) {
        more.addEventListener("click", function () {
          var willOpen = deep.classList.contains("hidden");
          deep.classList.toggle("hidden");
          more.setAttribute("aria-expanded", willOpen ? "true" : "false");
          more.textContent = willOpen ? "🔼 접기" : "🔍 실전 사례·전체 해설 더보기 (심화 퀴즈 포함)";
        });
      }
    });
  }

  /* ---------- 오늘의 상식 히어로 카드 (홈) ---------- */
  var fhIndex = 0;
  function renderHero() {
    var f = FACTS[fhIndex];
    if (!f) return;
    var colorMap = { "초급": "#16B981", "중급": "#E8A33D", "고급": "#E0524B" };
    var diffEl = document.getElementById("fhDiff");
    if (diffEl) diffEl.innerHTML = '<span style="color:' + colorMap[f.diff] + '">' + f.diff + ' · S' + f.stage + ' 관문 ' + f.sub + '</span>';
    document.getElementById("fhQ").textContent = f.hook;
    document.getElementById("fhOxText").textContent = f.ox;
    document.getElementById("fhFeedback").className = "fh-feedback";
    document.getElementById("fhFeedback").innerHTML = "";
    document.querySelectorAll("#fhCard .ox-btn").forEach(function (b) { b.disabled = false; b.classList.remove("correct", "wrong"); });
  }
  function answerHero(val) {
    var f = FACTS[fhIndex];
    var correct = val === f.answer;
    var clickedBtn = document.getElementById(val ? "fhTrue" : "fhFalse");
    document.querySelectorAll("#fhCard .ox-btn").forEach(function (b) {
      b.disabled = true;
      var bv = b.id === "fhTrue";
      if (bv === f.answer) b.classList.add("correct");
      else if (bv === val) b.classList.add("wrong");
    });
    if (correct) celebrate(clickedBtn);
    var box = document.getElementById("fhFeedback");
    box.className = "fh-feedback " + (correct ? "ok" : "no");
    box.innerHTML = (correct
      ? "🎉 <b>정답이에요!</b> "
      : "😅 <b>아쉬워요, 틀렸어요!</b> 정답은 <b>'" + (f.answer ? "맞다" : "아니다") + "'</b>입니다. "
    ) + f.snap +
      '<br><br><a class="btn sm" href="stage' + f.stage + '.html#mod-' + f.sub + '" style="margin-top:4px;">📖 이 관문 전체 학습 보러가기 →</a>';
    markSeen(f.sub);
  }
  function initHero() {
    if (!FACTS.length || !document.getElementById("fhCard")) return;
    fhIndex = Math.floor(Math.random() * FACTS.length);
    renderHero();
    document.getElementById("fhTrue").addEventListener("click", function () { answerHero(true); });
    document.getElementById("fhFalse").addEventListener("click", function () { answerHero(false); });
    document.getElementById("fhNext").addEventListener("click", function () { fhIndex = (fhIndex + 1) % FACTS.length; renderHero(); });
    document.getElementById("fhPrev").addEventListener("click", function () { fhIndex = (fhIndex - 1 + FACTS.length) % FACTS.length; renderHero(); });
    document.getElementById("fhRandom").addEventListener("click", function () { fhIndex = Math.floor(Math.random() * FACTS.length); renderHero(); });
    var shareBtn = document.getElementById("fhShare");
    if (shareBtn) {
      shareBtn.addEventListener("click", function () {
        var f = FACTS[fhIndex];
        var text = "🤔 " + f.hook + "\nOX 퀴즈 — " + f.ox + "\n정답은? → Land Master Pro에서 확인";
        var done = function () { shareBtn.textContent = "✅ 복사됨"; setTimeout(function () { shareBtn.textContent = "🔗 공유용 문구 복사"; }, 1600); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () {});
        }
      });
    }
  }

  /* ---------- 홈 검색/필터 그리드 ---------- */
  var activeDiff = "전체", activeTag = null;
  function applyGridFilter() {
    var input = document.getElementById("globalSearch");
    if (!input) return;
    var q = (input.value || "").trim().toLowerCase();
    var chips = document.querySelectorAll(".fact-chip");
    var shown = 0;
    chips.forEach(function (c) {
      var matchQ = !q || c.getAttribute("data-search").toLowerCase().indexOf(q) >= 0;
      var matchDiff = activeDiff === "전체" || c.getAttribute("data-diff") === activeDiff;
      var matchTag = !activeTag || c.getAttribute("data-search").toLowerCase().indexOf(activeTag.toLowerCase()) >= 0;
      var ok = matchQ && matchDiff && matchTag;
      c.classList.toggle("filtered-out", !ok);
      if (ok) shown++;
    });
    var label = document.getElementById("searchCount");
    if (label) label.textContent = shown + "개 상식 표시 중" + (q || activeTag || activeDiff !== "전체" ? " (필터 적용됨)" : "");
  }
  function initHomeFilters() {
    var input = document.getElementById("globalSearch");
    if (!input) return;
    input.addEventListener("input", applyGridFilter);
    document.querySelectorAll(".diffchip").forEach(function (c) {
      c.addEventListener("click", function () {
        document.querySelectorAll(".diffchip").forEach(function (x) { x.classList.remove("active"); });
        c.classList.add("active");
        activeDiff = c.getAttribute("data-diff");
        applyGridFilter();
      });
    });
    document.querySelectorAll(".tagchip").forEach(function (c) {
      c.addEventListener("click", function () {
        var t = c.getAttribute("data-tag");
        if (activeTag === t) { activeTag = null; c.classList.remove("active"); }
        else {
          document.querySelectorAll(".tagchip").forEach(function (x) { x.classList.remove("active"); });
          activeTag = t; c.classList.add("active");
        }
        applyGridFilter();
      });
    });
    applyGridFilter();
  }

  /* ---------- 전역 헤더 검색 (모든 페이지 공통) ---------- */
  function renderGlobalSearchOverlay(q) {
    var overlay = document.getElementById("searchOverlay");
    var panel = document.getElementById("searchResults");
    if (!overlay) return;
    q = (q || "").trim();
    if (!q) { overlay.classList.remove("open"); return; }
    var matches = FACTS.filter(function (f) {
      var blob = (f.name + " " + f.hook + " " + f.snap).toLowerCase();
      return blob.indexOf(q.toLowerCase()) >= 0;
    });
    panel.innerHTML = "";
    var h = document.createElement("h4");
    h.textContent = '"' + q + '" 검색 결과 ' + matches.length + '건';
    panel.appendChild(h);
    if (!matches.length) {
      var p = document.createElement("p");
      p.style.color = "var(--muted)"; p.style.fontSize = "0.9em";
      p.textContent = "일치하는 상식이 없습니다. 다른 키워드로 시도해 보세요.";
      panel.appendChild(p);
    }
    matches.slice(0, 12).forEach(function (f) {
      var item = document.createElement("a");
      item.className = "sr-item";
      item.href = "stage" + f.stage + ".html#mod-" + f.sub;
      item.innerHTML = "<small>S" + f.stage + " · 관문 " + f.sub + " · " + f.diff + "</small>" + f.hook;
      panel.appendChild(item);
    });
    var close = document.createElement("button");
    close.className = "sr-close"; close.type = "button"; close.textContent = "닫기 (Esc)";
    close.addEventListener("click", function () { overlay.classList.remove("open"); });
    panel.appendChild(close);
    overlay.classList.add("open");
  }
  function initHeaderSearch() {
    var input = document.getElementById("headerSearch");
    var overlay = document.getElementById("searchOverlay");
    if (!input || !overlay) return;
    input.addEventListener("input", function () { renderGlobalSearchOverlay(input.value); });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) overlay.classList.remove("open"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") overlay.classList.remove("open"); });
  }

  /* ---------- 관문 딥링크 (검색/공유로 들어왔을 때 해당 카드로 스크롤+강조) ---------- */
  function initDeepLink() {
    var hash = location.hash;
    if (!hash || hash.indexOf("#mod-") !== 0) return;
    var card = document.querySelector(hash);
    if (!card) return;
    setTimeout(function () {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.classList.add("flash");
    }, 100);
  }

  /* ---------- 전면광고 임시 슬롯 (기본 꺼짐 — CFG.AD_INTERSTITIAL_ENABLED로 제어) ---------- */
  function initAdInterstitial() {
    var overlay = document.getElementById("adInterstitial");
    var closeBtn = document.getElementById("adSlotClose");
    if (!overlay || !closeBtn) return;
    var pendingHref = null;
    closeBtn.addEventListener("click", function () {
      overlay.classList.add("hidden");
      if (pendingHref) { location.href = pendingHref; pendingHref = null; }
    });
    if (!CFG.AD_INTERSTITIAL_ENABLED) return;
    document.querySelectorAll(".next-stage-link").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        pendingHref = a.getAttribute("href");
        overlay.classList.remove("hidden");
      });
    });
  }

  /* ---------- 애드센스 (설정 시에만 삽입) ---------- */
  function initAds() {
    if (!CFG.ADSENSE_ENABLED || !CFG.ADSENSE_CLIENT || CFG.ADSENSE_CLIENT.indexOf("ca-pub-") !== 0) return;
    if (location.protocol === "file:") return; // 로컬 미리보기에서는 로드하지 않음
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + CFG.ADSENSE_CLIENT;
    s.setAttribute("crossorigin", "anonymous");
    document.head.appendChild(s);
    // 자동 광고 사용: 별도 슬롯 코드 불필요. 수동 슬롯을 쓰려면 .ad-slot 안에
    // <ins class="adsbygoogle" ...> 코드를 넣고 (adsbygoogle=window.adsbygoogle||[]).push({}) 호출.
  }

  /* ---------- 내비 활성 표시 ---------- */
  function initNav() {
    var here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".site-nav a").forEach(function (a) {
      var href = a.getAttribute("href");
      if (href === here) a.classList.add("active");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initQuizzes();
    initOxCards();
    initHero();
    initHomeFilters();
    initHeaderSearch();
    initAdInterstitial();
    initDeepLink();
    refreshWidgets();
    initAds();
  });

  // 다른 스크립트에서 쓸 수 있게 공개
  window.LMP = { state: state, refreshWidgets: refreshWidgets, levelName: levelName };
})();

/* ============================================================
   Land Master Pro — AI 학습 도우미 (챗봇 위젯)
   config.js의 CHAT_ENABLED + CHAT_API_URL이 모두 채워져야 동작한다.
   페이지 HTML을 수정하지 않도록 DOM을 여기서 직접 만든다.
   ============================================================ */
(function () {
  "use strict";
  var CFG = window.LMP_CONFIG || {};
  if (!CFG.CHAT_ENABLED || !CFG.CHAT_API_URL) return;

  var MAX_LEN = 200;
  var MAX_TURNS = 8;           // api/land.js의 MAX_HISTORY와 같은 값
  var STORE_KEY = "lmp_chat_seen_v1";

  // 페이지 성격에 맞는 추천 질문
  var SUGGEST_BY_PAGE = {
    "stage1.html": ["맹지가 정확히 뭐예요?", "현황도로로도 건축허가가 나나요?", "구거가 끼어 있으면 어떻게 하나요?"],
    "stage2.html": ["보전산지와 준보전산지 차이는?", "농취증은 도시 사람도 받을 수 있나요?", "산을 대지로 바꾸려면 뭐가 드나요?"],
    "stage3.html": ["건폐율과 용적률이 어떻게 다른가요?", "계획관리지역이 왜 인기가 많나요?", "개발행위허가가 뭔가요?"],
    "stage4.html": ["등기부등본 갑구와 을구 차이는?", "기획부동산은 어떻게 알아보나요?", "토지 계약 특약에 뭘 넣어야 하나요?"],
    "stage5.html": ["수용재결이 뭔가요?", "보상금이 시세보다 낮은 이유는?", "대토보상은 아무나 받나요?"]
  };
  var SUGGEST_DEFAULT = ["토지 투자, 뭐부터 봐야 하나요?", "맹지가 뭔가요?", "용도지역이 왜 중요한가요?"];

  var msgs = [];               // [{role, content}]
  var busy = false;
  var panel, log, ta, sendBtn, fab;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  function pageKey() {
    var p = location.pathname.split("/").pop() || "index.html";
    return p;
  }

  function suggestions() {
    return SUGGEST_BY_PAGE[pageKey()] || SUGGEST_DEFAULT;
  }

  /* 링크 허용 목록: 같은 사이트의 .html 파일명만 앵커로 바꾼다.
     [보여줄 글자](파일명.html) 형태만 인식하고, 그 외 텍스트는 그대로 둔다. */
  var LINK_RE = /\[([^\]\n]{1,40})\]\(([a-z0-9-]{1,60}\.html)\)/g;

  function renderText(node, text) {
    node.textContent = "";
    var last = 0, m;
    LINK_RE.lastIndex = 0;
    while ((m = LINK_RE.exec(text)) !== null) {
      if (m.index > last) node.appendChild(document.createTextNode(text.slice(last, m.index)));
      var a = document.createElement("a");
      a.href = m[2];
      a.textContent = m[1];
      node.appendChild(a);
      last = m.index + m[0].length;
    }
    if (last < text.length) node.appendChild(document.createTextNode(text.slice(last)));
  }

  function addMsg(kind, text) {
    var d = el("div", "lmp-msg " + kind);
    if (kind === "bot") renderText(d, text); else d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  function addIntro() {
    var wrap = el("div", "lmp-chat-intro");
    var p = el("div");
    p.innerHTML = "<b>토지 용어가 막힐 때 물어보세요.</b><br>이 사이트의 용어사전 28개와 퀴즈 25개를 근거로 답합니다.";
    wrap.appendChild(p);
    var sg = el("div", "lmp-sugg");
    suggestions().forEach(function (q) {
      var b = el("button", null, q);
      b.type = "button";
      b.addEventListener("click", function () { ask(q); });
      sg.appendChild(b);
    });
    wrap.appendChild(sg);
    log.appendChild(wrap);
  }

  function setBusy(v) {
    busy = v;
    sendBtn.disabled = v;
    ta.disabled = v;
  }

  function ask(text) {
    if (busy) return;
    text = (text || "").trim().slice(0, MAX_LEN);
    if (!text) return;

    var intro = log.querySelector(".lmp-chat-intro");
    if (intro) intro.remove();

    addMsg("me", text);
    msgs.push({ role: "user", content: text });
    while (msgs.length > MAX_TURNS) msgs.shift();
    ta.value = "";
    ta.style.height = "";
    setBusy(true);

    var bubble = addMsg("bot", "");
    var dots = el("span", "lmp-typing");
    dots.appendChild(el("i")); dots.appendChild(el("i")); dots.appendChild(el("i"));
    bubble.appendChild(dots);

    stream(bubble);
  }

  function stream(bubble) {
    var acc = "";
    var failed = false;

    fetch(CFG.CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs })
    }).then(function (res) {
      if (!res.ok) {
        return res.json().catch(function () { return {}; }).then(function (j) {
          throw new Error(j.error || "일시적인 문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
        });
      }
      if (!res.body || !res.body.getReader) throw new Error("이 브라우저에서는 지원되지 않아요.");

      var reader = res.body.getReader();
      var dec = new TextDecoder();
      var buf = "";

      function pump() {
        return reader.read().then(function (r) {
          if (r.done) return;
          buf += dec.decode(r.value, { stream: true });
          var parts = buf.split("\n");
          buf = parts.pop() || "";
          for (var i = 0; i < parts.length; i++) {
            var line = parts[i];
            if (line.indexOf("data: ") !== 0) continue;
            var data = line.slice(6).trim();
            if (!data || data === "[DONE]") continue;
            try {
              var p = JSON.parse(data);
              if (p.error) { failed = true; acc = p.error; }
              else if (p.text) { acc += p.text; }
              renderText(bubble, acc);
              log.scrollTop = log.scrollHeight;
            } catch (e) { /* 부분 청크는 무시 */ }
          }
          return pump();
        });
      }
      return pump();
    }).then(function () {
      if (!acc) { bubble.className = "lmp-msg err"; bubble.textContent = "답변을 받지 못했어요. 다시 시도해 주세요."; }
      else if (failed) { bubble.className = "lmp-msg err"; bubble.textContent = acc; }
      else { msgs.push({ role: "assistant", content: acc }); }
    }).catch(function (err) {
      bubble.className = "lmp-msg err";
      bubble.textContent = err && err.message ? err.message : "연결에 실패했어요.";
      msgs.pop(); // 실패한 질문은 히스토리에서 뺀다
    }).then(function () {
      setBusy(false);
      log.scrollTop = log.scrollHeight;
      if (panel.classList.contains("open")) ta.focus();
    });
  }

  function open() {
    panel.classList.add("open");
    fab.hidden = true;
    if (!log.children.length) addIntro();
    try { localStorage.setItem(STORE_KEY, "1"); } catch (e) {}
    setTimeout(function () { ta.focus(); }, 40);
    if (window.gtag) window.gtag("event", "chat_open", { page: pageKey() });
  }

  function close() {
    panel.classList.remove("open");
    fab.hidden = false;
    fab.focus();
  }

  function build() {
    fab = el("button", "lmp-chat-fab");
    fab.type = "button";
    fab.setAttribute("aria-label", "용어챗봇 열기");
    fab.appendChild(el("span", "fab-ico", "🧭"));
    fab.appendChild(el("span", null, "용어챗봇"));
    fab.addEventListener("click", open);

    panel = el("div", "lmp-chat-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "AI 학습 도우미");

    var head = el("div", "lmp-chat-head");
    head.appendChild(el("div", "ch-ico", "🧭"));
    var ht = el("div", "ch-t");
    ht.appendChild(el("div", "ch-name", "탐사 도우미"));
    ht.appendChild(el("div", "ch-sub", "이 사이트 내용을 근거로 답합니다"));
    head.appendChild(ht);
    var x = el("button", "lmp-chat-close", "✕");
    x.type = "button";
    x.setAttribute("aria-label", "닫기");
    x.addEventListener("click", close);
    head.appendChild(x);

    log = el("div", "lmp-chat-log");
    log.setAttribute("aria-live", "polite");

    var form = el("form", "lmp-chat-form");
    ta = el("textarea");
    ta.rows = 1;
    ta.maxLength = MAX_LEN;
    ta.placeholder = "궁금한 토지 용어를 적어보세요";
    ta.setAttribute("aria-label", "질문 입력");
    ta.addEventListener("input", function () {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 88) + "px";
    });
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(ta.value); }
    });
    sendBtn = el("button", "lmp-chat-send", "➤");
    sendBtn.type = "submit";
    sendBtn.setAttribute("aria-label", "보내기");
    form.appendChild(ta);
    form.appendChild(sendBtn);
    form.addEventListener("submit", function (e) { e.preventDefault(); ask(ta.value); });

    var foot = el("div", "lmp-chat-foot",
      "AI가 생성한 답변입니다. 법률·세무·투자 자문이 아니며, 실제 거래 전 반드시 해당 기관과 전문가의 확인을 받으세요.");

    panel.appendChild(head);
    panel.appendChild(log);
    panel.appendChild(form);
    panel.appendChild(foot);

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) close();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
