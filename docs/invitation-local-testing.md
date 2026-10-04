# Test every workflow locally

End-to-end manual test of all invitation and sign-in workflows, using plus-addresses on one Gmail inbox. Background: [invitations](features/invitations.md).

## Sample accounts

All `+tag` addresses arrive in the same inbox (`siddhero97@gmail.com`) but are separate accounts. Use each address once; a second invite to the same address shows "already has an account". Need more? Bump the number.

| Role | Sample email | Invited by | Starts at |
| --- | --- | --- | --- |
| Admin (seed) | an `admin` or `seedAdmin` entry in `.env.json` | already exists | `/en/login` |
| Catalyst | `siddhero97+catalyst3@gmail.com` | admin | `/en/invite-catalyst` |
| Pastor | `siddhero97+pastor3@gmail.com` | catalyst | `/en/invite-pastor` |
| Team member | `siddhero97+team3@gmail.com` | pastor | `/en/invite-team` |

Each person you create picks their own password when accepting. Suggested: `Test-password-123` (8+ characters).

## Before you start

1. `.env.local` filled in, all `supabase/migrations/*.sql` applied.
2. `pnpm dev`, then open http://localhost:3000/en/login.
3. Use a **private window per person**. Tabs in one browser share a session.
4. Supabase's built-in mailer allows only a few emails per hour. If you see "The invitation email couldn't be sent", copy the link shown. It is a reusable app link, so you can open it as often as needed until the invitation is accepted.

## Flow A: Admin invites a Catalyst

1. Sign in as the admin (credentials in `.env.json`).
2. Open `/en/invite-catalyst`, enter `siddhero97+catalyst3@gmail.com`, send.
3. In a private window open the emailed (or copied) link.
   - Expect `/en/invite/<token>`, "You belong here.", Accept enabled.
4. Name `Test Catalyst3`, password `Test-password-123`, accept.
   - Expect `/en/onboarding/catalyst`. Finish it; you land on the catalyst home.
5. Open the link again. Expect "invitation unavailable".

## Flow B: Catalyst invites a Pastor

1. Sign in as `siddhero97+catalyst3@gmail.com` (the account from Flow A).
2. Open `/en/invite-pastor`: email `siddhero97+pastor3@gmail.com`, church `Hope Church`, send.
3. In a private window open the link.
   - Expect "Your church has a place here." with "Pastor · Hope Church · Assigned catalyst Test Catalyst3".
4. Name `Test Pastor3`, password, accept.
   - Expect `/en/onboarding/church`.
5. Fill church name, city, planting start date, then the first goal. Expect the planter home with the tree and your goal.
6. Back as the catalyst, `/en/dashboard` lists Test Pastor3.

## Flow C: Pastor invites a Team member

1. Sign in as `siddhero97+pastor3@gmail.com`.
2. On the home page choose **Invite a team member** (`/en/invite-team`). Enter `siddhero97+team3@gmail.com`, send.
3. In a private window open the link.
   - Expect `/en/team-invite/<token>` and the heading "Join Hope Church."
4. Name `Test Team3`, password, accept.
   - Expect `/en/team-invite/welcome`, then **Continue** to the team home with the church name and "Role: Team member".
5. In Supabase, `church_memberships` has one row for this user (role `peer`) and `profiles.role = peer`.
6. Visit `/en/dashboard` as the team member. Expect a redirect to the home page.

## Flow D: Sign-in, sign-out, recovery

For each of the three new accounts:
1. Sign out, then sign in at `/en/login` with the email and password.
2. Wrong password shows an error; signed-out visits to `/en/dashboard` redirect to login.
3. `/en/recover`: request a reset, open the link, set a new password. This link is single-use.

## Flow E: Reusable link and failure cases

| Case | How | Expect |
| --- | --- | --- |
| Reuse | Open the copied app link 3 times in fresh private windows before accepting | Works every time, Accept enabled |
| Used up | Open it after the invite is accepted | "invitation unavailable" |
| Expired | In Supabase set `expires_at` in the past on a pending invitation | "invitation unavailable" |
| Existing account | Invite an address that already has an account | "This email already has an account." |
| Wrong account | Open a team link while signed in as someone else | Accept disabled, or session error on submit |
| Wrong route | Open a team token at `/en/invite/<token>` | Redirects to `/en/team-invite/<token>` |
| Wrong role | Visit `/en/invite-team` as a catalyst or team member | Redirected away |
| Peer limits | Team member opens `/en/onboarding/church` | Cannot create a church |

## Automated checks

```bash
pnpm exec vitest run
pnpm exec playwright test     # throwaway users, cleans up after itself
```

Playwright does not send real email; use Flows A-C for that.

## Cleaning up

Delete `siddhero97+catalyst3`, `+pastor3`, `+team3` in Supabase Auth (profiles and memberships cascade), plus the test church and invitation rows. Remove test accounts from `.env.json` if you no longer need them.
