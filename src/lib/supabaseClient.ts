import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';

// This function should be called client-side, for example, in a useEffect hook or within useState initializer in _app.tsx
export const getSupabaseBrowserClient = () => createBrowserSupabaseClient();
