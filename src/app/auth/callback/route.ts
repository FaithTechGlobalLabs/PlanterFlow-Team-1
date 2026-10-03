import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";

export async function GET(request: NextRequest) {
  const requestedLocale = request.nextUrl.searchParams.get("locale");
  const locale = routing.locales.find((value) => value === requestedLocale) ?? routing.defaultLocale;
  const code = request.nextUrl.searchParams.get("code");
  let success = false;
  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      success = !error;
    } catch {
      // Expired links and connection failures return to the recovery form.
      success = false;
    }
  }
  const destination = success ? `/${locale}/recover/update` : `/${locale}/recover?error=link`;
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
