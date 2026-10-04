# Flourishing validation record

Verified locally on the feature branch after integrating merged PR69, PR71 and PR72.

| Check                         | Result                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vitest                        | 243 passing tests across 44 files                                                                                                                      |
| TypeScript                    | `tsc --noEmit` passed                                                                                                                                  |
| ESLint                        | 0 errors; 7 existing `next/no-img-element` warnings in unchanged artwork components                                                                    |
| Production build              | Next.js production build passed                                                                                                                        |
| Diff whitespace               | `git diff --check` passed                                                                                                                              |
| Completion migration          | Executed successfully in local PGlite/PostgreSQL; backfill, first completion, reopen/recomplete/archive, spoofed metadata and owner RLS fixture passed |
| Rendered browser matrix       | 60 cases; 0 automated axe violations and 0 page overflow findings                                                                                      |
| Additional interaction checks | Drawer scan: 0 axe violations; account Escape passed; 5 fruit/18 leaf caps confirmed; reduced motion had 0 running animations                          |

## Rendered coverage

Chromium was used to render the actual Next.js development app with explicitly fictional preview records. The 12 routes/scenarios below were checked at 1440, 768, 390 and 320 pixels: Catalyst garden, Planter home, objective Kanban, Catalyst workspace, Journey, team, a fruitful seed (24 outcomes/30 progress records), a quiet older church, login, recovery, invitation entry and unavailable invitation. Another 11 garden cases at mobile width covered all five age stages, unknown and planned age, empty, many, long-name and quiet states. The remaining matrix case exercised drawer open/Escape/focus restoration and search-empty behavior.

Screenshots were inspected for desktop/mobile composition, readable silhouettes, gold fruit separation, long text, typography and neutral age versus attention labels. Additional screenshots show keyboard focus and the church drawer. These are preview checks, not authenticated live acceptance tests. Automated axe results are useful evidence, not a certification of complete WCAG conformance. Dedicated role-authorized server screens and invite acceptance with valid tokens require the staging checks below.

## Selected token contrast ratios

| Cue                                     | Ratio  |
| --------------------------------------- | ------ |
| Muted text on canvas                    | 5.91:1 |
| White primary button text               | 7.85:1 |
| Danger text on error surface            | 7.30:1 |
| Supporting text on dark header          | 8.55:1 |
| Control border on surface               | 3.24:1 |
| Focus outline on canvas                 | 7.23:1 |
| Canopy outline on sampled light terrain | 6.45:1 |
| Gold fruit against primary foliage      | 4.47:1 |
| Fruit outline against gold fill         | 8.29:1 |

Ratios were computed for the listed token pairs. Decorative gradients are not a claim that every individual painted pixel has that ratio; dark silhouette/marker edges and textual equivalents convey essential meaning.

## Required staging acceptance before release

No live account credentials or configured Supabase project were available. No remote migration was applied, no production data was written, and no deployment or merge was performed.

1. Review/apply the completion-history migration after PR72's status migration, then deploy to staging.
2. Verify sign-in, recovery and sign-out using supported accounts.
3. Invite/accept/onboard Pastor, Catalyst and team roles; verify expiry and organization/church boundaries.
4. Create an objective, save meaningful progress, complete/reopen/archive/recomplete; reload and confirm one persistent outcome and its unchanged first date.
5. Check an older backfilled completion retains no fabricated date; check corrections/deletions under existing authorized workflows.
6. Verify support/prayer requests and replies, Catalyst acknowledgements, monthly care attribution and church review loading/error behavior.
7. Verify team members see only shared objectives and permitted conversation records; compare full growth only between equally authorized views.
8. Download the real authorized PDF and inspect its text/layout; confirm another Catalyst/team peer cannot export private records.
9. Check email delivery and persisted updates against the project's actual policies and deployment environment.

Blossoms remain intentionally deferred because no explicit milestone source exists. Pre-migration reopened/archived outcomes with no saved completion history remain unknowable. These are documented data limits; they are never converted into invented growth.

## Styling feedback and rebase validation

Rebased onto main `371566d` (PR75 branding and PR76 draft protection). Component styling hooks replace anonymous descendant/order selectors in the new UI; Journey imports its own scoped stylesheet. Repeated the 60-case rendered matrix after fixing narrow-screen logo/header wrapping: zero overflow or automated axe violations. The unsaved-objective draft regression tests remain passing.
