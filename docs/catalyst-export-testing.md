# Catalyst Export & Presence Section Testing Guide

Use this task list to verify the Catalyst PDF/HTML export feature and the Catalyst Garden presence cards.

---

## 1. Automated Unit Tests

- [ ] **Run Export API Unit Tests**
  ```bash
  pnpm exec vitest run tests/api/export-planter.test.ts
  ```
  - [ ] Verify 4 tests pass (`denies unauthenticated`, `denies unassigned catalyst`, `allows assigned catalyst + JSON format`, `renders printable HTML export`).

- [ ] **Run Catalyst Dashboard UI Tests**
  ```bash
  pnpm exec vitest run tests/ui/catalyst-dashboard.test.tsx
  ```
  - [ ] Verify 3 UI component tests pass.

---

## 2. Manual Browser Testing (Catalyst Garden & Presence Cards)

- [ ] **Start Local Dev Server**
  ```bash
  pnpm dev
  ```

- [ ] **Sign in as Catalyst**
  - [ ] Open `http://localhost:3000/en/login` in your browser.
  - [ ] Enter Catalyst credentials and sign in.
  - [ ] Verify redirection to Catalyst Garden (`http://localhost:3000/en/catalyst`).

- [ ] **Test Clickable Presence Cards**
  - [ ] Locate the **"Where am I needed?"** presence section (`.catalyst-presence-section`).
  - [ ] Hover over a presence card (`.catalyst-presence-card`). Verify hover background highlight and cursor pointer.
  - [ ] Click anywhere on the presence card box.
  - [ ] Verify navigation to the planter's objective review page (`/en/catalyst/planters/<id>`).

---

## 3. Manual Browser Testing (Catalyst Export)

- [ ] **Open Planter Review Page**
  - [ ] Navigate to an assigned planter page (`/en/catalyst/planters/<id>`).

- [ ] **Trigger Export Report**
  - [ ] Scroll to the bottom action bar.
  - [ ] Click the **📄 Export PDF Report** button (`.exportButton`).
  - [ ] Verify a new browser tab opens at `/api/export/planter/<id>`.

- [ ] **Verify Export Report Content**
  - [ ] Verify header contains **Planter Name**, **Church Name**, and **Export Date**.
  - [ ] Verify **Check-in History** section lists past check-ins with notes, feeling, momentum, and support requests.
  - [ ] Verify **Objectives & Dialogue** section lists categories, objectives, progress updates, and dialogue messages in chronological order.

- [ ] **Print / Save as PDF**
  - [ ] Click the **🖨️ Print / Save as PDF** button at the top of the report page (or press `Cmd+P` / `Ctrl+P`).
  - [ ] Verify print preview renders cleanly with no scrollbars or clipped text.
  - [ ] Save as a PDF document.

---

## 4. Security & Authorization Checks

- [ ] **Test Unauthenticated Access**
  - [ ] Open a private/incognito browser window.
  - [ ] Navigate directly to `/api/export/planter/<id>`.
  - [ ] Verify response is HTTP 401 Unauthorized (`{"error": "Unauthorized"}`).

- [ ] **Test Cross-Org / Unassigned Access**
  - [ ] Sign in as a Catalyst who is NOT assigned to planter `<id>`.
  - [ ] Navigate directly to `/api/export/planter/<id>`.
  - [ ] Verify response is HTTP 403 Forbidden (`{"error": "Forbidden: You are not authorized to export these records."}`).

- [ ] **Test JSON Format Export**
  - [ ] As an assigned Catalyst, open `/api/export/planter/<id>?format=json` in your browser.
  - [ ] Verify structured JSON response containing `exportDate`, `planter`, `church`, `objectives`, and `checkIns`.
