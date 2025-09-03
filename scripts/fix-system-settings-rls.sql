-- RLS für system_settings aktivieren und Richtlinien erstellen
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_settings') THEN
    -- RLS aktivieren
    ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;
    
    -- Bestehende Richtlinien löschen
    DROP POLICY IF EXISTS "Allow service role full access to system_settings" ON "public"."system_settings";
    DROP POLICY IF EXISTS "Allow admins full access to system_settings" ON "public"."system_settings";
    DROP POLICY IF EXISTS "Allow authenticated read access to system_settings" ON "public"."system_settings";
    
    -- Neue Richtlinien erstellen
    CREATE POLICY "Allow service role full access to system_settings" 
      ON "public"."system_settings" 
      AS PERMISSIVE
      FOR ALL 
      TO service_role 
      USING (true)
      WITH CHECK (true);
      
    CREATE POLICY "Allow admins full access to system_settings" 
      ON "public"."system_settings" 
      AS PERMISSIVE
      FOR ALL 
      TO authenticated 
      USING (
        EXISTS (
          SELECT 1 FROM "public"."profiles" 
          WHERE "id" = auth.uid() AND "role" = 'ADMIN'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM "public"."profiles" 
          WHERE "id" = auth.uid() AND "role" = 'ADMIN'
        )
      );
      
    CREATE POLICY "Allow authenticated read access to system_settings" 
      ON "public"."system_settings" 
      AS PERMISSIVE
      FOR SELECT 
      TO authenticated 
      USING (true);
      
    -- Berechtigungen aktualisieren
    GRANT ALL ON "public"."system_settings" TO authenticated;
    GRANT ALL ON "public"."system_settings" TO service_role;
    GRANT SELECT ON "public"."system_settings" TO anon;
    
    RAISE NOTICE 'RLS für system_settings erfolgreich konfiguriert';
  ELSE
    RAISE NOTICE 'Tabelle system_settings existiert nicht';
  END IF;
END $$;
