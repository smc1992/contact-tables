-- Erstelle eine Funktion, um Benutzer ohne Profile zu finden
CREATE OR REPLACE FUNCTION get_users_without_profiles()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.users.id,
    auth.users.email,
    auth.users.created_at,
    auth.users.last_sign_in_at
  FROM 
    auth.users 
  LEFT JOIN 
    profiles ON auth.users.id = profiles.id 
  WHERE 
    profiles.id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Erstelle eine Prozedur, um fehlende Profile zu erstellen
CREATE OR REPLACE PROCEDURE create_missing_profiles()
LANGUAGE plpgsql
AS $$
DECLARE
  user_record RECORD;
  success_count INT := 0;
  error_count INT := 0;
BEGIN
  -- Für jeden Benutzer ohne Profil
  FOR user_record IN 
    SELECT * FROM get_users_without_profiles()
  LOOP
    BEGIN
      -- Erstelle ein Profil mit der Rolle 'CUSTOMER'
      INSERT INTO profiles (id, email, role, created_at, updated_at)
      VALUES (
        user_record.id,
        user_record.email,
        'CUSTOMER',
        NOW(),
        NOW()
      );
      
      success_count := success_count + 1;
      RAISE NOTICE 'Profil für % erfolgreich erstellt', user_record.email;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE NOTICE 'Fehler beim Erstellen des Profils für %: %', user_record.email, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Zusammenfassung: % Profile erstellt, % Fehler', success_count, error_count;
END;
$$;

-- Ausführen der Prozedur (auskommentiert - manuell ausführen)
-- CALL create_missing_profiles();
