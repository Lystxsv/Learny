/**
 * Ejemplo para más adelante (Cloudflare Worker / Vercel / Firebase).
 * Despliégalo aparte y NUNCA pongas GEMINI_API_KEY en el navegador.
 *
 * Uso: en Learny, deja la clave vacía y apunta las llamadas a /api/tutor
 * cuando conectes este proxy.
 */
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('Método no permitido', { status: 405 });
    const { prompt } = await request.json();
    const text = String(prompt || '').replace(/\s+/g, ' ').trim().slice(0, 3500);
    if (!text) return Response.json({ error: 'Pregunta vacía' }, { status: 400 });
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ parts: [{ text }] }] })
    });
    return new Response(await response.text(), { status: response.status, headers: { 'Content-Type': 'application/json' } });
  }
};
