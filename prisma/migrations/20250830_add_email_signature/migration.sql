-- Add email_signature field to system_settings table
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS email_signature TEXT;
