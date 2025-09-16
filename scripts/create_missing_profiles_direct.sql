-- Dieses SQL-Skript erstellt Profile für alle Benutzer in auth.users, die noch kein Profil haben
-- Es kann direkt in der Supabase SQL-Konsole ausgeführt werden

-- Zuerst erstellen wir eine temporäre Tabelle mit allen Benutzern, die kein Profil haben
CREATE TEMP TABLE users_without_profiles AS
SELECT 
  auth.users.id,
  auth.users.email,
  auth.users.created_at
FROM 
  auth.users 
LEFT JOIN 
  profiles ON auth.users.id = profiles.id 
WHERE 
  profiles.id IS NULL;

-- Anzahl der Benutzer ohne Profile ausgeben
SELECT COUNT(*) AS users_without_profiles_count FROM users_without_profiles;

-- Profile für alle Benutzer ohne Profil erstellen
INSERT INTO profiles (id, role, created_at, updated_at)
SELECT 
  id,
  'CUSTOMER' AS role,
  NOW() AS created_at,
  NOW() AS updated_at
FROM 
  users_without_profiles;

-- Überprüfen, ob alle Profile erstellt wurden
SELECT COUNT(*) AS newly_created_profiles_count 
FROM profiles 
WHERE id IN (SELECT id FROM users_without_profiles);

-- Temporäre Tabelle löschen
DROP TABLE users_without_profiles;

-- Gesamtanzahl der Profile nach der Operation
SELECT COUNT(*) AS total_profiles_count FROM profiles;

-- Gesamtanzahl der Benutzer in auth.users
SELECT COUNT(*) AS total_users_count FROM auth.users;
