# Munab Hospital — Laravel Implementation Contract (Outline)

Purpose: outline for the comprehensive contract to be handed to the Laravel team, distinguishing **[EXISTING]** endpoints already documented/live for the dental clinic from **[NEW-PROPOSED]** hospital endpoints Laravel must design/build. Sources cross-checked below; nothing here invents an existing API — anything not present in these sources is marked NEW-PROPOSED.

Sources inspected:
- `src/api/registry.ts:1-119` — single source of truth for live paths
- `src/api/client/http.ts:1-95` — envelope, error kinds, retry policy
- `src/api/auth/auth.service.ts` — auth calls and `CurrentUser` shape
- `src/config/backendCapabilities.ts:1-47` — per-module/per-screen status (LIVE_API/PARTIAL_API/MOCK/BLOCKED)
- `docs/frontend/LEMONADE_REACT_LARAVEL_INTEGRATION_STATUS.md` — existing dental-clinic integration doc (sections 1–7)
- `docs/munab/MUNAB_HOSPITAL_API_GAP_MATRIX.md`, `MUNAB_HOSPITAL_MODULE_MATRIX.md` — explicit "no Laravel JSON API yet" list for hospital modules
- `src/modules/configs/hospital.ts` (353 lines), `admin.ts`, `clinical.ts`, `finance.ts`, `operations.ts` — module field/action/workflow shapes (mock today, contract source for NEW-PROPOSED payload shapes)
- `src/modules/types.ts` — `ModuleConfig`/`LaravelBinding`/`ActionDef` shapes the contract must map onto

---

## 1. Document conventions
- Tag every endpoint **[EXISTING]** (cite `registry.ts` line + integration-status doc section) or **[NEW-PROPOSED]** (cite module config file + gap matrix).
- No invented fields: proposed payloads are drawn only from `fields`/`columns`/`seed` in the module configs, never guessed.
- Each NEW-PROPOSED endpoint must state: purpose, trigger (which UI action), request shape, response shape, status codes, permission, and the exact line in `src/modules/configs/*.ts` it replaces (the mock/seed logic) plus the `laravel` binding shape to add per `LaravelBinding` (types.ts:44-52).

## 2. Envelope & transport (EXISTING — normative, do not change)
- Base: `{VITE_LARAVEL_API_URL}` + `/api/v1/...` (or `/api/public/...`, `/api/dental/...` for the pre-existing public/legacy routes) — `registry.ts:7,18-28`.
- Response envelope: `{ data, meta?, links?, message? }`, consumed by `request<T>()` (`http.ts:81-85`); bare payloads via `requestRaw<T>()` for endpoints like `/search` that return `{ results }` (`http.ts:88`, `registry.ts:108`).
- All NEW-PROPOSED endpoints MUST use the same envelope — no bespoke shapes.
- Headers: `Accept: application/json`, `Authorization: Bearer <token>` when authenticated, `Content-Type: application/json` on bodies (`http.ts:55-64`). Integration doc also requires `X-Branch-Id` CORS allowance (integration status doc §1) — confirm whether hospital multi-branch/ward context reuses this header or needs `X-Facility-Id`/`X-Ward-Id` (NEW — decision needed).

## 3. Auth & session (EXISTING, extend for hospital roles)
- `POST auth/login`, `POST auth/logout`, `GET auth/me`, `POST auth/forgot-password`, `POST auth/reset-password` — `registry.ts:10-16`, `auth.service.ts`.
- Sanctum bearer token model, no cookies/CSRF for the SPA (integration doc §1).
- `GET auth/me` capability contract: `roles, permissions, is_super_admin, organization_id, branch_id, branches, must_change_password, pin_verified_at` (integration doc §2) — **NEW-PROPOSED**: hospital needs additional scoping fields (`department_id`, `ward_id`?, `shift?`) if nursing/ward modules require session context — flag as open question, do not assume shape.
- Permission strings actually referenced in UI (mock-gated, to be authoritative in Laravel): `view_patients, view_appointments, view_consultations, view_dental_chart, view_lab_orders, view_radiology_orders, view_prescriptions, view_invoices, view_payments, view_inventory, view_notifications, view_users, view_queue, view_reports, view_accounting, manage_settings, manage_marketing` (`rg` over `src/modules/configs/*.ts`). **NEW-PROPOSED permissions** needed for hospital modules not covered by the above (e.g. distinct `manage_admissions`, `manage_hr`, `manage_procurement`, `manage_payroll`, `send_sms`) — module configs currently reuse generic ones (`P`, `C`, `N`, `FIN`, `HR`, `PROC` aliases in `hospital.ts:33`) as placeholders; contract must ask Laravel to confirm/define a proper RBAC matrix per hospital module instead of clinic aliases.

## 4. Error model (EXISTING, normative)
- `ApiError` kinds mapped 1:1 from HTTP status (`http.ts:8-9,30-33`): 401 unauthenticated → clear session/redirect; 403 forbidden; 404 not_found; 405 method_not_allowed; 409 conflict; 419 csrf; 422 validation (field errors in `errors: Record<string,string[]>`); 429 rate_limited (`Retry-After` header read); 5xx/network/timeout → generic "server unavailable" + retry.
- GET-only single retry on network/5xx (`shouldRetryRead`, `http.ts:92-94`); never retries 4xx or mutating requests.
- All NEW-PROPOSED endpoints must conform to this exact error taxonomy — no new status codes without corresponding `ApiErrorKind`.

## 5. Pagination & filtering (EXISTING pattern to extend)
- `PaginationMeta = { current_page, from, last_page, per_page, to, total }` inside `meta` (`http.ts:26-28`; integration doc §1).
- NEW-PROPOSED list endpoints (departments, OPD, wards, beds, employees, etc.) must use identical `meta` shape; module `filters` (e.g. `hospital.ts` status/department filters) map to query params — contract should enumerate expected query params per module (status, department, ward, date range) drawn from each `filters` array, not invented ones.

## 6. Existing (dental/clinic) endpoint catalogue — [EXISTING], unchanged
Reproduce as authoritative appendix, grouped exactly as in `registry.ts` + integration-status doc §3:
1. Auth (5 endpoints)
2. Public site + assistant + search (`/api/public/*`, `/api/dental/*`, `/api/v1/assistant/chat`, `/api/v1/search`)
3. Patients (+ dental chart sub-resources)
4. Appointments (+ availability/check, confirm/check-in/cancel/no-show/add-to-queue)
5. Queue (list/stats/call-next/call/complete/skip/assign-dentist) — **[BLOCKED]** `queue/{id}/start` flagged P0 non-atomic, do not include as safe (`registry.ts:58`, integration doc §4)
6. Consultations, Vitals, Prescriptions (+dispense), Lab Orders (+collect-sample/record-results/cancel/pending), Radiology Orders (+record-results/cancel/pending)
7. Invoices, Payments (append-only, no PUT/DELETE — 405 by design), M-Pesa status polling
8. Inventory (products/categories/suppliers — partial, writes only on products)
9. Reports (revenue/appointments/financial/inventory)
10. Notifications, Users (read-heavy, writes partial per `backendCapabilities.ts:16-18`)
11. Data-quality caveats to carry over verbatim (hardcoded doctor names, fixed slots, no descriptions) — integration doc §6.

Each item: cite `registry.ts` line, `backendCapabilities.ts` status flag, and any BLOCKED/PARTIAL caveat.

## 7. New-proposed hospital endpoint catalogue — [NEW-PROPOSED]
Organize by section exactly matching `hospital.ts` module `section` groupings (mirrors `MUNAB_HOSPITAL_API_GAP_MATRIX.md`); one subsection per module with: proposed resource path (`/api/v1/hospital/{module}` — namespace TBD/confirm with backend, currently unspecified), list/detail/create/update/delete matrix, custom action endpoints (from each module's `actions: ActionDef[]`), request/response fields (from `fields`/`columns`), and workflow/status machine (from `flow()`/explicit `actions` transitions).

7.1 Administration — Departments, Service Catalogue
7.2 Patient Care — OPD Visits, Emergency, Admissions (+ ward transfer — **must be transactional**, `hospital.ts:83,89`), Referrals
7.3 Nursing & Wards — Wards, Beds (status state machine: available/occupied/reserved/cleaning/maintenance/blocked), Nursing Notes (append-only), Medication Rounds/MAR (append-only, give/withhold actions), Shift Handover (append-only)
7.4 Departments (clinical) — Maternity, Paediatric Growth, Theatre (pre-op checklist, room booking)
7.5 Pharmacy/Diagnostics — Dispensing (server-side stock deduction requirement, `hospital.ts:183`), Lab Test Catalogue
7.6 Insurance — Insurance Providers, Pre-authorisations, Claims (submit/approve/reject/resubmit/paid state machine)
7.7 Human Resources — Employees, Attendance & Shifts, Leave (approve/reject), Payroll (**server-side calculation only, statutory rates configurable, "not implemented by design" per integration doc §5**), Recruitment
7.8 Procurement & Tenders — Purchase Requests, Quotations/RFQs, Goods Received (stock update server-side), Tenders (staff CRUD + public read-only `/tenders`, evaluation data never public — `MUNAB_HOSPITAL_API_GAP_MATRIX.md:4`)
7.9 Communications — SMS Templates, Bulk SMS (queued jobs, consent checks), SMS Log (read-only)

For each: note the exact `mod({...})` block location in `hospital.ts`/other config files as the payload-shape source, and the `LaravelBinding` shape (`list, detail, create, update, remove, actions: Record<string,(id)=>string>, pageActions`) Laravel's contract should let the frontend fill in per `types.ts:44-52` — this determines how each proposed endpoint is later wired into `registry.ts` without UI changes.

## 8. Cross-cutting workflow rules (carry over verbatim from gap matrix, `MUNAB_HOSPITAL_API_GAP_MATRIX.md:4`)
- Bed transfers/admissions: transactional (all-or-nothing ward/bed reassignment).
- Pharmacy dispensing: stock deducted server-side atomically with dispense action.
- Payroll: computed server-side only; statutory rates configurable, never hardcoded or computed client-side.
- SMS: sent via queued jobs; consent checks enforced server-side.
- Tenders: evaluation/scoring data never exposed on public tender endpoints.
- Queue → consultation (existing P0): atomic single endpoint returning `{queue_entry, consultation}` or 409 — required before hospital OPD/Emergency workflows can safely extend the same pattern (integration doc §4).

## 9. Appendices
- A: Full existing `PAYMENT_PURPOSES`/`PAYMENT_METHODS` enums (`registry.ts:114-119`) — hospital billing (OPD/Emergency/Admissions charges) must reuse these enums, not invent new ones, unless Laravel formally extends them.
- B: Permission matrix table (existing permissions vs. proposed new permissions per module).
- C: Module → proposed endpoint → `LaravelBinding` mapping table (machine-checkable checklist mirroring `MUNAB_HOSPITAL_MODULE_MATRIX.md`).
- D: Open questions for backend (namespace prefix for hospital resources, additional `auth/me` fields, new permission names, multi-branch/ward header).
