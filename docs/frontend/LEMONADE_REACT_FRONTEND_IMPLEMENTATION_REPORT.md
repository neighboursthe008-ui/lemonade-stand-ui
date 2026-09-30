# Implementation Report

Architecture: TanStack Start + React 19, TanStack Query, React Hook Form + Zod, Tailwind v4.
- `src/api/` — registry, HTTP client, envelope normaliser, error types.
- `src/modules/` — generic module engine: configs (clinical, finance, operations, admin), `ResourceService` (Mock + Laravel implementations), `ResourcePage`, `DynamicForm`.
- `src/services/` — dedicated services: dental chart, public requests, shop, patient portal.
- `src/components/` — shells, search palette, odontogram, M-Pesa checkout, states, dashboard.
- `src/stores/` — auth (capabilities from `auth/me`), cart.

Key decisions: one interface per service so switching Mock→Laravel needs no UI change; queue start permanently isolated until P0 fix; payments append-only; consultation fee from server only; payroll excluded.

See the Integration Status document for what Laravel must add.
