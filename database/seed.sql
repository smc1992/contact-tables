-- Beispieldaten für Contact Tables Anwendung

-- Beispiel-Restaurants (Angenommen, diese Benutzer existieren bereits in auth.users)
INSERT INTO public.restaurants (
  id, 
  name, 
  description, 
  address, 
  city, 
  postal_code, 
  country, 
  phone, 
  website, 
  logo_url, 
  status, 
  subscription_tier
) VALUES 
(
  '00000000-0000-0000-0000-000000000001', 
  'Ristorante Italiano', 
  'Authentische italienische Küche in gemütlicher Atmosphäre', 
  'Hauptstraße 123', 
  'Berlin', 
  '10115', 
  'Deutschland', 
  '+49 30 12345678', 
  'https://ristorante-italiano.example.com', 
  'https://example.com/logos/ristorante.png', 
  'ACTIVE', 
  'PREMIUM'
),
(
  '00000000-0000-0000-0000-000000000002', 
  'Brauhaus am Markt', 
  'Traditionelles deutsches Brauhaus mit hauseigenen Bieren', 
  'Marktplatz 7', 
  'München', 
  '80331', 
  'Deutschland', 
  '+49 89 87654321', 
  'https://brauhaus-am-markt.example.com', 
  'https://example.com/logos/brauhaus.png', 
  'ACTIVE', 
  'BASIC'
),
(
  '00000000-0000-0000-0000-000000000003', 
  'Sushi Palace', 
  'Moderne japanische Küche mit frischem Sushi und Sashimi', 
  'Fischerstraße 42', 
  'Hamburg', 
  '20095', 
  'Deutschland', 
  '+49 40 55667788', 
  'https://sushi-palace.example.com', 
  'https://example.com/logos/sushi.png', 
  'PENDING', 
  NULL
);

-- Beispiel-Kontakttische
INSERT INTO public.contact_tables (
  id,
  restaurant_id,
  title,
  description,
  date,
  start_time,
  end_time,
  max_participants,
  current_participants,
  status,
  price,
  image_url
) VALUES 
(
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001',
  'Gemeinsames Abendessen',
  'Lernen Sie neue Leute kennen bei einem gemütlichen italienischen Abendessen',
  CURRENT_DATE + INTERVAL '7 days',
  '19:00',
  '22:00',
  6,
  2,
  'ACTIVE',
  25.00,
  'https://example.com/images/dinner.jpg'
),
(
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000002',
  'Bierabend mit neuen Leuten',
  'Probieren Sie verschiedene Biersorten und knüpfen Sie neue Kontakte',
  CURRENT_DATE + INTERVAL '3 days',
  '20:00',
  '23:00',
  8,
  4,
  'ACTIVE',
  15.00,
  'https://example.com/images/beer.jpg'
),
(
  '00000000-0000-0000-0000-000000000103',
  '00000000-0000-0000-0000-000000000001',
  'Pasta-Kochkurs',
  'Lernen Sie, wie man authentische italienische Pasta zubereitet',
  CURRENT_DATE + INTERVAL '14 days',
  '18:00',
  '21:00',
  10,
  5,
  'ACTIVE',
  35.00,
  'https://example.com/images/pasta.jpg'
);

-- Beispiel-Benutzer-Profile (Angenommen, diese Benutzer existieren bereits in auth.users)
INSERT INTO public.profiles (
  id,
  first_name,
  last_name,
  avatar_url,
  bio
) VALUES 
(
  '00000000-0000-0000-0000-000000000101',
  'Max',
  'Mustermann',
  'https://example.com/avatars/max.jpg',
  'Ich bin ein Foodie und liebe es, neue Restaurants zu entdecken.'
),
(
  '00000000-0000-0000-0000-000000000102',
  'Anna',
  'Schmidt',
  'https://example.com/avatars/anna.jpg',
  'Reisebegeisterte und Feinschmeckerin.'
),
(
  '00000000-0000-0000-0000-000000000103',
  'Thomas',
  'Meyer',
  'https://example.com/avatars/thomas.jpg',
  'Auf der Suche nach neuen kulinarischen Erlebnissen und interessanten Gesprächen.'
);

-- Beispiel-Teilnahmen
INSERT INTO public.participations (
  contact_table_id,
  user_id,
  status
) VALUES 
(
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000101',
  'CONFIRMED'
),
(
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102',
  'CONFIRMED'
),
(
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000101',
  'CONFIRMED'
),
(
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000102',
  'CONFIRMED'
),
(
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000103',
  'CONFIRMED'
),
(
  '00000000-0000-0000-0000-000000000103',
  '00000000-0000-0000-0000-000000000103',
  'CONFIRMED'
);

-- Beispiel-Favoriten
INSERT INTO public.favorites (
  user_id,
  contact_table_id
) VALUES 
(
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102'
),
(
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000101'
),
(
  '00000000-0000-0000-0000-000000000103',
  '00000000-0000-0000-0000-000000000103'
);

-- Beispiel-Benachrichtigungen
INSERT INTO public.notifications (
  user_id,
  title,
  message,
  type,
  related_resource_type,
  related_resource_id
) VALUES 
(
  '00000000-0000-0000-0000-000000000101',
  'Neue Teilnahme bestätigt',
  'Ihre Teilnahme am Kontakttisch "Gemeinsames Abendessen" wurde bestätigt.',
  'SUCCESS',
  'CONTACT_TABLE',
  '00000000-0000-0000-0000-000000000101'
),
(
  '00000000-0000-0000-0000-000000000102',
  'Neuer Kontakttisch in Ihrer Nähe',
  'Ein neuer Kontakttisch "Pasta-Kochkurs" wurde in Ihrer Nähe erstellt.',
  'INFO',
  'CONTACT_TABLE',
  '00000000-0000-0000-0000-000000000103'
),
(
  '00000000-0000-0000-0000-000000000103',
  'Erinnerung: Kontakttisch morgen',
  'Erinnerung: Der Kontakttisch "Bierabend mit neuen Leuten" findet morgen statt.',
  'INFO',
  'CONTACT_TABLE',
  '00000000-0000-0000-0000-000000000102'
);

-- Beispiel-Bewertungen
INSERT INTO public.ratings (
  contact_table_id,
  user_id,
  rating,
  comment
) VALUES 
(
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102',
  5,
  'Tolles Erlebnis! Das Essen war hervorragend und die Gesellschaft sehr angenehm.'
),
(
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000101',
  4,
  'Sehr gute Bierauswahl und interessante Gespräche.'
),
(
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000103',
  3,
  'Gutes Konzept, aber etwas zu laut für tiefere Gespräche.'
);

-- Beispiel-Benutzereinstellungen
INSERT INTO public.user_settings (
  user_id,
  notifications_email,
  notifications_push,
  notifications_new_events,
  privacy_profile,
  privacy_contact_info
) VALUES 
(
  '00000000-0000-0000-0000-000000000101',
  TRUE,
  TRUE,
  TRUE,
  'public',
  'contacts'
),
(
  '00000000-0000-0000-0000-000000000102',
  TRUE,
  FALSE,
  TRUE,
  'contacts',
  'private'
),
(
  '00000000-0000-0000-0000-000000000103',
  FALSE,
  TRUE,
  FALSE,
  'public',
  'public'
);

-- Beispiel-Partneranfragen
INSERT INTO public.partner_requests (
  restaurant_id,
  status,
  admin_notes
) VALUES 
(
  '00000000-0000-0000-0000-000000000003',
  'PENDING',
  'Anfrage wird geprüft. Bitte Unterlagen zur Lebensmittelsicherheit nachreichen.'
);
