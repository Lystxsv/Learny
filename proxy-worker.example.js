/**
 * Proxy de ejemplo para Learny (Cloudflare Worker).
 * Mantiene la clave de Gemini en el servidor: NUNCA la pongas en el navegador.
 *
 * Despliegue (Cloudflare):
 *   1. wrangler secret put GEMINI_API_KEY
 *   2. Variable ALLOWED_ORIGIN = https://TU-USUARIO.github.io   (sin barra final).
 *      Admite varios orígenes separados por comas, p. ej. para probar en local:
 *      https://TU-USUARIO.github.io,http://localhost:8000
 *   3. Opcional: MODEL = gemini-flash-latest
 *   4. Recomendado: crea un binding "RATE_LIMITER" (Workers Rate Limiting) para limitar el uso por IP.
 *   5. Copia la URL del Worker en Learny → Ajustes ⚙️ → "URL de tu proxy".
 *
 * IMPORTANTE: la comprobación de Origin solo frena a otras páginas web; cualquier script
 * fuera de un navegador puede falsificar ese encabezado. Por eso el límite de uso (RATE_LIMITER
 * o, mejor, una regla de Cloudflare) es lo que protege tu cuota. Abrir Learny con doble clic
 * (file://) envía Origin "null" y será rechazado: usa localhost o https.
 *
 * Contrato: POST { "prompt": "..." }  →  respuesta JSON de Gemini (generateContent).
 */
const MAX_BODY = 24000;     // bytes aceptados
const MAX_PROMPT = 9000;    // caracteres enviados a Gemini (igual que Learny)
const hits = new Map();     // límite de reserva por IP (por instancia; no sustituye a RATE_LIMITER)

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const allowedList = String(env.ALLOWED_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
    const allowed = allowedList.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': allowed ? origin : 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };
    const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors } });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: { message: 'Método no permitido' } }, 405);
    if (!allowed) return json({ error: { message: 'Origen no permitido' } }, 403);
    if (!env.GEMINI_API_KEY) return json({ error: { message: 'El proxy no tiene GEMINI_API_KEY configurada' } }, 500);

    const ip = request.headers.get('CF-Connecting-IP') || 'desconocida';
    if (env.RATE_LIMITER) {
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      if (!success) return json({ error: { message: 'Demasiadas consultas. Espera un momento.' } }, 429);
    } else {
      const now = Date.now(), recent = (hits.get(ip) || []).filter((t) => now - t < 60000);
      if (recent.length >= 20) return json({ error: { message: 'Demasiadas consultas. Espera un momento.' } }, 429);
      recent.push(now); hits.set(ip, recent);
      if (hits.size > 5000) hits.clear();
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ error: { message: 'Solicitud demasiado grande' } }, 413);
    let payload;
    try { payload = JSON.parse(raw); } catch { return json({ error: { message: 'JSON inválido' } }, 400); }

    // Conserva los saltos de línea del prompt (importan para las instrucciones por bloques).
    const text = String(payload?.prompt || '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, MAX_PROMPT);
    if (!text) return json({ error: { message: 'Pregunta vacía' } }, 400);

    const model = encodeURIComponent(env.MODEL || 'gemini-flash-latest');
    let upstream;
    try {
      upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text }] }], generationConfig: { maxOutputTokens: 4096 } })
      });
    } catch {
      return json({ error: { message: 'No se pudo contactar con Gemini' } }, 502);
    }
    return new Response(await upstream.text(), { status: upstream.status, headers: { 'Content-Type': 'application/json', ...cors } });
  }
};
