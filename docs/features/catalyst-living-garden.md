# Catalyst living garden — Phase 1 and Phase 3

The Catalyst home at `/en/catalyst` now presents a garden of assigned churches, a presence rail, searchable church directory and existing pastor invitation statuses. Selecting a church opens a native modal detail drawer with the pastor, location, planting stage, current objective and latest check-in when available. Review and acknowledgement still use Olivia’s existing `/catalyst/planters/[id]` forms and server actions; deeper church work still uses `/dashboard?planter=...`.

The Catalyst `/dashboard` includes Garden, Needs attention, Churches, Support & conversations, Prayer requests, Objective categories, Journey and a link to existing invitations. The organization-level workspace access model is retained; the assigned-church home is not expanded to organization-wide access. No auth, RLS, schema, invitation, conversation or Planter action changes were made.

## Visual and engagement contract

- Trees use layered SVG foliage, bark, ground shadows and restrained canopy motion. All plots have equal visual size; decorative variation does not rank churches or people.
- Fruit reflects objectives with explicit `status = done`. At most five decorative fruit markers render; the full completed count remains textual. Time away never removes these markers.
- A planting stage is the existing calendar-based stage, presented as text. Trees do not wither for inactivity.
- Journey shows saved progress and check-ins with their actual dates, plus explicitly completed objectives. It does not invent completion dates.
- Weekly rhythm, persistent leaf awards, milestones, badges, notification delivery and interactive objective branches are deferred: the current records do not provide an audited event ledger for these features. No fake streak or app-open reward is introduced.
- Large gardens show six churches per page. The searchable directory retains access to every church.
- Native dialog behavior supplies Escape dismissal, focus containment and focus restoration. Every tree is a keyboard button with its name and status; decorative artwork is hidden from assistive technology. Reduced-motion disables the ambient motion.

## Shared cleanup and isolation

New styles are scoped to `catalyst-garden-app` and `ff-living-catalyst`. Shared Button gains explicit focus styling and additive tertiary/destructive variants; existing defaults remain intact. Prototype “coming next” strings are replaced with usable copy. `Demo` remains only in `src/lib/workspace/sample.ts`, the explicitly labeled public preview/test fixture, which production loaders never use. Real database names are not rewritten or hidden.

The Planter home, Planter workspace, team invitations, onboarding and server actions are intentionally unchanged. Main conflict risk is concurrent edits to the Catalyst page/workspace, the shared Button or translation file; Bharath’s Planter files are not redesigned. No database migration is required.

## Preview and acceptance

- Existing public preview: `/en/preview?role=catalyst`.
- Added home preview: `/en/preview?role=catalyst&surface=garden`.
- Both contain explicitly labeled fictional records. Production has no fixture fallbacks.
- Unit coverage includes church context links, cancel dismissal, no-data and failed-load honesty, large-garden pagination and retention of explicit completed outcomes after inactivity.
- Live Catalyst authentication, sending an actual pastor invitation, and persisting an actual review must be accepted in a configured environment with authorized test credentials before merge. The scratch checkout has no application credentials.

## Validation results

- Baseline: 33 test files / 156 tests passed before changes. Final: 34 files / 162 tests passed.
- TypeScript and production build pass. ESLint has no errors and retains seven pre-existing `next/no-img-element` warnings in GlobeCard and TreeSapling.
- Browser QA: desktop 1440×1000 and mobile 390×844; home and workspace render without runtime or console errors. Home drawer Escape closes and focus returns to its tree. Workspace Journey navigation works. Reduced-motion canopy animation computes to `none`.
- Explicitly labeled preview scenarios `empty`, `quiet`, `long` and `many` (13 churches) have no document overflow at 390px. Pagination reaches the thirteenth church. These fixture scenarios are available only through the existing public preview route.
- axe-core WCAG A/AA scans of the default desktop home and workspace report zero violations. This is an automated check of those states, not a full accessibility certification.
- Screenshots: [home desktop](../qa/catalyst-living-garden/home-desktop.webp), [church drawer](../qa/catalyst-living-garden/church-drawer.webp), [home mobile](../qa/catalyst-living-garden/home-mobile.webp), [workspace desktop](../qa/catalyst-living-garden/workspace-desktop.webp), [workspace mobile](../qa/catalyst-living-garden/workspace-mobile.webp). They contain fictional preview data only.

The exact Mobbin URL could not be resolved; the supplied product direction guided implementation. The research PDF named in the prompt was not included in the uploaded files for this execution. The supplied prompt was available in full and its engagement guardrails were followed.
