# Button / Action Matrix

| Location | Control | Behaviour |
|---|---|---|
| Dashboard | Quick Action menu + tiles | Open create form of the target module (`?new=1`) or patient registration |
| Dashboard | Call Next Patient | Queue `call-next` (REAL) / mock queue for dev profiles |
| Dashboard | View (schedule), View Accounting, View Reports, View System Health, Help | Navigate to module pages |
| Patient profile | Actions menu (16 items) | Module create forms pre-filled with patient; dental chart tab; print; certificate/referral print dialog; JSON download |
| Patient profile | Tabs (10) + tooth buttons | Load records; odontogram save → dental-chart batch (REAL) / mock |
| Module pages | New, View, Edit, Delete, status actions, filters, search, pagination | Via shared ResourcePage; permission- and state-aware; destructive actions confirm |
| Payments | Refund | Mock-only; no edit/delete (append-only) |
| Queue | Start consultation | Mock-only (P0) |
| Journal entries | Post / Reverse | Mock; debit ≠ credit validated |
| Public booking | Continue / Request appointment | Validates, submits via PublicRequestService, shows reference |
| Contact | Send message | Validates, submits via PublicRequestService |
| Shop | Add to cart, qty +/−, remove, Place order, Send STK prompt, Retry, Cancel | Cart store + ShopService + M-Pesa simulation |
| Portal | Sign in/out, section tabs, Cancel appointment, Pay with M-Pesa, Update password | PatientPortalService |
| Top bar | Search, notifications, branch selector, help, profile, sign out | Working |

No `alert("coming soon")`, no `href="#"`, no fake Laravel success toasts.
