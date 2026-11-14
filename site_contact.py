# -*- coding: utf-8 -*-
"""사이트에 표시되는 운영자 연락처.

about.html / privacy.html 의 문의 주소. 2026-11-14에 build_site.py 에서
이 파일로 분리했다(코드와 연락처를 섞어 두지 않기 위함).
주소를 바꿀 때는 이 파일만 고치고 `python build_site.py` 를 다시 실행하면 된다.
환경변수 SITE_CONTACT_EMAIL 이 설정되어 있으면 그 값이 우선한다.
"""
import os

CONTACT_EMAIL = os.environ.get(
    "SITE_CONTACT_EMAIL",
    "free336.adsens.2025" + "@" + "gmail.com",
)
