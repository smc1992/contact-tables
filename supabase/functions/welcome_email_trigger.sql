-- Funktion erstellen, die bei neuen Benutzerregistrierungen einen Webhook auslöst
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Benutzerrolle aus den Metadaten abrufen
  SELECT (auth.users.raw_user_meta_data->>'role')::TEXT INTO user_role
  FROM auth.users
  WHERE id = NEW.id;

  -- Nur für Benutzer mit der Rolle "CUSTOMER" fortfahren
  IF user_role = 'CUSTOMER' THEN
    -- Webhook aufrufen
    PERFORM
      net.http_post(
        url := current_setting('app.site_url', true) || '/api/auth/callback',
        body := json_build_object(
          'event', 'INSERT',
          'table', TG_TABLE_NAME,
          'record', row_to_json(NEW),
          'schema', TG_TABLE_SCHEMA
        ),
        headers := json_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.webhook_secret', true)
        )
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger für neue Benutzerregistrierungen erstellen
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger für neue Profile erstellen
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Konfigurationsparameter für die Funktion setzen
-- Diese müssen in der Supabase-Konsole unter SQL-Editor > Configuration gesetzt werden
COMMENT ON FUNCTION public.handle_new_user IS 'Funktion, die bei neuen Benutzerregistrierungen einen Webhook auslöst';
