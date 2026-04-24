/**
 * Cadence — OpenAI Whisper proxy (Vercel Edge Function)
 *
 * What this does:
 *   1. Receives a POST multipart/form-data request from Cadence with an audio blob.
 *   2. Checks the X-Cadence-Access header against the TRIAL_CODES env var.
 *   3. Forwards the form-data to OpenAI's audio/transcriptions endpoint
 *      using the OPENAI_API_KEY stored as an environment variable on Vercel.
 *   4. Returns the transcription to the frontend.
 *
 * Env vars required on Vercel:
 *   - OPENAI_API_KEY   : your OpenAI key (sk-...)
 *   - TRIAL_CODES      : same comma-separated list shared with anthropic.js
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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json({ error: { message: 'Server is missing OPENAI_API_KEY.' } }, 500);
  }

  // Parse the incoming multipart body and re-forward as-is (with model defaulted).
  let formData;
  try { formData = await req.formData(); }
  catch (e) {
    return json({ error: { message: 'Could not parse multipart body: ' + e.message } }, 400);
  }

  if (!formData.get('model')) formData.set('model', 'whisper-1');
  // Safety: cap upload to ~25MB (OpenAI's limit). A 25MB webm is ~25 minutes at 128kbps.
  const file = formData.get('file');
  if (file && typeof file.size === 'number' && file.size > 25 * 1024 * 1024) {
    return json({ error: { message: 'Audio file exceeds 25MB limit.' } }, 413);
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey },
      body: formData
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
