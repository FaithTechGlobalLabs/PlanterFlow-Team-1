# Onboarding Flow

Two role-specific flows guide new users from invitation to dashboard.

## Catalyst Flow

1. Admin creates invitation via seed script: `pnpm invite:catalyst email@example.com`
2. Invitation email sent by Supabase Auth
3. User clicks link → lands at `/invite/[token]`
4. Accepts invitation (name, language, password) → creates auth user + profile
5. `/onboarding/catalyst` → sets contact preference, marks onboarded
6. Home dashboard (can now invite pastors)

## Pastor Flow

1. Catalyst uses `/invite-pastor` form
2. Invitation email sent by Supabase Auth
3. User clicks link → lands at `/invite/[token]`
4. Accepts invitation (name, password) → creates auth user + profile
5. `/onboarding/church` → church details (name, city, planting date, vision)
6. `/onboarding/first-goal` → selects category, creates first objective
7. Home dashboard

## Routes

**Invitation acceptance:**
- `/invite` — no token provided
- `/invite/unavailable` — token expired or already used
- `/invite/[token]` — accept form (catalyst or planter)

**Onboarding:**
- `/onboarding/catalyst` — catalyst contact preference
- `/onboarding/church` — planter church details
- `/onboarding/first-goal` — planter first objective

**Catalyst actions:**
- `/invite-pastor` — send invitation to a pastor
- `/invite-pastor/sent/[id]` — confirmation page

**Admin actions:**
- `/invite-catalyst` — send invitation to a catalyst (admin-only)
- `/invite-catalyst/sent/[id]` — confirmation page

**Home:**
- `/` — role-specific dashboard (redirects to onboarding if incomplete)

## Manual Setup

### 1. Database Schema

Paste `supabase/migrations/0001_onboarding.sql` into the Supabase SQL Editor and run.

### 2. Authentication URLs

In Supabase Dashboard → Authentication → URL Configuration:

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** Add `http://localhost:3000/**`

### 3. Email Settings

- Invitation links expire per Auth email settings (default 1 hour)
- Free-tier email is rate limited to a few invitations per hour
- Production: configure a custom SMTP provider

### 4. First Invitation

Create the first catalyst invitation:

```bash
pnpm invite:catalyst you@example.com
```

The script creates an invitation row and sends the email. Check your inbox for the link.

## Admins

Admins are catalysts with the `is_admin` boolean flag set to true. Admins can invite catalysts via the `/invite-catalyst` route and optionally grant admin privileges to new catalysts. First admins are created using the seed script:

```bash
pnpm invite:catalyst daeunlove0525@gmail.com nairbharath587@gmail.com siddhero97@gmail.com --admin
```

Requires Node 22 (`nvm use`). Free-tier email allows only a few invites per hour; rerun failed ones later.

## Implementation Notes

- **Session flow:** Supabase emails a magic link with `#access_token`. `auth-hash-listener.tsx` exchanges the hash for a cookie session, then navigates to `/`.
- **RLS policies:** Users read their org. Invitations are readable only by the inviter. Profiles are inserted only via the service-role admin client.
- **Redirects:** The home page router (`/`) checks auth state, profile existence, and onboarding progress, then redirects as needed.
- **Validation:** All form inputs are validated server-side via `src/lib/validation/onboarding.ts`.
