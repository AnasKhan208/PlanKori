import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/db";
import { publicConfig } from "@/lib/config";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (typeof window === "undefined") {
    return createBrowserClient<Database>(
      publicConfig.supabaseUrl,
      publicConfig.supabaseAnonKey
    );
  }

  if (!client) {
    client = createBrowserClient<Database>(
      publicConfig.supabaseUrl,
      publicConfig.supabaseAnonKey
    );
  }

  return client;
}
