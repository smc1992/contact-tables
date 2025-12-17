-- Enable RLS on email_campaigns table
ALTER TABLE "public"."email_campaigns" ENABLE ROW LEVEL SECURITY;

-- Create policies for email_campaigns
CREATE POLICY "Allow admins full access to email_campaigns" 
  ON "public"."email_campaigns" 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM "public"."profiles" 
      WHERE "id" = auth.uid() AND "role" = 'ADMIN'
    )
  );

-- Enable RLS on email_recipients table
ALTER TABLE "public"."email_recipients" ENABLE ROW LEVEL SECURITY;

-- Create policies for email_recipients
CREATE POLICY "Allow admins full access to email_recipients" 
  ON "public"."email_recipients" 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM "public"."profiles" 
      WHERE "id" = auth.uid() AND "role" = 'ADMIN'
    )
  );

-- Enable RLS on email_batches table
ALTER TABLE "public"."email_batches" ENABLE ROW LEVEL SECURITY;

-- Create policies for email_batches
CREATE POLICY "Allow admins full access to email_batches" 
  ON "public"."email_batches" 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM "public"."profiles" 
      WHERE "id" = auth.uid() AND "role" = 'ADMIN'
    )
  );

-- Enable RLS on email_templates table
ALTER TABLE "public"."email_templates" ENABLE ROW LEVEL SECURITY;

-- Create policies for email_templates
CREATE POLICY "Allow admins full access to email_templates" 
  ON "public"."email_templates" 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM "public"."profiles" 
      WHERE "id" = auth.uid() AND "role" = 'ADMIN'
    )
  );

-- Enable RLS on unsubscribe_tokens table
ALTER TABLE "public"."unsubscribe_tokens" ENABLE ROW LEVEL SECURITY;

-- Create policies for unsubscribe_tokens
CREATE POLICY "Allow admins full access to unsubscribe_tokens" 
  ON "public"."unsubscribe_tokens" 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM "public"."profiles" 
      WHERE "id" = auth.uid() AND "role" = 'ADMIN'
    )
  );

-- Enable RLS on unsubscribed_emails table
ALTER TABLE "public"."unsubscribed_emails" ENABLE ROW LEVEL SECURITY;

-- Create policies for unsubscribed_emails
CREATE POLICY "Allow admins full access to unsubscribed_emails" 
  ON "public"."unsubscribed_emails" 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM "public"."profiles" 
      WHERE "id" = auth.uid() AND "role" = 'ADMIN'
    )
  );

-- Add service role access policy for all tables
CREATE POLICY "Allow service role full access to email_campaigns" 
  ON "public"."email_campaigns" 
  FOR ALL 
  TO service_role 
  USING (true);

CREATE POLICY "Allow service role full access to email_recipients" 
  ON "public"."email_recipients" 
  FOR ALL 
  TO service_role 
  USING (true);

CREATE POLICY "Allow service role full access to email_batches" 
  ON "public"."email_batches" 
  FOR ALL 
  TO service_role 
  USING (true);

CREATE POLICY "Allow service role full access to email_templates" 
  ON "public"."email_templates" 
  FOR ALL 
  TO service_role 
  USING (true);

CREATE POLICY "Allow service role full access to unsubscribe_tokens" 
  ON "public"."unsubscribe_tokens" 
  FOR ALL 
  TO service_role 
  USING (true);

CREATE POLICY "Allow service role full access to unsubscribed_emails" 
  ON "public"."unsubscribed_emails" 
  FOR ALL 
  TO service_role 
  USING (true);
