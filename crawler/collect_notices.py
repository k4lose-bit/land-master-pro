# -*- coding: utf-8 -*-
"""경기북부 고시·공고 자동 수집기.

sources.json 에 정의된 출처(RSS 또는 HTML 게시판)에서 공고를 수집해
../data/notices.json 을 갱신한다. GitHub Actions(.github/workflows/update-notices.yml)가
하루 1회 자동 실행하도록 구성되어 있고, 로컬에서도 실행 가능:

    pip install requests beautifulsoup4
    python collect_notices.py

지자체 홈페이지는 개편이 잦아 selector가 깨질 수 있다. 한 출처가 실패해도
나머지는 계속 수집하며, 실패 내역은 로그로 출력된다. selector 수정은
sources.json 만 고치면 된다(코드 수정 불필요).
"""
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("필요 패키지 설치: pip install requests beautifulsoup4")
    sys.exit(1)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_PATH = os.path.join(HERE, "..", "data", "notices.json")
SRC_PATH = os.path.join(HERE, "sources.json")
KST = timezone(timedelta(hours=9))

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; LandMasterBot/1.0; +https://land.free336.com)",
    "Accept-Language": "ko",
}

# 토지·개발 관련 공고만 추리는 키워드 (제목 기준)
KEYWORDS = [
    "보상", "수용", "재결", "공공주택", "택지", "지구", "도시관리계획", "도시계획",
    "지형도면", "실시계획", "산업단지", "개발행위", "도로", "철도", "정비구역",
    "재개발", "재건축", "환지", "열람", "성장관리", "개발제한", "토지", "지구단위",
]


def keep(title):
    return any(k in title for k in KEYWORDS)


def clean(text):
    return re.sub(r"\s+", " ", (text or "")).strip()


def norm_date(text):
    """다양한 날짜 표기를 YYYY-MM-DD로 정규화 (실패 시 빈 문자열)."""
    text = clean(text)
    m = re.search(r"(\d{4})[.\-/년\s]+(\d{1,2})[.\-/월\s]+(\d{1,2})", text)
    if m:
        return "%s-%02d-%02d" % (m.group(1), int(m.group(2)), int(m.group(3)))
    return ""


def fetch(url):
    r = requests.get(url, headers=HEADERS, timeout=20)
    r.raise_for_status()
    if not r.encoding or r.encoding.lower() == "iso-8859-1":
        r.encoding = r.apparent_encoding
    return r.text


def collect_rss(src):
    items = []
    xml_text = fetch(src["url"])
    root = ET.fromstring(xml_text.encode(root_encoding(xml_text)))
    for item in root.iter("item"):
        title = clean(item.findtext("title"))
        link = clean(item.findtext("link"))
        date = norm_date(item.findtext("pubDate") or item.findtext("dc:date") or "")
        if title and link and keep(title):
            items.append(make(src, title, link, date))
    return items


def root_encoding(xml_text):
    m = re.match(r"<\?xml[^>]*encoding=[\"']([^\"']+)", xml_text)
    return m.group(1) if m else "utf-8"


def collect_html(src):
    """CSS selector 기반 게시판 수집.
    sources.json 항목: row(행), title(제목 a), date(날짜 셀) selector와 base(상대링크 기준)."""
    items = []
    html_text = fetch(src["url"])
    soup = BeautifulSoup(html_text, "html.parser")
    for row in soup.select(src["row"]):
        a = row.select_one(src["title"])
        if not a:
            continue
        title = clean(a.get_text())
        href = a.get("href") or ""
        if href.startswith("javascript"):
            # onclick 안의 숫자(글 번호)로 상세 URL을 만드는 게시판 대응
            onclick = a.get("onclick") or href
            m = re.search(r"(\d{3,})", onclick)
            href = src.get("detail", src["url"]).replace("{id}", m.group(1)) if m else src["url"]
        elif href and not href.startswith("http"):
            href = src.get("base", src["url"]).rstrip("/") + "/" + href.lstrip("/")
        date_el = row.select_one(src.get("date", "")) if src.get("date") else None
        date = norm_date(date_el.get_text() if date_el else "")
        if title and keep(title):
            items.append(make(src, title, href, date))
    return items


def make(src, title, link, date):
    return {
        "region": src["region"],
        "category": src.get("category", "고시·공고"),
        "title": title,
        "link": link,
        "date": date,
    }


def main():
    with open(SRC_PATH, encoding="utf-8") as f:
        sources = json.load(f)

    all_items, errors = [], []
    for src in sources:
        try:
            items = collect_rss(src) if src["type"] == "rss" else collect_html(src)
            all_items.extend(items[: src.get("limit", 15)])
            print("✔ %s: %d건" % (src["region"], len(items)))
        except Exception as e:  # 한 출처 실패가 전체를 막지 않게
            errors.append("%s: %s" % (src["region"], e))
            print("✘ %s 실패: %s" % (src["region"], e))

    # 중복 제거(링크 기준) + 날짜 내림차순
    seen, unique = set(), []
    for it in all_items:
        if it["link"] in seen:
            continue
        seen.add(it["link"])
        unique.append(it)
    unique.sort(key=lambda x: x.get("date") or "0000-00-00", reverse=True)
    unique = unique[:60]

    if not unique:
        print("수집 결과가 0건입니다. 기존 notices.json을 유지합니다.")
        if errors:
            print("실패 출처:", "; ".join(errors))
        return

    out = {
        "generated_at": datetime.now(KST).strftime("%Y-%m-%d %H:%M KST"),
        "source_note": "지자체·LH 공식 게시판 자동 수집 (키워드: 토지·개발 관련)",
        "errors": errors,
        "notices": unique,
    }
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print("완료: %d건 → data/notices.json" % len(unique))


if __name__ == "__main__":
    main()
