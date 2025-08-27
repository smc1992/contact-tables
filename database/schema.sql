-- Schema für Contact Tables Anwendung

-- Benutzer-Profil-Erweiterungen (ergänzt die auth.users Tabelle von Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurants
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, ACTIVE, REJECTED, SUSPENDED
  subscription_tier TEXT, -- FREE, BASIC, PREMIUM
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  contract_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kontakt-Tische (Events)
CREATE TABLE IF NOT EXISTS public.contact_tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  max_participants INTEGER NOT NULL DEFAULT 4,
  current_participants INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, CANCELLED, COMPLETED
  price DECIMAL(10, 2),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teilnahmen an Kontakt-Tischen
CREATE TABLE IF NOT EXISTS public.participations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_table_id UUID REFERENCES public.contact_tables(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'CONFIRMED', -- CONFIRMED, CANCELLED, ATTENDED
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contact_table_id, user_id)
);

-- Favoriten
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_table_id UUID REFERENCES public.contact_tables(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, contact_table_id)
);

-- Benachrichtigungen
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- INFO, SUCCESS, WARNING, ERROR
  read BOOLEAN DEFAULT FALSE,
  related_resource_type TEXT, -- CONTACT_TABLE, PARTICIPATION, RESTAURANT, etc.
  related_resource_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bewertungen für Kontakt-Tische
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_table_id UUID REFERENCES public.contact_tables(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contact_table_id, user_id)
);

-- Benutzereinstellungen
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  notifications_email BOOLEAN DEFAULT TRUE,
  notifications_push BOOLEAN DEFAULT TRUE,
  notifications_new_events BOOLEAN DEFAULT TRUE,
  notifications_updates BOOLEAN DEFAULT TRUE,
  notifications_marketing BOOLEAN DEFAULT FALSE,
  privacy_profile TEXT DEFAULT 'public', -- public, contacts, private
  privacy_contact_info TEXT DEFAULT 'contacts', -- public, contacts, private
  privacy_participation TEXT DEFAULT 'public', -- public, contacts, private
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partneranfragen (für Restaurants)
CREATE TABLE IF NOT EXISTS public.partner_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  admin_notes TEXT,
  admin_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS-Policies (Row Level Security)

-- Profiles: Jeder kann sein eigenes Profil bearbeiten
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Benutzer können ihr eigenes Profil lesen" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Benutzer können ihr eigenes Profil bearbeiten" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Benutzer können ihr eigenes Profil erstellen" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Restaurants: Nur Restaurant-Besitzer und Admins können Restaurant-Daten bearbeiten
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Jeder kann Restaurants sehen" ON public.restaurants
  FOR SELECT USING (true);
CREATE POLICY "Restaurants können ihre eigenen Daten bearbeiten" ON public.restaurants
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Restaurants können ihre eigenen Daten erstellen" ON public.restaurants
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Contact Tables: Restaurants können ihre eigenen Tische verwalten, alle können sie sehen
ALTER TABLE public.contact_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Jeder kann Kontakt-Tische sehen" ON public.contact_tables
  FOR SELECT USING (true);
CREATE POLICY "Restaurants können ihre eigenen Kontakt-Tische verwalten" ON public.contact_tables
  FOR ALL USING (auth.uid() = restaurant_id);

-- Participations: Benutzer können ihre eigenen Teilnahmen verwalten
ALTER TABLE public.participations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Benutzer können ihre eigenen Teilnahmen sehen" ON public.participations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Benutzer können ihre eigenen Teilnahmen erstellen" ON public.participations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Benutzer können ihre eigenen Teilnahmen aktualisieren" ON public.participations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Benutzer können ihre eigenen Teilnahmen löschen" ON public.participations
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Restaurants können Teilnahmen an ihren Tischen sehen" ON public.participations
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.contact_tables ct
    WHERE ct.id = contact_table_id AND ct.restaurant_id = auth.uid()
  ));

-- Favorites: Benutzer können ihre eigenen Favoriten verwalten
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Benutzer können ihre eigenen Favoriten sehen" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Benutzer können ihre eigenen Favoriten erstellen" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Benutzer können ihre eigenen Favoriten löschen" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Notifications: Benutzer können nur ihre eigenen Benachrichtigungen sehen
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Benutzer können ihre eigenen Benachrichtigungen sehen" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Benutzer können ihre eigenen Benachrichtigungen aktualisieren" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Ratings: Benutzer können ihre eigenen Bewertungen verwalten, alle können Bewertungen sehen
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Jeder kann Bewertungen sehen" ON public.ratings
  FOR SELECT USING (true);
CREATE POLICY "Benutzer können ihre eigenen Bewertungen erstellen" ON public.ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Benutzer können ihre eigenen Bewertungen aktualisieren" ON public.ratings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Benutzer können ihre eigenen Bewertungen löschen" ON public.ratings
  FOR DELETE USING (auth.uid() = user_id);

-- User Settings: Benutzer können nur ihre eigenen Einstellungen verwalten
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Benutzer können ihre eigenen Einstellungen sehen" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Benutzer können ihre eigenen Einstellungen erstellen" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Benutzer können ihre eigenen Einstellungen aktualisieren" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Partner Requests: Nur Admins können alle Anfragen sehen, Restaurants nur ihre eigenen
ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restaurants können ihre eigenen Anfragen sehen" ON public.partner_requests
  FOR SELECT USING (auth.uid() = restaurant_id);
CREATE POLICY "Restaurants können ihre eigenen Anfragen erstellen" ON public.partner_requests
  FOR INSERT WITH CHECK (auth.uid() = restaurant_id);

-- Funktionen und Trigger

-- Funktion zum Aktualisieren des updated_at Zeitstempels
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für updated_at Aktualisierung
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contact_tables_updated_at
  BEFORE UPDATE ON public.contact_tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_participations_updated_at
  BEFORE UPDATE ON public.participations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_partner_requests_updated_at
  BEFORE UPDATE ON public.partner_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Funktion zum Aktualisieren der Teilnehmerzahl bei Teilnahme/Stornierung
CREATE OR REPLACE FUNCTION update_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'CONFIRMED' THEN
    UPDATE public.contact_tables
    SET current_participants = current_participants + 1
    WHERE id = NEW.contact_table_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'CONFIRMED' AND NEW.status = 'CANCELLED' THEN
    UPDATE public.contact_tables
    SET current_participants = current_participants - 1
    WHERE id = NEW.contact_table_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'CANCELLED' AND NEW.status = 'CONFIRMED' THEN
    UPDATE public.contact_tables
    SET current_participants = current_participants + 1
    WHERE id = NEW.contact_table_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'CONFIRMED' THEN
    UPDATE public.contact_tables
    SET current_participants = current_participants - 1
    WHERE id = OLD.contact_table_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger für Teilnehmerzahl-Aktualisierung
CREATE TRIGGER update_participant_count
  AFTER INSERT OR UPDATE OR DELETE ON public.participations
  FOR EACH ROW EXECUTE FUNCTION update_participant_count();

-- Funktion zum Erstellen eines Profils nach Benutzerregistrierung
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  -- Wenn der Benutzer ein Restaurant ist, erstelle auch einen Restaurant-Eintrag
  IF NEW.raw_user_meta_data->>'role' = 'RESTAURANT' THEN
    INSERT INTO public.restaurants (
      id,
      name,
      description,
      status
    ) VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'restaurant_name',
      NEW.raw_user_meta_data->>'restaurant_description',
      'PENDING'
    );
    
    -- Erstelle eine Partneranfrage
    INSERT INTO public.partner_requests (restaurant_id)
    VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für neue Benutzer
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- System Settings (globale Einstellungen inkl. SMTP)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id TEXT PRIMARY KEY DEFAULT '1',
  site_name TEXT NOT NULL DEFAULT 'Contact Tables',
  site_description TEXT,
  contact_email TEXT,
  support_phone TEXT,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  registration_enabled BOOLEAN DEFAULT TRUE,
  default_subscription_days INTEGER DEFAULT 30,
  max_featured_restaurants INTEGER DEFAULT 6,
  google_maps_api_key TEXT,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_user TEXT,
  smtp_password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Newsletters (Admin-Newsletter-Versand)
CREATE TABLE IF NOT EXISTS public.newsletters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, sending, sent, failed
  sent_at TIMESTAMP WITH TIME ZONE,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  open_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS für System Settings – nur Admins (aus JWT user_metadata.role) dürfen lesen/schreiben
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins können Einstellungen lesen" ON public.system_settings
  FOR SELECT USING (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','ADMIN'), false)
  );
CREATE POLICY "Admins können Einstellungen schreiben" ON public.system_settings
  FOR INSERT WITH CHECK (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','ADMIN'), false)
  );
CREATE POLICY "Admins können Einstellungen aktualisieren" ON public.system_settings
  FOR UPDATE USING (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','ADMIN'), false)
  ) WITH CHECK (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','ADMIN'), false)
  );

-- RLS für Newsletters – nur Admins
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins können Newsletter lesen" ON public.newsletters
  FOR SELECT USING (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','ADMIN'), false)
  );
CREATE POLICY "Admins können Newsletter erstellen" ON public.newsletters
  FOR INSERT WITH CHECK (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','ADMIN'), false)
  );
CREATE POLICY "Admins können Newsletter aktualisieren" ON public.newsletters
  FOR UPDATE USING (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','ADMIN'), false)
  ) WITH CHECK (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','ADMIN'), false)
  );
CREATE POLICY "Admins können Newsletter löschen" ON public.newsletters
  FOR DELETE USING (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','ADMIN'), false)
  );

-- updated_at Trigger für neue Tabellen
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_newsletters_updated_at
  BEFORE UPDATE ON public.newsletters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
