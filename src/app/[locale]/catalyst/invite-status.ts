// Pastor invitations this Catalyst has sent, read from the shared invitations
// table. The token is never selected, so links can't leak through this view.

import { invitationStatus } from "@/lib/invitations";

export const INVITES_SHOWN = 10;

export type InviteStatus = "pending" | "accepted" | "expired";

export type InviteView = {
  id: string;
  email: string;
  churchName: string | null;
  status: InviteStatus;
  sentAt: string;
};

type InvitationRow = {
  id: string;
  email: string;
  church_name: string | null;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
};

const ORDER: Record<InviteStatus, number> = { pending: 0, expired: 1, accepted: 2 };

// Pending first (they may need a nudge), then expired, then accepted; newest first within each.
export function buildInviteStatuses(rows: InvitationRow[], now: Date): InviteView[] {
  return rows
    .map((row) => {
      const state = invitationStatus(row, now);
      return {
        id: row.id,
        email: row.email,
        churchName: row.church_name,
        status: (state === "valid" ? "pending" : state) as InviteStatus,
        sentAt: row.created_at,
      };
    })
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || b.sentAt.localeCompare(a.sentAt))
    .slice(0, INVITES_SHOWN);
}
