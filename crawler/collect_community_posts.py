# -*- coding: utf-8 -*-
"""커뮤니티 글을 정적 페이지로 만들어 검색엔진에 노출시키는 자동 수집기.

Supabase posts 테이블을 공개 SELECT로 읽어와, 기준을 만족하는 글마다
community-post-<id>.html 정적 페이지를 만들고 community-archive.html(전체 목록)과
sitemap.xml을 다시 쓴다. GitHub Actions(.github/workflows/update-community.yml)가
6시간마다 자동 실행하도록 구성되어 있고, 로컬에서도 실행 가능:

    pip install requests beautifulsoup4
    python crawler_community/collect_community_posts.py

정책 (모두 의도적인 선택, 코드만 보고 판단하지 말 것):
- 순수 텍스트 기준 50자 미만인 글은 정적 페이지를 만들지 않는다 (저품질/스팸 페이지 방지).
- 회원이 에디터(Quill)로 쓴 원본에는 서식·이미지 태그가 그대로 들어있는데, 이걸 검증 없이
  그대로 정적 HTML에 박아넣으면 XSS 위험이 있다. 그래서 정적 페이지에는 태그를 다 벗겨낸
  "텍스트만" 넣고, 서식·이미지가 있는 원문은 커뮤니티(#post-<id>)로 안내한다.
- 작성자 이메일은 그대로 노출하지 않고 앞 3자 + '***'로 마스킹한다 (community.js의
  maskEmail()과 동일한 규칙 — 검색 노출 페이지라 스팸 수집 위험이 더 크다).
- 글이 삭제되었거나 더 이상 기준(50자)을 만족하지 않게 되면, 이전에 만들어둔 정적 페이지도
  같이 지운다 — 안 그러면 죽은 글의 페이지가 사이트에 영구히 남는다.
- 이 스크립트는 저장소 루트에서 실행된다고 가정한다 (`python crawler_community/collect_community_posts.py`).
  생성 파일은 모두 저장소 루트에 바로 쓴다 (site/ 서브폴더 아님 — 실제 배포 구조가 flat이기 때문).
"""
import json
import os
import re
import sys

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("필요 패키지 설치: pip install requests beautifulsoup4")
    sys.exit(1)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
sys.path.insert(0, ROOT)

from build_site import shell, esc, SITE_URL, static_pages  # noqa: E402

# config.js에 이미 공개돼 있는 값과 동일 (anon key는 브라우저에도 그대로 노출되는 공개 키)
SUPABASE_URL = "https://birwnzwkaufeianbwtrq.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_t71D_lRPCye6d1n7FILKAQ_QiijSmad"

MANIFEST_PATH = os.path.join(ROOT, "data", "community_posts.json")
MIN_TEXT_LEN = 50
MAX_POSTS = 300


def strip_html(raw_html):
    """서식 태그를 제거하고 순수 텍스트만 남긴다. 문단 구분은 줄바꿈으로 보존."""
    soup = BeautifulSoup(raw_html or "", "html.parser")
    text = soup.get_text("\n")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text


def mask_email(email):
    """community.js의 maskEmail()과 동일한 규칙: 앞 3자 + '***'."""
    if not email:
        return "익명"
    name = email.split("@")[0]
    return name[:3] + "***"


def fetch_posts():
    url = SUPABASE_URL + "/rest/v1/posts"
    params = {
        "select": "id,title,content,author_email,created_at",
        "order": "created_at.desc",
        "limit": str(MAX_POSTS),
    }
    headers = {"apikey": SUPABASE_ANON_KEY, "Authorization": "Bearer " + SUPABASE_ANON_KEY}
    r = requests.get(url, params=params, headers=headers, timeout=20)
    r.raise_for_status()
    return r.json()


def post_html(post, text, excerpt):
    title = (post.get("title") or "").strip() or "(제목 없음)"
    author = mask_email(post.get("author_email"))
    date = (post.get("created_at") or "")[:10]
    paragraphs = "\n      ".join(
        "<p>%s</p>" % esc(p) for p in text.split("\n") if p.strip()
    )
    fname = "community-post-%s.html" % post["id"]
    body = """
    <div class="page-head">
      <span class="term-badge">커뮤니티</span>
      <h1>%(title)s</h1>
      <p>%(author)s · %(date)s</p>
    </div>
    <div class="doc">
      %(paragraphs)s
      <p style="color:var(--muted); font-size:0.85em;">이 페이지는 커뮤니티에 올라온 글을 검색 노출용으로
      정리한 버전입니다. 서식·이미지가 포함된 원문과 댓글은 커뮤니티에서 확인하세요.</p>
      <p><a class="btn ghost sm" href="community.html#post-%(id)s">💬 커뮤니티에서 원문·댓글 보기 →</a></p>
    </div>
    <p class="doc-back"><a href="community-archive.html">← 커뮤니티 지난 글 목록</a></p>""" % {
        "title": esc(title), "author": esc(author), "date": esc(date),
        "paragraphs": paragraphs or "<p>(내용 없음)</p>", "id": post["id"],
    }
    return fname, shell(fname, "%s | Land Master Pro 커뮤니티" % title, esc(excerpt), body)


def archive_html(entries):
    rows = "\n      ".join(
        '<a class="glossary-card" href="%s"><b>%s</b><span>%s · %s</span></a>'
        % (e["file"], esc(e["title"]), esc(e["author"]), esc(e["date"]))
        for e in entries
    )
    body = """
    <div class="page-head">
      <h1>🗂 커뮤니티 지난 글</h1>
    </div>
    <div class="glossary-grid">
      %(rows)s
    </div>
    <p><a class="btn ghost sm" href="community.html">💬 커뮤니티에서 직접 글쓰기 →</a></p>""" % {
        "rows": rows or "<p>아직 정리된 글이 없습니다.</p>",
    }
    return shell("community-archive.html", "커뮤니티 지난 글 | Land Master Pro",
                 "Land Master Pro 커뮤니티 회원들이 남긴 글 모음.", body)


def write_file(name, content):
    path = os.path.join(ROOT, name)
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("  ✔", name)


def main():
    try:
        posts = fetch_posts()
    except Exception as e:
        print("✘ Supabase 조회 실패:", e)
        sys.exit(1)

    old_files = set()
    if os.path.exists(MANIFEST_PATH):
        with open(MANIFEST_PATH, encoding="utf-8") as f:
            old_files = {e["file"] for e in json.load(f)}

    entries, new_files = [], set()
    for post in posts:
        text = strip_html(post.get("content"))
        if len(text) < MIN_TEXT_LEN:
            continue
        excerpt = text[:120].replace("\n", " ")
        fname, html_out = post_html(post, text, excerpt)
        write_file(fname, html_out)
        new_files.add(fname)
        entries.append({
            "file": fname,
            "title": (post.get("title") or "").strip() or "(제목 없음)",
            "author": mask_email(post.get("author_email")),
            "date": (post.get("created_at") or "")[:10],
        })

    # 삭제되었거나 더 이상 기준(50자)을 만족하지 않는 글의 정적 페이지 제거
    removed = old_files - new_files
    for fname in removed:
        path = os.path.join(ROOT, fname)
        if os.path.exists(path):
            os.remove(path)
            print("  ✘ 제거:", fname)

    os.makedirs(os.path.dirname(MANIFEST_PATH), exist_ok=True)
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

    write_file("community-archive.html", archive_html(entries))

    pages = static_pages() + [e["file"] for e in entries]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for p in pages:
        sm.append("  <url><loc>%s/%s</loc></url>" % (SITE_URL, p))
    sm.append("</urlset>")
    write_file("sitemap.xml", "\n".join(sm))

    print("완료: 정적 페이지 %d건 (제거 %d건)" % (len(entries), len(removed)))


if __name__ == "__main__":
    main()
