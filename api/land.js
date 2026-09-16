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

    const contents = incomingMessages
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.content || m.message || '').trim() }]
      }))
      .filter((c) => c.parts[0].text.length > 0);

    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: '토지 용어 안내' }] });
    }

    // 끊김 없는 표준 generateContent API 호출
    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent';

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [
            {
              text: '당신은 토지 실무 용어 안내 도우미입니다. 인사말이나 서두, 특수서식(###, ---) 없이, 사용자가 질문한 용어의 핵심 정의와 주의할 점을 2~3문장의 명확하고 온전한 문장단락으로 마침표까지 깔끔하게 설명하세요.'
            }
          ]
        },
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `Gemini API 에러 (${response.status}): `;
      try {
        const errJson = JSON.parse(errText);
        errMsg += errJson.error?.message || errText;
      } catch (e) {
        errMsg += errText;
      }
      return res.status(response.status).json({ error: errMsg });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '답변을 생성하지 못했습니다.';

    // SSE 스트림 포맷으로 완성된 텍스트 전체를 안전하게 전송
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
