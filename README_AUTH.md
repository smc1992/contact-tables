# Supabase Authentication Pattern for Next.js Pages Router

This document outlines the correct and standardized approach for handling server-side authentication and authorization within this project to prevent future bugs and inconsistencies.

## The Problem

The application suffered from persistent redirect loops and unauthorized errors. The root cause was an inconsistent implementation of Supabase client initialization across different parts of the application (pages using `getServerSideProps` and API routes).

- Some pages used the modern `@supabase/ssr` library via a helper.
- Other pages and wrappers used the outdated `@supabase/auth-helpers-nextjs`.
- Some pages implemented the client creation logic inline.
- Admin pages used inconsistent authentication methods (some client-side, some server-side).
- Admin API routes requiring service role access were implemented inconsistently.

This led to a fragile system where the user's session was not reliably retrieved, causing authentication checks to fail incorrectly.

## The Solution: A Standardized Approach

To fix this, we have standardized on a single, reliable method for creating the Supabase client on the server.

### 1. The Central `createClient` Helper

All server-side logic **must** use the central helper function located at `src/utils/supabase/server.ts`.

```typescript
// src/utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
// ... implementation details ...

export function createClient(context: GetServerSidePropsContext | { req: NextApiRequest; res: NextApiResponse }) {
  // ... returns a configured Supabase client instance
}
```

### 2. Usage in `getServerSideProps`

Any page requiring server-side data fetching and authentication must import and use this helper.

```typescript
// Example: src/pages/restaurant/dashboard/some-page.tsx

import { createClient } from '../../../utils/supabase/server';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createClient(context);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Handle unauthenticated user -> redirect
  }

  // ... rest of the logic
};
```

### 3. Usage in API Routes

API routes follow the exact same pattern.

```typescript
// Example: src/pages/api/some-route.ts

import { createClient } from '../../../utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ... rest of the logic
}
```

### 4. Role-Based Authorization

User role checks should be performed against the `user_metadata` object, which is directly available on the user object. This avoids an extra, potentially failing, database call.

```typescript
// Correct way to check role
const userRole = user.user_metadata?.role;
if (userRole !== 'RESTAURANT') {
  // Handle unauthorized role -> redirect
}
```

By strictly adhering to this pattern, we ensure that authentication is handled consistently and reliably across the entire application.

## Admin Pages Authentication Standard

### 1. Server-Side Authentication with `withAuth` HOC

All admin pages **must** use the `withAuth` Higher-Order Component for consistent server-side authentication and role-based access control.

```typescript
// Example: src/pages/admin/some-admin-page.tsx
import withAuth from '@/utils/withAuth';

const AdminPage = ({ user }) => {
  // Component implementation
};

export default withAuth(AdminPage);
```

The `withAuth` HOC:
- Uses the central `createClient` helper for authentication
- Performs role checks against 'admin' or 'ADMIN' roles
- Redirects unauthenticated users to `/auth/login`
- Redirects unauthorized users to the homepage

### 2. Admin API Routes

API routes that require admin privileges **must** use the `createAdminClient` helper for operations requiring the service role key.

```typescript
// Example: src/pages/api/admin/some-admin-route.ts
import { createClient, createAdminClient } from '@/utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Authenticate the user with regular client
  const supabase = createClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || (user.user_metadata.role !== 'admin' && user.user_metadata.role !== 'ADMIN')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Use admin client for privileged operations
  const adminClient = createAdminClient();
  
  try {
    // Perform admin operations
    // ...
    
    return res.status(200).json({ data });
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### 3. Never Use Admin Client in Client-Side Code

Never attempt to use the admin client or service role key in client-side code. Always create API routes for operations requiring admin privileges.

### 4. Consistent Error Handling

All admin API routes should implement consistent error handling:

```typescript
try {
  // Admin operations
} catch (error) {
  console.error('Specific error context:', error);
  return res.status(500).json({
    error: 'Descriptive error message',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}
```

### 5. Environment Variables

Ensure these environment variables are properly set in both local development and production:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the client.
