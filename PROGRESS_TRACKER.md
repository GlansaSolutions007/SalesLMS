# Sales LMS — Software Development Progress Tracker

**Prepared for:** CEO / Project Manager / Development Team
**Prepared on:** 2026-07-27
**Scope:** `SalesLMS` frontend repository (React + Vite)

## How to read this document

| Symbol | Meaning |
|---|---|
| ✅ | Completed |
| 🟡 | In Progress |
| ❌ | Not Started |
| 🔄 | UI Revision Required |

**Important methodology note:** This repository contains **frontend code only** — there is no backend or database code in it. *Backend API* and *Database* statuses below are therefore **inferred**, not confirmed against a real server:

- Marked **✅** where the page calls a real HTTP endpoint through `src/services/*` (e.g. `axios` → `/admin/companies`) and gets/sends real data — the underlying DB table is assumed to exist because the API responds.
- Marked **❌** where the page uses hardcoded local arrays / mock data, or the relevant service file explicitly says "mock backend, no real API yet" (this is a comment left by the developers in `employeeService.js` and `courseService.js`).
- Marked **🟡** where a backend function exists in code but isn't actually being called by the UI yet (dead/unused wiring).

**Testing status:** a full repo scan found **zero test files** (`*.test.js`, `*.spec.js`) anywhere in the project. Every page is therefore ❌ Not Started for Testing — this is called out once here rather than repeated as a note on every row.

This file is plain Markdown/text so it can be edited directly (in any editor, or in the Git repo) as statuses change — just swap the emoji and remarks.

---

## 1. Authentication

| Page | UI Design | Frontend | Backend API | Database | Testing | Remarks |
|---|---|---|---|---|---|---|
| Login | ✅ | ✅ | ✅ | ✅ | ❌ | Fully working — real `POST /auth/login` + session check |
| Forgot Password | 🔄 | 🟡 | ❌ | ❌ | ❌ | Cosmetic view-switch inside `login.jsx`; not wired to any API |
| Reset Password | 🔄 | 🟡 | ❌ | ❌ | ❌ | Same as above — fields exist, no submit logic |
| Change Password | ✅ | ✅ | ✅ | ✅ | ❌ | Works, but as a modal (`ChangePasswordModal.jsx`), not a page |

### Login
- **Screen Purpose:** Authenticate a user and start a session.
- **APIs Used:** `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, `POST /auth/refresh` (`authService.js`)
- **Database Tables (assumed):** `users`, `roles`
- **UI Components:** Email/password fields, show/hide password toggle, "Remember me" checkbox
- **Dependencies:** `axios`, `AuthContext`
- **Current Development Status:** Complete and functioning end-to-end.
- **Pending Tasks:** None functional; consider a11y labels on the password-visibility toggle.
- **Priority:** High (already delivered — keep stable)

### Forgot Password
- **Screen Purpose:** Let a user request a password-reset email/OTP.
- **APIs Used:** None yet. Needed: `POST /auth/forgot-password`
- **Database Tables:** None wired. Needed: `password_reset_tokens`, `users`
- **UI Components:** Email input (already built, inside `login.jsx`)
- **Dependencies:** None
- **Current Development Status:** Fake UI state (`view: "forgot"`) inside `login.jsx`; submit button has no handler.
- **Pending Tasks:** Extract to its own route (or keep as a modal), build `authService.forgotPassword()`, wire the submit handler, add sent/error states.
- **Priority:** High — security-relevant flow, currently unusable.

### Reset Password
- **Screen Purpose:** Let a user set a new password from a reset link/token.
- **APIs Used:** None yet. Needed: `POST /auth/reset-password`
- **Database Tables:** None wired. Needed: `password_reset_tokens`, `users`
- **UI Components:** New password + confirm password fields (already built, inside `login.jsx`)
- **Dependencies:** None
- **Current Development Status:** Same in-component stub pattern as Forgot Password; no token handling, no route.
- **Pending Tasks:** Needs a real route (e.g. `/reset-password/:token`), backend wiring, token-expiry handling, password-strength validation.
- **Priority:** High

### Change Password
- **Screen Purpose:** Let a logged-in user change their own password.
- **APIs Used:** `POST /auth/change-password` (`authService.js`)
- **Database Tables (assumed):** `users`
- **UI Components:** `ChangePasswordModal.jsx` — current/new/confirm fields, validation, error mapping
- **Dependencies:** `authService.js`
- **Current Development Status:** Fully working, opened from the Topbar.
- **Pending Tasks:** Optional — promote from modal-only to a dedicated `/settings/security` page for discoverability.
- **Priority:** Low (already functional)

---

## 2. Dashboard

| Page | UI Design | Frontend | Backend API | Database | Testing | Remarks |
|---|---|---|---|---|---|---|
| Dashboard | ✅ | 🟡 | ❌ | ❌ | ❌ | 5 role-specific dashboards, visually complete, 100% hardcoded data |

### Dashboard
- **Screen Purpose:** Role-specific landing page with KPIs, tables, and charts (5 variants: Super Admin, Company Admin, Trainer, Sales Manager, Sales Employee).
- **APIs Used:** None currently.
- **Database Tables (needed):** `companies`, `employees`, `subscriptions`, `revenue/transactions`, `courses`, `certificates` (varies per role widget)
- **UI Components:** Stat cards, companies table, hand-built revenue chart (no charting library)
- **Dependencies:** `DashboardRouter.jsx` + 5 role dashboard components
- **Current Development Status:** Strong visual mockup; all stats/tables/charts are static local arrays.
- **Pending Tasks:** Build per-role stats/reporting APIs, replace mock arrays with live data + loading/error states, consider adopting a real charting library instead of hand-rolled SVG.
- **Priority:** High — first screen every user sees.

---

## 3. Company Management

| Page | UI Design | Frontend | Backend API | Database | Testing | Remarks |
|---|---|---|---|---|---|---|
| Company List | ✅ | ✅ | ✅ | ✅ | ❌ | Most complete module — real pagination/search/filter/CSV export |
| Add Company | ✅ | ✅ | ✅ | ✅ | ❌ | 3-step wizard, real validation + submission |
| Edit Company | ✅ | ✅ | ✅ | ✅ | ❌ | Logo replace/remove, reset-to-loaded-data confirm |
| View Company | ✅ | ✅ | ✅ | ✅ | ❌ | Read-only detail view, fully live |

### Company List
- **Screen Purpose:** Browse, search, filter, and export the company directory.
- **APIs Used:** `GET /admin/companies` (search/status/sort/page params) — `companyApi.js`
- **Database Tables (assumed):** `companies`, `subscription_plans`, `branches`, `departments`
- **UI Components:** Data table, search bar, status filter, sort control, CSV export, print-to-PDF
- **Dependencies:** `useCompaniesList` hook, `utils/csv.js`
- **Current Development Status:** Fully functional, real API-backed.
- **Pending Tasks:** Automated tests; "Export PDF" is currently just `window.print()` — consider a real PDF export.
- **Priority:** Medium

### Add Company
- **Screen Purpose:** Onboard a new company with a subscription plan and an admin user.
- **APIs Used:** `GET /subscription-plans`, `POST /admin/companies` (multipart) — `companyApi.js`
- **Database Tables (assumed):** `companies`, `subscription_plans`, `users`, address/location fields
- **UI Components:** 3-step `WizardStepper`, logo drag-drop uploader, cascading Country/State/City selects, `PasswordField`
- **Dependencies:** `react-hook-form`, `@hookform/resolvers/yup`, `yup`
- **Current Development Status:** Fully functional 3-step wizard with real validation and submission.
- **Pending Tasks:** Automated tests; verify duplicate email/GST server-error handling.
- **Priority:** Medium

### Edit Company
- **Screen Purpose:** Update an existing company's details.
- **APIs Used:** `GET /admin/companies/{id}`, `POST /admin/companies/{id}` (`_method=PUT` spoof, multipart)
- **Database Tables (assumed):** `companies`
- **UI Components:** Same field set as Add, plus logo replace/remove and a reset-to-loaded-data confirmation dialog
- **Dependencies:** `react-hook-form`, `yup`
- **Current Development Status:** Fully functional.
- **Pending Tasks:** Automated tests.
- **Priority:** Medium

### View Company
- **Screen Purpose:** Read-only detail view of a single company.
- **APIs Used:** `GET /admin/companies/{id}`
- **Database Tables (assumed):** `companies`, `subscription_plans`
- **UI Components:** Profile card, stat cards (Employees/Branches/Departments/Designations), Company Information / Address / Subscription / Settings sections
- **Dependencies:** `companyApi.js`
- **Current Development Status:** Fully functional.
- **Pending Tasks:** Automated tests.
- **Priority:** Low

> **Note:** the Company Management sub-navigation also has **Branches, Departments, and Designations** tabs — these exist in the menu/routing but are **not built yet** (render the generic "not built" placeholder). They weren't in the originally requested page list, so see the **Additional Pages Found** table near the end of this document.

---

## 4. Role & Permission Management

| Page | UI Design | Frontend | Backend API | Database | Testing | Remarks |
|---|---|---|---|---|---|---|
| Role List | ✅ | ✅ | ✅ | ✅ | ❌ | Fully working CRUD via modal |
| Add Role | ✅ | ✅ | ✅ | ✅ | ❌ | Modal-based (not a standalone page), fully functional |
| Edit Role | ✅ | ✅ | ✅ | ✅ | ❌ | Modal-based, fully functional |
| Role Details | ❌ | ❌ | ✅ | ✅ | ❌ | Backend endpoint exists but no read-only details screen uses it |
| Permission List | ❌ | ❌ | ✅ | ✅ | ❌ | No standalone page to browse/manage permissions |
| Assign Permissions | ✅ | ✅ | 🟡 | ✅ | ❌ | Works today via an inline payload; the dedicated sync endpoint is unused |

### Role List
- **Screen Purpose:** Browse, add, edit, activate/deactivate, and delete roles.
- **APIs Used:** `GET admin/roles`, `PATCH admin/roles/{id}/status`, `DELETE admin/roles/{id}` (`rolesService.js`)
- **Database Tables (assumed):** `roles`, `role_user` (user count), `role_permission` (permission count)
- **UI Components:** Data table (Name, Description, Status, Users, Permissions, Created)
- **Dependencies:** `rolesService.js`
- **Current Development Status:** Fully functional.
- **Pending Tasks:** Automated tests.
- **Priority:** Medium

### Add Role / Edit Role
- **Screen Purpose:** Create or update a role and its permission set.
- **APIs Used:** `POST admin/roles` / `PUT admin/roles/{id}` (permission IDs sent inline)
- **Database Tables (assumed):** `roles`, `role_permission`
- **UI Components:** Modal — Role Name, Description, grouped/searchable permission checklist with select-all
- **Dependencies:** `rolesService.js`
- **Current Development Status:** Fully functional, but implemented as a modal rather than a dedicated page.
- **Pending Tasks:** Automated tests; decide if a full-page form is wanted instead of a modal.
- **Priority:** Medium

### Role Details
- **Screen Purpose:** Read-only view of a single role's info and permissions.
- **APIs Used:** `GET admin/roles/{id}` exists but is only used to *prefill the edit modal*, not to render a details screen.
- **Database Tables (assumed):** `roles`, `role_permission`
- **UI Components:** None built.
- **Dependencies:** —
- **Current Development Status:** No UI exists for this as a standalone screen.
- **Pending Tasks:** Build a details view (or decide it's not needed since Edit already shows everything).
- **Priority:** Low

### Permission List
- **Screen Purpose:** Browse/manage the catalog of available permissions.
- **APIs Used:** `GET admin/permissions?per_page=100` exists but is only consumed inside the Role modal's checklist.
- **Database Tables (assumed):** `permissions`
- **UI Components:** None built as a standalone page.
- **Dependencies:** —
- **Current Development Status:** No page to create/edit/delete individual permissions.
- **Pending Tasks:** Decide if permissions should be developer-managed only (seeded) or need an admin UI.
- **Priority:** Low

### Assign Permissions
- **Screen Purpose:** Attach permissions to a role.
- **APIs Used:** Currently sent inline via `createRole`/`updateRole`. A separate `syncRolePermissions` (`POST admin/roles/{id}/permissions`) exists in `rolesService.js` but is **not called anywhere**.
- **Database Tables (assumed):** `role_permission`
- **UI Components:** Grouped checkbox checklist inside the Add/Edit Role modal
- **Dependencies:** `rolesService.js`
- **Current Development Status:** Functionally works today; there's duplicate/dead backend wiring to reconcile.
- **Pending Tasks:** Remove the unused `syncRolePermissions` function or switch to using it instead of the inline payload — pick one pattern.
- **Priority:** Low (tech debt, not user-facing)

---

## 5. Employee Management

| Page | UI Design | Frontend | Backend API | Database | Testing | Remarks |
|---|---|---|---|---|---|---|
| Employee List | ✅ | 🟡 | ❌ | ❌ | ❌ | Full CRUD *look*, but local-only mock state (resets on refresh) |
| Add Employee | ✅ | ✅ | ❌ | ❌ | ❌ | Rich 3-step wizard; submission is fully faked |
| Edit Employee | ❌ | ❌ | ❌ | ❌ | ❌ | **No edit route exists at all** |
| Employee Profile | ✅ | 🔄 | ❌ | ❌ | ❌ | Shows identical mock data regardless of which employee was clicked |

### Employee List
- **Screen Purpose:** Browse, search, add, edit, delete employees.
- **APIs Used:** None — `employeeService.js` is explicitly commented "Mock employees backend. No real API exists yet."
- **Database Tables (needed):** `employees`, `departments`, `designations`, `branches`
- **UI Components:** Generic `CrudPage`/`useCrudTable` engine — data table, search, sort, filter, bulk-delete, CSV import/export
- **Dependencies:** `src/components/CrudPage.jsx`, `src/hooks/useCrudTable.js`
- **Current Development Status:** Full-looking CRUD table, but entirely client-side state seeded from `employeeData.js`; nothing persists.
- **Pending Tasks:** Build real `employeeService` endpoints and wire `useCrudTable` to them.
- **Priority:** High

### Add Employee
- **Screen Purpose:** Onboard a new employee (details, address/documents, skills/emergency contacts).
- **APIs Used:** `saveEmployeeDraft`/`createEmployee` — both mock (`setTimeout`). The one real call is `getCompanies` (to populate the company dropdown for Super Admins).
- **Database Tables (needed):** `employees`, `employee_documents`, `employee_skills`, `emergency_contacts`
- **UI Components:** 3-step wizard, `DocumentUploader`, password-strength meter, dynamic skill/emergency-contact rows
- **Dependencies:** Manual `useState`-based form state, `WizardStepper`
- **Current Development Status:** UI/validation fully built; "Save Draft"/"Save Employee" always succeed against a fake timer — nothing persisted.
- **Pending Tasks:** Wire to a real backend; add duplicate-email/username server validation.
- **Priority:** High

### Edit Employee
- **Screen Purpose:** Update an existing employee's details.
- **APIs Used:** None.
- **Database Tables (needed):** `employees`
- **UI Components:** None built.
- **Dependencies:** —
- **Current Development Status:** `routePaths.js` has no `EMPLOYEES_EDIT` route — editing an employee is currently impossible in the app.
- **Pending Tasks:** Add the route + page (can likely reuse most of `EmployeeForm.jsx`), wire to a real update endpoint.
- **Priority:** High — basic CRUD gap.

### Employee Profile
- **Screen Purpose:** Read-only detail view (Overview, Documents, Skills, Emergency Contacts, Targets, Performance tabs).
- **APIs Used:** None — hardcoded local arrays in the page file, explicitly commented "Mock per-employee detail."
- **Database Tables (needed):** `employees`, `employee_documents`, `employee_skills`, `emergency_contacts`, `targets`, `performance_records`
- **UI Components:** 6 tabs, static tables/lists
- **Dependencies:** —
- **Current Development Status:** Renders the *same* mock data no matter which employee row was clicked — not bound to the real selected employee.
- **Pending Tasks:** Wire to a real per-employee API; fix the data-binding bug once the API exists.
- **Priority:** High — this is misleading in a demo (looks correct, isn't).

---

## 6. Trainer Management

| Page | UI Design | Frontend | Backend API | Database | Testing | Remarks |
|---|---|---|---|---|---|---|
| Trainer List | ✅ | 🟡 | ❌ | ❌ | ❌ | Same CrudPage pattern as Employees, fully mocked |
| Add Trainer | ✅ | 🟡 | ❌ | ❌ | ❌ | Inline modal (no dedicated page); no backend at all |
| Edit Trainer | ✅ | 🟡 | ❌ | ❌ | ❌ | Same inline modal; no backend at all |
| Trainer Profile | ✅ | 🔄 | ❌ | ❌ | ❌ | Identical mock data regardless of trainer clicked |

### Trainer List
- **Screen Purpose:** Browse, search, add, edit, delete trainers.
- **APIs Used:** None — **no `trainerService.js` file exists in the codebase at all.**
- **Database Tables (needed):** `trainers`, `trainer_expertise`
- **UI Components:** Generic `CrudPage` (Trainer, Expertise, Courses, Batches, Rating, Status columns)
- **Dependencies:** `src/components/CrudPage.jsx`, hardcoded `trainerData.js`
- **Current Development Status:** Full-looking CRUD, entirely local mock.
- **Pending Tasks:** Build a `trainerService.js` and real backend endpoints from scratch.
- **Priority:** High

### Add Trainer / Edit Trainer
- **Screen Purpose:** Create/update a trainer record.
- **APIs Used:** None.
- **Database Tables (needed):** `trainers`
- **UI Components:** Inline `CrudPage` modal (no dedicated page/route)
- **Dependencies:** —
- **Current Development Status:** UI works, nothing persists.
- **Pending Tasks:** Same as Trainer List — needs a real service layer.
- **Priority:** Medium

### Trainer Profile
- **Screen Purpose:** Read-only detail view (Overview, Skills, Course Allocation, Schedule, Attendance, Performance, Feedback tabs).
- **APIs Used:** None — hardcoded local arrays.
- **Database Tables (needed):** `trainers`, `trainer_skills`, `trainer_courses`, `schedules`, `attendance`, `performance_records`, `feedback`
- **UI Components:** 7 tabs, `StarRating` component
- **Dependencies:** —
- **Current Development Status:** Same data-binding issue as Employee Profile — shows identical data for every trainer.
- **Pending Tasks:** Wire to a real per-trainer API once it exists; fix data binding.
- **Priority:** Medium

---

## 7. Course Management

| Page | UI Design | Frontend | Backend API | Database | Testing | Remarks |
|---|---|---|---|---|---|---|
| Course List | ✅ | 🟡 | ❌ | ❌ | ❌ | Filtering works client-side; row actions (View/More) have no handlers |
| Add Course | ✅ | ✅ | ❌ | ❌ | ❌ | 4-step wizard, fully faked backend |
| Course Details | 🔄 | ❌ | ❌ | ❌ | ❌ | A full mockup exists as **dead, unrouted code** (`courses.jsx`) |
| Course Sections | ✅ | 🟡 | ❌ | ❌ | ❌ | Working generic CRUD table, hardcoded seed data |
| Lessons | ✅ | 🟡 | ❌ | ❌ | ❌ | Same pattern as Course Sections |
| Lesson Details | ❌ | ❌ | ❌ | ❌ | ❌ | No such page exists anywhere |

### Course List
- **Screen Purpose:** Browse/filter the course catalog.
- **APIs Used:** None — hardcoded `COURSES` array and `STATS`.
- **Database Tables (needed):** `courses`, `enrollments`
- **UI Components:** Stat cards, tab filters, grid/list toggle, data table
- **Dependencies:** —
- **Current Development Status:** The actually-routed file is `src/pages/courseList.jsx`. A near-duplicate `src/pages/courses.jsx` exists but is **dead code, not routed anywhere** — don't confuse the two.
- **Pending Tasks:** Build a real courses-listing API; wire the View/More row actions (currently no-ops).
- **Priority:** High

### Add Course
- **Screen Purpose:** Create a course: details → modules/lessons → assessment → publish.
- **APIs Used:** `saveCourseDraft`, `publishCourse` — both mock (`courseService.js` explicitly says "Mock courses backend. No real API exists yet").
- **Database Tables (needed):** `courses`, `course_modules`, `lessons`, `lesson_resources`, `assessments`, `questions`
- **UI Components:** 4-step wizard, homegrown `RichTextEditor` (contentEditable-based, not a library), image uploader
- **Dependencies:** Custom validation (`courseWizardValidation.js`)
- **Current Development Status:** Very complete step-by-step UI with real client-side validation; nothing is persisted server-side.
- **Pending Tasks:** Build real course/module/lesson/assessment endpoints; consider swapping the homegrown rich-text editor for a maintained library (e.g. TipTap) if formatting needs grow.
- **Priority:** High

### Course Details
- **Screen Purpose:** Single-course detail view (hero, curriculum accordion, reviews, Q&A, resources).
- **APIs Used:** None — hardcoded constants.
- **Database Tables (needed):** `courses`, `course_modules`, `lessons`, `reviews`
- **UI Components:** Fully built in `courses.jsx` — hero image, tabs, expandable curriculum accordion
- **Dependencies:** —
- **Current Development Status:** The UI exists but is **not wired into routing at all** — currently unreachable from the app.
- **Pending Tasks:** Decide whether to revive this file as a real route (`/courses/:id`) and wire it to a real API, or rebuild it fresh.
- **Priority:** Medium

### Course Sections
- **Screen Purpose:** Manage course modules/sections.
- **APIs Used:** None — hardcoded seed data.
- **Database Tables (needed):** `course_modules`
- **UI Components:** Generic `TrainingCrudPage` (shared CRUD engine) — Module, Course, Lessons, Duration, Order, Status columns
- **Dependencies:** `TrainingCrudPage.jsx`, `CrudPage.jsx`
- **Current Development Status:** Functional add/edit/delete/search/CSV table, entirely local.
- **Pending Tasks:** Wire to a real API once course-module endpoints exist.
- **Priority:** Medium

### Lessons
- **Screen Purpose:** Manage lessons within modules.
- **APIs Used:** None — hardcoded seed data.
- **Database Tables (needed):** `lessons`
- **UI Components:** Same `TrainingCrudPage` engine — Lesson, Module, Type (Video/Document/Quiz), Duration, Order, Status
- **Dependencies:** `TrainingCrudPage.jsx`
- **Current Development Status:** Functional table, local-only.
- **Pending Tasks:** Wire to a real API.
- **Priority:** Medium

### Lesson Details
- **Screen Purpose:** Single-lesson detail/player view.
- **APIs Used:** None.
- **Database Tables (needed):** `lessons`, `lesson_resources`
- **UI Components:** None built.
- **Dependencies:** —
- **Current Development Status:** Doesn't exist anywhere in the codebase.
- **Pending Tasks:** Design and build from scratch.
- **Priority:** Medium

> **Note:** the Courses menu also has **Course Categories** and **Lesson Resources** sub-pages that exist in code (same `TrainingCrudPage` pattern, hardcoded seed data) but weren't in the originally requested page list — see **Additional Pages Found** below.

---

## 8. Training Management

| Page | UI Design | Frontend | Backend API | Database | Testing | Remarks |
|---|---|---|---|---|---|---|
| Assign Courses | ❌ | ❌ | ❌ | ❌ | ❌ | No route/page exists yet |
| Assigned Courses | ❌ | ❌ | ❌ | ❌ | ❌ | No route/page exists yet |
| Employee Progress | ❌ | ❌ | ❌ | ❌ | ❌ | No route/page exists yet |

### Assign Courses / Assigned Courses / Employee Progress
- **Screen Purpose:** Assign courses to employees, view assigned courses, and track completion progress.
- **APIs Used:** None. Needed: `POST /training/assign`, `GET /training/assigned`, `GET /training/progress`
- **Database Tables (needed):** `course_assignments`, `employee_progress`
- **UI Components:** None built.
- **Dependencies:** —
- **Current Development Status:** Not started — no menu entry, route, or file exists for any of these three screens.
- **Pending Tasks:** Full design + build from scratch (UI, API, DB).
- **Priority:** High — this is core LMS functionality (assigning training and tracking completion) and currently has zero coverage.

> **Note:** the app *does* have a "Training Sessions" placeholder under a separate "Training" parent menu — it's also unbuilt. See **Additional Pages Found** below.

---

## 9. Reports

| Page | UI Design | Frontend | Backend API | Database | Testing | Remarks |
|---|---|---|---|---|---|---|
| Course Report | ❌ | ❌ | ❌ | ❌ | ❌ | No sub-page/route exists; only a single unbuilt "Reports" placeholder in the menu |
| Employee Report | ❌ | ❌ | ❌ | ❌ | ❌ | Same as above |
| Completion Report | ❌ | ❌ | ❌ | ❌ | ❌ | Same as above |

### Course Report / Employee Report / Completion Report
- **Screen Purpose:** Reporting/analytics on courses, employees, and completion rates.
- **APIs Used:** None. Needed: reporting/aggregation endpoints per report type.
- **Database Tables (needed):** Aggregation across `courses`, `employees`, `enrollments`, `course_assignments`, `employee_progress`
- **UI Components:** None built — the single "Reports" menu item renders a generic "not built" placeholder.
- **Dependencies:** —
- **Current Development Status:** Not started.
- **Pending Tasks:** Define report requirements with stakeholders, design UI, build backend aggregation queries.
- **Priority:** Medium

---

## 10. Settings

| Page | UI Design | Frontend | Backend API | Database | Testing | Remarks |
|---|---|---|---|---|---|---|
| General Settings | ❌ | ❌ | ❌ | ❌ | ❌ | No sub-page/route exists; only a single unbuilt "Settings" placeholder in the menu |
| Company Settings | ❌ | ❌ | ❌ | ❌ | ❌ | Some fields (timezone/language/currency/office hours) already appear *read-only* on the View Company screen |
| Office Hours | ❌ | ❌ | ❌ | ❌ | ❌ | Same as above — read-only display exists, no editable settings page |

### General Settings / Company Settings / Office Hours
- **Screen Purpose:** System-wide and per-company configuration (locale, currency, working hours, etc.).
- **APIs Used:** None. Needed: `GET/PUT /settings`, `GET/PUT /companies/{id}/settings`
- **Database Tables (needed):** `settings` / `company_settings`
- **UI Components:** None built — the single "Settings" menu item renders a generic "not built" placeholder. (Company → View Company already *displays* timezone/language/currency/office-hours read-only, which can likely be reused as a starting point.)
- **Dependencies:** —
- **Current Development Status:** Not started as an editable screen.
- **Pending Tasks:** Design and build from scratch; consider reusing the read-only display already built in View Company as a base.
- **Priority:** Low

---

## Additional Pages Found in Codebase (Outside Original Scope)

These exist in the app's menu/routing today but weren't part of the requested page list above. Flagged here for visibility since they affect real users navigating the sidebar.

| Module | Page | UI Design | Frontend | Backend API | Database | Testing | Remarks |
|---|---|---|---|---|---|---|---|
| Company Management | Branches | ❌ | ❌ | ❌ | ❌ | ❌ | Tab exists in nav, renders "not built" placeholder |
| Company Management | Departments | ❌ | ❌ | ❌ | ❌ | ❌ | Same |
| Company Management | Designations | ❌ | ❌ | ❌ | ❌ | ❌ | Same |
| Course Management | Course Categories | ✅ | 🟡 | ❌ | ❌ | ❌ | Working CRUD table (`TrainingCrudPage`), hardcoded seed data |
| Course Management | Lesson Resources | ✅ | 🟡 | ❌ | ❌ | ❌ | Same pattern — PDF/Video/Link/Slides resource table |
| Training Management | Training Sessions | ❌ | ❌ | ❌ | ❌ | ❌ | Only page under the "Training" parent menu; renders placeholder |

*(Not included in the Overall Progress Summary percentages below, since they were outside the requested scope — but recommend formally adding them to the tracked list.)*

---

## Overall Progress Summary

Counts are across the **38 originally requested pages** only.

### UI Design
| Status | Count |
|---|---|
| ✅ Completed | 22 |
| 🟡 In Progress | 0 |
| 🔄 UI Revision Required | 3 |
| ❌ Not Started | 13 |

### Frontend
| Status | Count |
|---|---|
| ✅ Completed | 12 |
| 🟡 In Progress | 10 |
| 🔄 UI Revision Required | 2 |
| ❌ Not Started | 14 |

### Backend API
| Status | Count |
|---|---|
| ✅ Completed | 11 |
| 🟡 In Progress | 1 |
| ❌ Not Started | 26 |

### Database
| Status | Count |
|---|---|
| ✅ Completed | 12 |
| ❌ Not Started | 26 |

### Testing
| Status | Count |
|---|---|
| ✅ Completed | 0 |
| ❌ Not Started | 38 |

---

## 1. Pending UI Screens
- Forgot Password *(revision)* — extract from `login.jsx` into a real screen
- Reset Password *(revision)* — same
- Course Details *(revision)* — revive dead `courses.jsx` mockup into a routed page
- Role Details
- Permission List
- Edit Employee
- Lesson Details
- Assign Courses
- Assigned Courses
- Employee Progress
- Course Report
- Employee Report
- Completion Report
- General Settings
- Company Settings
- Office Hours
- *(Bonus scope)* Company Branches, Departments, Designations; Training Sessions

## 2. Pending APIs
- `POST /auth/forgot-password`, `POST /auth/reset-password`
- Dashboard stats endpoints (per role)
- Employee CRUD: create/update/delete/list (`employeeService.js` is fully mocked today)
- Edit Employee endpoint
- Employee Profile per-record detail endpoint
- Trainer CRUD: create/update/delete/list (**no `trainerService.js` exists at all**)
- Trainer Profile per-record detail endpoint
- Course CRUD (create/update/delete/publish — `courseService.js` is fully mocked today)
- Course Sections (modules) CRUD
- Lessons CRUD
- Lesson Details / Lesson Resources CRUD
- Training assignment: assign courses, list assigned courses, employee progress tracking
- Reports: course/employee/completion aggregation endpoints
- Settings: general/company/office-hours read+write endpoints
- Role & Permission cleanup: reconcile unused `syncRolePermissions` vs. inline payload; decide if a Permission CRUD API is needed

## 3. Pending Database Tables
- `password_reset_tokens`
- Real `employees`, `employee_documents`, `employee_skills`, `emergency_contacts` (currently only frontend mock shapes exist)
- `trainers`, `trainer_expertise`, `trainer_skills`, `trainer_courses`
- `courses`, `course_modules`, `lessons`, `lesson_resources`, `assessments`, `questions`, `enrollments`
- `course_assignments`, `employee_progress`
- `settings` / `company_settings`
- Reporting aggregation views/tables for Course/Employee/Completion reports

## 4. Pending Testing
- **Everything.** Zero automated tests exist in the repository today — including the two most "production-ready" modules (Company Management, Roles & Permissions) that are already live-wired to real APIs.
- Recommend starting with: (1) API-integration smoke tests for Company & Roles modules since they're closest to production, (2) form-validation unit tests for the Add Company / Add Role / Add Employee / Add Course wizards.

## 5. Next Sprint Plan (Suggested)
1. **Employee & Trainer backend wiring** — UI is largely done for both; highest ROI is building the real APIs and swapping out the mock services.
2. **Fix Employee Profile / Trainer Profile data binding** — currently shows identical fake data regardless of which record was clicked; risk of misleading stakeholders in a demo.
3. **Ship Forgot/Reset Password** — currently a security gap (users who forget their password have no way to recover their account).
4. **Add the missing Edit Employee route** — basic CRUD parity gap.
5. **Decide the fate of `courses.jsx`** (Course Details) — revive as a routed page or delete as dead code.
6. **Start Training Management from scratch** — Assign Courses / Assigned Courses / Employee Progress are core LMS functionality with zero current coverage.
7. Begin scoping Reports and Settings with stakeholders (currently pure placeholders).

## 6. Risks & Blockers
- **Zero automated test coverage** across the entire app, including live-API modules — regressions won't be caught before manual QA.
- **"Looks done, isn't" risk:** Employee, Trainer, and Course "Add" flows have polished, fully-validated UI wizards that *silently discard all data* on submit (mocked `setTimeout` success) — high risk of confusing stakeholders in demos into thinking these modules are production-ready.
- **Employee Profile / Trainer Profile show identical mock data for every record** — could actively mislead a reviewer clicking between different employees/trainers.
- **No `EMPLOYEES_EDIT` route** — editing an employee is not currently possible in the app at all.
- **Dead code:** `src/pages/courses.jsx` (a full Course Details mockup) is not routed anywhere and could be mistaken for a working feature, or accidentally deleted by someone unaware it's meant to be revived.
- **Sidebar/menu ahead of implementation:** Company → Branches/Departments/Designations and Training → Training Sessions appear as clickable nav items but land on an unbuilt placeholder — inconsistent-feeling UX for end users today.
- **No shared UI libraries** for charts, rich text, or date-pickers (`package.json` has none) — the Dashboard charts, the Course wizard's rich-text editor, and drag-drop uploaders are all hand-rolled, which increases long-term maintenance cost versus adopting a maintained library.
- **Tech debt:** duplicate/inconsistent permission-assignment code path (`syncRolePermissions` defined but unused).

## 7. Estimated Completion %

Methodology: for each of the 5 tracked dimensions (UI/Frontend/Backend/Database/Testing) across the 38 requested pages, ✅ = 1 point, 🟡 = 0.5, 🔄 = 0.25, ❌ = 0. Dimension completion = sum of points ÷ 38. Overall = average of the 5 dimension percentages. This is a rough planning heuristic, not a formal story-point estimate — adjust the weighting if the team prefers a different method.

| Dimension | Completion |
|---|---|
| UI Design | 60% |
| Frontend | 46% |
| Backend API | 30% |
| Database | 32% |
| Testing | 0% |
| **Overall** | **~34%** |

**Headline takeaway:** the app *looks* more finished than it *is* — UI is roughly 60% done, but real backend wiring sits around 30%, and there is no automated test safety net at all. The fastest path to a genuinely demo-able product is backend integration for Employee/Trainer/Course (UI is already built for these), not more UI work.
