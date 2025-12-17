-- Prüfen, ob der Willkommens-Mail-Tag existiert
SELECT * FROM user_tags WHERE name LIKE '%willkommen%mail%';

-- Anzahl der Benutzer mit der Rolle 'customer' abrufen
SELECT COUNT(*) AS total_customers 
FROM profiles 
WHERE role = 'CUSTOMER';

-- Anzahl der Benutzer mit dem Willkommens-Mail-Tag abrufen
SELECT COUNT(DISTINCT uta.user_id) AS customers_with_welcome_tag
FROM user_tag_assignments uta
JOIN user_tags t ON uta.tag_id = t.id
JOIN profiles p ON uta.user_id = p.id
WHERE t.name LIKE '%willkommen%mail%'
AND p.role = 'CUSTOMER';

-- Benutzer mit der Rolle 'customer', die KEINEN Willkommens-Mail-Tag haben
SELECT p.id, p.name, p.id as email
FROM profiles p
WHERE p.role = 'CUSTOMER'
AND p.id NOT IN (
  SELECT DISTINCT uta.user_id
  FROM user_tag_assignments uta
  JOIN user_tags t ON uta.tag_id = t.id
  WHERE t.name LIKE '%willkommen%mail%'
);
