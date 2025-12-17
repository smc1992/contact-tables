-- Prüfen, ob die Tabellen existieren
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_tags', 'user_tag_assignments', 'profiles');

-- Struktur der user_tags Tabelle
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_tags';

-- Struktur der user_tag_assignments Tabelle
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_tag_assignments';

-- Prüfen, ob Daten in den Tabellen vorhanden sind
SELECT COUNT(*) FROM user_tags;
SELECT COUNT(*) FROM user_tag_assignments;
SELECT COUNT(*) FROM profiles WHERE role = 'CUSTOMER';
