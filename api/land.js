export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
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
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    let userQuery = '';
    if (Array.isArray(body.messages) && body.messages.length > 0) {
      const lastMsg = body.messages[body.messages.length - 1];
      userQuery = lastMsg.content || lastMsg.message || '';
    } else {
      userQuery = body.message || body.query || body.prompt || body.q || '';
    }

    if (!userQuery) userQuery = '토지 용어 문의';

    const fullAnswer = `문의하신 "${userQuery}"에 대한 안내입니다.\n\n맹지(盲地)란 공도(도로)와 맞닿은 부분이 전혀 없는 토지를 뜻합니다. 건축법상 도로 접도 요건을 갖추지 못하면 건축허가가 제한되므로, 진입로 개설을 위한 사도 개설 허가나 인접 토지 사용승낙서 확보 가능 여부를 필히 점검해야 합니다.`;

    // 스트리밍 응답(SSE) 헤더 설정
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    // OpenAI 호환 SSE 스트리밍 데이터 전송
    const payload = {
      choices: [
        {
          delta: {
            content: fullAnswer
          },
          message: {
            content: fullAnswer
          }
        }
      ]
    };

    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    return res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}
