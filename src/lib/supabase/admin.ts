import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function hasAdminCredentials() {
  return Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Service-role client. Bypasses Row Level Security.
 * Server only. Use for invitations, seeding default categories, and PDF export.
 * Never import this from a Client Component.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
