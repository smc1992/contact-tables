-- Überprüfen des Tag-Namens und der zugewiesenen Benutzer
SELECT t.id, t.name, t.description, COUNT(a.user_id) as user_count
FROM public.user_tag t
LEFT JOIN public.user_tag_assignments a ON t.id = a.tag_id
GROUP BY t.id, t.name, t.description;
