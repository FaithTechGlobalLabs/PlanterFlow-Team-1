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
    const params = new URLSearchParams(hash.slice(1));
    const isRecovery = params.get("type") === "recovery";
    const failurePath = isRecovery ? "/recover?error=link" : "/invite/unavailable";

    if (hash.includes("error=")) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      router.replace(failurePath);
      return;
    }
    if (!hash.includes("access_token=")) return;

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken || !refreshToken) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      router.replace(failurePath);
      return;
    }

    // Strip credentials immediately; StrictMode's second effect sees no hash.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    createClient()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        router.replace(error ? failurePath : isRecovery ? "/recover/update" : "/");
      })
      .catch(() => router.replace(failurePath));
  }, [router]);

  return null;
}
