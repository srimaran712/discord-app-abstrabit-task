# Discord Bot Dashboard

A full-stack web app that connects to a Discord server via slash commands. When a user runs a command in Discord, the bot records it, replies in Discord, and mirrors a notification to a second channel. An admin dashboard (behind login) shows a live log of every command.

---

## What the App Does

- **Discord slash commands** — users run `/status` or `/report <text>` in a Discord server
- **Interactions endpoint** — Discord sends a signed HTTP POST to the server; the app verifies the Ed25519 signature and responds within 3 seconds
- **Database logging** — every command is saved to Postgres (Neon) with the user, input, response, and timestamp
- **Deduplication** — the interaction ID is stored as a unique key so the same event is never processed twice
- **Mirror notification** — each command is forwarded to a second Discord channel via webhook
- **Admin dashboard** — a React app (behind login) shows live command logs, stats, and lets the admin configure command response text

---

## Architecture

```
Discord user
    │  /report hello
    ▼
Discord API
    │  POST /interactions (Ed25519 signed)
    ▼
Express server (Render)
    ├── verifies signature
    ├── saves to Neon Postgres
    ├── replies to Discord
    └── POSTs to mirror webhook
    
React dashboard (Render Static Site)
    └── GET /api/logs  ──▶  Express server  ──▶  Postgres
```

---

## Tech Stack

| Layer      | Choice            | Why                                         |
|------------|-------------------|---------------------------------------------|
| Backend    | Node.js + Express | Lightweight, fast to set up, good ecosystem |
| Database   | Neon (Postgres)   | Free tier, no credit card, serverless Postgres |
| Frontend   | React + Vite      | Simple, fast build, easy to deploy as static site |
| Hosting    | Render            | Free tier for both web service and static site |
| Bot        | Discord API       | Interactions-based (no persistent websocket needed) |

---

## Running Locally

### Prerequisites
- Node.js 18+
- A Discord application (from [Discord Developer Portal](https://discord.com/developers/applications))
- A Neon database (from [neon.tech](https://neon.tech))

### Backend

```bash
# Clone the repo
git clone https://github.com/srimaran712/discord-app-abstrabit-task.git
cd YOUR_REPO

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in the values in .env (see section below)

# Register slash commands with Discord (run once)
node src/register-commands.js

# Start the server
npm run dev
```

The server runs at `http://localhost:3000`.

> **Note:** Discord cannot send interactions to localhost. To test the full flow locally, use a tunnel like [ngrok](https://ngrok.com): `ngrok http 3000`, then paste the HTTPS URL into the Discord Developer Portal as your Interactions Endpoint URL.

### Frontend Dashboard

```bash
cd dashboard
npm install
cp .env.example .env
# Set VITE_API_URL to your backend URL
npm run dev
```

Dashboard runs at `http://localhost:5173`.

---

## Environment Variables

### Backend — `.env`

```env
# Discord
DISCORD_APP_ID=          # From General Information in Developer Portal
DISCORD_PUBLIC_KEY=      # From General Information in Developer Portal
DISCORD_BOT_TOKEN=       # From Bot tab in Developer Portal

# Database
DATABASE_URL=            # Neon connection string (postgresql://...)

# Mirror channel
MIRROR_WEBHOOK_URL=      # Discord webhook URL for the second channel

# Server
PORT=3000
```

### Frontend — `dashboard/.env`

```env
VITE_API_URL=            # Your deployed backend URL, e.g. https://your-bot.onrender.com
```

---

## Deployment

### Backend (Render Web Service)
1. Push code to GitHub
2. Render → New → **Web Service** → connect repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all environment variables from the table above under **Environment**

### Frontend (Render Static Site)
1. Push the `dashboard/` folder to GitHub (can be same or separate repo)
2. Render → New → **Static Site** → connect repo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add `VITE_API_URL` environment variable

---

## How to Test It

### Add the bot to your server
Use this invite link to add the bot:

```
https://discord.com/oauth2/authorize?client_id=YOUR_APP_ID&scope=bot+applications.commands&permissions=2048
```

> Replace `YOUR_APP_ID` with the Application ID from the Developer Portal.

### Run a slash command
In any channel in your Discord server:
- `/status` — the bot replies with a status message
- `/report text:something happened` — the bot logs the report and replies

### Admin dashboard login
- URL: `https://discord-dashboard-app.onrender.com/`
- Email: `admin@bot.com`
- Password: `admin123`

The dashboard shows all command logs, stats, and command rule configuration.

---

## Project Structure

```
/
├── src/
│   ├── index.js              # Express server + interactions endpoint
│   ├── database.js           # Postgres connection, setup, log/query helpers
│   └── register-commands.js  # One-time script to register slash commands
├── dashboard/
│   ├── src/
│   │   ├── App.jsx           # Login + Dashboard UI
│   │   └── App.css           # Styles
│   └── index.html
├── .env.example
└── README.md
```

---

## Security Notes

- Ed25519 signature is verified on every request using `discord-interactions` — forged or replayed requests are rejected before any business logic runs
- Interaction IDs are stored with a `UNIQUE` constraint — duplicate deliveries are silently ignored (`ON CONFLICT DO NOTHING`)
- All secrets are in environment variables, never in code or client-side bundles
- The `DISCORD_BOT_TOKEN` and `MIRROR_WEBHOOK_URL` are only used server-side and never exposed to the frontend
