const {Pool}= require('pg')
require('dotenv').config();

const connectionPool= new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function setup() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS command_logs (
      id SERIAL PRIMARY KEY,
      interaction_id TEXT UNIQUE, -- used to prevent duplicate processing
      user_id TEXT,
      username TEXT,
      command TEXT,
      input TEXT,
      response TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log(' Database ready');
}



async function logCommand({ interaction_id, user_id, username, command, input, response }) {
  await pool.query(
    `INSERT INTO command_logs 
      (interaction_id, user_id, username, command, input, response)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (interaction_id) DO NOTHING`,
    [interaction_id, user_id, username, command, input, response]
  );
}

async function getAllLogs() {
  const result = await pool.query(
    'SELECT * FROM command_logs ORDER BY created_at DESC'
  );
  return result.rows;
}

module.exports = { setup, logCommand, getAllLogs };