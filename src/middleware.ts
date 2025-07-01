// Middleware is disabled to adopt a more performant, middleware-less authentication strategy.
// Authentication is now handled in getServerSideProps for initial page loads and via JWT verification in API routes.
// See: https://medium.com/@jamesleeht/how-to-use-supabase-auth-in-next-js-without-extra-latency-and-make-pages-load-faster-33a045d15c78

export function middleware() {}

export const config = {
  matcher: [],
};