export const config = {
  supportsResponseStreaming: true,
};

export default async function handler(req, res) {
  // 1. CORS 헤더 명시
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
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
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

    if (!userQuery) userQuery = '맹지';

    const answer = `문의하신 "${userQuery}"에 대한 안내입니다.\n\n맹지(盲地)는 도로와 맞닿은 부분이 없는 땅을 뜻합니다. 건축허가를 받으려면 도로 개설이나 토지사용승낙서 같은 진입로 요건을 사전에 반드시 확인하셔야 합니다.`;

    // 2. SSE 스트림 헤더
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    // 3. OpenAI 형식 스트리밍 데이터 전송
    const chunkData = {
      choices: [
        {
          delta: { content: answer },
          text: answer
        }
      ]
    };

    res.write(`data: ${JSON.stringify(chunkData)}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    } else {
      res.end();
    }
  }
}
