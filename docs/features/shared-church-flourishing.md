# Shared church flourishing and platform polish

Implemented on merged main c153f33, including PR69 (e76a236), PR71 (0b74326), and PR72 (c153f33). The platform remains First Fruits with SEND Network branding and the existing role, invitation, objective, support and review workflows.

The meaning is: **A living record of how you and your community have shown up for what matters.** No spiritual quality, success ranking or inferred causal impact is calculated.

## One calculation and rendering model

`src/lib/church-growth.ts` owns strict date parsing, qualifying progress, deduplication, historical outcomes and visual caps. `ChurchTree` renders the model; `TreeMeaning` supplies text equivalents and the expandable explanation. All garden/home, church drawers, review, workspace, Journey and PDF/JSON growth summaries derive from these rules. Aggregation consumes existing authorized bulk queries; it never grants access.

| Element         | Source and meaning                                                                                                         | Rendering                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Roots           | Vision, foundation and community                                                                                           | Structural metaphor; never a profile-completeness score                      |
| Trunk/size      | UTC calendar age from planting date                                                                                        | Independent of activity and outcomes                                         |
| Branches        | Distinct objective IDs                                                                                                     | Up to 6 drawn; objective lists keep actual records                           |
| Progress leaves | Unique saved progress IDs attached to authorized objectives, with a nonblank note or finite numeric value (including zero) | Up to 18 light outlined leaves; exact text count                             |
| Fruit           | Unique objectives with recorded first completion                                                                           | Up to 5 gold outlined fruit; exact text count                                |
| Blossoms        | Explicit milestone records                                                                                                 | Deferred: there is no supported milestone model to populate them             |
| Attention       | Existing support/review/check-in status                                                                                    | Text badges independent of growth; no withering                              |
| Care            | Saved responses with authenticated actor IDs                                                                               | Separate factual care counts and chronological metadata; no causation claims |

Baseline canopy texture is decorative age artwork; only the light outlined leaves represent saved progress.

| Age                     | Stage           | Structure scale                 |
| ----------------------- | --------------- | ------------------------------- |
| Under 3 calendar months | Seed            | .36                             |
| 3 to under 12 months    | Sprout          | .52                             |
| 12 to under 24 months   | Sapling         | .72                             |
| 24 to under 36 months   | Young tree      | .88                             |
| 36 months onward        | Established     | 1                               |
| Missing/invalid date    | Neutral unknown | .8; explicit missing-date label |
| Future planting date    | Planned seed    | .36; explicit planned label     |

Date-only values are validated as actual calendar dates; local timezone and daylight-saving changes do not change a stage. Exact anniversary boundaries use UTC year/month/day. Marker size stays legible on young structures, so many outcomes cannot turn a young church into an old tree.

## Historical truth and corrections

Apply `supabase/migrations/20261004210434_church_completion_history.sql` **after PR72's status migration and before deploying this branch**. It is packaged, locally verified, and has not been applied to a remote database.

The existing objective table gains `has_completed` and `first_completed_at`. An invoker trigger sets metadata on first completion and preserves it through reopening, recompletion and archival. Each objective contributes at most one fruit. Clients cannot erase completion or forge its date by writing metadata columns. Existing table policies and role authorization remain unchanged.

Currently completed objectives are backfilled as outcomes with **no completion timestamp**. Earlier reopened/archived completions cannot be reconstructed; no history is invented. A historical outcome with an unknown date stays undated even if recompleted later. New first completions record a real database timestamp and appear in Journey. Deleting an objective removes its derived representation; edits to the same progress record do not mint another leaf. Removing or emptying an invalid progress record corrects its count. Inactivity alone never removes growth. Administrative correction of historical completion metadata requires a reviewed database correction, not a new public mutation endpoint.

The calculation can identify absent metadata for fixtures/legacy payloads, but production selects require this migration. Do not deploy the app ahead of the schema.

## Scope and privacy

The same authorized records and observation time yield the same growth on every surface. Team members see only shared objectives and their permitted records; that is a smaller authorized view, not a full private church score. Private check-ins and Catalyst dialogue remain excluded from peer access. Public login globe is labeled illustrative and receives no private records. Fictional names/data remain in explicit preview/test fixtures.

Catalyst home counts distinct acknowledged check-ins for each church. Its monthly summary uses saved acknowledgement response IDs and the signed-in actor. Catalyst workspace monthly care includes its authorized objective and support/prayer conversation responses. These intentionally different labels describe different saved records; assignment is never counted as contribution. Monthly windows are UTC calendar month to the server observation time. Church review and workspace drawers show dated progress, first outcomes and objective care metadata together, without private message bodies in overview summaries. Workspace Journey retains permission-scoped detail and includes support/prayer conversation metadata.

## Platform inventory and audit decisions

| Surface                                                         | Purpose, action and audit treatment                                                                                                                                                          |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public login/recovery                                           | Sign in or recover access; shared labeled controls, readable fonts and errors, illustrative globe, preserved session recovery                                                                |
| Invite entry/accept/unavailable/welcome; team invite acceptance | Accept the specific invitation or return to a clear recovery route; required invitation/token/identity fields and validation retained                                                        |
| Catalyst/church/first-goal onboarding                           | Collect role, church, planting date and first objective; keep persisted fields, shared form tokens/errors, semantic category radio group with keyboard focus                                 |
| Pastor/Catalyst/team invitation forms and sent pages            | Invite the appropriate role and show saved invitation status; preserve existing expiry, acceptance, admin distinction and boundaries                                                         |
| Catalyst garden, church list and presence                       | Invite a pastor, select a church, respond/review; shared age/growth, neutral age labels, distinct attention badges, search and pagination                                                    |
| Church drawer/review                                            | Explain its tree, show documented care and progress, open workspace or acknowledge check-in; accessible native dialog, unified export                                                        |
| Catalyst workspace/categories                                   | Explore authorized churches and manage categories; shared growth, care summaries, role-aware controls and one account menu                                                                   |
| Planter home/workspace/objectives                               | Continue or create an objective, save progress, manage Kanban status; preserve PR72 drag/drop and accessible status select, persistent outcomes, clear saved feedback                        |
| Prayer/support/team                                             | Retain private versus shared boundaries, meaningful request/reply/share/invite controls and team snapshot error state                                                                        |
| Journey                                                         | Chronological saved objective/progress/care/first completion history; no fabricated historic completion dates                                                                                |
| Loading/error/empty/preview                                     | Preserve distinctions between missing records, no search matches, missing age and failed fetch; failures do not produce a zero-growth tree; explicit sample notice and guarded preview saves |

Account actions are consolidated into `AccountMenu` on every role shell. The duplicate “Switch account” submit was removed because it performed the same sign-out operation. Account menus close on Escape/outside pointer and restore keyboard focus. PDF exports share one download/error component; API authorization and edge-compatible PDF generation remain intact. Required fields were retained after reviewing validation/persistence; no field/schema was deleted merely for visual simplification.

## Styling conventions

Semantic tokens live in `src/app/globals.css`: ink/muted, canvas/surface, border/control-border, green/success, attention, danger/destructive and on-dark text. Tree artwork has deliberately scoped foliage/bark/progress/fruit tokens, separate from attention status. Background landscape gradients and decorative tones are botanical artwork, not status values. Dark canopy outlines and gold fruit with dark edge/highlight preserve silhouettes against light terrain.

DM Sans is loaded as a variable font so intermediate UI weights are real font weights; editorial headings use the existing Georgia family through `--font-editorial`. Shared fields use 16px text, associated unique labels/errors, and a visible control border. Dense supporting text is at least 12px in touched role styles. Buttons retain primary/secondary/tertiary/destructive hierarchy, wrapped status labels and noninteractive disabled links. Native controls and descriptive classes preserve focus, hover, selected, pending and disabled states.

Touched components use `component__element` and `component--state` where useful, while retaining existing `ff-`, `garden-`, `planter-` conventions. Status classes use normalized status identifiers, not display strings with spaces. Role CSS remains scoped; no global heading/control reset was introduced. CSS was formatted to make shared rules and overrides reviewable. Growth markers never replay an animation on load, and existing scene motion/spinners honor reduced motion.

## Validation and release requirements

See the accompanying validation report and screenshots for actual checks and their limits. No remote migration, merge, deployment or live authenticated mutation has occurred. Before release, apply the migration through your normal reviewed process, then verify configured sign-in, invitation acceptance, onboarding, objective/progress saves and status changes, support/prayer replies, review persistence, team permissions, PDF downloads and sign-out against staging. Unit/integration and preview checks do not substitute for those authenticated live workflows.
