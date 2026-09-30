# Lemonade React ↔ Laravel 13 — Integration Document

Audience: the Laravel team at `C:\xampp\htdocs\lemonade`. This explains how the React frontend talks to Laravel, what is already wired, and exactly what Laravel must add so each mock module can switch to live data **without UI changes**.

Legend: **REAL API** = wired to a documented Laravel endpoint · **MOCK SERVICE** = runs on isolated development data behind the same interface · **BACKEND MISSING** = Laravel has no JSON contract yet · **BLOCKED** = endpoint exists but is unsafe.

---

## 1. Configuration

| Variable | Purpose |
|---|---|
| `VITE_LARAVEL_API_URL` | Base URL of Laravel (e.g. `http://192.168.1.10/lemonade/public`, staging, production). Never hardcoded. |
| `VITE_DATA_MODE` | `api` \| `mock` \| `hybrid` (default `hybrid`: live where an API exists, mock elsewhere). |
| `VITE_<MODULE>_DATA_SOURCE` | Per-module override (`api`/`mock`) — progressive migration. |

Laravel requirements:
- **CORS**: allow the frontend origin, `Authorization`, `Content-Type`, `Accept`, `X-Branch-Id`.
- **Auth**: Sanctum bearer token returned by `POST /api/v1/auth/login`; sent as `Authorization: Bearer <token>`. No cookies/CSRF needed for the SPA.
- Every response uses the envelope `{ success, message?, data, meta?, links?, errors? }`. Paginated lists put `current_page, last_page, per_page, total` in `meta`.

## 2. Client behaviour (src/api)

- All paths live in `src/api/registry.ts`; no endpoint strings elsewhere.
- Timeouts, request cancellation (AbortSignal), GET-only retry on network/5xx.
- Status handling: **401** → session cleared, redirect to sign-in · **403** → professional "no permission" screen · **404** → not-found state · **409** → conflict toast (e.g. double booking) · **422** → field-by-field errors mapped onto form inputs from `errors` · **429** → "too many requests, retry shortly" · **500 / network** → "Clinic server unavailable" + Retry.
- Capabilities come from `GET /api/v1/auth/me`: `roles, permissions, is_super_admin, organization_id, branch_id, branches, must_change_password, pin_verified_at`. The UI hides what a user can't do, but **Laravel stays authoritative**.

## 3. REAL API — wired now

| Area | Endpoints used |
|---|---|
| Auth | `POST auth/login`, `POST auth/logout`, `GET auth/me`, `POST auth/forgot-password`, `POST auth/reset-password` |
| Public site | `GET /api/public/featured-content, blog-posts, blog-posts/{slug}, events, campaigns, categories`; `GET /api/dental/services, doctors, available-times` |
| Assistant | `POST /api/v1/assistant/chat` (public: unauthenticated; staff: bearer) |
| Search | `GET /api/v1/search?q=` |
| Patients | `GET/POST patients`, `GET/PUT patients/{id}`, `GET patients/{id}/consultations, vitals, vitals/latest, prescriptions, lab-orders, radiology-orders` |
| Dental chart | `GET patients/{id}/dental-chart`, `GET …/teeth/{tooth}/history`, `PUT …/dental-chart/batch` with `{ entries:[{ tooth_number, tooth_surface?, condition_type, condition_code?, notes? }] }` |
| Appointments | list/create/update, `availability/check`, `{id}/confirm`, `check-in`, `cancel`, `no-show`, `add-to-queue` |
| Queue | `GET queue`, `GET queue/stats`, `POST queue/call-next`, `{id}/call`, `complete`, `skip`, `assign-dentist` |
| Clinical | consultations (+`check-eligibility`, `{id}/complete`), vitals, prescriptions (+`dispense`), lab-orders (+`collect-sample`, `record-results`, `cancel`, `lab-orders-pending`), radiology-orders (+`record-results`, `cancel`) |
| Billing | invoices CRUD; payments `GET/POST` only (append-only — no PUT/DELETE); `GET mpesa/transactions/{checkoutRequestId}` |
| Inventory | `inventory/products` CRUD, `inventory/categories`, `inventory/suppliers` (list) |
| Reports | `reports/revenue, appointments, financial, inventory` |
| Notifications / Users | `GET notifications`, `GET users`, `GET users/{id}` |

Rules enforced in React:
- Payment `purpose` uses the **exact** server enum (`Consultation Fee … Other`); `other_reason` required when `Other`. Methods: `cash, mpesa, card, bank, insurance, other`.
- Consultation fee is **never computed in React** — it displays what `consultations/check-eligibility` returns.
- Appointment creation sends `branch_id` + `scheduled_at` (+ `patient_id`/guest name+phone, optional `clinician_id`, `service_id`). No invented fields.
- Patient forms use PatientResource fields only (no photo, county, national_id, passport_number, preferred_dentist_id, user_id).

## 4. BLOCKED

| Endpoint | Why | What React does |
|---|---|---|
| `POST /api/v1/queue/{id}/start` | Queue/consultation divergence (non-atomic transaction, P0). | **Never called.** "Start consultation" runs `MockQueueWorkflowService` labelled *"Development workflow — Laravel queue orchestration pending."* |

**Laravel must provide:** one atomic endpoint that moves the queue entry to `in_consultation` AND creates/returns the consultation (or returns 409 if already started), returning `{ queue_entry, consultation }`.

## 5. BACKEND MISSING — mock services waiting for Laravel

Each module below has a TypeScript interface with a Mock implementation. To go live: add the endpoint to `src/api/registry.ts`, add the `laravel` binding in the module config (or implement the `Laravel*Service`), set `VITE_<MODULE>_DATA_SOURCE=api`.

| Module | Suggested Laravel contract (to be designed by backend — not assumed by UI) |
|---|---|
| Public booking | `POST /api/public/appointments` (guest name, phone, email?, service_id, clinician_id, date, time, branch_id) → `{ reference }`; throttled + captcha |
| Contact form | `POST /api/public/contact` (name, email, phone?, subject, message) |
| Dashboard | `GET /api/v1/dashboard?role=` returning KPI counts per role |
| Treatment plans | CRUD `/api/v1/treatment-plans` |
| Receipts / Refunds / Credit notes / POS | `GET payments/{id}/receipt`, `POST payments/{id}/refunds`, credit notes CRUD, POS sale |
| M-Pesa STK Push | `POST /api/v1/mpesa/stk-push` → `{ checkout_request_id }`; UI already polls `mpesa/transactions/{id}` for pending/success/failed/cancelled/timeout |
| Accounting | accounts, journal entries (balanced debit/credit), periods, ledger, trial balance, reconciliation, statements |
| Inventory extras | stock adjustments, movements, transfers, purchase orders/receiving, category/supplier writes |
| Shop | public products, cart checkout, orders, order status/tracking |
| Patient portal | patient auth, own appointments (cancel), vitals, prescriptions, results, invoices, payments, orders, notifications, password change |
| Notifications | `POST notifications/{id}/read`, `POST notifications/read-all`, send |
| CMS admin | pages/blog/news/events/gallery/testimonials/media CRUD (public reads already live) |
| Marketing | campaigns CRUD, UTM links, attribution, SEO settings, integrations |
| Administration | roles/permissions, branches, organization, settings, user writes, AI knowledge |
| Audit logs, Backups (create/download/restore/checksum), System health (DB/Redis/queue/scheduler/storage) | read + super-admin actions |

**Not implemented by design:** Payroll (backend matrix: NOT IMPLEMENTED).

## 6. Data-quality issues found in Laravel

1. `/api/dental/doctors` returns hardcoded placeholders ("Dr. Sarah Johnson", "Dr. Michael Chen", "Dr. Emma Wilson").
2. `/api/dental/services` returns names only (no descriptions/prices/durations).
3. `/api/dental/available-times` returns the same 10 slots every day, ignoring bookings.
4. Clinic address, hours and email are not exposed by any endpoint.

## 7. Go-live checklist for the Laravel team

- [ ] CORS for the frontend origin
- [ ] Fix P0 queue start (atomic) and tell frontend to switch `queue.start` binding
- [ ] Real doctors/services/availability
- [ ] Public booking + contact endpoints
- [ ] Dashboard endpoint
- [ ] STK Push initiation endpoint
- [ ] Then modules in section 5 in priority order: billing extras → inventory extras → shop → accounting → portal → admin/CMS/marketing → backups/health
