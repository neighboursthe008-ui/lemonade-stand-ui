# Mock API Matrix

All mock services share the interface of their future Laravel implementation. Mock writes are always labelled "development data only" and never presented as Laravel writes. Mocks run for dev profiles (REAL API used for real signed-in staff where a binding exists).

| Module | Source | Mock-only actions |
|---|---|---|
| Appointments, Consultations, Vitals, Dental chart, Prescriptions, Lab, Radiology, Invoices, Payments, Products, Categories*, Suppliers*, Notifications, Users, Patients | REAL API (+ mock for dev profiles) | Queue start (P0), refunds, stock adjust, mark-read, category/supplier writes |
| Waiting list / queue | REAL API except start | Start consultation → MockQueueWorkflowService |
| Treatment plans, Receipts, Refunds, Credit notes, POS | MOCK SERVICE | all |
| Accounting (accounts, journals, periods, reconciliation, statements) | MOCK SERVICE | all; journal debit ≠ credit validated |
| Purchasing, stock movements, transfers, shop orders | MOCK SERVICE | all |
| Public shop + cart + checkout (`ShopService`) | MOCK SERVICE | all |
| M-Pesa STK (`MpesaCheckout`) | MOCK SERVICE | simulation never reports a real payment |
| Patient portal (`PatientPortalService`) | MOCK SERVICE | all |
| Public booking / contact (`PublicRequestService`) | MOCK SERVICE | all |
| Dashboard (`DashboardService`) | MOCK SERVICE | counts derived from shared dev records |
| CMS admin, Marketing, SEO, Integrations, Roles, Branches, Organization, Settings, AI knowledge, Audit logs, Backups, System health | MOCK SERVICE | all |

Dev data: 120 fictional patients plus linked appointments, queue, consultations, vitals, prescriptions, lab, radiology, invoices, payments, products, orders, notifications, campaigns, CMS and accounting records (deterministic seed, base date 30 Sep 2026).
