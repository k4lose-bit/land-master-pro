# -*- coding: utf-8 -*-
"""본문 도해와 OG 이미지를 코드로 그린다 (2026-11-17 신설).

왜 코드로 그리는가
  - 2026-11-17 경쟁 페이지 24개 실측 결과, 민간 상위 페이지의 본문 이미지는
    평균 2.5장이고 '설명형' 쿼리(지구단위계획/등기부등본)의 1~3위는 8~12장이었다.
    반면 우리 사이트는 42개 페이지에 우리 소유 이미지가 0장이었다.
  - 토지이음·등기소 화면 캡처는 저작권·이용약관 문제가 있어 쓰지 않는다.
    조문에서 나오는 수치(4m/2m, 경사도 25도 등)를 그대로 도해로 그리면
    원본성이 확보되고 내용도 정확하다.
  - 이미지의 모든 수치는 content_terms / content_terms2 의 검증된 laws 목록과
    content_guides.py 의 numbers 표에서 가져온다. 새 수치를 그릴 때는
    반드시 국가법령정보센터 원문과 대조하고 출처를 주석에 남길 것.

실행: python3 make_diagrams.py  →  assets/img/ 에 PNG 생성
"""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "assets", "img")

# 민트 테마 (2026-08-28 LOCKED)
BG      = (242, 250, 247)
CARD    = (255, 255, 255)
PRIMARY = (14, 166, 114)
ACCENT  = (46, 230, 168)
LINE    = (167, 139, 250)
INK     = (31, 41, 55)
MUTED   = (107, 114, 128)
BAD     = (224, 82, 75)
WARN    = (232, 163, 61)
SOIL    = (214, 211, 199)

FONT_B = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
FONT_R = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
# NotoSansCJK ttc 의 한국어 face index
KR_INDEX = 1


def f(size, bold=False):
    path = FONT_B if bold else FONT_R
    try:
        return ImageFont.truetype(path, size, index=KR_INDEX)
    except Exception:
        return ImageFont.truetype(path, size)


def tw(d, text, font):
    b = d.textbbox((0, 0), text, font=font)
    return b[2] - b[0], b[3] - b[1]


def center(d, text, font, cx, y, fill=INK):
    w, _ = tw(d, text, font)
    d.text((cx - w / 2, y), text, font=font, fill=fill)


def rrect(d, box, r, fill=None, outline=None, width=2):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def arrow(d, x1, y1, x2, y2, color=INK, width=3, head=9):
    d.line([(x1, y1), (x2, y2)], fill=color, width=width)
    import math
    ang = math.atan2(y2 - y1, x2 - x1)
    for s in (-0.5, 0.5):
        d.line([(x2, y2),
                (x2 - head * math.cos(ang + s), y2 - head * math.sin(ang + s))],
               fill=color, width=width)


def dim_line(d, x1, x2, y, label, color=PRIMARY, font=None):
    """치수선 — |<---- 4m ---->|"""
    d.line([(x1, y), (x2, y)], fill=color, width=3)
    for x in (x1, x2):
        d.line([(x, y - 9), (x, y + 9)], fill=color, width=3)
    if label:
        w, h = tw(d, label, font)
        cx = (x1 + x2) / 2
        d.rectangle([cx - w / 2 - 6, y - h / 2 - 5, cx + w / 2 + 6, y + h / 2 + 5], fill=CARD)
        d.text((cx - w / 2, y - h / 2 - 2), label, font=font, fill=color)


def base(w, h, title, sub=None):
    im = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w, 64], fill=CARD)
    d.line([(0, 64), (w, 64)], fill=LINE, width=3)
    d.text((26, 18), title, font=f(27, True), fill=PRIMARY)
    if sub:
        wd, _ = tw(d, sub, f(16))
        d.text((w - wd - 26, 26), sub, font=f(16), fill=MUTED)
    return im, d


def footer(d, w, h, src):
    d.line([(26, h - 42), (w - 26, h - 42)], fill=LINE, width=1)
    d.text((26, h - 32), src, font=f(15), fill=MUTED)
    t = "ttangstudy.com"
    wd, _ = tw(d, t, f(15, True))
    d.text((w - wd - 26, h - 32), t, font=f(15, True), fill=PRIMARY)


# ─────────────────────────────────────────────── 1. 접도 요건 도해
def diagram_jeopdo():
    """건축법 제2조 제1항 제11호(도로 너비 4m) + 제44조 제1항(접면 2m).
    수치 출처: content_terms2.py 'maengji' / 'jeopdo-uimu' laws (2026-10-14 대조)."""
    W, H = 1200, 690
    im, d = base(W, H, "건축법이 요구하는 두 가지 숫자 — 도로 너비 4m, 접한 길이 2m",
                 "건축법 제2조 제1항 제11호 · 제44조 제1항")

    road_top, road_bot = 150, 262          # 도로 (너비 4m)
    d.rectangle([80, road_top, W - 80, road_bot], fill=(228, 232, 240), outline=MUTED, width=2)
    for x in range(110, W - 100, 70):      # 중앙선
        d.line([(x, (road_top + road_bot) // 2), (x + 38, (road_top + road_bot) // 2)],
               fill=(255, 255, 255), width=5)
    center(d, "도 로", f(21, True), (W) // 2, road_top + 14, MUTED)

    # 도로 너비 치수 (세로)
    d.line([(96, road_top), (96, road_bot)], fill=PRIMARY, width=3)
    for y in (road_top, road_bot):
        d.line([(88, y), (104, y)], fill=PRIMARY, width=3)
    d.text((112, (road_top + road_bot) // 2 - 16), "너비 4m 이상", font=f(20, True), fill=PRIMARY)
    d.text((112, (road_top + road_bot) // 2 + 8), "제2조 제1항 제11호", font=f(15), fill=MUTED)

    # 대지 A — 접면 2m 이상 (충족)
    ax1, ax2 = 190, 520
    d.rectangle([ax1, road_bot, ax2, road_bot + 250], fill=CARD, outline=PRIMARY, width=4)
    center(d, "대지 A", f(23, True), (ax1 + ax2) // 2, road_bot + 92, PRIMARY)
    center(d, "접한 길이 2m 이상 → 요건 충족", f(18), (ax1 + ax2) // 2, road_bot + 130, INK)
    dim_line(d, ax1, ax2, road_bot + 22, "2m 이상", PRIMARY, f(19, True))

    # 대지 B — 접면 부족 (미달)
    bx1, bx2 = 700, 790
    d.rectangle([bx1, road_bot, bx2, road_bot + 250], fill=CARD, outline=BAD, width=4)
    d.rectangle([bx2, road_bot + 70, bx2 + 280, road_bot + 250], fill=CARD, outline=BAD, width=4)
    center(d, "대지 B", f(23, True), bx2 + 50, road_bot + 150, BAD)
    center(d, "접한 길이 2m 미만 → 요건 미달", f(18), bx2 + 60, road_bot + 190, INK)
    dim_line(d, bx1, bx2, road_bot + 22, "2m 미만", BAD, f(18, True))

    y = H - 118
    rrect(d, [80, y, W - 80, y + 64], 12, fill=CARD, outline=LINE, width=2)
    d.text((100, y + 11), "4m는 도로의 '너비', 2m는 대지가 도로에 '접한 길이'입니다. "
                          "서로 다른 조문의 숫자입니다.", font=f(19, True), fill=INK)
    d.text((100, y + 38), "면 지역(도시지역·지구단위계획구역 밖, 동·읍 아님)은 제44조~제47조가 "
                          "적용되지 않습니다 — 건축법 제3조 제2항", font=f(17), fill=MUTED)
    footer(d, W, H, "출처: 국가법령정보센터 건축법 원문 대조(2026-10-14)")
    return im, "doro-jeopdo-yogeon.png"


# ─────────────────────────────────────────────── 2. 보전/준보전산지 비교
def diagram_sanji():
    """산지관리법 제4조①·제18조②·시행령 제24조④·제15조①1호.
    수치 출처: content_guides.py 'sanji-nongji' compare (2026-10-13/14 대조)
    + 산림청고시 제2026-16호(2026-01-30) 단가."""
    W, H = 1200, 820
    im, d = base(W, H, "보전산지와 준보전산지 — 실제로 갈리는 네 지점",
                 "산지관리법 제4조 · 제18조 · 시행령 제24조")
    cols = [(90, 630, "보전산지", BAD, "임업용산지 + 공익용산지 (산림청장 지정)"),
            (640, 1110, "준보전산지", PRIMARY, "보전산지 외의 산지")]
    rows = [("전용허가기준 적용", "8개 기준 전부", "제1호~제4호 적용 배제", "제18조 제2항"),
            ("대체산림자원조성비", "10,840원/㎡", "8,340원/㎡", "산림청고시 2026-16호"),
            ("가산율", "준보전 + 30%", "기준 단가", "시행령 제24조 제4항"),
            ("허가권자", "3만㎡ 이상 시·도지사", "—", "시행령 제15조①1호")]
    for x1, x2, name, color, desc in cols:
        rrect(d, [x1, 100, x2, 175], 12, fill=CARD, outline=color, width=4)
        center(d, name, f(27, True), (x1 + x2) // 2, 115, color)
        center(d, desc, f(16), (x1 + x2) // 2, 150, MUTED)
    y = 200
    for label, left, right, src in rows:
        rrect(d, [90, y, 1110, y + 128], 10, fill=CARD, outline=LINE, width=2)
        d.text((112, y + 14), label, font=f(20, True), fill=INK)
        d.text((112, y + 44), src, font=f(15), fill=MUTED)
        d.line([(630, y + 12), (630, y + 116)], fill=LINE, width=2)
        center(d, left, f(23, True), 470, y + 52, BAD)
        center(d, right, f(23, True), 880, y + 52, PRIMARY)
        y += 142
    rrect(d, [90, y, 1110, y + 60], 12, fill=(254, 246, 231), outline=WARN, width=2)
    d.text((112, y + 9), "준보전산지여도 평균경사도 25도를 넘으면 전용허가가 막힙니다 "
                         "— 등급이 아니라 땅의 생김새로 갈립니다.", font=f(19, True), fill=INK)
    d.text((112, y + 34), "경사도·입목축적 기준: 산지관리법 시행령 별표 4 / 측정방법: 시행규칙 별표 1의3",
           font=f(16), fill=MUTED)
    footer(d, W, H, "출처: 국가법령정보센터 산지관리법·시행령 원문 및 산림청고시 제2026-16호")
    return im, "sanji-bojeon-junbojeon-bigyo.png"


# ─────────────────────────────────────────────── 3. 대체산림자원조성비 계산 흐름
def diagram_sallim_calc():
    """산림청고시 제2026-16호(2026-01-30) 본문 계산식 그대로.
    단위면적당 금액 = 산지별 산출금액 + 개별공시지가의 1/1000 (상한 8,340원/㎡)."""
    W, H = 1200, 700
    im, d = base(W, H, "대체산림자원조성비는 이렇게 계산됩니다",
                 "산림청고시 제2026-16호 (2026. 1. 30. 시행)")
    boxes = [(90, 120, 350, 230, "산지 구분별\n단위면적당 산출금액",
              "준보전 8,340원/㎡\n보전 10,840원/㎡\n제한지역 16,680원/㎡", PRIMARY),
             (430, 120, 690, 230, "개별공시지가의\n1000분의 1",
              "상한 8,340원/㎡\n(2024년까지는 1000분의 10\n— 블로그 수치 주의)", LINE)]
    for x1, y1, x2, y2, t, sub, c in boxes:
        rrect(d, [x1, y1, x2, y2 + 60], 12, fill=CARD, outline=c, width=3)
        yy = y1 + 14
        for ln in t.split("\n"):
            center(d, ln, f(20, True), (x1 + x2) // 2, yy, INK); yy += 28
        yy += 4
        for ln in sub.split("\n"):
            center(d, ln, f(16), (x1 + x2) // 2, yy, MUTED); yy += 23
    center(d, "+", f(42, True), 390, 160, INK)
    arrow(d, 700, 190, 770, 190, INK, 4, 12)
    rrect(d, [780, 120, 1110, 290], 12, fill=(230, 247, 241), outline=PRIMARY, width=4)
    center(d, "단위면적당 금액", f(22, True), 945, 142, PRIMARY)
    center(d, "(원/㎡)", f(17), 945, 172, MUTED)
    center(d, "× 산지전용 면적(㎡)", f(21, True), 945, 208, INK)
    center(d, "= 부과금액", f(26, True), 945, 244, PRIMARY)

    y = 340
    rrect(d, [90, y, 1110, y + 110], 12, fill=CARD, outline=LINE, width=2)
    d.text((112, y + 14), "감면 — 시행령 별표 5 (보전산지와 준보전산지의 비율이 다릅니다)",
           font=f(20, True), fill=INK)
    d.text((112, y + 46), "농림어업인이 자기 소유 산지에 660㎡ 미만으로 짓는 주택·부대시설 → 보전 100% / 준보전 100% 감면",
           font=f(17), fill=MUTED)
    d.text((112, y + 72), "농림어업인등의 축사·온실·버섯재배시설·양어장 → 보전 100% / 준보전 100% 감면",
           font=f(17), fill=MUTED)

    y = 480
    rrect(d, [90, y, 1110, y + 92], 12, fill=(254, 237, 234), outline=BAD, width=2)
    d.text((112, y + 12), "가장 흔한 오류", font=f(20, True), fill=BAD)
    d.text((112, y + 42), "개별공시지가 반영비율은 2025년도 고시부터 1000분의 1입니다. "
                          "'공시지가의 1%'로 계산한 자료는", font=f(17), fill=INK)
    d.text((112, y + 66), "2024년 이전 기준이고, 그대로 쓰면 가산액이 10배 과대계상됩니다.",
           font=f(17), fill=INK)
    footer(d, W, H, "출처: 산림청고시 제2026-16호 고시문 원문 · 산지관리법 제19조 제8항")
    return im, "daeche-sallim-gyesan-bangbeop.png"


# ─────────────────────────────────────────────── 4. 등기사항증명서 구조
def diagram_deunggi():
    """부동산등기법 제15조 제2항(표제부/갑구/을구), 등기규칙 제151조 제2항(가처분은 갑구).
    출처: content_terms2.py 'deunggibu-deungbon' laws (2026-10-14 대조)."""
    W, H = 1200, 780
    im, d = base(W, H, "등기사항증명서는 세 칸으로 되어 있습니다",
                 "부동산등기법 제15조 제2항")
    parts = [("표제부", "부동산의 표시", "소재지 · 지번 · 지목 · 면적\n→ 내가 보는 물건이 맞는지 대조", MUTED),
             ("갑  구", "소유권에 관한 사항", "소유권 이전 · 가등기 · 가압류 · 압류\n경매개시결정 · 가처분", PRIMARY),
             ("을  구", "소유권 외의 권리", "근저당권 · 지상권 · 전세권\n임차권 · 지역권", LINE)]
    y = 110
    for name, sub, body, c in parts:
        rrect(d, [90, y, 1110, y + 178], 12, fill=CARD, outline=c, width=4)
        rrect(d, [90, y, 320, y + 178], 12, fill=c, outline=c, width=2)
        center(d, name, f(32, True), 205, y + 54, CARD)
        center(d, sub, f(17), 205, y + 110, CARD)
        yy = y + 36
        for ln in body.split("\n"):
            d.text((356, yy), ln, font=f(21), fill=INK); yy += 38
        y += 198
    y = H - 160
    rrect(d, [90, y, 1110, y + 110], 12, fill=(254, 246, 231), outline=WARN, width=2)
    d.text((112, y + 12), "여기서 가장 많이 놓칩니다", font=f(20, True), fill=INK)
    d.text((112, y + 44), "소유명의인을 채무자로 하는 소유권 외 권리의 가처분은 을구가 아니라 "
                          "갑구에 기록됩니다.", font=f(18), fill=INK)
    d.text((112, y + 72), "부동산등기규칙 제151조 제2항 — 갑구를 끝까지 읽어야 하는 이유입니다.",
           font=f(17), fill=MUTED)
    footer(d, W, H, "출처: 국가법령정보센터 부동산등기법·부동산등기규칙 원문 대조(2026-10-14)")
    return im, "deunggi-pyojebu-gapgu-eulgu.png"


# ─────────────────────────────────────────────── 5. 지구단위계획 — 사업인정 의제 시점
def diagram_suyong():
    """국토계획법 제96조②, 도시개발법 제17조·제22조③, 택촉법 제12조②, 산업입지법 제22조②.
    출처: content_guides.py 'gyehoek-inga' compare (2026-10-14 대조)."""
    W, H = 1200, 700
    im, d = base(W, H, "수용권이 생기는 시점은 법마다 다릅니다",
                 "사업인정 의제 — 토지보상법상 수용의 출발점")
    rows = [("국토의 계획 및 이용에 관한 법률", "실시계획의 고시", "제96조 제2항"),
            ("도시개발법", "실시계획 인가 + 토지 세부목록 고시", "제17조 · 제22조 제3항"),
            ("택지개발촉진법", "택지개발지구의 지정·고시", "제12조 제2항"),
            ("산업입지 및 개발에 관한 법률", "산업단지의 지정·고시", "제22조 제2항")]
    y = 120
    for law, when, art in rows:
        rrect(d, [90, y, 1110, y + 110], 12, fill=CARD, outline=LINE, width=2)
        d.text((112, y + 18), law, font=f(21, True), fill=INK)
        d.text((112, y + 54), art, font=f(16), fill=MUTED)
        rrect(d, [560, y + 20, 1086, y + 90], 10, fill=(230, 247, 241), outline=PRIMARY, width=2)
        center(d, when, f(21, True), 823, y + 42, PRIMARY)
        y += 128
    y = H - 110
    rrect(d, [90, y, 1110, y + 62], 12, fill=(254, 237, 234), outline=BAD, width=2)
    d.text((112, y + 9), "\"실시계획인가가 나면 수용권이 생긴다\"는 설명은 법마다 틀립니다.",
           font=f(19, True), fill=INK)
    d.text((112, y + 35), "국토계획법에서는 인가가 아니라 '고시'가 사업인정 고시로 의제됩니다.",
           font=f(17), fill=MUTED)
    footer(d, W, H, "출처: 국가법령정보센터 4개 법률 원문 대조(2026-10-14)")
    return im, "saeobinjeong-uije-sijeom.png"


DIAGRAMS = [diagram_jeopdo, diagram_sanji, diagram_sallim_calc,
            diagram_deunggi, diagram_suyong]


# ─────────────────────────────────────────────── OG 이미지 (1200x630)
def og_image(title, sub, badge, name):
    """구글 디스커버·검색 대표이미지 요건: 너비 1200px 이상, 총 픽셀 30만 초과, 16:9 계열.
    1200x630 = 756,000픽셀 (요건 충족). 출처: developers.google.com/search/docs/appearance/google-discover"""
    W, H = 1200, 630
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    # 지적선 모티프 (사이트 히어로와 동일한 경계선 그래픽 계열)
    pts = [(830, 120), (1130, 190), (1090, 470), (800, 520), (760, 300)]
    d.polygon(pts, outline=ACCENT)
    for i in range(len(pts)):
        x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % len(pts)]
        n = 16
        for k in range(0, n, 2):
            d.line([(x1 + (x2 - x1) * k / n, y1 + (y2 - y1) * k / n),
                    (x1 + (x2 - x1) * (k + 1) / n, y1 + (y2 - y1) * (k + 1) / n)],
                   fill=PRIMARY, width=4)
    for p in pts:
        d.ellipse([p[0] - 7, p[1] - 7, p[0] + 7, p[1] + 7], fill=ACCENT, outline=PRIMARY, width=3)

    d.rectangle([0, 0, 14, H], fill=PRIMARY)
    bw, bh = tw(d, badge, f(22, True))
    rrect(d, [62, 86, 62 + bw + 36, 86 + bh + 24], 18, fill=PRIMARY)
    d.text((80, 94), badge, font=f(22, True), fill=CARD)

    y = 170
    for ln in title.split("\n"):
        d.text((62, y), ln, font=f(54, True), fill=INK); y += 72
    y += 12
    for ln in sub.split("\n"):
        d.text((62, y), ln, font=f(25), fill=MUTED); y += 38

    d.line([(62, H - 92), (W - 62, H - 92)], fill=LINE, width=2)
    d.text((62, H - 74), "ttangstudy.com", font=f(28, True), fill=PRIMARY)
    t = "경기북부 토지 투자 아카데미"
    wd, _ = tw(d, t, f(21))
    d.text((W - wd - 62, H - 70), t, font=f(21), fill=MUTED)
    return im, name


OG_SPECS = [
    ("도로·맹지 법령 가이드", "건축법이 말하는 '도로'와 접도 요건\n4m와 2m가 어느 조문의 숫자인지부터",
     "맹지·도로", "og-guide-doro-maengji.png"),
    ("산지·농지 법령 가이드", "보전/준보전산지의 갈림, 전용허가 기준\n대체산림자원조성비와 농취증",
     "임야·농지", "og-guide-sanji-nongji.png"),
    ("지구단위계획·실시계획인가", "사업이 어느 단계에 왔는지\n그리고 수용권이 언제 생기는지",
     "용도·계획", "og-guide-gyehoek-inga.png"),
    ("권리·계약 법령 가이드", "등기사항증명서 읽는 법, 공유지분의 한계\n특약으로 못 넘는 선",
     "권리·계약", "og-guide-gwolli-gyeyak.png"),
    ("토지보상 가이드", "대토보상·협의양도인택지·현금청산\n이름이 비슷한 제도들을 갈라놓기",
     "토지보상", "og-guide-bosang-cheongsan.png"),
    ("맹지·접도 요건 판정기", "건축법 제2조 제11호와 제44조 제1항으로\n이 땅의 건축 가능성을 1차 판정",
     "도구", "og-tool-maengji.png"),
    ("대체산림자원조성비 계산기", "2026년 산림청고시 단가로 계산합니다\n감면 항목과 공시지가 가산까지",
     "도구", "og-tool-sallim.png"),
    ("랜드 마스터 프로", "토지 법령을 조문 단위로 확인하는 곳\n퀴즈 25개 · 실전 사례 17건 · 판정기",
     "토지 공부", "og-default.png"),
]


def main():
    os.makedirs(OUT, exist_ok=True)
    made = []
    for fn in DIAGRAMS:
        im, name = fn()
        im.save(os.path.join(OUT, name), optimize=True)
        made.append((name, im.size))
    for title, sub, badge, name in OG_SPECS:
        im, nm = og_image(title, sub, badge, name)
        im.save(os.path.join(OUT, nm), optimize=True)
        made.append((nm, im.size))
    for n, s in made:
        p = os.path.join(OUT, n)
        print("  %-42s %dx%d  %5.1fKB" % (n, s[0], s[1], os.path.getsize(p) / 1024))
    print("총 %d장 → %s" % (len(made), OUT))


if __name__ == "__main__":
    main()
