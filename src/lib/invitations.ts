export function invitationStatus(
  inv: { accepted_at: string | null; expires_at: string },
  now = new Date()
): "valid" | "expired" | "accepted" {
  if (inv.accepted_at !== null) {
    return "accepted";
  }

  const expiresAt = new Date(inv.expires_at);
  if (now > expiresAt) {
    return "expired";
  }

  return "valid";
}
