-- Tag 'willkomensmail' erstellen
INSERT INTO public.user_tag (name, description)
VALUES ('willkomensmail', 'Benutzer, die eine Willkommens-E-Mail erhalten haben')
ON CONFLICT (name) DO NOTHING
RETURNING id;

-- ID des Tags abfragen
SELECT id FROM public.user_tag WHERE name = 'willkomensmail';
