# CLAUDE.md — Cadence project context

**Read this file first at the start of every new task.** It exists so you (a fresh Claude) can get up to speed in 60 seconds without the user re-explaining everything.

---

## What Cadence is

Cadence is a personal voice and public-speaking training web app. A user does a daily ~10-minute session: breath warmup → tongue twister → actor-style vocal warmup → impromptu speech with Anthropic-generated feedback. Recordings are saved to IndexedDB and tracked over time on a Progress tab with a benchmark comparison feature.

Built and owned by **Regina Smirnova** (regina.smirnova@gmail.com). She's non-technical — treat her as a capable product-minded collaborator, not a developer. Explain trade-offs simply, offer concrete steps, and don't assume familiarity with terminal, git, or deployment mechanics.

---

## Tech stack

- **Frontend:** Single-file `index.html` — vanilla JS, no build step, no framework. Everything is in one file: HTML, CSS, JS.
- **Storage:** IndexedDB for audio blobs, localStorage for settings/plan state.
- **Recording:** Web MediaRecorder + Web Speech API for live interim transcripts.
- **Transcription (authoritative):** OpenAI Whisper — runs automatically after every recording, replaces the live transcript.
- **Feedback:** Anthropic Messages API (claude-sonnet-4-5 with fallback chain to claude-haiku-4-5 / claude-3-5-sonnet-latest / claude-3-5-haiku-latest).
- **Hosting:** GitHub repo → Vercel (auto-deploys on push to main). Vercel runs two edge functions in `/api` as the backend proxy.
- **Design system:** Inter for UI, Instrument Serif for display. Monochrome palette with one accent `--accent-bm: #B8552F` (terracotta) reserved for benchmark recordings.

---

## File structure

```
cadence/
├── index.html          ← The entire app (single file)
├── api/
│   ├── anthropic.js    ← Vercel edge function, proxies Anthropic
│   └── whisper.js      ← Vercel edge function, proxies OpenAI Whisper
├── vercel.json         ← Vercel config (cleanUrls: true)
├── DEPLOY.md           ← User-facing Vercel deployment walkthrough
├── ROADMAP.md          ← Product roadmap notes
└── CLAUDE.md           ← This file
```

---

## Architecture: the proxy pattern

This is the single most important thing to understand. Regina shares the app with friends via short access codes. She must never expose her API keys to them.

**How it works:**
1. User enters an **access code** in Settings (e.g. `alex-may-2026`).
2. Frontend sends requests to `/api/anthropic` or `/api/whisper` with header `X-Cadence-Access: <code>`.
3. The Vercel edge function checks the code against the `TRIAL_CODES` env var (comma-separated allowlist).
4. If valid, the edge function forwards the request to Anthropic/OpenAI using the real API key (stored as `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` env vars on Vercel).
5. The response streams back to the frontend.

**Fallback path:** If no access code is set, the frontend falls back to direct API calls using the user's own keys from the "Advanced" section in Settings. Regina uses this path herself for local dev.

**Env vars on Vercel:**
- `ANTHROPIC_API_KEY` — Regina's Anthropic key
- `OPENAI_API_KEY` — Regina's OpenAI key
- `TRIAL_CODES` — e.g. `alex-may-2026,maya-may-2026,regina-test`

Editing `TRIAL_CODES` requires a Vercel redeploy before the change takes effect. This is a known limitation of Phase 1 (no real database yet).

---

## Key code locations inside index.html

- `state.settings` — defaults include `accessCode`, `anthropicKey`, `openaiKey`, `provider`, `name`.
- `transcribeWithWhisper(blob)` — routes to `/api/whisper` when `accessCode` is set, direct to OpenAI otherwise.
- `autoTranscribe(prefix, blob, liveInfo)` — runs Whisper right after recording stops, replaces the textarea with its result.
- `callAnthropic(userPrompt)` — routes to `/api/anthropic` when `accessCode` is set; has specific 401 handling for bad access code vs bad API key.
- `getFeedback(...)` — always uses `callAnthropic` when `accessCode` is set, bypassing any OpenAI feedback path.
- `ensureTodayPlan()` — sets up `state.todayPlan` with today's twister + prompt + per-exercise done flags (`warmupDone`, `twisterDone`, `vocalDone`, `feedback`).
- Settings modal has an **Access code** field up top and a collapsible `<details>` "Advanced — use your own API keys" section below.
- Progress tab: benchmark recordings get `.bm-row.is-benchmark` class (terracotta left stripe + tinted background); each row has a delete button that confirms then calls `DB.del(id)`.

---

## Today session flow (4 exercises)

1. **Breath & warm-up** — guided breathing (no recording)
2. **Tongue twister** — read aloud at three speeds (no recording, just practice)
3. **Voice warm-up** — 4 actor-style steps: unclench/release (25s), lip trills (35s), humming siren (35s), vowel resonance (25s). No recording.
4. **Impromptu speech** — records, auto-Whisper, Anthropic feedback.

Only exercise 4 records audio. This is intentional — Regina removed the tongue twister recording because it wasn't useful.

---

## Current state (as of April 2026)

**Done:**
- Single-file app with 4-exercise Today flow
- Progress tab with delete + benchmark color-coding
- Whisper auto-transcription after every recording
- Settings modal with access code + collapsible Advanced section
- Vercel serverless proxy (`/api/anthropic`, `/api/whisper`)
- DEPLOY.md walkthrough

**User's current task:**
- Switching Cowork workspace from `Voice trainer` to `cadence` so edits flow directly into her git repo
- Pushing the proxy files to GitHub via GitHub Desktop
- Deploying to Vercel and setting up env vars
- Sharing access codes with friends to beta test

**Next up (Phase 2+):** Real auth (Clerk or Supabase), Supabase Postgres for users/usage, Stripe Checkout with 7-day trial → $10/month. Not started. See ROADMAP.md.

---

## Conventions & style

- Single file — do NOT split index.html into separate CSS/JS files without explicit ask.
- CSS uses custom properties on `:root` (`--ink`, `--muted`, `--line`, `--accent-bm`, etc.). Reuse these instead of hardcoding colors.
- Font stack: `'Inter', system-ui, sans-serif` for UI, `'Instrument Serif', Georgia, serif` for display headings.
- Monochrome palette. The only accent is `--accent-bm` and it's reserved for benchmarks — don't introduce new accent colors casually.
- `$()` is a jQuery-like `querySelector` helper defined at the top of the script. `$$()` is `querySelectorAll`. Don't pull in real jQuery.
- No build step. No npm. No Tailwind. Everything must run by opening index.html in a browser.
- When adding a new exercise or screen, follow the existing pattern: a `section#screen-X` block in HTML + a render function in JS.

---

## Common task patterns

- **"Add a new exercise to Today"** → update `TONGUE_TWISTERS` / `PROMPTS` / etc. arrays, add a done flag on `state.todayPlan`, add a new item to the home today-list array, create a new `#screen-X` section, wire up a render function.
- **"Change the feedback prompt"** → find `getFeedback` / the system prompt inside `callAnthropic` usage.
- **"Change what a recording screen looks like"** → search for the screen ID (e.g. `#screen-speaking`) in the HTML and the `renderSpeaking` / equivalent function in JS.
- **"User reports the proxy is broken"** → check Vercel function logs first, then `TRIAL_CODES` env var, then redeploy status.

---

## What NOT to do

- Don't restructure index.html into a multi-file project.
- Don't introduce a build tool, framework, or package manager.
- Don't commit API keys to the repo — they live only in Vercel env vars.
- Don't suggest features that require a database before Phase 2 ships (no per-user data yet).
- Don't use emojis in output unless Regina explicitly asks.
- Don't over-format chat responses with headers/bullets — Regina prefers conversational prose.

---

## If you're unsure

Ask Regina directly. She'd rather answer one quick clarifying question than see you go off and build the wrong thing. Use the AskUserQuestion tool for underspecified requests.
