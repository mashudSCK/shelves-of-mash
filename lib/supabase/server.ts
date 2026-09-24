import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Use this inside Server Components, Server Actions, and Route Handlers.
// Each call reads the current request's cookies, so always create a fresh
// client per request rather than a module-level singleton.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component without a mutable response.
          }
        },
      },
    }
  );
}

// Service-role client for trusted server-only operations (admin writes that
// must bypass RLS, e.g. analytics aggregation). NEVER import this in a file
// that could be bundled client-side; it has full database access.
export function createServiceClient() {
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
