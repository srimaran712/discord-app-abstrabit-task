# CLAUDE.md

This file documents how Claude was used as an AI assistant during this project, as required by the submission guidelines.

## How I used Claude

I did not use a pre-written system prompt or context file. All interaction was through the **claude.ai chat interface** (Claude Sonnet 4.6) in a single ongoing conversation thread. This file is being submitted as the equivalent AI context artifact.

## What I asked Claude to help with

- Explaining the Discord interactions model (PING/PONG, Ed25519, the 3-second window) in plain language before writing any code
- Generating the initial Express server with signature verification
- Writing the `database.js` module (Postgres connection, table creation, log insert with deduplication)
- Writing the `register-commands.js` one-time script
- Generating the React dashboard (login page, stats cards, logs table, command rules section)
- Writing the CSS for the dashboard
- Debugging the middleware ordering issue (see AI_NOTES.md)
- Drafting this README and the submission documents

## What I did not use Claude for

- Choosing the tech stack (Node/Express, Neon, Render) — those were my own decisions
- Actually configuring services (Discord Developer Portal, Neon, Render) — Claude gave instructions, I executed them
- Deciding what to keep vs. rewrite in generated code — I read every file before using it
- Catching the critical middleware bug — Claude's first suggestions were wrong; I had to push back and re-read the `discord-interactions` docs myself before Claude landed on the correct explanation

## Honest assessment of AI usefulness

Claude was most useful for boilerplate that would have taken time to look up (Postgres pool setup, Discord API request format for registering commands, React component structure). It was least useful for debugging — its first instinct was to suggest rechecking config values rather than looking at the code structure. The middleware ordering bug is a good example of where I had to direct Claude to the right area rather than following its first suggestion.
