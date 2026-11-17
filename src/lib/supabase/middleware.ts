import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicConfig } from "@/lib/config";
import type { Database, UserRole } from "@/types/db";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Explicit safety check: Never run middleware session logic on payment webhooks/callbacks
  if (pathname.startsWith("/api/payments")) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    publicConfig.supabaseUrl,
    publicConfig.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Check Supabase authenticated user first
  let user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // If Supabase server is not running locally, catch gracefully
    user = null;
  }

  // Check demo session cookie fallback
  const demoCookie = request.cookies.get("plankori-demo-session");
  let role: UserRole = "host";

  if (user) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role) {
        role = profile.role;
      } else {
        const metaRole = user.user_metadata?.role as UserRole | undefined;
        if (metaRole === "vendor" || metaRole === "admin") {
          role = metaRole;
        }
      }
    } catch {
      const metaRole = user.user_metadata?.role as UserRole | undefined;
      if (metaRole === "vendor" || metaRole === "admin") {
        role = metaRole;
      }
    }
  } else if (demoCookie?.value) {
    try {
      const parsed = JSON.parse(decodeURIComponent(demoCookie.value));
      if (parsed && parsed.id && parsed.role) {
        user = {
          id: parsed.id,
          email: parsed.email,
          user_metadata: { role: parsed.role, full_name: parsed.full_name },
        };
        role = parsed.role;
      }
    } catch {
      // invalid cookie
    }
  }

  // Redirect authenticated users away from /login and /signup
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const redirectTo = request.nextUrl.searchParams.get("redirectTo");
    if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (role === "vendor") {
      return NextResponse.redirect(new URL("/vendor/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Protected route checking
  const isHostRoute = pathname.startsWith("/dashboard");
  const isVendorRoute = pathname.startsWith("/vendor");
  const isAdminRoute = pathname.startsWith("/admin");

  if (isHostRoute || isVendorRoute || isAdminRoute) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based authorization
    if (isAdminRoute && role !== "admin") {
      const fallbackUrl = role === "vendor" ? "/vendor/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(fallbackUrl, request.url));
    }

    if (isVendorRoute && role !== "vendor" && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (isHostRoute && role !== "host" && role !== "admin") {
      return NextResponse.redirect(new URL("/vendor/dashboard", request.url));
    }
  }

  return supabaseResponse;
}
