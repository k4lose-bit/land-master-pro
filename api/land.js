export const config = {
  supportsResponseStreaming: true,
};

export default async function handler(req, res) {
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

    // 불필요한 서두 없이 본문만 즉시 구성
    const answer = `맹지(盲地)는 지적도상 공도(공공도로)에 직접 접하지 않은 토지를 뜻합니다.\n\n건축법상 진입도로 요건을 갖추지 못하면 원칙적으로 건축허가가 나지 않으므로, 인접 토지 소유자의 토지사용승낙서 확보나 사도 개설 가능 여부를 사전에 면밀히 확인해야 합니다.`;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    res.write(`data: ${JSON.stringify({ text: answer })}\n\n`);
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
