-- Überprüfen, ob die email_campaigns Tabelle existiert
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_campaigns') THEN
    RAISE NOTICE 'Tabelle email_campaigns existiert';
  ELSE
    RAISE EXCEPTION 'Tabelle email_campaigns existiert nicht';
  END IF;
END $$;

-- Überprüfen, ob RLS für email_campaigns aktiviert ist
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'email_campaigns'
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE 'RLS ist für email_campaigns aktiviert';
  ELSE
    RAISE NOTICE 'RLS ist für email_campaigns NICHT aktiviert';
    
    -- RLS aktivieren, falls nicht aktiviert
    ALTER TABLE "public"."email_campaigns" ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS wurde für email_campaigns aktiviert';
  END IF;
END $$;

-- Überprüfen, ob die service_role Policy existiert
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'email_campaigns'
    AND policyname = 'Allow service role full access to email_campaigns'
  ) THEN
    RAISE NOTICE 'Policy für service_role existiert bereits';
    
    -- Löschen der bestehenden Policy, um sie neu zu erstellen
    DROP POLICY IF EXISTS "Allow service role full access to email_campaigns" ON "public"."email_campaigns";
    RAISE NOTICE 'Bestehende Policy wurde gelöscht';
  END IF;
END $$;

-- Neue Policy für service_role erstellen
CREATE POLICY "Allow service role full access to email_campaigns" 
  ON "public"."email_campaigns" 
  AS PERMISSIVE
  FOR ALL 
  TO service_role 
  USING (true)
  WITH CHECK (true);

-- Überprüfen, ob die Admin Policy existiert
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'email_campaigns'
    AND policyname = 'Allow admins full access to email_campaigns'
  ) THEN
    RAISE NOTICE 'Policy für Admins existiert bereits';
    
    -- Löschen der bestehenden Policy, um sie neu zu erstellen
    DROP POLICY IF EXISTS "Allow admins full access to email_campaigns" ON "public"."email_campaigns";
    RAISE NOTICE 'Bestehende Admin-Policy wurde gelöscht';
  END IF;
END $$;

-- Neue Policy für Admins erstellen
CREATE POLICY "Allow admins full access to email_campaigns" 
  ON "public"."email_campaigns" 
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

-- Überprüfen, ob die Tabelle für alle zugänglich ist
DO $$
BEGIN
  -- Überprüfen, ob die Tabelle für alle zugänglich ist
  GRANT ALL ON "public"."email_campaigns" TO authenticated;
  GRANT ALL ON "public"."email_campaigns" TO service_role;
  GRANT ALL ON "public"."email_campaigns" TO anon;
  
  RAISE NOTICE 'Berechtigungen für email_campaigns wurden aktualisiert';
END $$;

-- Überprüfen, ob der Tabelleneigentümer korrekt ist
DO $$
DECLARE
  current_owner TEXT;
BEGIN
  SELECT tableowner INTO current_owner FROM pg_tables 
  WHERE schemaname = 'public' AND tablename = 'email_campaigns';
  
  RAISE NOTICE 'Aktueller Eigentümer der email_campaigns Tabelle: %', current_owner;
END $$;
