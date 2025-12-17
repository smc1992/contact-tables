// DEPRECATED: This script is redundant and contains flawed logic.
// It attempts to manage user authentication (email, password) directly in the public.profiles table,
// which bypasses Supabase's auth.users table and security mechanisms.

// All data seeding should be consolidated into the primary seeding script at `prisma/seed.js`.

console.warn('This script (generate-test-data.js) is deprecated and should not be run.');

