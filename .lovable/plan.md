# Munab branding, hospital dashboards, and Laravel API contract

## Goal
Finish the non-destructive Munab Nursing Home transformation requested in this pass: remove all remaining visible Lemonade branding, replace legacy clinic imagery with a cohesive generated hospital image set, make every configured staff role land on a useful permission-aware dashboard, and deliver one detailed Laravel contract the backend team can implement without guessing.

## Implementation

### 1. Complete Munab rebrand and image replacement
- Replace the three legacy reception images with newly generated Munab hospital photography covering reception/outpatient care, ward/nursing care, and diagnostics/clinical care.
- Keep the approved 45-second carousel, manual arrows, dots, motion reduction, and accessible labels.
- Replace the login’s dental-specific message and visual treatment with Munab hospital messaging and generated imagery.
- Remove remaining user-visible “Lemonade” text from page titles, descriptions, integration screens, browser storage labels where safe, and legacy documentation headings while retaining historical backend-path references only where technically necessary.
- Keep the existing dental department and its workflows as part of Munab rather than deleting them.

### 2. Role and department dashboards
- Expand development profiles to cover the configured operational roles: super admin, hospital administrator, doctor, dentist, nurse, nurse manager, receptionist, cashier, accountant, pharmacist, laboratory staff, radiology staff, inventory manager, procurement officer, insurance officer, HR manager, and marketing/content staff.
- Give each role a deliberate permission set and ensure navigation only exposes pages that role may use.
- Replace the current five-role dashboard mapping with role-specific hospital KPI groups, status summaries, work queues, charts, activity and working quick actions.
- Add department-focused dashboard views for outpatient care, emergency, wards, maternity, theatre, pharmacy, laboratory, radiology, insurance, finance, inventory, procurement, HR, marketing and administration.
- Continue using clearly labelled development data until Laravel endpoints exist; never present mock writes as live hospital writes.
- Keep queue consultation start isolated from the unsafe Laravel endpoint.

### 3. Functional audit
- Check every dashboard quick action and summary link against a real route and permission.
- Fix role/session switching, responsive navigation, empty states, loading/error behavior, and obvious broken module actions found during the audit.
- Test all configured roles at desktop width and representative clinical/administrative roles at phone width.
- Re-test public home, login, dental chart, patients, appointments, billing, and key hospital modules to ensure the expansion does not break the dental system.

### 4. Laravel implementation contract
Create `docs/munab/MUNAB_COMPLETE_FRONTEND_API_CONTRACT.md` as the backend team’s authoritative handoff, including:
- global base URL, headers, auth/session, branch and organisation context;
- standard success envelope, pagination, validation and error formats;
- role/permission vocabulary and server-authoritative access rules;
- exact existing documented endpoints, clearly separated from proposed new hospital endpoints;
- resource schemas, filters, sorting, pagination, create/update payloads and response examples;
- workflow transition endpoints and allowed state transitions;
- contracts for departments/services, OPD, emergency, admissions, wards/beds, nursing/MAR, maternity, theatre, diagnostics, pharmacy, insurance, billing, inventory, procurement, HR/payroll, CMS/marketing, SMS, backups and system health;
- transactional, audit, idempotency, concurrency, file-upload, notification and security requirements;
- explicit Laravel gaps and frontend module-to-endpoint mapping;
- the queue-start P0 prohibition and other operations that must remain server-authoritative.

## Verification
- Confirm the project reports a clean build after edits.
- Browser-test generated images, login, every development role dashboard, core dental workflows and key hospital modules.
- Check representative pages at 375px and 1280px for overflow and interaction failures.
- Update the roadmap and Munab reports with only verified results.

## Technical notes
- Preserve the existing TanStack Router, central endpoint registry, service/mock boundary and module engine.
- New Laravel paths will be documented as **proposed required contracts**, not added to runtime code until Laravel implements them.
- Existing documented Laravel paths remain labelled **existing contract**; unsupported modules remain **mock/backend missing**.
