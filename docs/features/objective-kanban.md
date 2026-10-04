# Objective Kanban

The Objectives view groups objectives into Planning, In Progress, At Risk, Complete, and Archived. Planter owners drag cards by their handle between columns or use the Move to dropdown; saves show pending, success, and error feedback. Cards only move after a successful save. Cards still open their existing details and progress history. Search filters all columns. Mobile stacks the columns vertically.

Team members retain shared-objective access and contribution permissions; they cannot change status. Catalyst viewers cannot change status. New objectives, including onboarding objectives, start in Planning. Completed and archived objectives stay accessible on the board but are excluded from open-objective counts. Archived objectives can be reopened.

## Deployment

Apply the existing Church Team migrations first, then `20261004180000_objective_kanban_status.sql`, coordinated with deployment of this app change. The migration maps active to in_progress, paused to planning, and done to complete. It changes the default and database constraint; it does not change activity statuses, thread statuses, or access policies. Old app instances will no longer be able to write the old objective statuses after this migration. Refresh existing browser sessions after rollout.

The migration has not been executed against a database in this implementation environment. Do not deploy the new writers before the migration. Rolling back app code alone is insufficient because the database retains the new statuses.

## Validation

TypeScript checks pass. Focused tests cover column rendering, successful and failed moves, pending saves, archived-objective restoration, status mapping, Catalyst labels, and server authorization for owners versus peers, Catalysts, and other planters. New files pass ESLint. Rebuilt on main commit 36ce635, retaining the Church Team review fixes and Catalyst garden. The full suite passes (188 tests); lint has no errors and seven existing image warnings.

After migration, test with real accounts: create an objective; move it through all five statuses and refresh; reopen an archived objective; check search and counts; confirm another planter and a Church Team member cannot change status. Verify the peer sees only shared objectives. This final database/RLS integration check still needs the deployed migrations and signed-in accounts.
