# First Fruits hackathon team plan

This is the shared delivery plan for Hadi, Bharath, Olivia, and Siddhartha. Build a persistent planter and Catalyst workflow for testing on Saturday October 3, 2026, then complete the agreed requirements and fix testing feedback before Sunday October 4 at 3:00 pm. All times below are Vancouver time, America/Vancouver, PDT.

The original **Planter Flow | #HACKVAN2026** PDF controls scope. The subsequent team decisions add six interface languages and keep Catalyst follow-through separate from church foliage. This plan supersedes conflicting implementation scope in the older repository design draft and the broader full-stack MVP DOCX. Figma guides appearance; a designed screen does not automatically become a hackathon requirement.

Ownership below is the working assignment. At kickoff, each person names their active branch and unpushed work so existing work is reused. No assignments have been sent to teammates automatically.

## Delivery commitments

| ID | Requirement | Primary owner | Acceptance evidence |
| --- | --- | --- | --- |
| R1 | Planter account and access to own records | Siddhartha | Two planter sessions cannot read or modify each other's objectives, progress, or dialogue |
| R2 | Catalyst sees planters in their organization | Olivia; Siddhartha owns authorization | Catalyst opens each same-organization planter; foreign-organization access is denied |
| R3 | Catalyst edits the number, title, and description of objective categories | Olivia | Add, rename, edit description, and remove an unused category; categories persist |
| R4 | Planter defines weekly or monthly steps and records progress | Bharath | Create and edit an objective/activity, select cadence, save progress, reload successfully |
| R5 | Timestamped planter and Catalyst dialogue under objectives | Bharath | Both accounts post and read replies with author and time; unauthorized readers are denied |
| R6 | Prayer requests can be shared with other planters in the organization by planter or Catalyst | Olivia | Private request stays within owner/Catalyst scope; share and unshare update peer access |
| R7 | English, Korean, Spanish, Japanese, Ukrainian, and French interface | Hadi coordinates; screen owners implement | All core flows work in en, ko, es, ja, uk, fr; preference survives sign-out |
| R8 | Planter and Catalyst export authorized objectives and dialogue to PDF | Siddhartha; Olivia owns entry point | Readable export with correct planter, Unicode content, and no foreign records |

Starting categories are Engage the City, Make Disciples, Plant the Church, Personal Relationship with Jesus, and Prayer Requests. Prayer Requests opens a dedicated prayer workflow instead of requiring weekly cadence. Keep this distinction clear in the UI and data model; do not create duplicate prayer records as ordinary objectives. The Catalyst can manage category labels and descriptions. Removing a category with records is blocked for this weekend rather than silently deleting its history.

Under this brief, Catalyst visibility is organization-wide. Do not accidentally retain the later proposal's assigned-portfolio-only permissions. Personal Relationship with Jesus is unscored, and its screen must clearly disclose Catalyst visibility. An author-only journal is a separate deferred feature; do not label ordinary objective content private to the author.

### Explicitly outside the weekend commitment

Church team accounts, Catalyst approval queues, expense decisions, payments, peer church profiles, badges, AI, automatic content translation, formal assessments, and a numerical flourishing algorithm are deferred. The globe, age-based trees, and separate Catalyst follow-through display are optional enhancements after R1–R8 work. Existing onboarding is reused, but not expanded into the larger specification.

If a tree is shown, label age and demonstration state honestly. Do not present illustrative foliage as computed health. Catalyst missed commitments, prayer activity, personal struggles, or requests for help never reduce church foliage. The core Catalyst experience is an ordinary accessible planter list even if the globe is added.

## Who owns what

| Person | Primary work | Shared responsibility | Reviewer |
| --- | --- | --- | --- |
| Hadi | Match required screens to Figma; resolve copy and scope; coordinate translations; recruit/observe testers; prepare demo | Product acceptance, mobile and language checks, maintain this plan and feedback log | Olivia reviews design feasibility |
| Bharath | Planter home, objective detail, activities/cadence, progress entry, shared dialogue component | Own shared UI components, global styles, locale routing and language preference controls | Olivia reviews frontend; Siddhartha reviews data access |
| Olivia | Catalyst list/detail, category management, prayer workflow/feed, PDF export controls | Integration coordinator; translate her screens; review shared components | Bharath reviews frontend; Siddhartha reviews permissions |
| Siddhartha | Auth/invitations, schema/migrations, RLS, shared data operations, seed accounts, PDF backend, hosting | Environment setup, backend contracts, permission checks, deployment and recovery | Olivia reviews integration; Bharath exercises server operations |

Olivia owns merge order and the integrated application status. Siddhartha owns deployments and database changes. Hadi decides priority when there is a scope or time tradeoff. Each person retains ownership of defects in their feature until the integrated acceptance check passes.

### Starting tasks

| Owner | First task | Next task | Final task today |
| --- | --- | --- | --- |
| Hadi | Mark the minimum Figma screens for R1–R8; confirm Paul's 30-minute test slot | Prepare synthetic scenarios and translation glossary; observe testing | Rank feedback, run six-language/mobile checks, rehearse demo |
| Bharath | Review existing login/onboarding UI; establish shared components and locale wiring | Implement planter objective, activity, progress, and dialogue flow | Fix tester blockers; finish his translations and persistence checks |
| Olivia | Inventory invitation overlap with Siddhartha; prepare Catalyst list/detail | Implement categories and prayer sharing; merge complete slices | Integrate all screens, export controls, and her translations |
| Siddhartha | Verify project access; review auth branch; close profile privilege gap | Publish schema/operations, seed sessions, connect hosted build | Finish export and permission tests; publish the integrated build |

## Saturday schedule

The plan starts at approximately 8:45 am. If kickoff slips, shorten polish and discovery blocks first; keep the testing slot and post-test integration checkpoint. Evening times are working targets to confirm at kickoff, not assumed availability commitments.

| Vancouver time | Shared checkpoint | Parallel work and required output |
| --- | --- | --- |
| 8:45–9:00 am | Kickoff and ownership | Everyone identifies their branch and current work. Hadi confirms test slot and six-language scope. Olivia records the merge queue. Siddhartha confirms Supabase and hosting access. |
| 9:00–9:30 am | Foundation contract | Siddhartha fixes record names, access rules, migration order, and data operation inputs/outputs. Bharath selects reusable UI/locale foundations. Olivia resolves which invitation flow survives. Hadi marks the required Figma screens. |
| 9:30–11:00 am | Build in parallel | Bharath builds planter objective/progress/detail; Olivia builds Catalyst list/detail and categories; Siddhartha implements persistence/auth and synthetic fixtures; Hadi prepares strings and test script. Frontend can use contract-shaped fixtures temporarily. |
| 11:00–11:20 am | First integration | Merge reviewed foundation and connect both frontends to real operations. Demonstrate login, saved objective, progress, Catalyst read and reply across two sessions. Record failures with owner. |
| 11:20 am–12:15 pm | Complete the test path | Fix integrated blockers; add prayer sharing if ready. Ensure refresh persistence, readable mobile layouts, and clear save errors. Hadi prepares two accounts and the test language. |
| 12:15–12:45 pm | Hosted rehearsal | Run the whole test path on the hosted build. Check a second planter cannot open the first planter's records. Hadi verifies task wording; Siddhartha confirms deployment. |
| 12:45 pm until test | Stabilize | Pause risky migrations and shared changes. Prepare a recorded backup and known-issues list. A fallback walkthrough is labeled as such, not reported as a successful live test. |
| 1:00–3:00 pm | Initial user testing window | Use the actual agreed 30-minute appointment within this window. Hadi facilitates; one developer observes; remaining developers handle isolated fixes and finish missing requirements. Do not deploy during the session. |
| Immediately after test, 20 minutes | Feedback triage | Hadi ranks observed problems; Olivia assigns owners and merge order. Fix inability to complete a task, access errors, data loss, and confusing visibility first. |
| After triage–5:30 pm | Finish locked scope | Complete prayer share/unshare, categories, export, six-language coverage, and feedback fixes. All screens use the live database. |
| 5:30–6:00 pm | Full integration checkpoint | Walk R1–R8 together. Every failure gets an owner, reproduction steps, and next checkpoint. Recheck permission boundaries after schema changes. |
| 6:00–8:00 pm | Stabilize and review | Fix blockers, review translation/layout issues, verify PDF glyphs, and run targeted checks. No new product features. |
| 8:00–8:30 pm | Handoff for Sunday | Save tested commit/deployment, requirement status, owners of unfinished work, and a short demo script. Agree Sunday attendance. |

## How implementation fits together

### Reuse the current work

The locally inspected main branch is a scaffold. The cached feat/login-page branch contains the broadest usable foundation: login, invitations, onboarding, English localization, shared components, tests, and an initial migration. The cached feat/teamInvitation branch contains a competing invite acceptance flow. These references were not refreshed from GitHub during the review; fetch current state before making integration decisions.

Siddhartha and Olivia compare the branches, select one canonical invitation flow, and preserve useful work from the other. Do not merge both routes without reconciling behavior. Review and repair the profile update policy before using real accounts: users must not be able to change role, admin privilege, or organization through editable profile fields. Retain the agreed simple planter/Catalyst roles for this weekend.

Reuse the existing stack: Next.js App Router, TypeScript, Tailwind, Supabase, and pnpm. Use the branch's Node 22 requirement consistently and align the README. Before writing framework code, read the relevant installed Next.js documentation required by AGENTS.md.

### Shared records and operations

The following is the target contract to finalize by 9:30, not a claim that these records or functions already exist. Preserve compatible existing names rather than having each developer invent a separate model.

| Record | Required contract |
| --- | --- |
| Profile | Auth user ID, organization, fixed role/privileges, display name, locale; only permitted personal fields editable by user |
| Category | ID, organization, title, description, order, ordinary-objective or prayer behavior; Catalyst manages |
| Objective | ID, owner planter, category, title, description, status, created/updated time; category and owner belong to same organization |
| Activity | ID, objective, description, weekly/monthly cadence, status; explicit repeatable steps under the objective |
| Progress entry | ID, objective, optional activity reference, note, optional numeric value, reporting date, author, created time |
| Dialogue message | ID, objective, author, plain-text body, created time; only planter owner and same-organization Catalyst |
| Prayer request | ID, planter, body, private or organization visibility, created/updated time; private means owner plus Catalyst in this brief |

Siddhartha supplies reusable operations for current profile, list planters/categories, load planter detail, save category/objective/activity, add progress/message, list/save/share prayer, and export authorized records. Inputs and responses include stable IDs, predictable error codes/messages, and timestamps. The server derives actor and authorization; the browser does not choose trusted author, role, or organization values.

Bharath and Olivia agree on response shapes with Siddhartha. Each operation must state who can call it, which fields return, and what a save failure looks like. Forms retain entered text on errors. A successful toast is only shown after persistence succeeds. No fake success buttons or temporary fixtures in the final demo path.

### Feature handoffs

- Siddhartha → Bharath: authenticated planter profile, category list, objective/activity/progress operations, dialogue operation, seeded planter account.
- Siddhartha → Olivia: Catalyst session, organization-scoped planter summaries, category operations, prayer audience operations, export authorization and endpoint.
- Bharath → Olivia: shared page shell, form controls, language switcher, reusable objective detail/dialogue presentation. Catalyst detail reuses these with role-appropriate actions.
- Hadi → both frontend owners: exact Figma frames for required screens, final English labels, translation glossary, mobile behavior, visibility wording.
- Frontend owners → Hadi: hosted route, test account role, expected happy path, known issues, and translated namespaces ready for review.
- All owners → Olivia: small PR, passing checks, setup/migration notes, and requirement IDs covered.

Realtime is optional. Persisted timestamped dialogue with refresh/refetch is sufficient for the brief. Do not spend the morning building a chat transport. The Catalyst list can initially show planter name and last progress date; advanced analytics are deferred.

### File and merge boundaries

Bharath owns shared components, global styles, locale routing, and package changes for frontend libraries. Siddhartha owns Supabase helpers, auth/session logic, server data operations, migrations, and deployment settings. Olivia owns Catalyst/category/prayer routes and the integration queue. Page owners keep form components beside their routes. Agree route names once at kickoff; reuse current locale-prefixed conventions.

Use feature branches from the agreed integrated main commit, such as codex/auth-data-foundation, codex/planter-workflow, and codex/catalyst-prayer. Existing teammate branches may retain their names. Do not rewrite another person's history or replace uncommitted work. No direct pushes of unfinished work to main.

Every PR includes scope, requirement IDs, how to test, checks run, and any migration/environment dependency. One teammate reviews it. Merge foundation first, then small complete feature slices. Rebase or merge updated main before integration. The migration owner orders migrations; two people must not independently modify the same migration.

Hold a five-minute coordination check every 60–90 minutes: shipped, next, blocked, shared files needed. If blocked for more than 15 minutes, name the dependency and ask its owner to pair. Use the agreed fixture shape while waiting for an API; keep the integration requirement explicit.

## Six language implementation

Supported locale codes: English en, Korean ko, Spanish es, Japanese ja, Ukrainian uk, French fr. Use native names in the selector: English, 한국어, Español, 日本語, Українська, Français. Save preference on the user profile and keep route locale, message loader, and HTML language consistent. A saved non-English preference must not silently reload English.

Bharath owns the common/auth/settings namespaces and locale wiring. Bharath also owns planter/goal/progress/dialogue strings. Olivia owns Catalyst/categories/prayer/export strings. Hadi maintains the terminology glossary and coordinates fluent-speaker review. Use feature-specific translation files where practical; if existing JSON files remain monolithic, Hadi or one designated assembler integrates translated sections to avoid six-file merge conflicts.

Every page owner supplies matching keys for all six languages, including empty, loading, validation, error, save, and permission states. Externalize text before translating. English fallback is a temporary safety measure; missing core translations remain an unfinished R7 item. Do not describe machine-drafted wording as reviewed.

Preserve user-written goals, dialogue, and prayer in their original language. Localize static interface labels and dates. Translate seeded default category labels through stable keys where feasible; Catalyst-customized labels remain authored content. Check Japanese/Korean line wrapping, longer French/Ukrainian labels, Unicode names, mobile controls, and PDF font coverage.

## Supabase and deployment

The supplied project URL is https://uqxkoqekpvdyucuiccxh.supabase.co. Siddhartha verifies access to this project and obtains keys through the team's approved secret-sharing route. Store local secrets in ignored .env.local and hosted secrets in deployment settings. Do not commit keys or put the service-role credential in public configuration.

Confirm hosting project, deployment access, auth site URL and allowed redirects before the first hosted test. Validate invite delivery. If invitations are unreliable, use pre-provisioned synthetic accounts for the test and record invitation delivery as unresolved; never claim that bypass proves invitations work.

Seed one test organization with a Catalyst and at least two planters, plus a separate organization for isolation checks. Include ordinary objectives, both activity cadences, progress, messages, and private/shared prayer. Keep test identities synthetic. Record migration/seed commands and a safe reset procedure; no destructive reset against an unidentified database.

For PDF, prefer the simplest complete path. A print-friendly authorized export with browser Save as PDF is acceptable if the resulting PDF is readable and usable; a server-generated PDF is also valid. Include planter name, export date, category/objective content, and dialogue author/timestamps. Verify Korean, Japanese, Ukrainian, Spanish, and French content. Prayer and personal content are not silently included in a general export; provide clear scope selection and authorization.

## Test session and release checks

Hadi confirms the exact 30-minute appointment inside the 1:00–3:00 pm window. Suggested session: 3 minutes sign-in/orientation, 7 minutes objective/activity/progress, 6 minutes Catalyst view/reply, 5 minutes prayer visibility, 4 minutes language/export if ready, 5 minutes debrief. Do not steer users through every click; record where they hesitate and what they think sharing means.

Record feedback as: task, observed problem, impact, reproduction, owner, next checkpoint, verified fix. Separate an observed blocker from a new feature suggestion. Priorities are access/privacy/data loss, inability to complete the core task, confusing behavior, then visual polish.

Before calling the build ready, verify:

- [ ] A planter creates and edits an objective and weekly/monthly activity, adds progress, and sees it after reload.
- [ ] Catalyst can view the correct organization's planter and reply; planter sees the reply with timestamp.
- [ ] Another planter cannot read or modify objectives, activities, progress, or dialogue through direct requests.
- [ ] Foreign-organization Catalyst/planter requests are denied, including exports.
- [ ] A user cannot self-promote or change organization through profile updates.
- [ ] Category add/edit/remove behavior works without deleting linked history.
- [ ] Private prayer is absent from peer responses; sharing enables same-organization access; unsharing removes it.
- [ ] All six locales work across the core flow; switching/saved preference and error messages are checked.
- [ ] Export opens as a readable PDF with correct scope and Unicode glyphs.
- [ ] Save errors preserve content; duplicate submission does not create accidental duplicates where preventable.
- [ ] Core actions work on a narrow mobile screen and keyboard, with readable labels and visible focus.
- [ ] Lint, type checking/build, relevant unit tests, and a hosted end-to-end rehearsal pass on the integrated commit.

Add focused authorization tests and checks for the actual feature behavior; prioritize those over snapshots of static styling. Record which checks passed, which were manual, and which remain unverified. No automated test suite or passing build replaces separate-session permission checks.

## Sunday completion plan

| Vancouver time | Outcome |
| --- | --- |
| 9:00–9:15 am | Reconfirm outstanding requirements and owners from Saturday handoff |
| 9:15–11:30 am | Finish remaining R1–R8 work and observed blockers; no expansion into deferred workflows |
| 11:30 am–12:30 pm | Full six-language, permissions, persistence, mobile, and PDF verification |
| 12:30–1:00 pm | Optional globe/tree polish only if required checks pass; otherwise continue fixes |
| 1:00 pm | Freeze new features |
| 1:00–2:00 pm | Rehearse on hosted build and fix critical defects |
| 2:00–2:30 pm | Prepare synthetic demo data and accounts; record backup walkthrough; note known limitations |
| 2:30–3:00 pm | Final smoke test; save tested commit, deployment URL, and recovery instructions |
| 3:00 pm | Final build cutoff |

If required functionality remains incomplete, Hadi records that explicitly and adjusts the demonstration. Simplify styling, animation, transport, and navigation before cutting requirements. Do not silently redefine the locked brief to call a partial build complete.

## Immediate kickoff decisions

Confirm the exact test appointment, active branches/unpushed work, evening and Sunday availability, deployment owner access, and who can review the five non-English translations. Confirm these operational details without reopening the locked product scope. Siddhartha must verify schema and project state before applying migrations; the project URL alone does not establish what is already deployed.
