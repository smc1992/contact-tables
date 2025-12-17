
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
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'restaurants'
      ORDER BY ordinal_position;
    `);

    console.log('Columns in restaurants table:');
    res.rows.forEach(row => {
      console.log(`${row.column_name} (${row.data_type} / ${row.udt_name})`);
    });
    
    // Check restaurant_images table
    console.log('\nColumns in restaurant_images table:');
    const resRI = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'restaurant_images'
      ORDER BY ordinal_position;
    `);
    resRI.rows.forEach(row => {
      console.log(`${row.column_name} (${row.data_type})`);
    });
    const resView = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'visible_restaurants'
      ORDER BY ordinal_position;
    `);
    resView.rows.forEach(row => {
      console.log(`${row.column_name} (${row.data_type})`);
    });

    console.log('\nSample opening_hours:');
    const resOH = await client.query(`SELECT opening_hours FROM restaurants WHERE opening_hours IS NOT NULL LIMIT 1;`);
    if (resOH.rows.length > 0) {
      console.log(resOH.rows[0].opening_hours);
    } else {
      console.log('No opening_hours found');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
