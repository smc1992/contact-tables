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
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_id UUID,
    contact_email TEXT,
    opening_hours JSONB,
    is_verified BOOLEAN,
    slug TEXT,
    contract_status TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_valid_until TIMESTAMPTZ,
    offer_table_today BOOLEAN,
    distance_meters DOUBLE PRECISION,
    -- Add columns for the image
    image_url TEXT,
    image_alt_text TEXT,
    image_height TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.*,
        ST_Distance(
            ST_SetSRID(ST_MakePoint(r.longitude, r.latitude), 4326),
            ST_SetSRID(ST_MakePoint(long, lat), 4326)::geography
        ) AS distance_meters,
        -- Select the title image URL and details
        ri.url AS image_url,
        ri.alt_text AS image_alt_text,
        ri.height AS image_height
    FROM
        restaurants AS r
    -- Join with restaurant_images to get the title image
    LEFT JOIN restaurant_images AS ri ON r.id = ri.restaurant_id AND ri.is_title_image = TRUE
    WHERE
        r.is_active = TRUE AND r.contract_status = 'ACTIVE' AND
        ST_DWithin(
            ST_SetSRID(ST_MakePoint(r.longitude, r.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(long, lat), 4326)::geography,
            radius_meters
        )
    ORDER BY
        distance_meters;
END;
$$;
