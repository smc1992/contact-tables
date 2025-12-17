-- Trigger für neue Benutzerregistrierungen erstellen
-- Dieser Trigger ruft die Edge Function auf, wenn ein neuer Benutzer erstellt wird

-- Funktion erstellen, die bei neuen Benutzerregistrierungen die Edge Function aufruft
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Edge Function über HTTP aufrufen
  PERFORM
    net.http_post(
      url := current_setting('app.edge_function_url', true) || '/welcome-email',
      body := json_build_object(
        'type', 'INSERT',
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW),
        'schema', TG_TABLE_SCHEMA
      ),
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.edge_function_key', true)
      )
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger für neue Profile erstellen
DROP TRIGGER IF EXISTS on_profile_created_welcome_email ON public.profiles;
CREATE TRIGGER on_profile_created_welcome_email
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.trigger_welcome_email();

-- Konfigurationsparameter für die Funktion setzen
-- Diese müssen in der Supabase-Konsole unter SQL-Editor > Configuration gesetzt werden
COMMENT ON FUNCTION public.trigger_welcome_email IS 'Funktion, die bei neuen Benutzerregistrierungen die Welcome-Email Edge Function aufruft';
