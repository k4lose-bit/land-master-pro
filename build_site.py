# -*- coding: utf-8 -*-
"""Land Master Pro 사이트 빌더.
content_stage12.py / content_stage345.py 의 데이터로 site/ 안의 HTML을 생성한다.
콘텐츠를 고친 뒤 `python build_site.py` 를 다시 실행하면 된다."""
import html
import json
import os
from datetime import date

from content_stage12 import STAGE1, STAGE2
from content_stage345 import STAGE3, STAGE4, STAGE5
from content_facts import FACTS, DIFFICULTY_COLOR
from content_glossary import GLOSSARY, GROUPS, slugify_check

STAGES = [STAGE1, STAGE2, STAGE3, STAGE4, STAGE5]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "site")
SITE_URL = "https://land.free336.com"
SITE_NAME = "랜드 마스터 프로 | 경기북부 토지 투자 아카데미"
# 네이버 서치어드바이저 "사이트 소유확인" HTML 태그 방식에서 content 값만 받아서 채우면 됨.
# 예: <meta name="naver-site-verification" content="abcdef1234..."> 에서 abcdef1234... 부분.
NAVER_SITE_VERIFICATION = "4600038de4f3bc5274fce5f172ce95ba03cbd8f3"
STAGE_COLORS = {1: "#2E86DE", 2: "#16B981", 3: "#14B8A6", 4: "#E8A33D", 5: "#E0524B"}
ALL_MODULES = [(stg["num"], m) for stg in STAGES for m in stg["modules"]]

NAV = [
    ("index.html", "🏠 홈"),
    ("stage1.html", "S1. 맹지·도로"),
    ("stage2.html", "S2. 임야·농지"),
    ("stage3.html", "S3. 용도지역"),
    ("stage4.html", "S4. 권리·계약"),
    ("stage5.html", "S5. 토지보상"),
    ("glossary.html", "📖 용어사전"),
    ("notices.html", "📡 공고 와처"),
    ("guide.html", "🌐 토지이음 가이드"),
    ("community.html", "💬 커뮤니티"),
]

FAVICON = ("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>"
           "<text y='.9em' font-size='90'>🧭</text></svg>")

# 쿠팡파트너스 추천 도서 (제목/링크/표지는 운영자가 파트너스 대시보드·상품 페이지에서 직접 가져온 것만 등록)
BOOKS = [
    {"title": "송사무장의 부동산 경매의 기술", "url": "https://link.coupang.com/a/gGuIA6idbw",
     "cover": "https://thumbnail.coupangcdn.com/thumbnails/remote/492x492ex/image/retail/images/511550344228135-15112508-d5eb-430f-9af3-f8990b92aa83.jpg"},
    {"title": "경매 권리분석 이렇게 쉬웠어?", "url": "https://link.coupang.com/a/gGuLLrxRQW",
     "cover": "https://thumbnail.coupangcdn.com/thumbnails/remote/492x492ex/image/retail/images/550400523497541-9d7f4440-390c-4a04-8ef4-ef648048dd59.png"},
    {"title": "싱글맘 부동산 경매로 홀로서기", "url": "https://link.coupang.com/a/gGuN7Zoal2",
     "cover": "https://thumbnail.coupangcdn.com/thumbnails/remote/492x492ex/image/retail/images/2020/03/30/11/3/fe94f518-b366-4b2a-aa94-4abd79e86734.jpg"},
]


def esc(s):
    return html.escape(str(s), quote=True)


BOOK_COVER_COLORS = ["#0EA672", "#2E86DE", "#E0524B", "#E8A33D", "#7C5CF0"]


def book_promo_html(heading="📚 함께 보면 좋은 책"):
    cards = []
    for i, b in enumerate(BOOKS):
        if b.get("cover"):
            cover_inner = '<img src="%s" alt="%s">' % (esc(b["cover"]), esc(b["title"]))
        else:
            cover_inner = (
                '<span class="spine-icon">📖</span><span class="cover-title">%s</span>' % esc(b["title"])
            )
        bg = "" if b.get("cover") else (' style="background:%s;"' % BOOK_COVER_COLORS[i % len(BOOK_COVER_COLORS)])
        cards.append(
            '<a class="book-card" href="%s" target="_blank" rel="nofollow sponsored noopener">'
            '<span class="book-cover"%s><span class="book-badge">쿠팡</span>%s</span>'
            '<span class="book-caption">%s</span>'
            '<span class="book-cta">보러가기 →</span></a>'
            % (esc(b["url"]), bg, cover_inner, esc(b["title"]))
        )
    items = "\n      ".join(cards)
    return """
    <div class="book-promo">
      <h4>%s</h4>
      <div class="book-grid">
      %s
      </div>
      <p class="book-note">이 링크로 구매 시 쿠팡 파트너스 활동의 일환으로 일정액의 수수료를 제공받을 수 있습니다.</p>
    </div>""" % (esc(heading), items)


def community_nudge_html(text):
    return """
    <div class="community-nudge">
      <span class="cn-icon">🙋</span>
      <div class="cn-text"><p>%s</p></div>
      <a class="btn ghost sm" href="community.html">💬 커뮤니티 바로가기</a>
    </div>""" % esc(text)


def shell(page, title, desc, body, extra_scripts="", extra_head=""):
    nav_html = "\n        ".join(
        '<a href="%s">%s</a>' % (href, label) for href, label in NAV
    )
    return """<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>%(title)s</title>
  <meta name="description" content="%(desc)s">
  <link rel="canonical" href="%(site)s/%(page)s">
  <meta property="og:title" content="%(title)s">
  <meta property="og:description" content="%(desc)s">
  <meta property="og:type" content="website">
  <meta property="og:url" content="%(site)s/%(page)s">
  <link rel="icon" href="%(favicon)s">
%(naver)s  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/style.css">
%(extra_head)s  <script src="assets/config.js"></script>
  <script>
    if (window.LMP_CONFIG && window.LMP_CONFIG.GA_MEASUREMENT_ID) {
      var _gaId = window.LMP_CONFIG.GA_MEASUREMENT_ID;
      var _gaS = document.createElement('script');
      _gaS.async = true;
      _gaS.src = 'https://www.googletagmanager.com/gtag/js?id=' + _gaId;
      document.head.appendChild(_gaS);
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', _gaId);
    }
  </script>
  <script src="assets/facts-data.js"></script>
  <script src="assets/app.js" defer></script>
%(extra)s</head>
<body>
  <div class="app-shell">
    <aside class="site-sidebar">
      <a class="brand" href="index.html"><span aria-hidden="true">🧭</span><b>Land Master Pro</b><span>경기북부 토지 탐사대</span></a>
      <nav class="site-nav">
        %(nav)s
      </nav>
    </aside>
    <div class="site-col">
      <header class="site-header">
        <div class="header-inner">
          <div class="header-tools">
            <input type="text" id="headerSearch" class="search-input" placeholder="🧭 현장 검색">
            <span class="streak-chip" id="streakChip">🔥 1일 연속</span>
            <span class="xp-chip" id="xpChip">Lv.1 토지 견습생 · 0 XP</span>
          </div>
        </div>
      </header>
      <div class="search-overlay" id="searchOverlay">
        <div class="search-panel" id="searchResults"></div>
      </div>
      <div class="ad-interstitial hidden" id="adInterstitial">
        <div class="ad-slot-card">
          <div class="ad-slot-label">광고 (준비 중 — AD_INTERSTITIAL_ENABLED=false)</div>
          <div class="ad-slot-box" id="adSlotBox">여기에 실제 애드센스 전면광고 코드가 들어갈 자리입니다.</div>
          <button class="btn ghost sm" id="adSlotClose" type="button">닫고 계속하기 →</button>
        </div>
      </div>
      <main>
%(body)s
      </main>
      <footer class="site-footer">
        <div class="footer-inner">
          <div>
            <a href="about.html">사이트 소개·문의</a>
            <a href="privacy.html">개인정보처리방침</a>
            <a href="notices.html">공고 와처</a>
          </div>
          <p class="disclaimer">본 사이트의 모든 콘텐츠는 일반적인 정보 제공을 목적으로 하며, 법률·세무·투자 자문이 아닙니다.
          법령·조례·세율은 개정될 수 있고 지자체마다 기준이 다르므로, 실제 거래 전 반드시 해당 기관과 전문가(변호사·세무사·감정평가사 등)의 확인을 받으시기 바랍니다.
          이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
          &copy; %(year)s Land Master Pro</p>
        </div>
      </footer>
    </div>
  </div>
%(scripts)s</body>
</html>
""" % {
        "title": esc(title), "desc": esc(desc), "site": SITE_URL, "page": page,
        "favicon": FAVICON, "nav": nav_html, "body": body,
        "year": date.today().year, "extra": "", "extra_head": extra_head,
        "scripts": extra_scripts,
        "naver": ('  <meta name="naver-site-verification" content="%s">\n' % NAVER_SITE_VERIFICATION) if NAVER_SITE_VERIFICATION else "",
    }


# ---------------------------------------------------------------- 스테이지 페이지
def module_html(m):
    sub = m["sub"]
    f = FACTS[sub]
    quiz = m["quiz"]
    opts = "\n        ".join(
        '<button class="quiz-opt" type="button">%s</button>' % esc(o) for o in quiz["opts"]
    )
    tags_html = "".join('<span class="tag-pill">#%s</span>' % esc(t) for t in f["tags"])
    return """
    <div class="module-card" data-module="%(sub)s" id="mod-%(sub)s" data-ox-answer="%(ox_answer)s" data-snap="%(snap)s">
      <div class="mod-top">
        <span class="mod-num">관문 %(sub)s</span>
        <span class="diff-badge" style="color:%(color)s; border-color:%(color)s;">%(diff)s</span>
      </div>
      <h3>%(name)s<span class="done-badge">✔ 클리어</span></h3>

      <p class="hook-q">🤔 %(hook)s</p>
      <p class="ox-statement">📝 OX 퀴즈 — <b>%(ox_text)s</b></p>
      <div class="ox-row">
        <button class="ox-btn" data-val="true">⭕ 맞다</button>
        <button class="ox-btn" data-val="false">❌ 아니다</button>
      </div>
      <div class="ox-feedback"></div>
      <button class="ox-retry-btn hidden" type="button">🔄 다시 풀기</button>
      <div class="tag-row">%(tags)s</div>

      <button class="more-btn" type="button" aria-expanded="false">🔍 실전 사례·전체 해설 더보기 (심화 퀴즈 포함)</button>

      <div class="deep-dive hidden">
        <div class="lesson-box"><b>📖 핵심 가이드</b><br>%(core)s</div>
        <div class="case-box">
          <div class="ct">📌 %(case_t)s</div>
          <div class="cs">💡 %(case_s)s</div>
        </div>
        <div class="trap-box"><b>💥 실무 함정:</b> %(trap)s</div>
        <div class="quiz-box" data-module="%(sub)s" data-ans="%(ans)d" data-exp="%(exp)s" data-wrong="%(wrong)s">
          <p class="q">⚔️ 심화 퀴즈 %(sub)s. %(q)s</p>
          %(opts)s
          <div class="quiz-feedback"></div>
        </div>
      </div>
    </div>""" % {
        "sub": sub, "diff": f["difficulty"], "color": DIFFICULTY_COLOR[f["difficulty"]],
        "name": esc(m["name"]), "hook": esc(f["hook"]), "ox_text": esc(f["ox"]),
        "ox_answer": "true" if f["ox_answer"] else "false", "snap": esc(f["snap"]), "tags": tags_html,
        "core": m["core"], "case_t": esc(m["case_t"]), "case_s": esc(m["case_s"]), "trap": esc(m["trap"]),
        "ans": quiz["ans"], "exp": esc(quiz["exp"]), "wrong": esc(quiz["wrong"]),
        "q": esc(quiz["q"]), "opts": opts,
    }


def build_stage(stg):
    mods = "\n".join(module_html(m) for m in stg["modules"])
    color = STAGE_COLORS[stg["num"]]
    dots = "".join(
        '<i style="background:%s" title="관문 %s · %s"></i>' % (
            DIFFICULTY_COLOR[FACTS[m["sub"]]["difficulty"]], m["sub"], FACTS[m["sub"]]["difficulty"]
        ) for m in stg["modules"]
    )
    body = """
    <div class="page-head">
      <h1 style="color:%(color)s;">%(title)s</h1>
      <p>%(desc)s</p>
      <div class="diff-dots">난이도 흐름 &nbsp;%(dots)s&nbsp; (초급 → 고급 순으로 배치됨)</div>
    </div>
    <div class="progress-wrap" data-stage-progress="%(num)d">
      <div class="progress-title"><span>이 스테이지 진행도</span><span data-progress-label>0/5 관문 완료 (0%%)</span></div>
      <div class="progress-bar-bg"><div class="progress-bar-fill" style="background:%(color)s;"></div></div>
    </div>
    <div class="intro-box" style="border-left-color:%(color)s;">%(intro)s</div>
    %(mods)s
    %(books)s
    %(nudge)s
    <div class="ad-slot"></div>
    <div class="stage-nav">%(prev)s%(next)s</div>""" % {
        "title": esc(stg["title"]), "desc": esc(stg["desc"]), "num": stg["num"], "color": color, "dots": dots,
        "intro": esc(stg["intro"]), "mods": mods,
        "books": book_promo_html() if stg["num"] in (4, 5) else "",
        "nudge": community_nudge_html(
            "%s 관련 궁금한 점이나 실제 경험담이 있다면, 커뮤니티에서 다른 학습자들과 나눠보세요." % stg["title"]
        ),
        "prev": ('<a class="btn ghost" href="stage%d.html">← 이전 스테이지</a>' % (stg["num"] - 1)) if stg["num"] > 1 else "",
        "next": (
            '<a class="btn next-stage-link" href="stage%d.html">다음 스테이지 →</a>' % (stg["num"] + 1)
        ) if stg["num"] < 5 else (
            '<div class="stage-done">🎉 <b>5개 스테이지, 25개 관문을 모두 둘러봤습니다.</b><br>'
            '공고 와처나 커뮤니티도 확인해 보세요.'
            '<div class="stage-done-actions">'
            '<a class="btn ghost" href="index.html">🏠 홈으로</a>'
            '<a class="btn" href="community.html">💬 커뮤니티에서 후기 남기기</a>'
            '</div></div>'
        ),
    }
    page = "stage%d.html" % stg["num"]
    write(page, shell(page, "%s | Land Master Pro" % stg["title"], stg["desc"], body))


# ---------------------------------------------------------------- 홈
def build_index():
    cards = ""
    for stg in STAGES:
        color = STAGE_COLORS[stg["num"]]
        dots = "".join(
            '<i style="background:%s"></i>' % DIFFICULTY_COLOR[FACTS[m["sub"]]["difficulty"]]
            for m in stg["modules"]
        )
        cards += """
      <a class="stage-card" href="stage%(num)d.html" data-mini-stage="%(num)d">
        <span class="node-badge" style="background:%(color)s; border-color:%(color)s;">%(num)d</span>
        <div class="stage-card-body">
          <span class="s-num" style="color:%(color)s;">STAGE %(num)d</span>
          <h3>%(menu)s</h3>
          <p>%(desc)s</p>
          <div class="mini-dots">%(dots)s</div>
          <div class="mini-bar"><i style="background:%(color)s;"></i></div>
          <div class="mini-label">0/5 관문 완료</div>
        </div>
      </a>""" % {"num": stg["num"], "menu": esc(stg["menu"].split(". ", 1)[1]), "desc": esc(stg["desc"]),
                 "color": color, "dots": dots}

    # 전체 상식 카드(검색/필터 대상)
    fact_chips = ""
    for stage_num, m in ALL_MODULES:
        f = FACTS[m["sub"]]
        blob = esc(" ".join([m["name"], f["hook"], f["snap"], " ".join(f["tags"])]))
        tag_html = "".join('<span class="tag-pill sm">#%s</span>' % esc(t) for t in f["tags"][:3])
        fact_chips += """
      <a class="fact-chip" href="stage%(stage)d.html#mod-%(sub)s" data-diff="%(diff)s" data-search="%(search)s">
        <div class="fc-top"><span class="diff-dot" style="background:%(color)s"></span><span class="fc-stage">S%(stage)d · 관문 %(sub)s</span></div>
        <div class="fc-q">%(hook)s</div>
        <div class="fc-tags">%(tags)s</div>
      </a>""" % {
            "sub": m["sub"], "stage": stage_num, "diff": f["difficulty"], "color": DIFFICULTY_COLOR[f["difficulty"]],
            "search": blob, "hook": esc(f["hook"]), "tags": tag_html,
        }

    top_tags = ["도로", "임야", "농지", "용도지역", "계약", "보상", "등기부", "산지전용", "토지이음"]
    tag_chip_html = "".join('<button class="chip tagchip" data-tag="%s" type="button">#%s</button>' % (esc(t), esc(t)) for t in top_tags)

    body = """
    <div class="site-hero">
      <div class="sh-eyebrow"><span class="dot"></span>이런 분들을 위해 만들었습니다</div>
      <h2 class="sh-h1">
        <div class="sh-l1">30분짜리 인강, 끝까지 본 적 있나요?</div>
        <div class="sh-l2">5분 OX 한 장이면<br>토지 공부는 충분합니다</div>
      </h2>
      <div class="sh-compare">
        <div><span class="dash">—</span> 인강·VOD 완주율 <b>5%% 미만</b></div>
        <div><span class="dash">—</span> Land Master Pro <b>OX 5분 학습 사이클</b></div>
      </div>
      <a class="sh-cta" href="stage1.html">🧭 5분 학습 시작하기</a>
      <div class="sh-stats">
        <div class="stat"><b>%(n_stage)d</b><span>스테이지</span></div>
        <div class="stat"><b>%(n_mod)d</b><span>실전 관문</span></div>
        <div class="stat"><b>%(n_glo)d</b><span>용어사전</span></div>
      </div>
      <svg class="sh-parcel" viewBox="0 0 640 480" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="terrainFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%%" stop-color="#0EA672" stop-opacity="0.10"/>
            <stop offset="100%%" stop-color="#0EA672" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="M0,300 Q120,260 240,290 T480,270 T640,300 L640,480 L0,480 Z" fill="url(#terrainFade)"/>
        <path d="M-10,340 Q140,300 300,335 T640,320" fill="none" stroke="#0EA672" stroke-width="1" stroke-opacity="0.22"/>
        <path d="M-10,395 Q160,360 320,390 T640,375" fill="none" stroke="#0EA672" stroke-width="1" stroke-opacity="0.16"/>
        <polygon points="330,60 560,140 520,360 300,420 250,220" fill="rgba(14,166,114,0.05)" stroke="#0EA672" stroke-width="2" stroke-dasharray="7 6"/>
        <circle cx="330" cy="60" r="5" fill="#2EE6A8"/><circle cx="560" cy="140" r="5" fill="#2EE6A8"/>
        <circle cx="520" cy="360" r="5" fill="#2EE6A8"/><circle cx="300" cy="420" r="5" fill="#2EE6A8"/><circle cx="250" cy="220" r="5" fill="#2EE6A8"/>
        <text x="560" y="130" font-size="12" font-weight="700" fill="#6B7B72">N37.74</text>
        <text x="250" y="210" font-size="12" font-weight="700" fill="#6B7B72">E127.05</text>
        <g transform="translate(555,395)" opacity="0.55">
          <circle r="19" fill="none" stroke="#0EA672" stroke-width="1.5"/>
          <path d="M0,-15 L4,0 L0,15 L-4,0 Z" fill="#0EA672"/>
          <text x="0" y="-24" font-size="10" font-weight="800" fill="#6B7B72" text-anchor="middle">N</text>
        </g>
      </svg>
    </div>

    <div class="page-head">
      <h1>경기북부 토지 투자, 게임처럼 정복한다</h1>
      <p>맹지 탈출부터 토지보상까지 — 25개 관문 실전 학습 + 공공 개발 고시·공고 와처</p>
    </div>

    <div class="fact-hero" id="factHero">
      <div class="fh-top">
        <span class="fh-label">오늘의 현장 상식</span>
        <span class="fh-count" id="factSeenCount">0개 확인함</span>
      </div>
      <div class="fh-card" id="fhCard">
        <div class="fh-diff" id="fhDiff"></div>
        <p class="fh-q" id="fhQ"></p>
        <p class="fh-ox-statement">OX 퀴즈 — <b id="fhOxText"></b></p>
        <div class="fh-ox">
          <button class="ox-btn lg" id="fhTrue">⭕ 맞다</button>
          <button class="ox-btn lg" id="fhFalse">❌ 아니다</button>
        </div>
        <div class="fh-feedback" id="fhFeedback"></div>
      </div>
      <div class="fh-actions">
        <button class="btn ghost sm" id="fhPrev">← 이전 상식</button>
        <button class="btn sm" id="fhRandom">🎲 아무거나 뽑기</button>
        <button class="btn ghost sm" id="fhNext">다음 상식 →</button>
        <button class="btn ghost sm" id="fhShare">🔗 공유용 문구 복사</button>
      </div>
    </div>

    <div class="search-box">
      <input type="text" id="globalSearch" class="field" placeholder="🔍 궁금한 키워드로 검색 (예: 맹지, 계획관리지역, 분묘기지권, 등기부...)">
      <div class="filter-row">
        <button class="chip diffchip active" data-diff="전체" type="button">전체 난이도</button>
        <button class="chip diffchip" data-diff="초급" type="button">🟢 초급</button>
        <button class="chip diffchip" data-diff="중급" type="button">🟡 중급</button>
        <button class="chip diffchip" data-diff="고급" type="button">🔴 고급</button>
      </div>
      <div class="filter-row">%(tagchips)s</div>
      <p class="search-count" id="searchCount">전체 25개 상식 표시 중</p>
      <div class="fact-grid" id="factGrid">%(chips)s</div>
    </div>

    <h2 class="section-h">학습 로드맵 (5스테이지 · 25개 관문)</h2>
    <div class="trail-map">%(cards)s</div>

    <div class="grid">
      <a class="stage-card plain" href="notices.html">
        <span class="s-num" style="color:var(--red);">WATCHER</span>
        <h3>📡 공공 개발 고시·공고 와처</h3>
        <p>경기북부 지자체·LH의 개발 관련 고시·공고를 한 곳에 모아 봅니다. 자동 수집기 연동 구조.</p>
        <div class="mini-label">바로가기 →</div>
      </a>
      <a class="stage-card plain" href="guide.html">
        <span class="s-num" style="color:var(--green);">TOOL</span>
        <h3>🌐 토지이음 완벽 활용 가이드</h3>
        <p>토지 실사의 시작이자 끝, 국토부 토지이음(eum.go.kr)을 단계별로 뜯어보는 실무 가이드.</p>
        <div class="mini-label">바로가기 →</div>
      </a>
      <a class="stage-card plain" href="community.html">
        <span class="s-num" style="color:var(--blue);">LOUNGE</span>
        <h3>💬 토지 마스터 라운지</h3>
        <p>회원 전용 커뮤니티. 투자 고민, 임장 후기, 서류 분석 질문을 나누는 공간입니다.</p>
        <div class="mini-label">바로가기 →</div>
      </a>
    </div>

    <div class="ad-slot"></div>

    <div class="card">
      <h3>이 사이트는</h3>
      <p style="font-size:0.98em;">
        수도권 개발 축이 북쪽으로 이동하면서 경기북부의 토지 시장이 움직이고 있습니다.
        그러나 토지는 아파트와 달리 규제 체계(국토계획법·농지법·산지관리법·군사기지법…)를 모르면 서류 한 줄 차이로 자산 가치가 갈리는 시장입니다.
        이 사이트는 30년 실무 경험을 바탕으로, 흩어져 있는 공공 정보(고시·공고, 토지이음)를 읽는 눈과
        실전에서 바로 쓰는 체크리스트를 게임처럼 학습할 수 있게 만들었습니다.
      </p>
    </div>""" % {
        "cards": cards, "chips": fact_chips, "tagchips": tag_chip_html,
        "n_stage": len(STAGES), "n_mod": len(ALL_MODULES), "n_glo": len(GLOSSARY),
    }
    write("index.html", shell(
        "index.html", SITE_NAME,
        "맹지 탈출, 임야·농지, 용도지역, 권리분석, 토지보상까지 — 경기북부 토지 투자를 25개 관문으로 배우는 실전 학습 사이트. 지자체 개발 고시·공고 와처 제공.",
        body))


def build_facts_data():
    facts_json = json.dumps(
        [{"sub": m["sub"], "hook": FACTS[m["sub"]]["hook"], "ox": FACTS[m["sub"]]["ox"],
          "answer": FACTS[m["sub"]]["ox_answer"], "snap": FACTS[m["sub"]]["snap"],
          "diff": FACTS[m["sub"]]["difficulty"], "stage": stage_num, "name": m["name"]}
         for stage_num, m in ALL_MODULES],
        ensure_ascii=False,
    )
    write(os.path.join("assets", "facts-data.js"), "window.LMP_FACTS = %s;\n" % facts_json)


# ---------------------------------------------------------------- 공고 와처
SEED_NOTICES = {
    "generated_at": None,
    "source_note": "기본 링크 모음 — 자동 수집기(crawler) 실행 후 실제 공고 목록으로 대체됩니다",
    "notices": [
        {"region": "남양주시", "category": "공식 게시판", "title": "남양주시청 고시·공고 게시판 바로가기", "date": "", "link": "https://www.nyj.go.kr"},
        {"region": "의정부시", "category": "공식 게시판", "title": "의정부시청 고시·공고 게시판 바로가기", "date": "", "link": "https://www.ui4u.go.kr"},
        {"region": "양주시", "category": "공식 게시판", "title": "양주시청 고시·공고 게시판 바로가기", "date": "", "link": "https://www.yangju.go.kr"},
        {"region": "동두천시", "category": "공식 게시판", "title": "동두천시청 고시·공고 게시판 바로가기", "date": "", "link": "https://www.ddc21.net"},
        {"region": "포천시", "category": "공식 게시판", "title": "포천시청 고시·공고 게시판 바로가기", "date": "", "link": "https://www.pocheon.go.kr"},
        {"region": "연천군", "category": "공식 게시판", "title": "연천군청 고시·공고 게시판 바로가기", "date": "", "link": "https://www.yeoncheon.go.kr"},
        {"region": "경기도", "category": "공식 게시판", "title": "경기도청 고시·공고 바로가기", "date": "", "link": "https://www.gg.go.kr"},
        {"region": "LH", "category": "토지보상·택지", "title": "LH 한국토지주택공사 공고 바로가기", "date": "", "link": "https://www.lh.or.kr"},
        {"region": "토지이음", "category": "규제 확인", "title": "토지이음 — 토지이용계획·규제 열람", "date": "", "link": "https://www.eum.go.kr"},
    ],
}


# ---------------------------------------------------------------- 용어사전
def build_glossary():
    slugify_check()
    group_meta = {g[0]: g for g in GROUPS}

    # ---- 색인 페이지 (glossary.html) ----
    sections = []
    for gkey, glabel, glink, gnavlabel in GROUPS:
        terms = [t for t in GLOSSARY if t["group"] == gkey]
        if not terms:
            continue
        cards = "\n      ".join(
            '<a class="glossary-card" href="glossary-%s.html"><b>%s</b><span>%s</span></a>'
            % (t["slug"], esc(t["term"]), esc(t["tagline"]))
            for t in terms
        )
        sections.append(
            '<div class="glossary-group">\n'
            '      <h3>%s <a class="glossary-group-link" href="%s">%s 자세히 보기 →</a></h3>\n'
            '      <div class="glossary-grid">\n      %s\n      </div>\n    </div>'
            % (esc(glabel), glink, esc(gnavlabel), cards)
        )
    body = """
    <div class="page-head">
      <h1>📖 토지 투자 용어사전</h1>
      <p>초보자가 가장 많이 막히는 용어를 한 개념씩, 짧고 정확하게 정리했습니다 (%(count)d개)</p>
    </div>
    <div class="intro-box">
      법령·행정 용어는 사전 그대로 읽으면 더 헷갈립니다. 실제 투자 판단에 필요한 만큼만,
      관련 스테이지와 연결해서 정리했습니다. 용어가 계속 추가되니 궁금한 용어가 없다면 나중에 다시 찾아보세요.
    </div>
    %(sections)s
    <div class="ad-slot"></div>""" % {
        "count": len(GLOSSARY), "sections": "\n    ".join(sections),
    }
    write("glossary.html", shell(
        "glossary.html", "토지 투자 용어사전 | Land Master Pro",
        "맹지, 보전산지, 용도지역, 지구단위계획 등 토지 투자 초보자가 막히는 용어를 짧고 정확하게 정리.",
        body))

    # ---- 개별 용어 페이지 (glossary-<slug>.html) ----
    for i, t in enumerate(GLOSSARY):
        gkey, glabel, glink, gnavlabel = group_meta[t["group"]]
        same_group = [x for x in GLOSSARY if x["group"] == t["group"] and x["slug"] != t["slug"]]
        related_html = ""
        if same_group:
            related_items = "\n        ".join(
                '<a href="glossary-%s.html">%s</a>' % (x["slug"], esc(x["term"]))
                for x in same_group[:6]
            )
            related_html = (
                '\n    <div class="term-related">\n      <h4>%s 관련 다른 용어</h4>\n      <div class="term-related-links">\n        %s\n      </div>\n    </div>'
                % (esc(glabel), related_items)
            )
        body_t = """
    <div class="page-head">
      <span class="term-badge">%(group)s</span>
      <h1>%(term)s</h1>
      <p>%(tagline)s</p>
    </div>
    <div class="doc">
      <p>%(desc)s</p>
      <div class="trap-box"><b>💡 실무 포인트:</b> %(point)s</div>
      <p><a class="btn ghost sm" href="%(glink)s">%(gnavlabel)s 스테이지에서 실전 퀴즈로 이어서 보기 →</a></p>
    </div>%(related)s
    %(nudge)s
    <div class="ad-slot"></div>
    <p class="doc-back"><a href="glossary.html">← 용어사전 전체 목록</a></p>""" % {
            "group": esc(glabel), "term": esc(t["term"]), "tagline": esc(t["tagline"]),
            "desc": t["body"], "point": t["point"], "glink": glink, "gnavlabel": esc(gnavlabel),
            "related": related_html,
            "nudge": community_nudge_html(
                "'%s' 관련 실제 사례나 궁금한 점이 있다면, 커뮤니티에서 물어보세요." % t["term"]
            ),
        }
        write("glossary-%s.html" % t["slug"], shell(
            "glossary-%s.html" % t["slug"], "%s이란? 뜻과 실무 포인트 | Land Master Pro" % t["term"],
            t["tagline"], body_t))


def build_notices():
    body = """
    <div class="page-head">
      <h1>📡 공공 개발 고시·공고 와처</h1>
      <p>경기북부 지자체·LH의 개발 관련 고시·공고 모음</p>
    </div>
    <div class="intro-box">
      토지 투자의 가장 확실한 정보원은 소문이 아니라 <b>지자체 고시·공고 원문</b>입니다.
      보상계획 열람 공고, 도시관리계획 변경, 도로 개설, 산업단지 지정이 모두 여기서 먼저 공개됩니다.
      아래 목록은 자동 수집기(GitHub Actions, 하루 1회)로 갱신되도록 설계되어 있으며,
      수집기 설정 전에는 각 기관의 공식 게시판 바로가기가 표시됩니다.
    </div>
    <p class="update-line" id="noticeUpdated"></p>
    <div class="filter-row" id="noticeFilters"></div>
    <div id="noticeList"></div>
    <div class="ad-slot"></div>
    <div class="card">
      <h3>공고 읽는 법 3줄 요약</h3>
      <p style="font-size:0.98em;">
        ① 제목에서 '보상계획 열람', '지형도면 고시', '실시계획 인가'가 보이면 사업이 확정 단계라는 뜻입니다.
        ② 공람·열람 공고에는 이의 제기 기한이 있습니다 — 내 땅이 포함됐다면 기한 관리가 전부입니다(Stage 5 참고).
        ③ '주민 의견 청취', '전략환경영향평가' 단계는 아직 바뀔 수 있는 구상 단계입니다. 단계를 구분해 읽으세요.
      </p>
    </div>
    %(nudge)s
    <script type="application/json" id="seedNotices">%(seed)s</script>""" % {
        "seed": json.dumps(SEED_NOTICES, ensure_ascii=False),
        "nudge": community_nudge_html("관심 있는 공고에 대해 다른 사람들과 이야기 나누고 싶다면 커뮤니티를 이용해보세요."),
    }
    write("notices.html", shell(
        "notices.html", "공공 개발 고시·공고 와처 | Land Master Pro",
        "남양주·의정부·양주·동두천·포천·연천과 LH의 개발 관련 고시·공고를 한 곳에서 확인하세요.",
        body, extra_scripts='  <script src="assets/notices.js" defer></script>\n'))
    # 초기 JSON 파일
    os.makedirs(os.path.join(OUT, "data"), exist_ok=True)
    with open(os.path.join(OUT, "data", "notices.json"), "w", encoding="utf-8") as f:
        json.dump(SEED_NOTICES, f, ensure_ascii=False, indent=2)


# ---------------------------------------------------------------- 토지이음 가이드
def build_guide():
    body = """
    <div class="page-head">
      <h1>🌐 토지이음(eum.go.kr) 완벽 활용 가이드</h1>
      <p>토지 실사의 시작이자 끝 — 국토교통부 공식 토지 정보 포털 사용법</p>
    </div>
    <div class="doc">
      <div class="intro-box">
        토지이음은 국토교통부가 운영하는 무료 공공 포털로, 지번 하나만 알면 그 땅에 걸린
        <b>모든 공법상 규제</b>를 열람할 수 있습니다. 등기부등본이 '누구의 땅인가'를 알려준다면,
        토지이음은 '무엇을 할 수 있는 땅인가'를 알려줍니다. 아래 순서대로 따라 하면 10분 안에 1차 실사가 끝납니다.
      </div>

      <h2>1단계. 지번 조회 — 토지이용계획 열람</h2>
      <p><a href="https://www.eum.go.kr" target="_blank" rel="noopener">토지이음 접속</a> → 메인 검색창에
      주소(지번)를 입력합니다. 도로명주소가 아닌 <b>지번 주소</b>(OO리 123-4) 기준입니다.
      결과 화면에서 소재지·지목·면적이 내가 검토 중인 물건과 일치하는지 먼저 대조하세요.
      한 글자라도 다르면 옆 필지를 보고 있는 것입니다.</p>

      <h2>2단계. '지역지구등 지정여부' — 가장 중요한 두 줄</h2>
      <p>화면 중앙의 지정 내역이 실사의 심장입니다. 두 줄로 나뉩니다.</p>
      <ul>
        <li><b>「국토의 계획 및 이용에 관한 법률」에 따른 지역·지구</b>: 용도지역(계획관리, 자연녹지…),
        용도지구, 용도구역이 표시됩니다. 건폐율·용적률·허용 용도의 기본 틀입니다. (Stage 3 참고)</li>
        <li><b>다른 법령 등에 따른 지역·지구</b>: 농업진흥구역(농지법), 보전산지(산지관리법),
        개발제한구역, 군사기지 및 군사시설보호구역, 상수원보호, 문화재보호, 가축사육제한 등
        개별법 규제가 모두 이 줄에 나옵니다. <b>경기북부에서는 군사시설 관련 표기를 반드시 확인</b>하세요. (Stage 4-5 관문 참고)</li>
      </ul>

      <h2>3단계. 행위제한 내용 조회</h2>
      <p>지정 내역의 각 항목을 클릭하거나 '행위제한내용' 탭으로 이동하면, 해당 지역·지구에서
      무엇을 지을 수 있고 없는지 법령 원문 기준으로 조회됩니다.
      '건축할 수 있는 건축물' 목록에 내 목적(단독주택, 창고, 음식점 등)이 있는지 확인하는 것이
      이 단계의 목표입니다. 조례 위임 사항은 시·군 조례까지 열어봐야 최종 확정됩니다.</p>

      <h2>4단계. 확인도면 읽기</h2>
      <p>화면 아래 확인도면에서 ① 내 필지의 모양(맹지 여부, 도로 접면), ② 색깔로 표시된 용도지역 경계,
      ③ 인접 필지의 지목을 봅니다. 필지 일부에만 다른 규제가 걸린 경우(선형 규제 — 도로예정선,
      하천구역)도 도면에서만 보입니다. 축척을 확대해 경계선이 필지를 가로지르는지 확인하세요.</p>

      <h2>5단계. 함께 쓰는 무료 공공 서비스</h2>
      <div class="table-scroll"><table>
        <tr><th>서비스</th><th>용도</th></tr>
        <tr><td><a href="https://rt.molit.go.kr" target="_blank" rel="noopener">국토부 실거래가 공개시스템</a></td><td>주변 토지 실거래 가격 확인 — 호가가 아닌 실제 성사 가격</td></tr>
        <tr><td><a href="https://seereal.lh.or.kr" target="_blank" rel="noopener">LH 씨:리얼(SEE:REAL)</a></td><td>토지 종합 정보, 개발사업 정보 지도 열람</td></tr>
        <tr><td><a href="https://gis.kofpi.or.kr" target="_blank" rel="noopener">임업정보 다드림</a></td><td>임야의 경사도·표고·입목 정보 분석 (Stage 2 필수 도구)</td></tr>
        <tr><td><a href="https://map.ngii.go.kr" target="_blank" rel="noopener">국토정보플랫폼</a></td><td>연도별 항공사진 — 현황도로·분묘·성토 이력 추적</td></tr>
        <tr><td><a href="https://www.gov.kr" target="_blank" rel="noopener">정부24</a></td><td>토지(임야)대장, 지적도 등본 발급</td></tr>
        <tr><td><a href="https://www.iros.go.kr" target="_blank" rel="noopener">인터넷등기소</a></td><td>등기사항전부증명서 열람·발급 (Stage 4 참고)</td></tr>
      </table></div>

      <h2>실전 체크 순서 요약</h2>
      <p>① 토지이음에서 용도지역 + 다른 법령 규제 확인 → ② 행위제한에서 목적 건축물 가능 여부 →
      ③ 도면에서 도로 접면·규제선 → ④ 실거래가로 가격 검증 → ⑤ 등기부로 권리관계 →
      ⑥ 지자체 담당 부서 유선 확인. 이 여섯 단계를 거치기 전에는 계약금을 보내지 않는 것,
      그것이 이 사이트가 가르치는 단 하나의 원칙입니다.</p>
    </div>
    %s
    <div class="ad-slot"></div>""" % book_promo_html()
    write("guide.html", shell(
        "guide.html", "토지이음 완벽 활용 가이드 | Land Master Pro",
        "국토부 토지이음(eum.go.kr)으로 용도지역·행위제한·규제를 10분 만에 확인하는 실무 순서를 단계별로 안내합니다.",
        body))


# ---------------------------------------------------------------- 커뮤니티
def build_community():
    body = """
    <div class="page-head">
      <h1>💬 토지 마스터 라운지</h1>
      <p>회원 전용 커뮤니티 — 투자 고민, 임장 후기, 서류 분석 질문</p>
    </div>

    <div id="setupPanel" class="setup-note hidden">
      <b>🔧 커뮤니티 준비 중입니다.</b><br>
      회원제 게시판은 운영자가 데이터베이스(Supabase) 연결을 완료하면 활성화됩니다.
      그때까지는 학습 스테이지와 공고 와처를 이용해 주세요.
      <span style="color:var(--muted);">(운영자: README의 3단계 — Supabase 프로젝트 생성 후
      assets/config.js에 URL과 KEY를 입력하면 즉시 열립니다.)</span>
    </div>

    <div id="communityApp" class="hidden">
      <div class="auth-bar">
        <div id="authForms">
          <input class="field" type="email" id="authEmail" placeholder="이메일" style="max-width:220px; display:inline-block; margin-right:6px;">
          <input class="field" type="password" id="authPw" placeholder="비밀번호 (6자 이상)" style="max-width:180px; display:inline-block; margin-right:6px;">
          <button class="btn sm" id="btnLogin">로그인</button>
          <button class="btn ghost sm" id="btnSignup">회원가입</button>
        </div>
        <div id="authInfo" class="hidden">
          <span class="who" id="whoAmI"></span>
          <button class="btn ghost sm" id="btnLogout" style="margin-left:10px;">로그아웃</button>
        </div>
      </div>
      <p class="msg" id="commMsg"></p>

      <div id="composeBar" class="hidden">
        <a class="btn" id="btnGoWrite" href="#write">✍️ 새 글 쓰기</a>
      </div>

      <div id="writeBox" class="card hidden">
        <a class="post-back" href="#">← 목록으로</a>
        <h3>새 글 쓰기</h3>
        <input type="text" class="field" id="postTitle" maxlength="120" placeholder="제목을 입력하세요">
        <div class="editor-wrap">
          <div id="postEditor" data-placeholder="투자 고민, 임장 후기, 서류 분석 질문을 자유롭게 남겨주세요. (개인정보·매물 광고·비방 글은 삭제될 수 있습니다)"></div>
        </div>
        <button class="btn" id="btnPost" style="margin-top:10px;">💬 글 등록</button>
      </div>

      <div id="postList"></div>
    </div>

    <div class="card">
      <h3>커뮤니티 이용 안내</h3>
      <p style="font-size:0.98em;">
        글과 댓글 작성은 회원(이메일 가입)만 가능합니다. 작성자 표시는 이메일 앞 3자리만 공개됩니다.
        지번·연락처 등 개인정보, 특정 매물의 광고·알선, 근거 없는 개발 소문 유포는 예고 없이 삭제됩니다.
        본 커뮤니티의 게시글은 회원 개인의 의견이며 사이트의 공식 견해가 아닙니다.
      </p>
    </div>"""
    write("community.html", shell(
        "community.html", "토지 마스터 라운지 (커뮤니티) | Land Master Pro",
        "경기북부 토지 투자자들의 회원제 커뮤니티. 투자 고민과 임장 후기, 서류 분석 질문을 나눕니다.",
        body,
        extra_head='  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.6/quill.snow.min.css">\n',
        extra_scripts=(
            '  <script src="https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.6/quill.min.js"></script>\n'
            '  <script src="https://cdn.jsdelivr.net/npm/quill-blot-formatter@1/dist/quill-blot-formatter.min.js"></script>\n'
            '  <script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.1.6/purify.min.js"></script>\n'
            '  <script src="assets/community.js" defer></script>\n'
        )))


# ---------------------------------------------------------------- 소개 / 개인정보
def build_about():
    body = """
    <div class="page-head">
      <h1>사이트 소개 · 문의</h1>
      <p>Land Master Pro는 어떤 사이트인가요</p>
    </div>
    <div class="doc">
      <h2>무엇을 하는 곳인가</h2>
      <p>Land Master Pro는 경기북부(남양주·구리·의정부·양주·동두천·포천·연천 등) 토지에 관심 있는
      일반 투자자를 위한 <b>무료 학습·정보 사이트</b>입니다. 세 가지를 제공합니다.</p>
      <ul>
        <li><b>실전 학습 아카데미</b>: 맹지·도로, 임야·농지, 용도지역, 권리분석, 토지보상 — 5개 스테이지
        25개 관문을 퀴즈 게임 방식으로 학습합니다.</li>
        <li><b>공고 와처</b>: 지자체·LH의 개발 관련 고시·공고를 모아 보고, 읽는 법을 안내합니다.</li>
        <li><b>커뮤니티</b>: 회원 간 투자 고민과 임장 후기를 나누는 공간입니다.</li>
      </ul>
      <h2>누가 만들었나</h2>
      <p>버스운수업 인사·노무 분야에서 30년 가까이 일하며 행정 서류와 법령·조례를 읽어 온 실무자가
      운영합니다. 토지 공부를 하며 '공공 정보는 다 공개되어 있는데 읽는 법을 가르쳐 주는 곳이 없다'는
      문제의식으로 이 사이트를 만들었습니다.</p>
      <h2>면책 고지</h2>
      <p>본 사이트의 모든 콘텐츠는 일반적인 정보 제공 목적이며 법률·세무·투자 자문이 아닙니다.
      법령·조례·판례·세율은 개정될 수 있고, 같은 규제도 지자체별 기준이 다릅니다.
      실제 거래·개발 행위 전에는 반드시 관할 기관 및 전문가(변호사, 세무사, 감정평가사, 토목설계사무소 등)의
      확인을 받으시기 바랍니다. 본 사이트는 콘텐츠 이용으로 발생한 손해에 대해 책임을 지지 않습니다.</p>
      <h2>문의</h2>
      <p>콘텐츠 오류 제보, 제휴 문의: <a href="mailto:free336.adsens.2025@gmail.com">free336.adsens.2025@gmail.com</a></p>
    </div>"""
    write("about.html", shell(
        "about.html", "사이트 소개·문의 | Land Master Pro",
        "경기북부 토지 투자 학습 사이트 Land Master Pro의 소개와 운영 원칙, 면책 고지, 문의처 안내.",
        body))


def build_privacy():
    body = """
    <div class="page-head">
      <h1>개인정보처리방침</h1>
      <p>시행일: 2026-08-27</p>
    </div>
    <div class="doc">
      <p>Land Master Pro(이하 '사이트')는 이용자의 개인정보를 중요시하며, 관련 법령을 준수합니다.</p>
      <h2>1. 수집하는 개인정보와 목적</h2>
      <ul>
        <li><b>커뮤니티 회원가입</b>: 이메일 주소, 비밀번호(암호화 저장) — 회원제 게시판 운영, 본인 확인 목적.</li>
        <li><b>학습 진행 데이터</b>: 퀴즈 진행도·XP는 서버로 전송되지 않고 이용자의 브라우저(localStorage)에만 저장됩니다.</li>
      </ul>
      <h2>2. 보유 및 이용 기간</h2>
      <p>회원 탈퇴 요청 시 지체 없이 파기합니다. 탈퇴는 문의 이메일로 요청할 수 있습니다.</p>
      <h2>3. 제3자 제공 및 처리 위탁</h2>
      <p>수집한 개인정보를 제3자에게 판매·제공하지 않습니다. 회원 데이터 보관은 데이터베이스 서비스
      (Supabase Inc.)에 위탁 처리될 수 있습니다.</p>
      <h2>4. 쿠키 및 광고</h2>
      <p>본 사이트는 Google AdSense 광고를 게재할 수 있습니다. Google을 포함한 제3자 광고 사업자는
      쿠키를 사용하여 이용자의 이전 방문 기록에 기반한 광고를 게재합니다.
      이용자는 <a href="https://adssettings.google.com" target="_blank" rel="noopener">Google 광고 설정</a>에서
      맞춤 광고를 비활성화할 수 있으며, <a href="https://www.aboutads.info" target="_blank" rel="noopener">aboutads.info</a>에서
      제3자 광고 사업자의 쿠키 사용을 관리할 수 있습니다.</p>
      <h2>5. 이용자의 권리</h2>
      <p>이용자는 언제든지 자신의 개인정보 열람·정정·삭제를 요청할 수 있습니다.</p>
      <h2>6. 문의처</h2>
      <p>개인정보 관련 문의: <a href="mailto:free336.adsens.2025@gmail.com">free336.adsens.2025@gmail.com</a></p>
      <p style="color:var(--muted); font-size:0.85em;">본 방침은 법령·서비스 변경에 따라 개정될 수 있으며, 개정 시 본 페이지에 게시합니다.</p>
    </div>"""
    write("privacy.html", shell(
        "privacy.html", "개인정보처리방침 | Land Master Pro",
        "Land Master Pro의 개인정보 수집·이용, 쿠키 및 광고, 이용자 권리에 대한 안내입니다.",
        body))


# ---------------------------------------------------------------- 부속 파일
def build_misc():
    pages = ["index.html", "stage1.html", "stage2.html", "stage3.html", "stage4.html",
             "stage5.html", "glossary.html", "notices.html", "guide.html", "community.html",
             "about.html", "privacy.html"]
    pages += ["glossary-%s.html" % t["slug"] for t in GLOSSARY]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for p in pages:
        sm.append("  <url><loc>%s/%s</loc></url>" % (SITE_URL, p))
    sm.append("</urlset>")
    write("sitemap.xml", "\n".join(sm))
    write("robots.txt", "User-agent: *\nAllow: /\nSitemap: %s/sitemap.xml\n" % SITE_URL)
    write("CNAME", "land.free336.com\n")


def write(name, content):
    path = os.path.join(OUT, name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("  ✔", name)


if __name__ == "__main__":
    print("Land Master Pro 빌드 시작…")
    build_facts_data()
    build_index()
    for s in STAGES:
        build_stage(s)
    build_glossary()
    build_notices()
    build_guide()
    build_community()
    build_about()
    build_privacy()
    build_misc()
    print("완료! site/ 폴더를 통째로 배포하면 됩니다.")
