/**
 * Proxy de ejemplo para Learny (Cloudflare Worker).
 * Mantiene la clave de Gemini en el servidor: NUNCA la pongas en el navegador.
 *
 * Despliegue (Cloudflare):
 *   1. wrangler secret put GEMINI_API_KEY
 *   2. Variable ALLOWED_ORIGIN = https://TU-USUARIO.github.io   (sin barra final)
 *   3. Opcional: MODEL = gemini-flash-latest
 *   4. Copia la URL del Worker en Learny → Ajustes ⚙️ → "URL de tu proxy".
 *      Con proxy activo no hace falta pegar ninguna clave en la app.
 *
 * Contrato: POST { "prompt": "..." }  →  respuesta JSON de Gemini (generateContent).
 */
const MAX_BODY = 8000;      // bytes aceptados
const MAX_PROMPT = 3500;    // caracteres enviados a Gemini

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGIN || '';
    const cors = {
      'Access-Control-Allow-Origin': allowed && origin === allowed ? origin : 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };
    const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors } });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: { message: 'Método no permitido' } }, 405);
    if (!allowed || origin !== allowed) return json({ error: { message: 'Origen no permitido' } }, 403);
    if (!env.GEMINI_API_KEY) return json({ error: { message: 'El proxy no tiene GEMINI_API_KEY configurada' } }, 500);

    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ error: { message: 'Solicitud demasiado grande' } }, 413);
    let payload;
    try { payload = JSON.parse(raw); } catch { return json({ error: { message: 'JSON inválido' } }, 400); }

    const text = String(payload?.prompt || '').replace(/\s+/g, ' ').trim().slice(0, MAX_PROMPT);
    if (!text) return json({ error: { message: 'Pregunta vacía' } }, 400);

    const model = encodeURIComponent(env.MODEL || 'gemini-flash-latest');
    let upstream;
    try {
      upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text }] }], generationConfig: { maxOutputTokens: 1500 } })
      });
    } catch {
      return json({ error: { message: 'No se pudo contactar con Gemini' } }, 502);
    }
    return new Response(await upstream.text(), { status: upstream.status, headers: { 'Content-Type': 'application/json', ...cors } });
  }
};
