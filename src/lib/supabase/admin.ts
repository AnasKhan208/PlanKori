import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";
import { publicConfig, serverConfig } from "@/lib/config";

/**
 * Service-Role Supabase Client (Server-Side Only).
 * Bypasses Row Level Security (RLS).
 * Use only for administrative tasks, automated background tasks, and webhook handling.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("Admin Supabase client cannot be instantiated on the client side.");
  }

  const serviceRoleKey = serverConfig.supabaseServiceRoleKey();
  if (!serviceRoleKey || serviceRoleKey === "dummy-service-role-key") {
    // In dev or tests where env isn't provided yet, warning or client creation
  }

  return createSupabaseClient<Database>(
    publicConfig.supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
