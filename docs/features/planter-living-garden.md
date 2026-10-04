# Planter living church garden

Phase 2 extends merged #67 and #70 from main `36ce635`. Catalyst is a garden of churches being supported; Planter is one living church being cultivated with a team.

## Surfaces and components

Authenticated `/en` keeps all login, invitation and onboarding redirects, then loads the existing session-scoped workspace into `PlanterHome`. `PlanterHomeShell` also frames the existing team invitation form. `/en/dashboard` keeps the existing objective, activity, progress, sharing, prayer and conversation forms. Owners see Garden, Today, Objectives, Prayer & support, Team and Journey. Peers retain their shared-objective experience; Catalysts retain their existing access.

`PlanterGarden`, `NextTending`, `RhythmIndicator`, `TeamSnapshot` and `PlanterJourney` compose both surfaces. Shared `ChurchTree` accepts an optional age stage; omitting it preserves Catalyst artwork. No new libraries, schema, policies or server mutations.

## Truthful tree semantics

- Foundation/roots and trunk are botanical metaphor; no spirituality, attendance or success score.
- Age comes from the existing `treeStageFromPlantingDate`: seed <3 months (including future planting), sprout <12 months, sapling <24 months, young <36 months, established thereafter. Illustration scale maps those existing stages to .45, .60, .80, .92, 1.0. Unknown dates use neutral journey copy and default artwork. Date/age alone determines size.
- Accessible objective links beside the tree are its branch interface (first four; all are available in Objectives). Selecting one opens the real objective detail.
- Fruit comes only from `status=done`. Artwork displays up to five decorative fruit; text always reports the full count. Returning after inactivity never removes recorded completion or reduces size.
- Foliage is decorative. There is no persisted leaf-growth or milestone system, and no invented blossom events. Reopened/deleted objectives reflect current saved data; this is not a new immutable rewards ledger.
- Next action suggests the active objective with earliest target date, then oldest creation and ID. It does not declare something overdue or manufacture urgency.
- Weekly rhythm counts unique days with the viewer's own saved objective progress in Monday–Sunday UTC, excluding future timestamps. No streak, reset penalty or missing-day warning. Other contributions remain visible in progress/Today/Journey.
- Journey uses objective creation, dated progress and actual membership join times. No `completed_at` exists, so explicit completion is summarized without a fabricated date. No inferred church creation, answered prayer or milestone event.

## Team and privacy

Owner-only roster reads use `church_memberships` for the owned church, role peer. Pending invitation reads are scoped by church, organization, inviter, role peer, unaccepted status and unexpired time. Both use the session client and existing RLS. Only member IDs, display names, join times and invitation metadata are returned; no tokens. Query failure uses an unavailable snapshot, not invented members. Organization profiles are never treated as membership.

Peer workspace loading continues to filter shared objectives server-side and exclude private dialogue, check-ins and threads. Existing server actions recheck sharing/membership and enforce ownership. Team replies remain in their dedicated table; private Catalyst dialogue remains separate and labeled. Existing support-request threads are now reachable alongside prayers, without bringing back generic check-in creation. No new membership revocation mechanism is invented; manage objective visibility in Edit objective.

## Accessibility and responsive behavior

Tree SVG is decorative with a textual count/stage summary and ordinary focusable objective links. Account sign-out lives in the header. Skip links, native buttons/links, native modal Escape behavior and visible focus remain. Mobile home brings the next action before the tree, and workspace navigation collapses to an explicit toggle. Scoped Planter contrast corrections avoid restyling the Catalyst garden. Saved feedback is gentle; reduced-motion disables animation and transition. Rhythm remains informational text even without motion.

## Preview and real data

Only `/en/preview` uses clearly labeled fictional records. Planter home: `?surface=garden`; workspace: default. Scenarios: `empty`, `low`, `rich`, `long`, `pending`; views: `today`, `objectives`, `prayers`, `team`, `journey`; objective deep links supported. Preview saving is refused and invitation links omitted. Production contains no hardcoded sample names/churches or Demo values in the redesigned surfaces. Existing fixtures remain isolated in `src/lib/workspace/sample.ts` and preview.

## Validation and limits

See `docs/qa/planter-living-garden/README.md` for exact checks, screenshots and remaining authenticated acceptance. Live login, email delivery, database mutations and deployed RLS require the team's configured test accounts/environment; sample previews do not verify these boundaries. No migrations added or applied.
