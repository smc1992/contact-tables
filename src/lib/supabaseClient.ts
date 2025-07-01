import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Supabase URL, Anon Key, or Service Role Key is not defined in environment variables.');
}

// Standard client for use in the browser (RLS is enforced)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for use in server-side routes, bypassing RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
