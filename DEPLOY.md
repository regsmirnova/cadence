# Deploying Cadence to Vercel

This guide walks you through deploying Cadence so you can share it with friends using access codes — without ever exposing your API keys.

At the end, you'll have:
- A public URL like `https://cadence-<something>.vercel.app`
- Your Anthropic + OpenAI keys stored safely on Vercel (not in your code, not in GitHub)
- A list of short access codes you can give to friends
- Spending caps on both providers so nobody can accidentally burn through your credit

Estimated time: **25–40 minutes**.

---

## Prerequisites

Before starting, make sure you have:
- A GitHub account with a repo containing this project (let's assume it's called `cadence`)
- An Anthropic API key (starts with `sk-ant-…`)
- An OpenAI API key (starts with `sk-…`)
- A credit card for Anthropic, OpenAI, and Vercel (Vercel's free tier will almost certainly cover you — no charges expected)

---

## Part 1 — Push the new files to GitHub

The project now contains three new files that need to be on GitHub before Vercel can deploy them:

```
api/anthropic.js      ← serverless proxy for the Anthropic Messages API
api/whisper.js        ← serverless proxy for OpenAI Whisper
vercel.json           ← Vercel config (clean URLs)
```

Plus the updated `index.html` (access-code field in Settings, proxy routing).

From your project folder in the terminal:

```bash
git add api/ vercel.json index.html DEPLOY.md
git commit -m "Add Vercel serverless proxy + access code auth"
git push
```

Confirm on github.com that the `api/` folder and `vercel.json` are now visible in the repo.

---

## Part 2 — Create a Vercel account

1. Go to **https://vercel.com/signup**
2. Click **Continue with GitHub** (this is the easiest path — Vercel can then see your repos)
3. Authorise Vercel to access your GitHub account
4. When asked to pick a plan, choose **Hobby** (free — it's plenty for this)
5. Vercel may ask you to create a "team" — just accept the default personal team it suggests

---

## Part 3 — Import the `cadence` repo

1. From the Vercel dashboard, click **Add New… → Project**
2. You'll see a list of your GitHub repos. Find `cadence` and click **Import**
3. On the "Configure Project" screen:
   - **Framework Preset:** `Other` (Vercel should auto-detect this — no build step needed for a static HTML file)
   - **Root Directory:** leave as `./`
   - **Build and Output Settings:** leave all defaults
   - **Environment Variables:** **skip for now** — we'll add them in the next step and redeploy
4. Click **Deploy**

Vercel will take ~30 seconds to build. When it's done, you'll see a confetti animation and a URL like `https://cadence-abc123.vercel.app`.

**Important:** the app will be broken at this point (the proxy has no keys yet). Don't worry — that's what Part 4 fixes.

---

## Part 4 — Add your API keys as environment variables

This is the critical step. Your keys live on Vercel as **environment variables** — they are never in your code, never in GitHub, and never sent to the browser.

1. In Vercel, open your `cadence` project
2. Go to **Settings → Environment Variables** (left sidebar)
3. Add three variables:

| Name | Value | Environments |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-…` (your Anthropic key) | Production, Preview, Development |
| `OPENAI_API_KEY` | `sk-…` (your OpenAI key) | Production, Preview, Development |
| `TRIAL_CODES` | `alex-may-2026,maya-may-2026,regina-test` | Production, Preview, Development |

For each one:
- Paste the **Name** exactly as shown (case-sensitive)
- Paste the **Value**
- Tick all three environment boxes (Production, Preview, Development)
- Click **Save**

**About `TRIAL_CODES`:** This is a comma-separated list of the access codes you'll hand out. Each person gets one. I'd suggest using a format like `firstname-month-year` so you can remember who has which. No spaces, no quotes. Example:

```
alex-may-2026,maya-may-2026,jordan-may-2026,regina-test
```

4. After saving all three, go back to the **Deployments** tab
5. Click the **⋯** menu on the latest deployment and choose **Redeploy** → **Redeploy** again
6. Wait ~30 seconds for the redeploy to finish

Now the serverless proxy has your keys and will accept requests from anyone with a valid access code.

---

## Part 5 — Test it yourself

1. Open your Vercel URL in a browser (e.g. `https://cadence-abc123.vercel.app`)
2. Click the **Settings** gear icon
3. In the **Access code** field, paste one of your trial codes (e.g. `regina-test`)
4. Leave the "Advanced — use your own API keys" section collapsed
5. Save settings
6. Do a short Today session — record the impromptu speech and submit
7. You should see Whisper transcribe cleanly and Anthropic feedback arrive

If it works, you're done. If it doesn't, skip to **Troubleshooting** below.

---

## Part 6 — Share with friends

For each friend:
1. Send them **the Vercel URL** (e.g. `https://cadence-abc123.vercel.app`)
2. Send them **one access code** from your `TRIAL_CODES` list
3. Tell them: "Open the URL, click Settings, paste this access code in the top field, and save"

That's it — they never see your keys, and you can revoke their access at any time by removing their code from `TRIAL_CODES` and redeploying.

To revoke or add codes later:
1. Vercel → your project → **Settings → Environment Variables**
2. Edit `TRIAL_CODES`
3. Click **Save**
4. Go to **Deployments** → **Redeploy** the latest one

---

## Part 7 — Set spending caps (do this before sharing!)

This is your safety net. Without it, a bug or abuse could in theory run up a large bill. With it, the API just stops working once the limit is hit.

### OpenAI (Whisper)

1. Go to **https://platform.openai.com/settings/organization/limits**
2. Under **Usage limits**, set:
   - **Hard limit:** `$15` (or whatever you're comfortable losing)
   - **Soft limit:** `$10` — you'll get an email warning at this point
3. Click **Save**

Whisper costs $0.006/minute, so even a $15 hard cap is ~40 hours of audio. Generous for a handful of testers.

### Anthropic

1. Go to **https://console.anthropic.com/settings/limits** (or **Billing → Usage limits**)
2. Set a **monthly spend limit** — `$20` is plenty for testing with a few friends
3. Save

Anthropic also shows you a real-time usage graph — worth bookmarking for the first week while you watch usage patterns.

### Vercel

Vercel's Hobby tier is free. There's effectively nothing to cap — if your friends hammer the app so hard you run into Vercel's limits (100 GB bandwidth/month), Vercel will just start rate-limiting, not bill you. If you want to be extra safe, you can set a **Spend Management** limit in Vercel **Settings → Billing**, but it's not necessary for a few test users.

---

## Part 8 — Future changes (your day-to-day flow)

Once this is set up, pushing new features to your friends is just:

```bash
# edit index.html locally
git add index.html
git commit -m "describe what changed"
git push
```

Vercel automatically detects the push and redeploys within ~30 seconds. Your friends will see the updated app on their next refresh. No email, no download, no reinstall.

---

## Troubleshooting

**"Invalid or missing access code" error**
- Check that you typed the code exactly as it appears in `TRIAL_CODES` (case-sensitive, no spaces)
- Make sure you redeployed after changing `TRIAL_CODES` — env var changes don't apply until the next deploy

**"Server is missing OPENAI_API_KEY" or similar**
- Go to Vercel → Settings → Environment Variables
- Confirm the variable exists and is ticked for Production
- Redeploy after any change

**Vercel build fails**
- Check the build logs in Vercel
- Most common issue: a typo in one of the JS files. Run `node --check api/anthropic.js` locally to check

**Friend says "I entered the code but nothing happens"**
- Ask them to open the browser console (right-click → Inspect → Console) and look for red errors
- Common issues: they're on an old browser without MediaRecorder support, or they denied microphone permission

**You want to roll back a broken deploy**
- Vercel → Deployments → find the last good deploy → **⋯ → Promote to Production**
- Instant rollback, no git needed

---

## What changed in the code (reference)

If you want to understand what's happening under the hood:

- **`api/anthropic.js`** — runs on Vercel's edge network. Receives POST requests from Cadence, checks the `X-Cadence-Access` header against `TRIAL_CODES`, then forwards the body to `https://api.anthropic.com/v1/messages` using the `ANTHROPIC_API_KEY` env var.
- **`api/whisper.js`** — same pattern but for OpenAI's `/v1/audio/transcriptions` endpoint. Also caps uploads at 25 MB (OpenAI's limit).
- **`index.html`** — the `callAnthropic` and `transcribeWithWhisper` functions now check if an access code is set in Settings. If yes, they call `/api/anthropic` and `/api/whisper` with the code. If no, they fall back to the direct API calls with the user's own keys (the "Advanced" section in Settings).

This means **you** can keep using Cadence with your own keys for development, while **friends** use the access code path without ever seeing your keys.

---

## Next steps (when you're ready to take it further)

Once a few friends have tested and you're happy with how it works, the natural next steps are:

1. **Real auth** — swap the simple access-code list for Clerk or Supabase Auth so users can sign up with email
2. **Database** — add Supabase Postgres to store per-user trial start dates, usage counts, and subscription status
3. **Stripe** — add Stripe Checkout with a 7-day free trial and $10/month recurring charge
4. **Usage caps per user** — limit each trial user to e.g. 10 sessions so the free trial has a natural ceiling

All of this builds on top of what you set up here today — you won't need to throw any of it away.
