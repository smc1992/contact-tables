// DEPRECATED: This script is conceptually flawed and should not be used.
// It attempts to manage user authentication (email, password) directly in the public.profiles table,
// which bypasses Supabase's auth.users table and security mechanisms.

// Admin users should be created via the Supabase dashboard or a proper seeding script
// that correctly separates authentication (Supabase Auth) and profile data (public.profiles).

console.warn('This script (create-admin.js) is deprecated and should not be run.');
 