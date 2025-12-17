
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database');

    const res = await client.query(`
      SELECT count(*) 
      FROM restaurants 
      WHERE is_active = true AND contract_status = 'ACTIVE'
    `);
    console.log('Active restaurants count:', res.rows[0].count);

    const res2 = await client.query(`
      SELECT name, latitude, longitude 
      FROM restaurants 
      WHERE is_active = true AND contract_status = 'ACTIVE' 
      LIMIT 5
    `);
    console.log('Sample active restaurants:', res2.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
