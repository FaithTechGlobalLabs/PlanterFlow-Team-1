# Comprehensive Catalyst PDF/HTML Export Testing Guide

This task-based guide provides detailed step-by-step instructions for thoroughly testing the **Catalyst / Planter PDF Export** feature ([#10](https://github.com/FaithTechGlobalLabs/PlanterFlow-Team-1/issues/10)), covering automated vitest runs, manual browser workflows, report content verification, print/PDF layout rendering, and security/authorization edge cases.

---

## 📋 Prerequisites & Local Setup

- [ ] **Ensure Dependencies & Environment are Ready**
  ```bash
  pnpm install
  ```
- [ ] **Start the Local Development Server**
  ```bash
  pnpm dev
  ```
  - App running at: `http://localhost:3000` (or `http://localhost:3001`)

---

## 🧪 Phase 1: Automated Unit & API Route Tests

- [ ] **Run Export API Route Unit Tests**
  ```bash
  pnpm exec vitest run tests/api/export-planter.test.ts
  ```
  - [ ] **Verify Test 1**: `denies unauthenticated requests` returns HTTP 401 Unauthorized.
  - [ ] **Verify Test 2**: `denies access if Catalyst is not assigned to planter's church` returns HTTP 403 Forbidden.
  - [ ] **Verify Test 3**: `allows assigned Catalyst and returns JSON data format when requested` (`?format=json`) returns HTTP 200 with structured JSON.
  - [ ] **Verify Test 4**: `renders printable HTML export for assigned Catalyst` returns HTTP 200 with styled HTML output.

- [ ] **Run Catalyst Dashboard UI Component Tests**
  ```bash
  pnpm exec vitest run tests/ui/catalyst-dashboard.test.tsx
  ```
  - [ ] Verify all 3 UI component tests pass cleanly.

---

## 💻 Phase 2: Manual Browser Testing (Catalyst Planter Page)

### Task 2.1: Navigation & UI Verification
- [ ] **Sign in as an Assigned Catalyst**
  - Open `http://localhost:3000/en/login`.
  - Log in with Catalyst credentials.
- [ ] **Navigate to a Planter's Detail View**
  - From the Catalyst Garden (`/en/catalyst`), click on a church/planter card needing attention or from the church list.
  - Target URL format: `http://localhost:3000/en/catalyst/planters/<planter_id>`
- [ ] **Locate the Export Button**
  - Scroll to the bottom actions container.
  - [ ] Verify the button with class `.exportButton` exists next to the **"Back to your garden"** button.
  - [ ] Verify the button text displays: `📄 Export PDF Report` (or localized text).

---

## 📄 Phase 3: Detailed Report Content & Layout Verification

### Task 3.1: Trigger and Render Report
- [ ] **Click the Export Button**
  - Click `📄 Export PDF Report` on the planter review page.
  - [ ] Verify a new browser tab opens at `/api/export/planter/<planter_id>`.
  - [ ] Verify HTTP status is 200 OK and page loads in under 2 seconds.

### Task 3.2: Verify Report Header & Meta Information
- [ ] **Header Section**
  - [ ] Brand subtitle displays: `FIRST FRUITS · AUTHORIZED PLANTER REPORT`.
  - [ ] Title displays the planter's full display name (e.g. `Alex Pastor`).
  - [ ] Meta line displays the Church Name (e.g. `Grace Church (Vancouver)`).
  - [ ] Export date displays current date formatted as `Month Day, Year` (e.g. `October 4, 2026`).

### Task 3.3: Verify Check-in History Section
- [ ] **Check-ins List**
  - [ ] Section title: `Check-in History`.
  - [ ] Each check-in card displays the check-in date in the header.
  - [ ] If notes exist, verifies `Notes: <text>` is displayed.
  - [ ] Feeling and Momentum indicators display (e.g. `Feeling: hopeful · Momentum: building`).
  - [ ] Support requests display under `Support Needed:` if present.
  - [ ] If no check-ins exist, verifies empty state text: `No check-ins recorded yet.`

### Task 3.4: Verify Objectives & Dialogue Section
- [ ] **Objectives List**
  - [ ] Section title: `Objectives & Dialogue`.
  - [ ] Each objective displays in a card container with objective title (e.g. `Launch Life Groups`).
  - [ ] Category badge and lifecycle status badge display (e.g. `active · Discipleship` or `done · Operations`).
  - [ ] Description paragraph displays if configured.
- [ ] **Progress Entries Sub-section**
  - [ ] Chronological progress entries list date, logged target values, and notes.
- [ ] **Dialogue & Prayer/Support Thread Sub-section**
  - [ ] Threaded dialogue messages display author display name, timestamp, and message body text in chronological order.
  - [ ] If no objectives exist, verifies empty state text: `No objectives added yet.`

---

## 🖨️ Phase 4: Print & PDF Document Generation Testing

### Task 4.1: Print Action Bar & Browser Print Dialog
- [ ] **Action Bar**
  - [ ] Verify a top floating action bar contains `🖨️ Print / Save as PDF` button.
  - [ ] Click `🖨️ Print / Save as PDF` or press `Cmd+P` (Mac) / `Ctrl+P` (Windows).
  - [ ] Verify browser print preview modal opens immediately.

### Task 4.2: Print CSS (`@media print`) Audit
- [ ] **In Print Preview Modal**:
  - [ ] Verify top action bar (`.no-print`) is hidden in print view.
  - [ ] Verify primary brand header (`FIRST FRUITS`) and border line are crisp and legible.
  - [ ] Verify background colors and borders render cleanly (`-webkit-print-color-adjust: exact`).
  - [ ] Verify no text or cards are cut off at page margins.
  - [ ] Verify page breaks occur logically between sections (`.page-break`).
- [ ] **Save as PDF**:
  - [ ] Select **Save as PDF** in print destination and save file.
  - [ ] Open saved `.pdf` file in a PDF viewer (Adobe Acrobat, Preview, Chrome PDF) and verify output is identical to browser preview.

---

## 🔒 Phase 5: Security, Authorization & Edge Case Validation

### Task 5.1: Unauthenticated Caller Denial
- [ ] Open an incognito / private browser window without logging in.
- [ ] Attempt to access `/api/export/planter/<planter_id>` directly.
- [ ] [ ] Verify response is **HTTP 401 Unauthorized**:
  ```json
  { "error": "Unauthorized" }
  ```

### Task 5.2: Unassigned / Cross-Org Catalyst Denial
- [ ] Log in as a Catalyst who belongs to a different organization or is NOT assigned to planter `<planter_id>`.
- [ ] Navigate directly to `/api/export/planter/<planter_id>`.
- [ ] [ ] Verify response is **HTTP 403 Forbidden**:
  ```json
  { "error": "Forbidden: You are not authorized to export these records." }
  ```

### Task 5.3: Authorized Planter Self-Export
- [ ] Log in as Planter `<planter_id>` directly.
- [ ] Open `/api/export/planter/<planter_id>`.
- [ ] [ ] Verify HTTP 200 OK and report renders successfully for planter's own record.

### Task 5.4: JSON Programmatic Export API Format
- [ ] As an assigned Catalyst, navigate to `/api/export/planter/<planter_id>?format=json`.
- [ ] [ ] Verify response headers: `Content-Type: application/json`.
- [ ] [ ] Verify JSON structure:
  ```json
  {
    "exportDate": "October 4, 2026",
    "planter": { "id": "...", "name": "..." },
    "church": { "name": "...", "city": "...", "startDate": "..." },
    "objectives": [...],
    "checkIns": [...]
  }
  ```

### Task 5.5: Unicode & Multilingual Support Validation
- [ ] Test with planter names, objectives, or messages containing non-ASCII / Unicode text (e.g. Japanese `Planter 計画`, Ukrainian `План посадки`, Spanish `Перший фрукт`, French, etc.).
- [ ] [ ] Verify all characters render properly in HTML and PDF exports without corruption or broken glyphs (`?` / ``).
