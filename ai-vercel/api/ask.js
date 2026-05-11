// api/ask.js — Vercel Serverless Function (Gemini)
export default async function handler(req, res) {

  const allowedOrigins = [
    'https://ericismyhero.github.io',
    'https://ericismyhero-github-io.vercel.app'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { question, context } = req.body;
  if (!question) return res.status(400).json({ error: 'Missing question' });

  try {
    const prompt = `Sən UNEC (Azərbaycan Dövlət İqtisad Universiteti) üzrə bir köməkçisən.
Yalnız aşağıdakı kontekst əsasında cavab ver. Kontekstdən kənar sualları rədd et.
Kontekst:
${context}
Sual: ${question}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const geminiData = await geminiRes.json();
    console.log('GEMINI RAW:', JSON.stringify(geminiData));

    const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text
      ?? 'Bəzi cuzi maddi sıxıntılar səbəbindən hələlik AI aktiv deyildir.';

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Gemini error:', err);
    return res.status(500).json({ error: 'Server xətası' });
  }
}
