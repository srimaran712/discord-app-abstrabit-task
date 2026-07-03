# AI_NOTES.md

## Tools and Models Used

I used **Claude (claude.ai, Sonnet 4.6)** as my primary AI assistant throughout the project — for architecture guidance, writing boilerplate code, debugging, and generating the React dashboard. I did not use a CLAUDE.md or AGENTS.md context file; all interaction was through the claude.ai chat interface in a single ongoing conversation.

**Rough split:**
- AI wrote: the initial Express server skeleton, the `database.js` module, the React dashboard UI, the `register-commands.js` script, and the CSS
- I wrote / decided: which parts to keep vs. rewrite, caught and fixed the two key bugs below, made all service and architecture choices, and did all the wiring between services (pasting keys, setting env vars, configuring Render)

---

## Key Decisions I Made Myself

**1. Using `discord-interactions` library instead of implementing Ed25519 manually**
The spec says you must verify Discord's signature. Claude initially suggested using `tweetnacl` directly and writing the raw byte comparison by hand. I chose to use the `discord-interactions` npm package instead, which wraps this as an Express middleware (`verifyKeyMiddleware`). This was the right call — it's the officially recommended library, it's maintained by Discord, and it handles the raw body buffering correctly out of the box.

**2. Neon over Supabase for the database**
Both were suggested as free Postgres options. I picked Neon because the connection string it gives you works directly with the `pg` npm package without any extra configuration — Supabase's free tier routes through a connection pooler that requires a slightly different SSL setup. Simpler was better here given the scope.

**3. Keeping the frontend and backend as two separate Render deployments**
Claude suggested at one point serving the React build as static files from the Express server itself (one deployment). I kept them separate — backend as a Web Service, frontend as a Static Site — because it's cleaner, the static site deploys and caches faster, and it makes it easier to update the UI without touching the bot logic.

---

## The Hardest Bug

**The `express.json()` middleware ordering problem — AI got this wrong at first.**

When Claude first generated the `index.js` file, it included `app.use(express.json())` at the top of the file, before the `/interactions` route. The server started fine and Discord's PING verification even passed — but every real slash command came back with a 401 Unauthorized from the `verifyKeyMiddleware`.

The error message in the Render logs was:
```
Error: Invalid signature
```

Claude's first suggestion was to check that I had copied the Public Key correctly — I had. Its second suggestion was to try adding the `rawBody` option to the body parser. Neither fixed it.

I went back and read the `discord-interactions` README more carefully. The issue was that `verifyKeyMiddleware` needs to read the **raw request body bytes** to verify the signature. Once `express.json()` runs first, it consumes the body stream and parses it into an object — the raw bytes are gone. The signature check then has nothing valid to verify against, so it always fails.

The fix was to **remove `app.use(express.json())` entirely** from the global middleware and let `verifyKeyMiddleware` handle body parsing for the `/interactions` route on its own. For any other routes that needed JSON parsing (like `/api/logs`), `express.json()` still works fine — it just can't run before the interactions middleware.

Claude added a comment in the final code warning about this, but it should have caught it in the first generation. The lesson: when working with request signature verification, always check whether any middleware upstream is consuming the body before the verification step runs.

---

## What I'd Improve With More Time

1. **Persistent command rules** — the dashboard's "Command Rules" section currently saves to React state only (resets on refresh). With more time I'd add a `command_rules` table in Postgres and a `PATCH /api/rules` endpoint so the admin's config actually changes how the bot responds.

2. **Real authentication** — the hardcoded `admin@bot.com` / `admin123` login is fine for a demo but not for production. I'd replace it with a proper session or JWT approach, with the credentials stored securely in environment variables on the backend.

3. **Mirror channel setup in the UI** — right now the mirror webhook URL is a static environment variable. The spec asks for an admin to connect a Discord server and pick a channel from the UI. I'd add an OAuth flow using Discord's `bot` scope so the admin can authorize the app and select a channel from a dropdown.

4. **Retry logic for the mirror webhook** — if the Slack/Discord webhook POST fails (network blip, rate limit), the interaction is still logged and Discord still gets a reply, but the mirror notification is silently lost. I'd add a simple retry with exponential backoff, and surface failures in the dashboard log.

5. **The AI stretch goal** — I didn't have time to add the LLM summarization step for `/report` text. The integration point is clear (call Gemini or Groq after saving the log, update the row with a `summary` field, include it in the Discord reply), but I chose to get the core working solidly first.

---

## Prompt Excerpt — The Trickiest Part

This is the exchange where I figured out the middleware ordering bug:

> **Me:** The signature verification is failing with "Invalid signature" on every slash command, but the PING passed. I've double-checked the public key. What else could cause this?
>
> **Claude:** One likely cause: if `express.json()` is registered before `verifyKeyMiddleware`, it consumes the raw request body. The signature check needs the raw bytes — once parsed, verification always fails. Remove the global `app.use(express.json())` and let `verifyKeyMiddleware` handle body reading for the `/interactions` route on its own.

That was the fix. It took two wrong suggestions before Claude landed on this — the key was me pushing back and saying "I already checked the key" rather than accepting the first answer.
