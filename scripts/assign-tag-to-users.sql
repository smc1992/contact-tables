-- Tag-ID abrufen
WITH tag_id AS (
  SELECT id FROM public.user_tags WHERE name = 'willkomensmail'
),
-- Benutzer-IDs aus der auth.users Tabelle abrufen (falls möglich)
-- Alternativ können wir IDs direkt angeben
user_ids AS (
  SELECT id FROM auth.users LIMIT 3
)
-- Tag den Benutzern zuweisen
INSERT INTO public.user_tag_assignments (user_id, tag_id)
SELECT u.id, t.id
FROM user_ids u, tag_id t
ON CONFLICT (user_id, tag_id) DO NOTHING;
