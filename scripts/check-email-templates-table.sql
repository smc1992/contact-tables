-- Prüfen, ob die email_templates Tabelle existiert
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'email_templates'
);

-- Falls die Tabelle existiert, ihre Struktur anzeigen
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'email_templates';

-- Anzahl der Einträge in der Tabelle
SELECT COUNT(*) FROM email_templates;
