export default async function handler(req, res) {
  // 1. CORS 허용 헤더 설정 (ttangstudy.com 허용)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 프리플라이트 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: '질문 내용이 없습니다.' });
    }

    // 기본 응답 예시 (추후 OpenAI/Gemini API 연동 가능)
    return res.status(200).json({
      reply: `문의하신 "${message}"에 대한 토지 안내입니다. 현재 토지마스터 라운지 AI 서비스가 정상 연결되었습니다.`
    });
  } catch (err) {
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}
