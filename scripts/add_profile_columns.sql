-- Migration: Hinzufügen fehlender Spalten zur profiles-Tabelle
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Daten aus user_metadata in die neuen Spalten migrieren (falls vorhanden)
-- Diese Abfrage kann später manuell ausgeführt werden, wenn die Spalten hinzugefügt wurden
/*
UPDATE profiles p
SET 
  first_name = (CASE WHEN auth.users.raw_user_meta_data->>'name' IS NOT NULL 
                THEN split_part(auth.users.raw_user_meta_data->>'name', ' ', 1) 
                ELSE NULL END),
  last_name = (CASE WHEN auth.users.raw_user_meta_data->>'name' IS NOT NULL 
               THEN substring(auth.users.raw_user_meta_data->>'name' FROM position(' ' IN auth.users.raw_user_meta_data->>'name') + 1) 
               ELSE NULL END),
  phone = auth.users.raw_user_meta_data->>'phone',
  address = auth.users.raw_user_meta_data->>'address',
  city = auth.users.raw_user_meta_data->>'city',
  zip_code = auth.users.raw_user_meta_data->>'zipCode'
FROM auth.users
WHERE p.id = auth.users.id;
*/
