# Invitations

Everyone joins through one Supabase magic-link invitation flow. No one can create an account without an invitation.

| Who invites | Invites | Starts at | Link lands on | Role |
| --- | --- | --- | --- | --- |
| Admin catalyst | Catalyst | `/invite-catalyst` | `/invite/<token>` | `catalyst` |
| Catalyst | Pastor | `/invite-pastor` | `/invite/<token>` | `planter` |
| Pastor (church set up) | Team member | `/invite-team` | `/team-invite/<token>` | `peer` |

## How it works

1. The server creates an `invitations` row (org, church, role and inviter come from the server, never the client) and calls `inviteUserByEmail()`.
2. The recipient opens the emailed link. `AuthHashListener` stores the Supabase session.
3. The invite page checks the token and asks for a name and password.
4. Accept (`src/lib/invitation-engine.ts`) requires a valid, unused, unexpired token whose email matches the signed-in session. It claims the invitation once, then creates the profile (and, for team members, the `church_memberships` row).
5. The user continues to role-specific onboarding: catalyst setup, church setup, or the team welcome page.

If the email can't be sent (rate limit, SMTP), the inviter gets a copyable app link (`/<locale>/invite/<token>` or `/team-invite/<token>`). Opening it without a session goes through `/api/invite-session/<token>`, which mints a fresh Supabase sign-in link, so the shared link can be opened repeatedly until the invitation is accepted or expires. Treat it like a password: anyone holding it can sign in as the invitee until then. The emailed Supabase link itself stays single-use.

## Test locally

```bash
pnpm dev                                        # in one terminal
pnpm exec vitest run                            # unit tests
pnpm exec playwright test                       # e2e; needs .env.local with the service-role key
```

By hand: sign in as an inviter, send an invite to a plus-address you control (for example `you+pastor1@gmail.com`), open the link, and accept. Reopening the link should show "invitation unavailable".

## Database

Migrations are in `supabase/migrations/`. Team invitations need `20261004000000_team_invitations.sql` (adds the `peer` role, `invitations.church_id`, and `church_memberships`). Apply with `pnpm dlx supabase db query --linked -f <file>`.
