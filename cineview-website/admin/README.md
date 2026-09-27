# Cineview Admin Dashboard — لوحة إدارة سينيفيو

A standalone Vue 3 app that Cineview staff use to manage website contact requests.
It talks to the API in [`../server`](../server/README.md).

Stack: Vue 3, Vite, Vue Router, Pinia, Axios, Tailwind CSS v4 and Lucide icons. The interface is Arabic (RTL).

| App | Dev port |
| --- | --- |
| Website | 5173 |
| **Admin dashboard** | **5174** |
| API | 4000 |

---

## Run locally

```bash
# 1. API (from the website root)
npm run api:install
cp server/.env.example server/.env        # set MONGO_URI (+ ADMIN_JWT_SECRET, SMTP_* …)
npm run admin:create                      # create the first SUPER_ADMIN (once)
npm run api:dev                           # http://localhost:4000

# 2. Dashboard
npm run admin:install
cp admin/.env.example admin/.env          # VITE_API_URL=http://localhost:4000/api
npm run admin:dev                         # http://localhost:5174
```

`npm run admin:build` builds the dashboard to `admin/dist`. To preview that build, run `npm run preview --prefix admin` (port 4174).

### Creating the first Super Admin

```bash
npm run admin:create
```

The command asks for the name, username, email and password; the password is hidden while you type.

To run it without prompts, set `ADMIN_INITIAL_NAME`, `ADMIN_INITIAL_USERNAME`, `ADMIN_INITIAL_EMAIL` and `ADMIN_INITIAL_PASSWORD` in `server/.env` or in the environment. Remove the password afterwards.

The command stops if an active SUPER_ADMIN already exists. It never runs on server start, and no password is hard-coded. Create any further admins from the **المستخدمون** page.

Password rule: at least 10 characters, containing both letters and numbers.

---

## Features

| Page | What it does |
| --- | --- |
| `/login` | Sign in with username or email. Show/hide password, loading state, Arabic errors. Already signed in → redirected to the dashboard. |
| `/` لوحة التحكم | Real counts from the database: total, each status, today and this month. Charts for requests in the last 7 days and requests per service. Latest requests and recent activity. |
| `/contacts` طلبات التواصل | Paginated table (20 per page) with search by name, company, phone or email, and filters for status, service and date range. Sort newest/oldest. Filters are kept in the URL. CSV export of the filtered results. Call / WhatsApp / Email buttons appear only when that contact method exists. Cards on mobile. |
| `/contacts/:id` | Full details with copy buttons ("تم النسخ"). Status actions: تم التواصل، قيد المتابعة، إغلاق، مزعج, or any status. Internal notes. Status history. Email-notification state. The IP is shown only as "stored encrypted". |
| `/admins` المستخدمون | **SUPER_ADMIN only.** Create admins, edit name/email/role, enable/disable, and reset passwords (a generated temporary password is shown once, or you type a new one). |
| `/audit` سجل النشاط | Paginated activity log with a filter by action. |
| العملاء، الخدمات، إعدادات الموقع | Placeholder pages that show «قريباً». No fake functionality. |

There is deliberately no delete for contact requests. Use **مغلق** or **مزعج** instead, so no lead is ever lost.

**WhatsApp links:**
- Numbers saved in international format (`+…` or `00…`) always get a link.
- Local numbers (starting with `0`) get a link only when `VITE_DEFAULT_COUNTRY_CODE` is set, e.g. `966`. Otherwise the button is hidden instead of guessing the country.

---

## Security model

- **Access token** (JWT, 15 min): held **in memory only** and sent as `Authorization: Bearer …`. It is never stored in localStorage or sessionStorage.
- **Refresh token:** an **httpOnly** cookie (`SameSite=Strict`, `Secure` in production). Its path is limited to `/api/admin/auth`, so JavaScript can never read it.
  - It rotates on every refresh.
  - Reusing an old token revokes the session.
  - Reloading the page restores the session silently through `/auth/refresh`.
- **Logout** revokes the session on the server.
- **Server-side effect of account changes:**
  - Disabling an admin or resetting their password ends all of their sessions immediately.
  - Changing your own password ends your other sessions.
- **Route guards:** every route except `/login` requires a session. SUPER_ADMIN-only pages show a 403 page to other admins, and the API enforces the same rules (it returns 403).
- **Bundle contents:** the bundle contains **no secrets**. The only build-time settings are the public `VITE_API_URL` and `VITE_DEFAULT_COUNTRY_CODE`. The old `ADMIN_API_KEY` is gone.
- **Search engines:** the dashboard is `noindex` (meta tag, `robots.txt`, and an `X-Robots-Tag` header in `vercel.json`).

---

## Deploy (e.g. Vercel)

1. Create a project with **Root Directory** `admin`. Build command: `npm run build`. Output directory: `dist`. `vercel.json` handles SPA routing and security headers.
2. Set the environment variable `VITE_API_URL=https://api.your-domain.com/api`.
3. On the API, set:
   - `CORS_ORIGINS` to include the dashboard origin, e.g. `https://admin.your-domain.com`;
   - `ADMIN_JWT_SECRET`;
   - `TRUST_PROXY=1`.
4. Keep the dashboard and the API on the **same site** (e.g. `admin.your-domain.com` + `api.your-domain.com`) so the `SameSite=Strict` refresh cookie works. For different sites, set `ADMIN_COOKIE_SAMESITE=none` on the API; it requires HTTPS.

---

## Structure

```
admin/src/
  assets/       Tailwind theme and shared utilities (field, card)
  components/   Sidebar, top bar, modal, badges, pagination, toasts, charts/ …
  layouts/      AdminLayout (sidebar + top bar + content)
  pages/        Login, Dashboard, Contacts, ContactDetails, Admins, AuditLog, ComingSoon, 403, 404
  router/       Routes + guards (auth, SUPER_ADMIN)
  stores/       auth (in-memory session), toast
  services/     http (Axios + silent refresh), api (endpoint functions)
  utils/        formatting, labels, contact links
```

Status labels and the service list come from [`../shared/contact.js`](../shared/contact.js), the same file the website and the API use.
