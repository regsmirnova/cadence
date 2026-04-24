/**
 * Cadence — Anthropic proxy (Vercel Edge Function)
 *
 * What this does:
 *   1. Receives a POST request from the Cadence frontend.
 *   2. Checks the X-Cadence-Access header against the TRIAL_CODES env var.
 *   3. Forwards the request body to Anthropic's Messages API using the
 *      ANTHROPIC_API_KEY stored as an environment variable on Vercel.
 *   4. Returns Anthropic's response to the frontend.
 *
 * Why edge runtime:
 *   - Fast cold starts.
 *   - Uses the standard Request / Response Web APIs.
 *   - Runs in Cloudflare-style isolates, so it scales for free.
 *
 * Env vars required on Vercel:
 *   - ANTHROPIC_API_KEY   : your Anthropic key (sk-ant-...)
 *   - TRIAL_CODES         : comma-separated list, e.g. "alex-may,maya-may"
 */

export const config = { runtime: 'edge' };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function validCodes() {
  return (process.env.TRIAL_CODES || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Cadence-Access'
      }
    });
  }

  if (req.method !== 'POST') {
    return json({ error: { message: 'Method not allowed' } }, 405);
  }

  const code = req.headers.get('x-cadence-access');
  const allowed = validCodes();
  if (allowed.length === 0) {
    return json({ error: { message: 'Server has no TRIAL_CODES configured.' } }, 500);
  }
  if (!code || !allowed.includes(code)) {
    return json({ error: { message: 'Invalid or missing access code.' } }, 401);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json({ error: { message: 'Server is missing ANTHROPIC_API_KEY.' } }, 500);
  }

  let body;
  try { body = await req.json(); }
  catch { return json({ error: { message: 'Invalid JSON body.' } }, 400); }

  // Reasonable guardrails — prevent abuse by capping token usage per request.
  if (body && typeof body === 'object') {
    if (typeof body.max_tokens !== 'number' || body.max_tokens > 4000) {
      body.max_tokens = Math.min(body.max_tokens || 2000, 4000);
    }
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return json({ error: { message: 'Proxy upstream error: ' + (e.message || 'unknown') } }, 502);
  }
}
