export default async function handler(req, res) {
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
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    body = body || {};

    let userQuery = '';

    // 프론트엔드가 보낸 messages 배열에서 질문 추출
    if (Array.isArray(body.messages) && body.messages.length > 0) {
      const lastMsg = body.messages[body.messages.length - 1];
      userQuery = lastMsg.content || lastMsg.message || '';
    } else {
      userQuery = body.message || body.query || body.prompt || body.q || '';
    }

    if (!userQuery) {
      userQuery = '토지 용어 문의';
    }

    // 기본 안내 및 응답
    const replyText = `문의하신 "${userQuery}"에 대한 안내입니다.\n\n맹지(盲地)란 공도(도로)와 직접 맞닿은 부분이 없는 토지를 말합니다. 진입로가 확보되지 않으면 원칙적으로 건축허가가 나지 않으므로, 진입로 확보 가능 여부나 도로점용·토지사용승낙서 요건을 반드시 확인해야 합니다.`;

    return res.status(200).json({
      reply: replyText,
      answer: replyText,
      text: replyText,
      message: replyText
    });
  } catch (err) {
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}
