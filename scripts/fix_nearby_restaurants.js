
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const sql = `
DROP FUNCTION IF EXISTS nearby_restaurants(double precision, double precision, double precision);
DROP FUNCTION IF EXISTS nearby_restaurants(double precision, double precision, integer);

CREATE OR REPLACE FUNCTION nearby_restaurants(
    lat double precision,
    long double precision,
    radius_meters double precision
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    phone TEXT,
    website TEXT,
    cuisine TEXT,
    price_range TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    user_id UUID,
    contact_email TEXT,
    opening_hours TEXT,
    is_verified BOOLEAN,
    slug TEXT,
    contract_status TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_valid_until TIMESTAMP,
    offer_table_today BOOLEAN,
    distance_meters DOUBLE PRECISION,
    image_url TEXT,
    image_alt_text TEXT,
    image_height TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.name,
        r.description,
        r.address,
        r.city,
        r.postal_code,
        r.latitude,
        r.longitude,
        r.phone,
        r.website,
        r.cuisine,
        r.price_range,
        r.is_active,
        r.created_at,
        r.updated_at,
        r."userId" AS user_id,
        r.email AS contact_email,
        r.opening_hours,
        r.is_visible AS is_verified,
        r.slug,
        r.contract_status::text,
        NULL::text AS stripe_customer_id,
        r.stripe_subscription_id,
        r.trial_end_date AS subscription_valid_until,
        r.offer_table_today,
        ST_Distance(
            ST_SetSRID(ST_MakePoint(r.longitude, r.latitude), 4326),
            ST_SetSRID(ST_MakePoint(long, lat), 4326)::geography
        ) AS distance_meters,
        ri.url AS image_url,
        NULL::text AS image_alt_text,
        NULL::text AS image_height
    FROM
        restaurants AS r
    LEFT JOIN restaurant_images AS ri ON r.id = ri.restaurant_id AND ri.is_primary = TRUE
    WHERE
        r.is_active = TRUE AND r.contract_status = 'ACTIVE' AND
        ST_DWithin(
            ST_SetSRID(ST_MakePoint(r.longitude, r.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(long, lat), 4326)::geography,
            radius_meters
        )
    ORDER BY
        distance_meters ASC;
END;
$$;
`;

async function run() {
  try {
    await client.connect();
    console.log('Connected to database');
    console.log('Executing SQL to update nearby_restaurants function...');
    await client.query(sql);
    console.log('Successfully updated nearby_restaurants function.');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

run();
