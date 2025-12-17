-- Alle Tags anzeigen
SELECT * FROM user_tags;

-- Alle Tag-Zuweisungen anzeigen
SELECT * FROM user_tag_assignments;

-- Anzahl der Kunden
SELECT COUNT(*) AS customer_count FROM profiles WHERE role = 'CUSTOMER';

-- Anzahl der Kunden mit dem Willkommens-Tag
SELECT COUNT(DISTINCT uta.user_id) AS customers_with_welcome_tag
FROM user_tag_assignments uta
JOIN user_tags t ON uta.tag_id = t.id
JOIN profiles p ON uta.user_id = p.id
WHERE t.name LIKE '%willkommen%mail%'
AND p.role = 'CUSTOMER';
