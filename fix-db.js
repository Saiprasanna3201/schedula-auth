require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

client.connect()
  .then(() => client.query('TRUNCATE appointments CASCADE;'))
  .then(() => {
    console.log('appointments table cleared');
    return client.end();
  })
  .catch((err) => {
    console.error('Error:', err.message);
    client.end();
  });