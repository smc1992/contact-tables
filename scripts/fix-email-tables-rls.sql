-- RLS für email_batches aktivieren und Richtlinien erstellen
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_batches') THEN
    -- RLS aktivieren
    ALTER TABLE "public"."email_batches" ENABLE ROW LEVEL SECURITY;
    
    -- Bestehende Richtlinien löschen
    DROP POLICY IF EXISTS "Allow service role full access to email_batches" ON "public"."email_batches";
    DROP POLICY IF EXISTS "Allow admins full access to email_batches" ON "public"."email_batches";
    
    -- Neue Richtlinien erstellen
    CREATE POLICY "Allow service role full access to email_batches" 
      ON "public"."email_batches" 
      AS PERMISSIVE
      FOR ALL 
      TO service_role 
      USING (true)
      WITH CHECK (true);
      
    CREATE POLICY "Allow admins full access to email_batches" 
      ON "public"."email_batches" 
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
      
    -- Berechtigungen aktualisieren
    GRANT ALL ON "public"."email_batches" TO authenticated;
    GRANT ALL ON "public"."email_batches" TO service_role;
    GRANT ALL ON "public"."email_batches" TO anon;
    
    RAISE NOTICE 'RLS für email_batches erfolgreich konfiguriert';
  ELSE
    RAISE NOTICE 'Tabelle email_batches existiert nicht';
  END IF;
END $$;

-- RLS für email_recipients aktivieren und Richtlinien erstellen
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_recipients') THEN
    -- RLS aktivieren
    ALTER TABLE "public"."email_recipients" ENABLE ROW LEVEL SECURITY;
    
    -- Bestehende Richtlinien löschen
    DROP POLICY IF EXISTS "Allow service role full access to email_recipients" ON "public"."email_recipients";
    DROP POLICY IF EXISTS "Allow admins full access to email_recipients" ON "public"."email_recipients";
    
    -- Neue Richtlinien erstellen
    CREATE POLICY "Allow service role full access to email_recipients" 
      ON "public"."email_recipients" 
      AS PERMISSIVE
      FOR ALL 
      TO service_role 
      USING (true)
      WITH CHECK (true);
      
    CREATE POLICY "Allow admins full access to email_recipients" 
      ON "public"."email_recipients" 
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
      
    -- Berechtigungen aktualisieren
    GRANT ALL ON "public"."email_recipients" TO authenticated;
    GRANT ALL ON "public"."email_recipients" TO service_role;
    GRANT ALL ON "public"."email_recipients" TO anon;
    
    RAISE NOTICE 'RLS für email_recipients erfolgreich konfiguriert';
  ELSE
    RAISE NOTICE 'Tabelle email_recipients existiert nicht';
  END IF;
END $$;

-- RLS für unsubscribe_tokens aktivieren und Richtlinien erstellen
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'unsubscribe_tokens') THEN
    -- RLS aktivieren
    ALTER TABLE "public"."unsubscribe_tokens" ENABLE ROW LEVEL SECURITY;
    
    -- Bestehende Richtlinien löschen
    DROP POLICY IF EXISTS "Allow service role full access to unsubscribe_tokens" ON "public"."unsubscribe_tokens";
    DROP POLICY IF EXISTS "Allow admins full access to unsubscribe_tokens" ON "public"."unsubscribe_tokens";
    
    -- Neue Richtlinien erstellen
    CREATE POLICY "Allow service role full access to unsubscribe_tokens" 
      ON "public"."unsubscribe_tokens" 
      AS PERMISSIVE
      FOR ALL 
      TO service_role 
      USING (true)
      WITH CHECK (true);
      
    CREATE POLICY "Allow admins full access to unsubscribe_tokens" 
      ON "public"."unsubscribe_tokens" 
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
      
    -- Berechtigungen aktualisieren
    GRANT ALL ON "public"."unsubscribe_tokens" TO authenticated;
    GRANT ALL ON "public"."unsubscribe_tokens" TO service_role;
    GRANT ALL ON "public"."unsubscribe_tokens" TO anon;
    
    RAISE NOTICE 'RLS für unsubscribe_tokens erfolgreich konfiguriert';
  ELSE
    RAISE NOTICE 'Tabelle unsubscribe_tokens existiert nicht';
  END IF;
END $$;

-- RLS für unsubscribed_emails aktivieren und Richtlinien erstellen
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'unsubscribed_emails') THEN
    -- RLS aktivieren
    ALTER TABLE "public"."unsubscribed_emails" ENABLE ROW LEVEL SECURITY;
    
    -- Bestehende Richtlinien löschen
    DROP POLICY IF EXISTS "Allow service role full access to unsubscribed_emails" ON "public"."unsubscribed_emails";
    DROP POLICY IF EXISTS "Allow admins full access to unsubscribed_emails" ON "public"."unsubscribed_emails";
    
    -- Neue Richtlinien erstellen
    CREATE POLICY "Allow service role full access to unsubscribed_emails" 
      ON "public"."unsubscribed_emails" 
      AS PERMISSIVE
      FOR ALL 
      TO service_role 
      USING (true)
      WITH CHECK (true);
      
    CREATE POLICY "Allow admins full access to unsubscribed_emails" 
      ON "public"."unsubscribed_emails" 
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
      
    -- Berechtigungen aktualisieren
    GRANT ALL ON "public"."unsubscribed_emails" TO authenticated;
    GRANT ALL ON "public"."unsubscribed_emails" TO service_role;
    GRANT ALL ON "public"."unsubscribed_emails" TO anon;
    
    RAISE NOTICE 'RLS für unsubscribed_emails erfolgreich konfiguriert';
  ELSE
    RAISE NOTICE 'Tabelle unsubscribed_emails existiert nicht';
  END IF;
END $$;
