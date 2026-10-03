// Types + constants only. Safe to import from client components.
// Server-side lookups live in queries.ts.

// Matches profiles.role / invitations.role in the data model.
export type Role = "catalyst" | "planter";

export type Invite = {
  token: string;
  churchName: string; // organizations.name
  role: Role;
  invitedBy?: string; // not in the schema yet, see note in queries.ts
};

export const ROLE_LABELS: Record<Role, string> = {
  planter: "Church planter",
  catalyst: "Catalyst",
};

// Stored in profiles.locale as BCP-47 codes.
export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
  { code: "zh", label: "中文" },
  { code: "tl", label: "Tagalog" },
] as const;
