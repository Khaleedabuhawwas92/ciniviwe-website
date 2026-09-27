# Cineview API

A small Node.js API for the Cineview website and the [admin dashboard](../admin/README.md).
- It receives the website's contact requests and stores every one in **MongoDB**, which is the source of truth.
- It sends an **email notification** after each request is saved.
- It provides authenticated admin endpoints for staff.

Stack: Express 5, Mongoose 9, Nodemailer, bcrypt (bcryptjs), JSON Web Tokens, helmet, cors, express-rate-limit.

---

## Run locally

Requirements: Node.js 20.12+ and MongoDB (local or MongoDB Atlas).

```bash
cd server
npm install
cp .env.example .env     # set MONGO_URI; ADMIN_JWT_SECRET for production; SMTP_* optional
npm run admin:create     # create the first SUPER_ADMIN (once)
npm run dev              # http://localhost:4000 (restarts on file changes)
npm start                # production mode (no watch)
npm test                 # test suite
```

From the website root you can also use `npm run api:install`, `npm run api:dev`, `npm run api:start`, `npm run api:test` and `npm run admin:create`.

### First Super Admin — `npm run admin:create`

- **Input:** it asks for the full name, username, email and password (the password is hidden while you type). Alternatively it reads `ADMIN_INITIAL_NAME`, `ADMIN_INITIAL_USERNAME`, `ADMIN_INITIAL_EMAIL` and `ADMIN_INITIAL_PASSWORD` from the environment or `.env`.
- **Safety:** it refuses to run when an active SUPER_ADMIN already exists, and nothing is created automatically on server start.
- **Password rule:** at least 10 characters, with letters and numbers. It is stored only as a bcrypt hash.
- **After it runs:** remove `ADMIN_INITIAL_PASSWORD` from `.env`, and create further admins in the dashboard.

**About the tests:** they use a separate `cineview_test` database on the local MongoDB and drop it when they finish. To point them elsewhere, set `MONGO_TEST_URI`. They start a throwaway local SMTP server, so no real email is sent.

When it starts, the API logs:
- whether email notifications are enabled;
- whether the SMTP connection was verified;
- the allowed CORS origins.

It exits with an error, instead of running half-broken, when:
- MongoDB cannot be reached; or
- `ADMIN_JWT_SECRET` is missing in production.

---

## Endpoints

### `POST /api/contact` — public

```json
{
  "fullName": "أحمد محمد",
  "companyName": "شركة المثال",
  "phone": "+966 50 000 0000",
  "email": "name@company.com",
  "service": "inventory",
  "message": "نص الرسالة",
  "website": ""
}
```

| Case | Response |
| --- | --- |
| Saved | `201 { "success": true, "message": "تم إرسال طلبك بنجاح، سنتواصل معك قريباً." }` |
| Invalid data | `400 { "success": false, "message": "يرجى مراجعة البيانات المدخلة.", "errors": { "email": "…" } }` |
| Too many requests | `429 { "success": false, "message": "لقد تجاوزت عدد المحاولات المسموح بها…" }` |
| Malformed JSON / body over 10 KB | `400` / `413` |

**Validation rules** come from `../shared/contact.js`, the same file the website uses:
- `fullName`: required, 3–100 characters.
- `phone` **or** `email`: at least one is required. Each is format-checked; phone needs 7–15 digits.
- `service`: required, one of `system`, `inventory`, `website`, `desktop`, `cloud`, `custom`, `other`.
- `message`: required, 10–2000 characters.
- `companyName`: optional, up to 120 characters.

**Sanitization** before anything is stored:
- only known fields are kept;
- non-string values are rejected, which blocks NoSQL operator injection;
- HTML tags and control / bidi-override characters are stripped;
- whitespace is normalized;
- Arabic-Indic digits are converted;
- email addresses are lowercased.

**Spam protection:**
- `website` is a honeypot. If it's filled, the API answers `201` but stores nothing.
- Messages with more than 3 links are stored with status `SPAM` and no email is sent.
- Rate limit per client IP, 5 requests per 15 minutes by default (configurable).

### `GET /api/health`

Returns `200 { success: true, database: "up" }`, or `503` when the database is down. Use it for uptime checks.

### Admin authentication

The old static `ADMIN_API_KEY` access has been **removed**; the server only warns if the variable is still set. Admin access now requires an admin account.

| Method & path | Purpose |
| --- | --- |
| `POST /api/admin/auth/login` `{ usernameOrEmail, password }` | Returns `{ admin, accessToken, expiresIn }` and sets the refresh cookie. Every failure returns the same `401 "بيانات الدخول غير صحيحة"`. |
| `POST /api/admin/auth/refresh` | Rotates the refresh cookie and returns a new access token. |
| `POST /api/admin/auth/logout` | Revokes the session and clears the cookie. |
| `GET /api/admin/auth/me` | The current admin's public profile. |
| `POST /api/admin/auth/change-password` `{ currentPassword, newPassword }` | Changes your own password and ends your other sessions. |

**Tokens and sessions:**
- **Access token:** a JWT (HS256) signed with `ADMIN_JWT_SECRET`, valid 15 minutes (`ADMIN_ACCESS_EXPIRES`). It is sent as `Authorization: Bearer`.
- **Refresh token:** 48 random bytes in an **httpOnly** cookie (`cv_admin_rt`) with `SameSite=Strict`, `Secure` in production, and path `/api/admin/auth`. The database stores only its SHA-256 (`AdminSession`).
  - It rotates on every refresh.
  - Presenting an already-rotated token revokes the session (theft detection).
  - The session lasts 7 days (`ADMIN_REFRESH_EXPIRES`).
- **CSRF protection:** `refresh` and `logout` require an allowed `Origin` and the header `X-Requested-With: XMLHttpRequest`.
- **Checks on every request:** `requireAdminAuth` re-checks the account (it must be `ACTIVE`) and the session (it must not be revoked). So disabling an admin, resetting their password or logging out takes effect immediately. `requireSuperAdmin` guards account management.

**Login protection:**
- **Rate limit:** 10 failed attempts per 15 minutes, counted both per IP and per account (`ADMIN_LOGIN_RATE_LIMIT_*`).
- **Timing:** bcrypt runs even for unknown usernames, so response time doesn't reveal which accounts exist.
- **Disabled admins** get the same generic error.

### Admin API (authenticated)

| Method & path | Who | Purpose |
| --- | --- | --- |
| `GET /api/admin/dashboard` | admin | Real statistics: counts by status, by service and per day for the last 7 days; today / this month; latest requests; recent activity. |
| `GET /api/admin/contacts?q=&status=&service=&from=YYYY-MM-DD&to=YYYY-MM-DD&sort=newest\|oldest&page=&limit=` | admin | Paginated list (max 100 per page). `q` searches name, company, email and phone; phone search ignores spaces. |
| `GET /api/admin/contacts/export?…same filters…` | admin | CSV (UTF-8 BOM, Arabic headers): name, company, phone, email, service, status, date. No internal fields; formula-injection safe; audited. |
| `GET /api/admin/contacts/:id` | admin | Details, including notes and status history. The IP hash is never returned (`hasIpHash` only). |
| `PATCH /api/admin/contacts/:id/status` `{ status }` | admin | Changes the status and appends to the history atomically. |
| `POST /api/admin/contacts/:id/notes` `{ text }` | admin | Adds an internal note (max 2000 characters). |
| `GET /api/admin/audit?action=&adminUser=&entityId=&page=&limit=` | admin | Activity log. |
| `GET /api/admin/users` | SUPER_ADMIN | Lists admins. |
| `POST /api/admin/users` `{ fullName, username, email, role, password }` | SUPER_ADMIN | Creates an admin. |
| `PATCH /api/admin/users/:id` `{ fullName?, email?, role?, status? }` | SUPER_ADMIN | Edits, enables/disables, or changes the role. You can't disable or demote yourself, and at least one active SUPER_ADMIN always remains. |
| `POST /api/admin/users/:id/reset-password` `{ password? }` | SUPER_ADMIN | Without `password`, returns a random `temporaryPassword` once. Either way, all of that admin's sessions end. |

**Notes on dates and deletion:**
- Date filters and "today / this month" use `APP_TIMEZONE`.
- Contact requests are **never hard-deleted**. Use the statuses `CLOSED` and `SPAM` instead.

---

## Data model — `ContactRequest`

| Field | Notes |
| --- | --- |
| `fullName`, `companyName`, `phone`, `email`, `service`, `message` | Sanitized values |
| `status` | `NEW` (default), `CONTACTED`, `IN_PROGRESS`, `CLOSED`, `SPAM` |
| `source` | `WEBSITE` |
| `userAgent` | Browser user agent (truncated to 300 characters) |
| `ipHash` | Keyed SHA-256 of the IP (needs `IP_HASH_SECRET`). **The raw IP is never stored.** Hidden from API responses. |
| `notification.status` | `PENDING`, `SENT`, `FAILED` or `SKIPPED` (email disabled or spam), plus `sentAt` / `error` |
| `notes[]` | `{ text, adminUser, createdAt }`. Staff only: excluded from every query unless explicitly selected by admin endpoints, and never part of any public response. |
| `statusHistory[]` | `{ fromStatus, toStatus, changedBy, changedAt }`. Append-only. |
| `createdAt`, `updatedAt` | Automatic |

## Data model — admin

| Model | Fields |
| --- | --- |
| `AdminUser` | `fullName`, `username` (unique, permanent), `email` (unique), `passwordHash` (bcrypt, never selected or serialized), `role` (`SUPER_ADMIN` / `ADMIN`), `status` (`ACTIVE` / `DISABLED`), `lastLoginAt`, `passwordChangedAt`, timestamps |
| `AdminSession` | One per login: `adminUser`, SHA-256 of the current and previous refresh tokens, `expiresAt` (TTL index), `revokedAt` / `revokedReason`, `userAgent` |
| `AdminAuditLog` | `adminUser` (null = CLI), `action`, `entityType`, `entityId`, `metadata`, `createdAt`. Actions: `LOGIN`, `LOGIN_FAILED`, `LOGOUT`, `CONTACT_VIEWED` (at most once per 30 min per admin and request), `CONTACT_STATUS_CHANGED`, `CONTACT_NOTE_ADDED`, `CONTACTS_EXPORTED`, `ADMIN_CREATED`, `ADMIN_UPDATED`, `ADMIN_ROLE_CHANGED`, `ADMIN_ENABLED`, `ADMIN_DISABLED`, `PASSWORD_RESET`, `PASSWORD_CHANGED`. Keys that look like passwords, tokens, hashes or secrets are stripped from `metadata`, and note text is not copied into it. |

---

## Email notifications

These settings go in `server/.env`, **never** in the website's `VITE_*` variables:

```env
CONTACT_NOTIFICATION_EMAIL=sales@your-domain.com   # comma-separate multiple recipients
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587                  # 587 = STARTTLS, 465 = implicit TLS
SMTP_SECURE=                   # leave empty to auto-detect from the port
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password   # use an app password where supported
SMTP_FROM="Cineview Website <no-reply@your-domain.com>"
APP_TIMEZONE=Asia/Riyadh       # used for the email date (and dashboard statistics)
```

Provider examples:

| Provider | Settings |
| --- | --- |
| Google Workspace / Gmail | `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`. `SMTP_PASS` must be an [App Password](https://support.google.com/accounts/answer/185833). |
| Microsoft 365 | `SMTP_HOST=smtp.office365.com`, `SMTP_PORT=587`. SMTP AUTH must be enabled for the mailbox. |
| Zoho Mail | `SMTP_HOST=smtp.zoho.com`, `SMTP_PORT=465` |
| SendGrid / Brevo / Mailgun / Amazon SES | Use the provider's SMTP host and SMTP credentials. `SMTP_FROM` must be a verified sender/domain. |

**What each email contains:** الاسم، الشركة، الهاتف، البريد، الخدمة، الرسالة and التاريخ, plus the request ID. It's sent as RTL HTML with a plain-text version. The `Reply-To` header is set to the customer's email, so you can reply directly.

**Delivery guarantees:**
- The request is always **saved first**.
- The email is sent in the background, so the visitor never waits for SMTP.
- If sending fails, the request stays saved with `notification.status = FAILED` and the error is logged. Nothing is lost.
- If SMTP isn't configured, requests are still saved with `notification.status = SKIPPED`.

---

## Security

- **Hardened HTTP:** `helmet` security headers; `x-powered-by` disabled; JSON bodies limited to 10 KB.
- **CORS:**
  - Only the origins listed in `CORS_ORIGINS` (website + admin dashboard) are allowed, with credentials.
  - `*` is ignored.
  - Development defaults to `localhost:5173`, `5174`, `4173` and `4174`.
- **Rate limiting:**
  - per IP on `/api/contact`;
  - stricter limits on failed admin logins (per IP and per account);
  - a general limit on the admin API.
  - Behind a proxy or load balancer, set `TRUST_PROXY=1` so the real client IP is used.
- **Authentication:** see [Admin authentication](#admin-authentication). Passwords are stored only as bcrypt hashes (cost 12), and admin responses are sent with `Cache-Control: no-store`.
- **Input handling:**
  - Mongoose `sanitizeFilter` is enabled globally.
  - Search input is regex-escaped.
  - Query and body values are reduced to known string fields.
  - Invalid filters return `400`.
- **Email safety:** all values are HTML-escaped in the email, and header values are forced to a single line.
- **Secrets:** they live only in environment variables. They are never logged and never returned by the API, and there are no secrets in either frontend bundle.

---

## Deployment

The website (Vercel), the admin dashboard (see [`admin/README.md`](../admin/README.md#deploy-eg-vercel)) and this API are deployed separately.

1. **Database:** create a MongoDB Atlas cluster, or use any MongoDB 6+. Create a database user and copy the connection string into `MONGO_URI`.
2. **API hosting:** any Node host works, e.g. Render, Railway, Fly.io or a VPS with PM2/systemd.
   - Root directory: **the website root** (the API imports `../shared/contact.js`).
   - Build command: `npm run api:install`
   - Start command: `npm run api:start`
   - Health check path: `/api/health`
3. **API environment variables:**
   - `NODE_ENV=production`
   - `MONGO_URI`
   - `CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com,https://admin.your-domain.com`
   - `TRUST_PROXY=1`
   - `ADMIN_JWT_SECRET` (random, at least 32 characters)
   - `IP_HASH_SECRET`
   - `APP_TIMEZONE`
   - `SMTP_*` and `CONTACT_NOTIFICATION_EMAIL`
4. **First admin:** run `npm run admin:create` once against the production database (from a machine that can reach it).
5. **Website (Vercel):** set `VITE_API_URL=https://api.your-domain.com` and redeploy.
6. **Admin dashboard:** set `VITE_API_URL=https://api.your-domain.com/api`. Keep it on the same site as the API (e.g. `admin.` + `api.`) for the `SameSite=Strict` cookie.

**Alternative:** serve the API on the same domain under `/api`, e.g. through a reverse proxy, and leave `VITE_API_URL` empty.
