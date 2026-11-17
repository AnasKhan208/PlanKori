"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import { demoStore } from "@/lib/demo-store";

export async function loginAction(input: LoginInput) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const { email, password } = parsed.data;

  // 1. Try Supabase Auth
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data?.user && !error) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      const role = profile?.role || data.user.user_metadata?.role || "host";
      return { success: true, role };
    }
  } catch (err) {
    console.warn("[loginAction] Supabase connection failed, checking demo fallback:", err);
  }

  // 2. Demo fallback authentication for predefined test accounts
  const demoProfile = demoStore.getProfileByEmail(email);
  if (demoProfile && (password === "Demo@12345" || password === "password")) {
    const cookieStore = await cookies();
    cookieStore.set(
      "plankori-demo-session",
      encodeURIComponent(
        JSON.stringify({
          id: demoProfile.id,
          email: demoProfile.email,
          role: demoProfile.role,
          full_name: demoProfile.full_name,
          phone: demoProfile.phone,
        })
      ),
      {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      }
    );

    return { success: true, role: demoProfile.role };
  }

  return { success: false, error: "Invalid email or password." };
}
