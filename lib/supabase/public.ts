import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Cookie-free and anonymous: never reuse a request's session in the shared cache.
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}
