import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database, UserRole } from "@/types/db";
import { publicConfig } from "@/lib/config";
import { demoStore } from "@/lib/demo-store";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicConfig.supabaseUrl,
    publicConfig.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}

export interface CurrentUserSession {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  phone: string;
}

/**
 * Returns current authenticated user (from Supabase auth or fallback demo session)
 */
export async function getCurrentUser(): Promise<CurrentUserSession | null> {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      return {
        id: user.id,
        email: user.email || "",
        role: profile?.role || (user.user_metadata?.role as UserRole) || "host",
        full_name: profile?.full_name || (user.user_metadata?.full_name as string) || "",
        phone: profile?.phone || (user.user_metadata?.phone as string) || "",
      };
    }
  } catch {
    // Supabase offline or unreachable
  }

  // Check demo session cookie fallback
  const cookieStore = await cookies();
  const demoCookie = cookieStore.get("plankori-demo-session");
  if (demoCookie?.value) {
    try {
      const parsed = JSON.parse(decodeURIComponent(demoCookie.value));
      if (parsed && parsed.id) {
        const storeProfile = demoStore.getProfileById(parsed.id);
        return {
          id: parsed.id,
          email: parsed.email || "",
          role: (storeProfile?.role || parsed.role || "host") as UserRole,
          full_name: storeProfile?.full_name || parsed.full_name || "",
          phone: storeProfile?.phone || parsed.phone || "",
        };
      }
    } catch {
      // invalid cookie
    }
  }

  return null;
}
