# First Fruits local testing

Use the authenticated app at http://127.0.0.1:3000/en/login for the existing planter and Catalyst journeys. The app runs on this computer; authentication and saved records use the configured Supabase service, so internet is required.

## Start and sign in

Double-click `Start-Local-Test.cmd` in the repository and keep its window open. If the server is already running, the launcher reports that instead of starting a second server. After source changes, stop the server and run `powershell -NoProfile -File scripts/start-local-test.ps1 -Build` to refresh the test build.

Use the existing synthetic accounts in `.env.workspace-demo.json`: `planter` is Daniel, `catalyst` is Alex, `peer` is another planter, and `outsider` belongs to a different organization. Keep that file private. Use separate browsers or a private window for simultaneous roles; tabs in one browser share a sign-in session.

After signing in, choose **Open workspace**. The home page also provides existing invitation controls. Preview URLs contain sample records and deliberately do not save; use `/en/dashboard` for persistence tests.

## Walk through the existing experience

1. **Planter:** Create an objective, add an activity, record progress, edit the objective and refresh. Confirm that the saved values remain.
2. **Check-in:** Choose Quick check-in, select feeling and momentum, enter an update and optional support need. Save and confirm it appears in Check-ins & progress after refresh.
3. **Catalyst:** Find Daniel in Your community. Open his workspace and read the objective and check-in. Reply on the objective. Return as the planter and confirm the reply appears.
4. **Prayer:** Create a request for Planter and Catalyst. Confirm the peer cannot see it. Change sharing to the organization, verify peer visibility, then return it to private and verify access is removed.
5. **Categories:** As Catalyst, add and edit an unused category, then remove it. Try removing a category in use and confirm it is blocked.
6. **Session and errors:** Sign out and revisit the dashboard; expect login. Try an incorrect password and then valid credentials. Check required fields and confirm failed saves retain entries.
7. **Access:** Use the peer and outsider accounts to confirm Daniel's private workspace is unavailable. Catalyst accounts can reply but cannot edit a planter's progress.

Use test-only wording such as “Local test” in new records. Record the role, page, action, expected result, actual result and severity when something fails.

## Invitation and recovery checks

Existing invitation and password recovery screens are included. Full delivery tests require an inbox the tester controls and the configured authentication service allowing the local callback URL. Follow the real email link on this same computer. Automated verification does not certify email delivery or a fresh user's onboarding; run those with a designated test inbox before claiming they passed.

## Scope and verification

This polish keeps the existing dashboard layout and adds consistent First Fruits and SEND Network branding. Login, recovery and onboarding share the same palette. Church-team permissions, interactive 3D globe, additional languages and exports are outside this polish.

The local build passed 71 tests, TypeScript, production build and authenticated page/access checks. Existing save-action verification covers objectives, activities, progress, check-ins, replies, sharing and category permissions. The working logo is `public/brand/first-fruits-mark.svg`; the browser icon uses the same artwork.
