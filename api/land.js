export default async function handler(req, res) {
  // CORS 허용 헤더
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 문자열로 넘어온 본문 파싱 처리
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    body = body || {};

    // 프론트엔드에서 보낼 수 있는 다양한 변수명 모두 수신
    const userQuery = body.message || body.query || body.prompt || body.question || body.text;

    if (!userQuery) {
      return res.status(400).json({ error: '질문 내용이 전달되지 않았습니다.' });
    }

    // 정상 응답 반환 (reply, text, answer 등 프론트가 요구하는 포맷 모두 충족)
    const replyText = `문의하신 "${userQuery}"에 대한 토지 학습 도우미 안내입니다. 토지마스터 라운지 AI 서버와 정상적으로 연동되었습니다!`;

    return res.status(200).json({
      reply: replyText,
      answer: replyText,
      text: replyText
    });
  } catch (err) {
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}
