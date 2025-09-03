-- Prüfen, ob der Tag 'willkomensmail' existiert
SELECT * FROM "user_tag" WHERE name LIKE '%willkomensmail%';

-- Prüfen, ob es Zuweisungen für diesen Tag gibt
SELECT ut.id, ut.name, ut.description, COUNT(uta.user_id) as user_count
FROM "user_tag" ut
LEFT JOIN "user_tag_assignments" uta ON ut.id = uta.tag_id
WHERE ut.name LIKE '%willkomensmail%'
GROUP BY ut.id, ut.name, ut.description;
