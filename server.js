require('dotenv').config();
const express = require('express');
const {
  verifyKeyMiddleware,
  InteractionType,
  InteractionResponseType
} = require('discord-interactions');

const app = express();

// ⚠️ Important: do NOT add express.json() before this route.
// verifyKeyMiddleware reads the raw body itself for signature checking.
// If you run express.json() first, verification will always fail.
app.post(
  '/interactions',
  verifyKeyMiddleware(process.env.DISCORD_PUBLIC_KEY),
  (req, res) => {
    const interaction = req.body;

    // Type 1 — Discord is checking your endpoint is real (PING)
    if (interaction.type === InteractionType.PING) {
      console.log('Received PING from Discord');
      return res.json({ type: InteractionResponseType.PONG });
    }

    // Type 2 — A user ran a slash command
    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      const commandName = interaction.data.name;
      console.log(`Received command: /${commandName}`);

      if (commandName === 'status') {
        return res.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: '✅ Bot is online and running!' }
        });
      }

      if (commandName === 'report') {
        const text = interaction.data.options?.[0]?.value ?? '(no text provided)';
        return res.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `📋 Report received: **${text}**` }
        });
      }

      // Fallback for unknown commands
      return res.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: 'Unknown command.' }
      });
    }
  }
);

// Health check — useful for Render to confirm the server is up
app.get('/', (req, res) => res.send('Bot server is running.'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));