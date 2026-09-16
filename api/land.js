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

    // 대화 내역 포맷팅
    const contents = incomingMessages
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.content || m.message || '').trim() }]
      }))
      .filter((c) => c.parts[0].text.length > 0);

    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: '토지 용어 안내' }] });
    }

    // gemini-1.5-flash-latest 모델 엔드포인트 호출
    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:streamGenerateContent?alt=sse';

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
              text: '당신은 대한민국 토지 실무, 공법, 인허가 전문 AI 어시스턴트입니다. 불필요한 서두나 인사말 없이 질문한 내용의 핵심과 실무상 주의사항만 간결하고 명확하게 답변하세요.'
            }
          ]
        },
        generationConfig: {
          temperature: 0.3
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

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const jsonStr = trimmed.slice(6);

        try {
          const parsed = JSON.parse(jsonStr);
          const chunkText = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (chunkText) {
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
          }
        } catch (e) {}
      }
    }

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
