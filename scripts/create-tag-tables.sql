-- Erstellen der user_tag Tabelle
CREATE TABLE IF NOT EXISTS public.user_tag (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Erstellen der user_tag_assignments Tabelle
CREATE TABLE IF NOT EXISTS public.user_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.user_tag(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, tag_id)
);

-- Index für schnellere Abfragen
CREATE INDEX IF NOT EXISTS user_tag_assignments_user_id_idx ON public.user_tag_assignments(user_id);
CREATE INDEX IF NOT EXISTS user_tag_assignments_tag_id_idx ON public.user_tag_assignments(tag_id);
