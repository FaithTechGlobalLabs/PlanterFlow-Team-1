import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "@/i18n/routing";

const handleI18n = createMiddleware(routing);
const localePattern = new RegExp(`^/(${routing.locales.join("|")})(?=/|$)`);

export async function proxy(request: NextRequest) {
  const response = handleI18n(request);
  if (response.status >= 300 && response.status < 400) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const localeMatch = pathname.match(localePattern);
  const locale = localeMatch?.[1] ?? routing.defaultLocale;
  const path = pathname.replace(localePattern, "") || "/";
  const isPublic =
    path === "/login" ||
    path === "/invite" ||
    path.startsWith("/invite/") ||
    path === "/team-invite" ||
    path.startsWith("/team-invite/") ||
    path.startsWith("/recover");

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }
  if (user && path === "/login") {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
