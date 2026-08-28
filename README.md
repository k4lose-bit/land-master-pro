# Land Master Pro — 운영 가이드

경기북부 토지 투자 학습 사이트. 아래 순서대로 진행하면 완성됩니다.
지금까지는 콘텐츠·구조·퀴즈·공고 수집기·회원제 커뮤니티 뼈대까지 전부 완성된 상태이고,
아래 4단계만 본인 권한(도메인 DNS, 구글 계정, 이메일 인증)으로 직접 진행하면 됩니다.

## 지금 상태로 되는 것 / 안 되는 것

- ✅ 25개 관문 전체 콘텐츠, 정답/오답을 실제로 판정하는 퀴즈, XP·레벨·진행도 저장(브라우저별)
- ✅ 모바일 화면 정상 작동 (기존 사이트는 스마트폰에서 깨졌음)
- ✅ 공고 와처 — 지금은 각 기관 공식 게시판 링크만 표시(정직한 상태). 크롤러 설정 시 자동 갱신
- ✅ 커뮤니티 — Supabase 연결 전까지는 "준비 중" 안내만 표시(가짜 데이터 없음). 연결 즉시 실사용 가능
- ⛔ 애드센스 광고 — 코드는 심어뒀지만 `ADSENSE_ENABLED: false`로 꺼둔 상태 (아래 4단계 참고)
- ⛔ 실제 도메인 연결 — 로컬 파일로는 열리지만 인터넷 주소가 아직 없음

## 1단계. 배포 (무료, 10분)

정적 파일이라 아무 무료 호스팅이나 가능합니다. GitHub Pages 기준:

1. GitHub에서 새 저장소 생성 (예: `land-master-pro`)
2. 이 `site` 폴더 안의 내용 전체를 저장소에 업로드(그대로 커밋)
3. 저장소 Settings → Pages → Branch를 `main`, 폴더를 `/ (root)`로 설정 → Save
4. 몇 분 후 `https://<계정명>.github.io/land-master-pro/`로 접속되면 성공

> `CNAME` 파일에 `land.free336.com`이 이미 들어 있어, 2단계에서 DNS만 연결하면 바로 그 주소로 열립니다.

## 2단계. free336.com 서브도메인 연결

free336.com을 등록한 곳(가비아, 카페24 등)의 DNS 관리 화면에서:

- 레코드 타입: `CNAME`
- 호스트: `land`
- 값(대상): `<계정명>.github.io`

저장 후 몇 분~몇 시간 내 `land.free336.com`으로 접속되면 완료. (GitHub Pages 대신 Cloudflare Pages를 쓴다면 그쪽이 안내하는 CNAME 대상으로 넣으면 됩니다.)

## 3단계. 회원제 커뮤니티 켜기 (Supabase, 무료)

1. [supabase.com](https://supabase.com) 가입 → New Project 생성 (비밀번호는 잘 보관)
2. 왼쪽 메뉴 **SQL Editor** → 이 폴더의 `supabase_schema.sql` 내용 전체를 붙여넣고 Run
   (게시글·댓글 테이블과 "본인 글만 삭제 가능" 보안 규칙이 한 번에 만들어집니다)
3. 왼쪽 메뉴 **Project Settings → API** 에서 `Project URL`과 `anon public` 키를 복사
4. `assets/config.js` 파일을 열어 다음 두 줄을 채우고 저장 후 다시 배포(재커밋)

   ```js
   SUPABASE_URL: "복사한 Project URL",
   SUPABASE_ANON_KEY: "복사한 anon public 키",
   ```

5. Supabase 대시보드 **Authentication → Providers → Email**에서 "Confirm email"을 켜 둘지 결정
   (켜두면 가입 시 메일 인증 필요 — 스팸 가입 방지에 도움)

이후 사이트의 `community.html`에서 회원가입·로그인·글쓰기·댓글이 바로 작동합니다.
운영자가 특정 글을 지우고 싶으면 Supabase 대시보드의 Table Editor에서 직접 삭제하면 됩니다.

## 4단계. 애드센스 광고 켜기 (콘텐츠가 어느 정도 쌓인 뒤)

**순서를 지키는 것이 중요합니다.** 지금 바로 켜지 말고, 아래 조건이 되면 켜세요.

- [ ] 1~3단계 완료 (실제 도메인으로 접속 가능)
- [ ] 최소 몇 주간 실제로 운영되어 검색엔진에 페이지가 인식된 상태
- [ ] 공고 와처(크롤러) 또는 커뮤니티 중 하나는 실제로 살아있는 콘텐츠가 쌓인 상태

준비되면 `assets/config.js`에서 한 줄만 바꾸면 됩니다.

```js
ADSENSE_ENABLED: true,
```

`ADSENSE_CLIENT`에는 이미 `adsense_id.txt`에서 가져온 게시자 ID(`ca-pub-9999663397461979`)가
들어가 있습니다. free336.com이 이미 승인된 계정이므로 서브도메인은 별도 심사 없이 광고가
게재됩니다(단, Google 정책은 언제든 바뀔 수 있으니 AdSense 대시보드에서 사이트가 "준비됨"으로
표시되는지 한 번 확인하세요). 재커밋해서 배포하면 다음 방문부터 자동광고가 나타납니다.

## 5단계 (선택). 공고 와처를 실제 자동 수집으로 전환

`crawler/` 폴더에 이미 수집기 코드가 있습니다.

1. `crawler/sources.json`을 열어 각 지자체의 실제 "고시공고" 게시판 URL로 교체
   (지금 들어있는 URL은 예시이며, 지자체 홈페이지 개편이 잦아 직접 최신 주소로 바꿔야 합니다.
   방법: 해당 시청 홈페이지 → 고시공고 메뉴 → 주소창 URL 복사)
2. 로컬에서 테스트: `pip install requests beautifulsoup4` 후 `python crawler/collect_notices.py`
   → `data/notices.json`이 갱신되면 성공
3. GitHub 저장소로 배포했다면 `.github/workflows/update-notices.yml`이 이미 들어있어
   **매일 아침 6시 30분(KST) 자동 실행**됩니다. 별도 설정 불필요.
4. 특정 지자체 게시판에서 수집이 안 되면(사이트 구조 변경 등) 그 출처만 건너뛰고 나머지는
   계속 수집되도록 만들어져 있습니다. 콘솔 로그(Actions 탭 → 실행 기록)에서 실패 원인 확인 가능.

이 단계는 기술적 유지보수가 필요해서 마지막으로 미뤄도 되는 부분입니다.
켜지 않아도 공고 페이지는 공식 게시판 링크 모음으로 정상 작동합니다.

## 콘텐츠 수정 방법

`content_stage12.py`, `content_stage345.py` (프로젝트 최상위 폴더, site 밖에 있음)에
스테이지별 텍스트가 들어 있습니다. 문구를 고친 뒤:

```
python build_site.py
```

를 실행하면 `site/` 폴더의 HTML이 전부 다시 생성됩니다. 디자인(`assets/style.css`)이나
동작 로직(`assets/app.js`)은 site 폴더 안에서 직접 수정하면 됩니다.

## 파일 구조 요약

```
site/
├── index.html, stage1~5.html, notices.html, guide.html, community.html
├── about.html, privacy.html          ← 애드센스 필수 페이지
├── assets/
│   ├── config.js                     ← 설정은 이 파일 하나만 고치면 됨
│   ├── style.css, app.js             ← 공통 디자인 · 퀴즈/XP 엔진
│   ├── notices.js, community.js      ← 공고 와처 · 커뮤니티 로직
├── crawler/
│   ├── collect_notices.py, sources.json
├── data/notices.json                 ← 공고 데이터 (크롤러가 갱신)
├── .github/workflows/update-notices.yml  ← 자동 수집 스케줄
├── supabase_schema.sql               ← 커뮤니티 DB 설정 SQL
├── CNAME, robots.txt, sitemap.xml
```
