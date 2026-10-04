# Catalyst

The Catalyst home answers "Where am I needed?". A Catalyst sees only the churches assigned to them, reviews each pastor's check-ins and goals, and replies in the goal conversation.

## Flow

1. Catalyst signs in. `/` sends an onboarded Catalyst to `/catalyst` (not onboarded → `/onboarding/catalyst`).
2. The garden lists assigned churches and puts the ones needing attention under **Where your presence helps**.
3. Catalyst opens a church → `/catalyst/planters/<pastor id>`.
4. Catalyst reads the latest check-in and acknowledges it with a support note, or replies under a goal.
5. Back on the garden, the church drops out of **Where your presence helps** once its latest check-in is acknowledged.

## Routes

| Route | What it shows |
| --- | --- |
| `/catalyst` | Garden: greeting, summary counts, globe, Where your presence helps, Invite a pastor, pastor invitations, church list |
| `/catalyst/planters/[id]` | Church page: church, pastor, start date, tree stage, check-ins, goals, latest progress, conversation |
| `/catalyst/categories` | Objective categories: add, edit, reorder, delete |

The #61 workspace at `/dashboard` is kept as is. `/catalyst` is the Catalyst landing page.

## Who sees what

- A Catalyst sees a church only when `churches.catalyst_id` is their user id. Another Catalyst's church, or a church in another organization, returns 404 on the church page.
- Replies and acknowledgements check the same assignment on the server before writing. The author always comes from the session.
- Pastor invitations show only invitations this Catalyst sent (`invitations.invited_by`). The invite token is never read.
- Category changes are limited to the Catalyst's organization by RLS.

## Status rules

Computed in `src/app/[locale]/catalyst/garden-status.ts` from real data.

| Badge | When |
| --- | --- |
| **Support requested** | The latest check-in asks for support and this Catalyst hasn't acknowledged it |
| **Review check-in** | There is a latest check-in this Catalyst hasn't acknowledged (no support asked) |
| **Check-in due** | No check-in in the last 7 days, or none yet |

"Last activity" uses `progress_entries` and `check_ins`, not objective edits. If the garden can't load, it shows an error and hides the counts and the all-clear message.

## Acknowledging a check-in

The Catalyst writes a support note under the latest check-in. It is saved in `dialogue_messages` under a goal, with `check_in_id` set to that check-in. Only a message linked this way counts as a review. An ordinary goal reply leaves `check_in_id` null and does not clear the badge.

Migration: `supabase/migrations/20261003235900_dialogue_check_in_link.sql` adds `dialogue_messages.check_in_id`. Apply it before deploying.

## Pastor invitations

The garden lists the pastor invitations this Catalyst sent, with **Pending**, **Expired** or **Accepted**. Pending ones list first. Sending still goes through `/invite-pastor` (see [invitations](invitations.md)).

## Categories

- Add, rename, edit the description and reorder (`sort_order`).
- Delete is blocked while any objective uses the category, so no planter's history is lost.
- The prayer category (`kind = 'prayer'`) can be renamed but not deleted, and isn't counted as an objective category on the garden.

## Test locally

Use the test accounts from the team channel. Open two windows so sessions don't mix: a normal window for the Catalyst and a private window for the Pastor.

1. **Pastor**: sign in → `/dashboard` → submit a check-in with a support request.
2. **Catalyst**: sign in → `/catalyst` → the church shows **Support requested**.
3. Open the church → **Needs your review** → write a note → **Acknowledge check-in** → **Reviewed · date**.
4. Back on the garden, the church is no longer under **Where your presence helps**.
5. **Outsider** (another organization): open `/en/catalyst/planters/<a demo pastor id>` → 404.

```bash
pnpm exec vitest run tests/catalyst   # Catalyst unit and component tests
```

## Not yet

- Per-objective check-ins and objective statuses (Planning, In Progress, At Risk, Complete, Archived) are waiting on the shared objective model.
- Prayer and support replies on the Catalyst side will use the #64 conversation backend once its migration is applied.
