# Screen Matrix

| Screen | Route | Status |
|---|---|---|
| Home (45 s hero carousel) | `/` | REAL API (featured content) |
| About, Services, Service detail, Dentists, Dentist profile | `/about`, `/services`, `/services/$id`, `/doctors`, `/doctors/$id` | REAL API (placeholder data from Laravel) |
| Book a visit | `/appointments` | REAL API reads + MOCK SERVICE submit |
| Blog, Article, News, Events, Gallery, Testimonials | `/blog`, `/blog/$slug`, `/news`, `/events`, `/gallery`, `/testimonials` | REAL API |
| Contact | `/contact` | MOCK SERVICE submit |
| Shop, Product, Cart/Checkout/M-Pesa | `/shop`, `/shop/$id`, `/cart` | MOCK SERVICE |
| Patient portal (11 sections) | `/portal` | MOCK SERVICE |
| Staff sign-in, Forgot password | `/auth/login`, `/auth/forgot-password` | REAL API |
| Dashboard (role-based) | `/app/dashboard` | MOCK SERVICE |
| Global search (Ctrl/⌘K + page) | `/app/search` | REAL API |
| Patients list/new/profile/edit | `/app/patients…` | REAL API |
| Reports | `/app/reports` | REAL API |
| Staff AI assistant | `/app/assistant` | REAL API |
| All other modules (50+) | `/app/$module` | see Mock API Matrix |
| Integration status | `/dev/integration-status` | — |
