require('dotenv').config();
const Cors = require('cors');
const express = require('express');
const {
  verifyKeyMiddleware,
  InteractionType,
  InteractionResponseType
} = require('discord-interactions');
const {setup,logCommand,getAllLogs}= require('./config/database')

const app = express();

app.use(Cors({
  allowMethods: ['POST', 'GET'],
  allowHeaders: ['Content-Type', 'Authorization'],
  origin: '*'
}));
app.post(
  '/interactions',
  verifyKeyMiddleware(process.env.DISCORD_PUBLIC_KEY),
  async (req, res) => {
    const interaction = req.body;

    // ping pong check
    if (interaction.type === InteractionType.PING) {
      console.log('Received PING from Discord');
      return res.json({ type: InteractionResponseType.PONG });
    }

    //  slash command
    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    
      const userId = interaction.member.user.id;
      const username = interaction.member.user.username;
      const interactionId = interaction.id;

      let responseText = '';
      let inputText = '';
      const commandName = interaction.data.name;
      console.log(`Received command: /${commandName}`);

      if (commandName === 'status') {
        // return res.json({
        //   type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        //   data: { content: ' Bot is online and running!' }
        // });
      responseText="Bot is in online"
      }

      if (commandName === 'report') {
        inputText = interaction.data.options?.[0]?.value ?? '(no text provided)';
        // return res.json({
        //   type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        //   data: { content: `📋 Report received: **${text}**` }
        // });
        responseText = ` Report received: **${inputText}**`;
      }

      await logCommand({
        interaction_id: interactionId,
        user_id: userId,
        username: username,
        command: commandName,
        input: inputText,
        response: responseText
      });

      // Fallback for unknown commands
      return res.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: responseText || 'Command received and logged.' }
      });
    }
  }
);

// Health check — useful for Render to confirm the server is up
app.get('/', (req, res) => res.send('Bot server is running.'));

// Endpoint to retrieve all command logs
app.get('/api/logs', async (req, res) => {
  const logs = await getAllLogs();
  res.json(logs);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async() => {
  await setup();
  console.log(`Server listening on port ${PORT}`);
});