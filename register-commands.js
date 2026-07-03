require('dotenv').config();

const commands = [
  {
    name: 'status',
    description: 'Check if the bot is online'
  },
  {
    name: 'report',
    description: 'Submit a report',
    options: [
      {
        name: 'text',
        description: 'What do you want to report?',
        type: 3, // STRING type
        required: true
      }
    ]
  }
];

async function registerCommands() {
  const url = `https://discord.com/api/v10/applications/${process.env.DISCORD_APP_ID}/commands`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commands)
  });

  const data = await response.json();

  if (response.ok) {
    console.log('✅ Commands registered successfully:', data.map(c => `/${c.name}`));
  } else {
    console.error('❌ Failed to register commands:', data);
  }
}

registerCommands();