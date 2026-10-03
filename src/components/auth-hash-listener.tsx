"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";

// Supabase invite emails land with an implicit-flow hash (#access_token=…&refresh_token=…
// or #error=…). The SSR browser client defaults to PKCE and rejects that hash, so
// we read the tokens ourselves and set the session, which stores it in cookies.
export function AuthHashListener() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;

    if (hash.includes("error=")) {
      router.replace("/invite/unavailable");
      return;
    }
    if (!hash.includes("access_token=")) return;

    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken || !refreshToken) {
      router.replace("/invite/unavailable");
      return;
    }

    let cancelled = false;
    createClient()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (cancelled) return;
        router.replace(error ? "/invite/unavailable" : "/");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
