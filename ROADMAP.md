# Cadence — Roadmap & Future Ideas

A scratchpad for features we're parking for later.

---

## Voice analysis (parked — revisit later)

**Goal:** Give real feedback on *how* Regina sounds — not just what she says.

### Why deferred
We focused the current feedback version on content (vocabulary, storytelling, persuasiveness) because voice quality analysis requires either extra infrastructure or a more limited first pass. Worth doing well rather than rushing.

### Dimensions worth analyzing

1. **Pace** — words per minute, and crucially, pace *variation* over the speech. Great speakers slow down for emphasis and speed up through context.
2. **Pauses** — strategic pauses (before/after key phrases) vs. hesitation pauses (mid-sentence). Different signals.
3. **Pitch variation** — monotone vs. expressive. Measured via fundamental frequency from FFT.
4. **Loudness variation** — emphasis patterns. Measured via RMS over short windows.
5. **Filler words** — "um," "uh," "like," "you know," "so." Count and rate per minute.
6. **Breath/gasp detection** — audibly short breath signals rushed delivery.

### Technical paths (ranked by effort)

**Option A — Transcript-only proxies (cheapest, weakest)**
- Count fillers from transcript.
- Infer hesitation from repeated words ("I I I think...").
- Rough but useful.

**Option B — Whisper word-level timestamps (moderate effort, strong payoff)**
- Call OpenAI Whisper with `response_format: verbose_json` to get per-word timestamps.
- Compute: WPM across sliding windows, pause distribution, rhythm.
- Feed structured metrics + transcript to Claude for narrative analysis.
- Requires OpenAI API key.

**Option C — In-browser Web Audio API analysis (highest effort, most powerful)**
- Decode the recording's blob into an AudioBuffer.
- Run FFT to extract fundamental frequency over time → pitch curve.
- Run RMS over short windows → loudness curve.
- Detect silences → pauses.
- Compute: monotone index (pitch variance), emphasis distribution, pause count/duration.
- No external APIs needed. Pure client-side.
- Could even render a waveform + pitch overlay on playback.

### Recommended path when we come back to this
Start with **Option C** (in-browser audio analysis) because:
- No extra API costs or keys.
- Gives real objective numbers (pitch variance, pause counts, loudness variation).
- Opens the door to a visual audio timeline in the UI.
- Can be combined with transcript-level fillers for a full picture.

Then feed those numerical metrics into Claude's feedback prompt:
```
VOICE METRICS:
- Pace: 142 WPM (natural range: 130–160)
- Pace variation: low (stdev 12 WPM) — consider varying speed for emphasis
- Pitch variance: medium
- Pauses > 800ms: 3 (strategic), 7 (mid-sentence, likely hesitation)
- Filler words: 4 "um", 2 "like" (6 per 60s — slightly high)
```

Claude can then weave this into qualitative narrative coaching.

### Visual idea
A playback waveform with pitch overlay + markers for each filler word and each long pause. User can click a marker to jump to that moment in their recording. This would be genuinely novel and make the feedback visceral.

---

## Other future features (brainstorm bucket)

### Side-by-side weekly benchmark comparison
When the user has 2+ weekly benchmarks, auto-generate a "what changed" analysis — Claude compares the two transcripts and notes what improved/regressed specifically. Show side-by-side quotes.

### Progress charts
Line charts over time for: vocabulary score, storytelling score, persuasiveness score. Use Recharts or Chart.js.

### Custom speech modes
Mode selector: "Storytelling," "Pitching," "Teaching," "Persuading." Each mode tunes prompts and feedback rubric accordingly.

### Prep mode
Before recording, let user jot down 3 bullet points/outline for what they'll say. Record with outline visible. Feedback includes "how well did you hit the points you planned?"

### Voice warmups library
Expand beyond box breathing. Lip trills, pitch slides, articulation ladders. Short audio demonstrations.

### Notebook integration
After each feedback, let user save the most important tip to a "Tip Notebook" — a running list of personal cues they can review before any real speech.

### Spaced repetition for vocabulary
When Claude flags a vague phrase upgrade ("really good" → "transformative"), add the strong word to a daily vocabulary deck the user reviews. Compound learning.

### Accountability/streak repair
If user breaks streak, offer a "catch-up" day that restores it without a full session.

### Topic diversity
Track which prompt categories (work, personal, abstract, etc.) the user gravitates toward. Push them toward their weaker categories occasionally.

### Real speech mode
Let user upload or record a real speech they gave (meeting talk, presentation). Get feedback on that, not just the practice prompts.
