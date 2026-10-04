import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "@/i18n/routing";
import { getSupabaseConfig } from "@/lib/supabase/config";

const handleI18n = createMiddleware(routing);
const localePattern = new RegExp(`^/(${routing.locales.join("|")})(?=/|$)`);

export async function proxy(request: NextRequest) {
  // Callback validates its own auth code and writes its own session cookies.
  if (request.nextUrl.pathname === "/auth/callback") return NextResponse.next();
  let response = handleI18n(request);
  if (response.status >= 300 && response.status < 400) {
    return response;
  }

  const { url, key } = getSupabaseConfig();
  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          const previousCookies = response.cookies.getAll();
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Rebuild the locale rewrite with the refreshed request cookies too.
          response = handleI18n(request);
          previousCookies.forEach((cookie) => response.cookies.set(cookie));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
          Object.entries(headers ?? {}).forEach(([name, value]) => response.headers.set(name, value));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  response.headers.set("Cache-Control", "private, no-store");
  const redirectWithCookies = (path: string) => {
    const destination = NextResponse.redirect(new URL(path, request.url));
    response.cookies.getAll().forEach((cookie) => destination.cookies.set(cookie));
    destination.headers.set("Cache-Control", "private, no-store");
    return destination;
  };

  const { pathname } = request.nextUrl;
  const localeMatch = pathname.match(localePattern);
  const locale = localeMatch?.[1] ?? routing.defaultLocale;
  const path = pathname.replace(localePattern, "") || "/";
  const isPublic =
    path === "/preview" ||
    path === "/login" ||
    path === "/invite" ||
    path.startsWith("/invite/") ||
    path.startsWith("/team-invite/") ||
    path === "/recover" || path === "/recover/update";

  if (!user && !isPublic) {
    return redirectWithCookies(`/${locale}/login`);
  }
  if (user && path === "/login") {
    return redirectWithCookies(`/${locale}`);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
