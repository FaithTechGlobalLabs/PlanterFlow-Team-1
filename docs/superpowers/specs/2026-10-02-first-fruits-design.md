# First Fruits: Design Spec

Date: 2026-10-02
Status: Draft for team review at pitch night
Client: SEND Network, North American Mission Board (NAMB). Project owner is a Church Planting Catalyst for BC.

This document turns the client's hackathon brief into a buildable design for a weekend. Items marked **Assumption** were not in the brief and need a yes or no from the client or the team.

## 1. Intent

**Outcome.** A planter writes down their planting vision as concrete objectives, logs progress against them, and their Catalyst sees that progress without waiting for the next phone call.

**Who it is for.**

- **Planter.** Leads a new church plant. Funded by NAMB for four years. May prefer a language other than English.
- **Catalyst.** Coaches a group of planters in a region. Acts as the org admin.

**Success looks like.** The Catalyst can open the app on a Monday, see which planters have logged progress and which have gone quiet, and leave an encouraging note under the exact objective that needs it. The planter sees that note the same day.

**What exists today.** Verbal touchpoints with no shared record. Both sides may take private notes but nothing confirms a shared understanding.

## 2. Requirements from the brief

Numbered so PRs and issues can reference them.

| # | Requirement |
| --- | --- |
| R1 | Each planter has their own account. A planter sees only their own data. |
| R2 | The Catalyst is the org admin and sees every planter in their org. |
| R3 | The Catalyst sets the number, title, and description of objective categories. |
| R4 | Under each category, a planter defines the steps and activities they will do weekly or monthly. |
| R5 | Planter and Catalyst can hold a time-stamped dialogue under each objective, chat style. |
| R6 | A planter records prayer requests. The planter or the Catalyst can make a request visible to other planters in the same org. |
| R7 | The planter can use the app in their native language. |
| R8 | Planter and Catalyst can export objectives and dialogue to PDF. |

Default categories the Catalyst starts with:

1. Engage the City
2. Make Disciples
3. Plant the Church
4. Personal Relationship with Jesus (growth and struggle areas)
5. Prayer Requests

**Assumption A1.** Prayer Requests is listed as a category in the brief but behaves differently from the others (shareable with peers, no weekly cadence). We model it as its own feature, not as a category row. The Catalyst can still delete or rename the other four.

## 3. MVP scope for the weekend

Build order. Each row is a vertical slice that can be demoed on its own.

| Priority | Slice | Covers |
| --- | --- | --- |
| P0 | Auth, org, roles. Catalyst invites planters by email. | R1, R2 |
| P0 | Catalyst manages categories. Defaults seeded on org creation. | R3 |
| P0 | Planter creates objectives under a category and logs progress entries. | R4 |
| P0 | Catalyst dashboard: every planter, last activity date, objectives per category. | R2 |
| P1 | Dialogue thread under each objective. | R5 |
| P1 | Prayer requests with private or org visibility. Org wall shows shared requests. | R6 |
| P1 | Language switcher. English plus one more language seeded for the demo. | R7 |
| P2 | PDF export of one planter's objectives and dialogue. | R8 |

Out of scope for the weekend: notifications (email or push), file attachments, multiple orgs per Catalyst, mobile apps, analytics beyond last-activity.

**Assumption A2.** Progress is logged as a free-text note plus an optional number (for example "3 coffee meetings"). No numeric targets or percent-complete yet. The Catalyst reads progress, the app does not score it.

**Assumption A3.** Second demo language is Spanish unless the client names a different one at pitch night.

## 4. Roles and visibility

| Data | Planter (own) | Planter (other planter in org) | Catalyst (own org) |
| --- | --- | --- | --- |
| Profile | read, edit | none | read |
| Categories | read | read | read, create, edit, delete |
| Objectives, progress entries | read, create, edit | none | read |
| Dialogue messages | read, create | none | read, create |
| Prayer request, visibility private | read, create, edit, share | none | read, share |
| Prayer request, visibility org | read, edit, unshare | read | read, unshare |

Visibility is enforced in the database, not only in the UI. See section 6.

## 5. Data model

```text
organizations
  id, name, created_at

profiles                       -- one row per auth user
  id (= auth user id), org_id, role ('catalyst' | 'planter'),
  display_name, locale, created_at

invitations
  id, org_id, email, role, token, accepted_at, created_at

objective_categories           -- defined by the Catalyst, per org
  id, org_id, title, description, sort_order, created_at

objectives                     -- a planter's plan item under a category
  id, planter_id, category_id, title, description,
  cadence ('weekly' | 'monthly'), status ('active' | 'paused' | 'done'),
  created_at, updated_at

progress_entries               -- a planter's report against an objective
  id, objective_id, note, value (nullable numeric),
  period_start (date), created_at

messages                       -- dialogue under an objective
  id, objective_id, author_id, body, created_at

prayer_requests
  id, planter_id, body, visibility ('private' | 'org'),
  answered_at (nullable), created_at, updated_at
```

Notes:

- `planter_id` and `author_id` reference `profiles.id`.
- Org membership is derived from `profiles.org_id`, so every row can be scoped to an org through its planter or category.
- Categories are per org, so deleting a category needs a decision about its objectives. For the weekend: block delete while objectives exist, allow rename.

## 6. Proposed stack

Recommended, with the alternative we considered. The team should pick one at pitch night and not revisit it.

**Recommended: Next.js plus Supabase.**

| Concern | Choice | Why |
| --- | --- | --- |
| App framework | Next.js (App Router), TypeScript | Two frontend-heavy devs. One repo for UI and server code. Vercel deploy in minutes. |
| Package manager | pnpm | Team decision. Use `pnpm`, never `npm`. |
| Database and auth | Supabase (Postgres, Auth, Realtime) | Row Level Security enforces the visibility table in section 4 at the database layer. Realtime gives live chat for R5 with no socket server. Magic link auth covers invites. |
| UI | Tailwind CSS, shadcn/ui | Fast, accessible defaults. Designer can tune tokens. |
| i18n | next-intl | Locale in the URL, JSON message files per language, server and client support. |
| PDF | @react-pdf/renderer in a route handler | Reuses React components for layout. Server side so the export is the same on every device. |
| Hosting | Vercel plus Supabase cloud | Free tiers cover the hackathon. |

**Alternative: Next.js plus Firebase (Firestore, Auth).** Also fast, and Firestore listeners make chat trivial. We prefer Supabase because the data is relational (orgs, planters, categories, objectives, entries) and SQL plus Row Level Security express the visibility rules in one place. Firestore security rules can do it but get verbose with cross-document checks.

## 7. Architecture

```text
Browser (Next.js client components)
   |  Supabase JS client, user JWT
   v
Supabase Postgres  <-- Row Level Security policies, one per table
   ^
   |  service role, server only
Next.js route handlers / server actions
   - invite planter (creates invitation, sends magic link)
   - seed default categories on org creation
   - PDF export (reads with the user's JWT, renders, streams)
```

- **Reads and writes from the browser go straight to Supabase.** RLS is the authorization layer. The frontend never decides what a user may see.
- **Server code is only for things RLS cannot do.** Invitations, seeding, and PDF rendering.
- **Realtime.** Subscribe to `messages` filtered by `objective_id` on the objective page. Subscribe to `progress_entries` on the Catalyst dashboard.

### RLS sketch

Helper: `current_org()` returns the caller's `org_id` from `profiles`. Helper: `is_catalyst()` returns true when the caller's role is `catalyst`.

- `profiles`: select where `org_id = current_org()`. Update where `id = auth.uid()`.
- `objective_categories`: select where `org_id = current_org()`. Insert, update, delete where `org_id = current_org() and is_catalyst()`.
- `objectives`, `progress_entries`: select where owner planter is `auth.uid()`, or caller is a Catalyst in the same org. Insert, update where owner planter is `auth.uid()`.
- `messages`: select and insert where the parent objective is visible to the caller.
- `prayer_requests`: select where `planter_id = auth.uid()`, or caller is Catalyst in same org, or `visibility = 'org'` and planter is in same org. Update where `planter_id = auth.uid()` or caller is Catalyst in same org.

## 8. Screens

Planter:

1. **Home.** Categories as sections. Each objective shows title, cadence, last entry date, unread dialogue count. Button to log progress.
2. **Objective detail.** Description, progress entries timeline, dialogue thread with composer.
3. **Prayer.** My requests with a share toggle. Org wall below.
4. **Settings.** Display name, language.

Catalyst:

1. **Dashboard.** Planter cards: name, last activity, count of objectives per category, planters with no activity in 14 days flagged.
2. **Planter view.** Same as planter Home, read only, with dialogue composer enabled.
3. **Categories.** Add, rename, reorder, describe.
4. **Prayer wall.** All requests in the org, with share and unshare.
5. **Export.** Pick a planter, download PDF.

Hadi owns layout and visual direction. This list fixes what each screen must contain, not how it looks.

## 9. Internationalization

- Locale stored on `profiles.locale` and reflected in the URL (`/en/...`, `/es/...`).
- All UI strings in `messages/<locale>.json`. No hard-coded English in components.
- User-entered content (objectives, messages, prayer requests) is stored as written. No machine translation in the MVP.
- Dates and relative times formatted through the i18n library so "3 days ago" localizes.

**Assumption A4.** Machine translation of dialogue between planter and Catalyst is a later phase. Worth asking the client whether Catalysts and planters already share a language in practice.

## 10. PDF export

- Route: `GET /api/export/planter/:id.pdf`. Server validates the caller is that planter or their Catalyst.
- Content: planter name, export date, then for each category: objectives, progress entries in date order, dialogue in date order.
- One file per planter. Category and date range filters are later.

## 11. Error handling

- RLS denials surface as empty results or permission errors. The UI shows "You do not have access" rather than a blank page.
- Invitation tokens expire after 7 days. Reuse shows a clear message with a "request a new invite" path.
- Realtime disconnects fall back to a refetch on focus. Chat must still work without the live channel.
- PDF generation failures return a JSON error with a request id so we can find it in logs during user testing.

## 12. Testing

- **Database.** SQL tests for RLS: a planter cannot read another planter's objective, a Catalyst can, a shared prayer request is visible org-wide, a private one is not. These are the tests that protect the client's trust and they run in seconds.
- **Unit.** Pure helpers (period bucketing, cadence labels, PDF data shaping).
- **End to end.** One Playwright flow: Catalyst invites planter, planter creates an objective and logs progress, Catalyst sees it and replies. Run before the Saturday user test and before the Sunday demo.

## 13. Questions for the client at pitch night

1. Which language besides English should the demo show? (A3)
2. Do you want Prayer Requests as a separate feature rather than a category? (A1)
3. Is free-text progress with an optional number enough for the weekend, or do you want numeric targets? (A2)
4. How many planters are in your org today? This sets the dashboard layout.
5. Who will test on Saturday, and do they have a phone or laptop with them?

## 14. Work split

| Person | Owns |
| --- | --- |
| Siddhartha | Supabase schema, RLS, invitations, seeding, PDF route, client liaison |
| Bharath | Planter screens: Home, Objective detail, Settings |
| Olivia | Catalyst screens: Dashboard, Planter view, Categories; prayer wall |
| Hadi | Design system, screen flows, demo script, keeping scope honest |

Shared: i18n wiring (whoever touches a screen adds its strings), Playwright flow (pair on Saturday morning).
