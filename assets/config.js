// ============================================================
// Land Master Pro — 사이트 설정 (이 파일 하나만 수정하면 됩니다)
// ============================================================
window.LMP_CONFIG = {

  // 배포 주소 (free336.com의 DNS에서 서브도메인을 연결한 뒤 실제 주소로 변경)
  SITE_URL: "https://land.free336.com",

  // ---------- 구글 애드센스 ----------
  // free336.com 승인 계정의 게시자 ID (adsense_id.txt에서 가져옴)
  ADSENSE_CLIENT: "ca-pub-9999663397461979",
  // 광고 켜기: 콘텐츠가 충분히 채워지고 실제 도메인으로 배포된 뒤 true로 변경.
  // 로컬 파일(file://)이나 빈 페이지 상태에서 광고를 켜면 정책 위반 위험이 있음.
  // 2026-08-31: 도메인 배포 완료 + AdSense 승인 상태(free336.com 하위 서브도메인 자동 커버) 확인되어 활성화.
  ADSENSE_ENABLED: true,

  // ---------- 구글 애널리틱스 4 (GA4) ----------
  // analytics.google.com에서 속성 생성 후 측정 ID(G-XXXXXXXXXX)를 여기에 넣으면
  // 자동으로 방문자 추적이 시작됩니다. 비워두면 아무 코드도 로드되지 않습니다.
  GA_MEASUREMENT_ID: "G-9Z445050C7",

  // ---------- 전면광고(인터스티셜) 임시 슬롯 ----------
  // 스테이지 이동 시 뜨는 전면광고 자리. 실제 애드센스 전면광고 코드가 준비되면
  // 아래를 true로 바꾸고 assets/app.js의 #adSlotBox 안에 실제 광고 코드를 넣으면 된다.
  // 꺼진 상태에서는 사용자에게 전혀 노출되지 않는다 (자리만 미리 잡아둔 상태).
  AD_INTERSTITIAL_ENABLED: false,

  // ---------- 커뮤니티 (Supabase) ----------
  // supabase.com에서 무료 프로젝트 생성 후 아래 두 값을 채우면
  // 회원가입/로그인/글/댓글이 자동으로 작동합니다. (README 3단계 참고)
  SUPABASE_URL: "https://birwnzwkaufeianbwtrq.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_t71D_lRPCye6d1n7FILKAQ_QiijSmad",

  // 관리자 이메일 (커뮤니티에서 관리자 표시용)
  ADMIN_EMAILS: ["free336.adsens.2025@gmail.com"],

  // 문의 이메일 (소개/개인정보처리방침 페이지에 표시)
  CONTACT_EMAIL: "free336.adsens.2025@gmail.com"
};
