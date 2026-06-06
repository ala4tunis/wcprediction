import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncUserToDb } from "@/lib/auth-actions";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");
  const next = searchParams.get("next") || "/dashboard";

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error_description || error)}`
    );
  }

  if (code) {
    const supabase = createClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
      );
    }

    if (data?.user) {
      // Sync the OAuth logged-in user to public.User in Prisma
      await syncUserToDb(data.user);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
