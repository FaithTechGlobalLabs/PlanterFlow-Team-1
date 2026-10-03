# Login Page Feature

**Issue:** [#12 Globe login](https://github.com/FaithTechGlobalLabs/PlanterFlow-Team-1/issues/12)  
**Figma:** [Desktop (1200px)](https://www.figma.com/design/cqiy3n6u8ZcIduE17bYoTG/Planter-Flow?node-id=6-2) | [Mobile (390px)](https://www.figma.com/design/cqiy3n6u8ZcIduE17bYoTG/Planter-Flow?node-id=10-404)  
**Status:** Login and recovery integration implemented; automated tests and types pass. Current Windows production build is blocked by SWC native-cache permissions; browser and hosted authentication verification are pending.

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
- Redirects to the current locale's home page on success

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

- #13 Password Recovery → implemented at `/en/recover`; verify email delivery and hosted callback
- #49 Invite Acceptance → `/en/invite`
- #2 Church Dashboard → Replace `/en` placeholder
- #6 Catalyst Garden → Interactive globe

## Hosting handoff — October 3, 2026

Hadi is working on the login integration on `codex/login-supabase-integration`, based on `origin/feat/login-page`. Sid owns the hosting configuration. These changes are local and have not been deployed.

Configure these variables in the application's hosting environment, then rebuild/redeploy:

| Variable | Value / source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://uqxkoqekpvdyucuiccxh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | This project's publishable key from Supabase; legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is also supported |
| `NEXT_PUBLIC_SITE_URL` | The actual HTTPS app origin, without a path; use `http://localhost:3000` only locally |
| `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` | Project server credential, entered directly in hosting settings. Never use a `NEXT_PUBLIC_` prefix or commit it |

The server credential is required for invitations and the existing privileged onboarding operations. Email/password login and password recovery use the public connection. A credential installed on the host is not available to a local development server; local invitation testing still needs its own ignored environment configuration.

In Supabase Authentication URL Configuration, set Site URL to the deployed app origin. Add redirect URLs for `https://<app-host>/auth/callback**` and `https://<app-host>/*/invite/**`. If testing locally, also add `http://localhost:3000/auth/callback**` and `http://localhost:3000/*/invite/**`. Use the exact host; do not broadly allow all deployed domains. Current locale routing is English only; the other requested languages remain separate implementation work.

The `20261003155911_restrict_profile_permissions.sql` migration has already been applied to the shared Supabase project and verified with a rolled-back impersonation test. Users can edit their personal profile fields but cannot promote their role, change organization, or grant themselves admin access. The existing base schema was already present before this integration; do not blindly replay the original migration against it.

### Acceptance check with Hadi and Sid

1. An existing confirmed user signs in and reaches the correct onboarding or home screen.
2. Refresh and navigation retain the session; sign out prevents access to protected pages.
3. Incorrect credentials show a generic error, without revealing account existence.
4. Request recovery for a team-owned test account; open the email in the same browser, set a new password, sign out, and sign in with it. PKCE recovery depends on the originating browser's cookies.
5. With Sid's server credential installed, an authorized Catalyst invites a team-owned test account; acceptance provisions the expected organization and role, then onboarding completes.
6. Verify the same flow on the hosted URL, including expired links and mobile layout.

Local validation: 14 test files / 58 tests passed, TypeScript passed, lint had no errors and eight existing image warnings. Tests mock authentication responses; they do not prove a real account can sign in or that email is delivered. The Windows build currently fails while loading `@swc/core` because its native cache rejects local directory permissions. No real sign-in, invitation email, recovery email, or browser acceptance test has been completed in this integration session. Existing invitation acceptance uses multiple database writes and is not yet transactional.
