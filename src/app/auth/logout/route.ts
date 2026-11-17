import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {}

  const cookieStore = await cookies();
  cookieStore.delete("plankori-demo-session");

  return NextResponse.redirect(new URL("/login", request.url));
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {}

  const cookieStore = await cookies();
  cookieStore.delete("plankori-demo-session");

  return NextResponse.redirect(new URL("/login", request.url));
}
