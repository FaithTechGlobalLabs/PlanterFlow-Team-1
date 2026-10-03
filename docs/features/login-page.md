# Login Page Feature

**Issue:** [#12 Globe login](https://github.com/FaithTechGlobalLabs/PlanterFlow-Team-1/issues/12)  
**Figma:** [Desktop (1200px)](https://www.figma.com/design/cqiy3n6u8ZcIduE17bYoTG/Planter-Flow?node-id=6-2) | [Mobile (390px)](https://www.figma.com/design/cqiy3n6u8ZcIduE17bYoTG/Planter-Flow?node-id=10-404)  
**Status:** ✓ Implemented, build passing

## Intent

Users sign in at `/en/login` with email and password. The page matches the Figma design at both desktop (1200px) and mobile (390px) widths.

**Why first:** This page establishes foundations every later page reuses:
- Color tokens and DM Sans typography
- Reusable UI components (Button, Input, BrandNav, PageHeader)
- Locale routing with next-intl
- Supabase session flow via proxy middleware

## Architecture

- **Routes:** All under `src/app/[locale]/` with next-intl locale prefix
- **Auth:** Server action `signIn` via Supabase SSR, errors mapped to generic messages
- **Middleware:** `src/proxy.ts` refreshes the Supabase session and redirects by auth state
- **i18n:** next-intl with English messages in `messages/en.json`
- **Components:** Reusable UI in `src/components/ui/`

## Design Tokens

All declared in `src/app/globals.css`:

| Token | Value | Use |
|---|---|---|
| `--color-canvas` | `#f3f5f2` | Page background |
| `--color-navy` | `#102d47` | Globe card background |
| `--color-ink` | `#14334b` | Headings, labels, secondary button text |
| `--color-muted` | `#5c6e7a` | Body copy, placeholders |
| `--color-green` | `#3d735d` | Eyebrow text |
| `--color-blue` | `#176194` | Primary button background |
| `--color-sage` | `#e6efe8` | Secondary button background |
| `--color-border` | `#d7e0df` | Input border |
| `--radius-card` | `12px` | Cards, inputs, buttons |

**Typography:** DM Sans (400, 700) via `next/font/google`, line-height 1.4.

| Style | Size | Weight |
|---|---|---|
| Title | 36px | 700 |
| Body | 15px | 400 |
| Label | 13px | 700 |
| Small | 12px | 400 |

## Components

**Button** — Variants: `primary` (blue) | `secondary` (sage). Height 48px.  
**Input** — Label + field (54px) + optional error. 16px padding.  
**BrandNav** — Brand mark (32px desktop / 24px mobile) + wordmark. Height 44px.  
**PageHeader** — Eyebrow (green) + title (36px) + subline. Reused by all pages.  
**GlobeCard** — Static globe illustration. 650×520px desktop / 260×450px mobile.

## Routing & i18n

- `src/i18n/routing.ts` — Locale config, next-intl exports
- `src/i18n/request.ts` — Message loader
- `messages/en.json` — UI strings (`brand`, `login`, `errors` namespaces)
- `src/proxy.ts` — Session refresh, auth-based redirects

Redirects:
- Signed-out → `/en/login` (except public routes: login, invite, recover)
- Signed-in on `/en/login` → `/en`

## Login Flow

**Page** (`src/app/[locale]/login/page.tsx`):
- Server component rendering BrandNav, PageHeader, GlobeCard, LoginForm
- Desktop: side-by-side (globe + form). Mobile: stacked.

**Form** (`src/app/[locale]/login/login-form.tsx`):
- Email + password inputs via `useActionState`
- Persists email, clears password on error
- Buttons: "Sign in" + "Accept invitation" link

**Action** (`src/app/[locale]/login/actions.ts`):
- Validates required fields
- Calls `supabase.auth.signInWithPassword()`
- Maps errors to generic message
- Redirects to `/` on success

## Testing

- `tests/ui/button.test.tsx` — Button variants, disabled state
- `tests/ui/input.test.tsx` — Label, error display, placeholder
- `tests/login/actions.test.ts` — Required field validation
- `vitest.config.ts` + `tests/setup.ts` — Vitest + jest-dom matchers

## SVG Assets

From Figma export in `public/brand/` and `public/globe/`:
- `first-fruits-mark.svg` (32 × 32)
- Globe layers: outline, meridian-wide, meridian-narrow, parallel-low, parallel-high, continents
- `tree-sapling.svg` (38 × 42.75)

Keep root width/height attributes; never override with 100% × 100%.

## Key Decisions

| What | Choice | Why |
|---|---|---|
| Sign-in | Email + password (server action) | Figma design; Supabase standard |
| i18n | next-intl 4.x, English, locale in URL | Enables future locales |
| Globe | Static SVG | Dynamic version in later feature (#6) |
| Tests | Vitest + React Testing Library | Fast, familiar |
| Styling | Tailwind + CSS tokens | Matches project; tokens match Figma |

## Next

- #13 Password Recovery → `/en/recover`
- #49 Invite Acceptance → `/en/invite`
- #2 Church Dashboard → Replace `/en` placeholder
- #6 Catalyst Garden → Interactive globe
