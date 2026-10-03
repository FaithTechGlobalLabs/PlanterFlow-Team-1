import "server-only";

/** Use configured deployment origin, never a caller-controlled Host header. */
export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL must be set for this deployment.");
  }
  const url = new URL(configured || "http://localhost:3000");
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin.");
  }
  return url.origin;
}
