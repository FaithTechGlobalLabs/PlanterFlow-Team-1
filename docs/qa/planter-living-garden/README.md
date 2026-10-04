# Phase 2 QA

Browser QA: Chromium, 1440×1000 desktop and 390×844 mobile, labeled sample previews. Screenshots are WebP. Real account credentials and live Supabase configuration were not present in this execution environment.

## Automated checks

- `node_modules/.bin/vitest run`: full suite, 36 files / 173 tests pass (baseline 34 / 162).
- `node_modules/.bin/tsc --noEmit`: passes.
- `node_modules/.bin/eslint`: zero errors; seven pre-existing img warnings in GlobeCard/TreeSapling.
- `node_modules/.bin/next build`: passes.
- Browser: home/workspace desktop/mobile; active/completed/empty objectives; members/empty/pending team; low/richer tree; long names; Today; Journey; prayer/support; separate team/private replies; objective edit sharing checkbox; Escape closes modal; keyboard skip link; reduced-motion canopy animation none; zero overflow and no runtime/console errors.
- axe WCAG A/AA scan across captured preview states: zero violations after scoped contrast and brand-label corrections. Automated scan is not a complete accessibility certification.
- Catalyst home regression preview: no overflow, no axe violations. Existing Catalyst tests remain passing; default ChurchTree call does not apply new age scaling.

## Acceptance boundaries

| Requirement | Evidence / remaining check |
| --- | --- |
| Login and real church/user home | Existing auth/onboarding redirects preserved; login/session tests pass. Live authenticated acceptance still required. |
| Open workspace / invite member / existing team | Route links and roster presentation verified. Session-scoped reads reviewed. Email sending and real pending/member records require configured environment. |
| Create/edit objective and target date | Existing forms and server validation retained; UI controls/type/build and validation tests pass. Persisted create/edit against database still required. |
| Progress author/timestamp, sharing/revocation | Existing UTC author/timestamp display and sharing field verified. Existing action/RLS checks unchanged. Persisted progress and stale-page revocation tests require live database. |
| Eligible peer visibility/contributions | Server filtering and role gating retained; private payload exclusions reviewed. Live allowed/denied cross-church access and peer writes still required. |
| Team versus Catalyst conversations | Separate controls and copy verified; separate tables/pathways unchanged. Live replies still required. |
| Catalyst access | Existing tests and default garden preview pass. Live assigned-Catalyst acceptance still required. |
| Tree/empty/responsive/accessibility | Preview screenshots, axe, keyboard, reduced-motion and model/UI tests. |
| Production sample cleanup | Search of Planter home/dashboard/components finds no hardcoded fixture names or Demo copy. Sample preview remains explicitly labeled. |

This PR must not be described as having passed live authenticated/RLS/email end-to-end acceptance. No schema or auth changes were made. No migration was applied.

A concurrent dev/build run briefly produced a partial generated Next validator. The generated cache was discarded and a clean sequential production rebuild passed. No source or dependency workaround was required.
