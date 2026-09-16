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

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    const incomingMessages = Array.isArray(body.messages) ? body.messages : [];

    // 가장 최근 사용자 질문 1개만 추출하여 속도 극대화
    const lastUserMsg = incomingMessages
      .slice()
      .reverse()
      .find((m) => m.role === 'user');

    const promptText = String(lastUserMsg?.content || lastUserMsg?.message || '토지 용어 안내').trim();

    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent';

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: promptText }]
          }
        ],
        systemInstruction: {
          parts: [
            {
              text: '토지 용어 안내 챗봇입니다. 서두나 특수기호 없이 핵심 정의와 실무 주의점을 완결된 2~3문장으로 짧고 명료하게 마침표까지 답변하세요.'
            }
          ]
        },
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 300,
          thinkingConfig: {
            thinkingBudget: 0 // 사고(생각) 시간 비활성화로 1초 컷 응답
          }
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Gemini API 에러: ${errText}` });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '답변을 생성하지 못했습니다.';

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    });

    res.write(`data: ${JSON.stringify({ text: replyText })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: `서버 내부 오류: ${err.message}` });
    } else {
      res.end();
    }
  }
}
