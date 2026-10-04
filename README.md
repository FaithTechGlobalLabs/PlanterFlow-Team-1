# First Fruits

Help church planters track progress against their own planting vision, and give their Catalyst the visibility to step in with resources, encouragement, and training at the right moment.

![MIT License](https://badgen.net/badge/license/MIT/blue)
![Discover](https://badgen.net/badge/stage/discover/orange)

<!--
Other 4D cycle badges
![Discern](https://badgen.net/badge/stage/discern/gray)
![Develop](https://badgen.net/badge/stage/develop/blue)
![Demonstrate](https://badgen.net/badge/stage/demonstrate/green)
-->

Built at **#HACKVAN2026** (FaithTech Create, Vancouver) for the **SEND Network, North American Mission Board (NAMB)**.

## The problem

Every church planter arrives with their own vision and methodology. Today that vision lives in verbal touchpoints between the planter and their Catalyst. There is no shared record of the plan, no way for the planter to report progress against it, and no signal that tells the Catalyst when a planter is drifting and needs help.

NAMB funds planters for a four-year window. A strong, on-course start gives a plant more runway to become financially self-sustaining. First Fruits exists to keep that start on course.

## What the app does

- **Planter accounts.** Each planter has their own account and sees only their own data.
- **Catalyst as org admin.** The Catalyst sees every planter in their org and defines the objective categories planters plan against.
- **Objectives and activities.** Under each category a planter defines the weekly or monthly steps they will take, then logs progress against them.
- **Dialogue per objective.** Planter and Catalyst chat under each objective. Every entry is time-stamped.
- **Prayer requests.** Planters record prayer requests. The planter or Catalyst can make a request visible to the other planters in the org so they can care for each other.
- **Native language.** Planters use the app in their own language.
- **PDF export.** Objectives and dialogue export to PDF for record keeping.

Default objective categories (editable by the Catalyst):

1. Engage the City
2. Make Disciples
3. Plant the Church
4. Personal Relationship with Jesus (growth and struggle areas)
5. Prayer Requests

See [`docs/superpowers/specs/2026-10-02-first-fruits-design.md`](docs/superpowers/specs/2026-10-02-first-fruits-design.md) for roles, data model, MVP scope, and the proposed stack.

## 📋 Requirements

- Node.js 22+
- pnpm 10+ (we use pnpm, not npm). Install with `corepack enable` or `npm i -g pnpm`.
- A Supabase project (Postgres, Auth, Realtime) for anything beyond the landing page
- A Cloudflare account for deploys (OpenNext on Workers; see `wrangler.jsonc`)

## 🚀 Getting Started

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase URL and keys
pnpm dev                     # http://localhost:3000
```

Apply the SQL files in `supabase/migrations/` to your Supabase project, in order.

Other scripts: `pnpm lint`, `pnpm build`, `pnpm exec vitest run` (unit tests), `pnpm test:e2e` (Playwright; needs `pnpm dev` and `.env.local`), `pnpm preview` / `pnpm deploy` (Cloudflare).

Feature docs: [invitations](docs/features/invitations.md), [onboarding](docs/features/onboarding.md), [login](docs/features/login-page.md), [local testing](docs/local-testing.md).

Project layout:

```text
src/app/              Next.js App Router pages and layouts
src/lib/supabase/     client.ts (browser), server.ts (server components, actions, routes), admin.ts (service role, server only)
docs/superpowers/specs/  Design spec
```

Stack: Next.js (App Router, TypeScript), Tailwind CSS, Supabase. Rationale and alternatives in the design spec.

## 🗓️ Hackathon schedule

| Event | When |
| --- | --- |
| Pitch Night | Fri Oct 2, 5:30 pm to 8:30 pm (client available around 7 pm) |
| User Testing | Sat Oct 3, 1 pm to 3 pm (client available for a 30 minute slot) |
| Presentation | Sun Oct 4, 3:30 pm to 4:30 pm |

## 👥 Team

| Name | GitHub | Focus |
| --- | --- | --- |
| Bharath | [@nairbharath587](https://github.com/nairbharath587) | Frontend |
| Olivia | [@y23angel](https://github.com/y23angel) | Frontend, full stack |
| Hadi | [@hekaputra-higher](https://github.com/hekaputra-higher) | Design, coordination |
| Siddhartha | [@siddhero97](https://github.com/siddhero97) | Backend, client liaison |

Client: Paul Wicki, Church Planting Catalyst (BC), SEND Network / NAMB. Contact details are shared in the team channel, not in this repo.

## 👏 How to Contribute

- Branch from `main`, open a PR, get one teammate review before merging.
- Keep PRs small during the hackathon so frontend and backend can land in parallel.

### [Code of Conduct][code]

We have adopted a Code of Conduct that we expect project participants to adhere to.
Please read the [full text][code] so that you can understand what actions will and will not be tolerated.

[code]: https://github.com/FaithTechGlobalLabs/.github/blob/main/CODE_OF_CONDUCT.md

## 📄 License

Project is MIT licensed, as found in the [LICENSE][license] file.

[license]: ./LICENSE
