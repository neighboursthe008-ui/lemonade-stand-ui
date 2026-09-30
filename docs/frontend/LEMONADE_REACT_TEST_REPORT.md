# Test Report (browser automation, Chromium)

Typecheck: passing. Laravel server was **not reachable** from the test environment, so REAL API flows were verified for correct error handling ("Clinic server unavailable" + Retry) but not against live data.

| Flow | Result |
|---|---|
| Dev sign-in (5 roles), permission-filtered menu & dashboards | Pass |
| Dashboard: Call Next Patient, Quick Action → Create Invoice | Pass (toast + navigation) |
| Patient list → profile → Dental chart → save tooth 36 | Pass |
| Patient Actions → Referral letter dialog | Pass |
| Module pages: queue, journal entries, inventory, campaigns, backups, system health | Render, no errors |
| Patient registration + validation + search (earlier pass) | Pass |
| Contact: empty submit shows errors; valid submit shows reference | Pass |
| Shop → add to cart → checkout → M-Pesa simulation | Pass |
| Portal sign-in → appointments | Pass |
| Mobile 360 px cart page | No horizontal overflow |
| Page errors during all runs | None |

Not yet covered: exhaustive per-width sweep of every module (320–1920 px), screen-reader audit, live-Laravel run.
