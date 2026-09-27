# Cineview Contact API

A small Node.js API that receives the website's contact requests.
- Every request is stored in **MongoDB**, which is the source of truth.
- An **email notification** is sent after the request is saved.
- The API is ready for a future admin dashboard.

Stack: Express 5, Mongoose 9, Nodemailer, helmet, cors, express-rate-limit.

---

## Run locally

Requirements: Node.js 20.12+ and MongoDB (local or MongoDB Atlas).

```bash
cd server
npm install
cp .env.example .env     # set MONGO_URI; SMTP_* is optional
npm run dev              # http://localhost:4000 (restarts on file changes)
npm start                # production mode (no watch)
npm test                 # test suite
```

From the website root you can also use `npm run api:install`, `npm run api:dev`, `npm run api:start` and `npm run api:test`.

**About the tests:** they use a separate `cineview_test` database on the local MongoDB and drop it when they finish. To point them elsewhere, set `MONGO_TEST_URI`. They start a throwaway local SMTP server, so no real email is sent.

When it starts, the API logs:
- whether email notifications are enabled;
- whether the SMTP connection was verified;
- whether the admin API is enabled.

If MongoDB cannot be reached, it exits with an error instead of running half-broken.

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

### Admin API (ready for the future dashboard)

**Disabled by default:** these routes return `404` unless `ADMIN_API_KEY` is set (minimum 32 characters). Every call must send `Authorization: Bearer <ADMIN_API_KEY>`.

| Method & path | Purpose |
| --- | --- |
| `GET /api/admin/contact-requests?status=NEW&q=…&page=1&limit=20` | List, newest first. Filter by status; `q` searches name / company / phone / email. |
| `GET /api/admin/contact-requests/:id` | Request details |
| `PATCH /api/admin/contact-requests/:id` with `{ "status": "CONTACTED" }` | Change status |

When the dashboard is built, replace the static key with real user authentication. It's one middleware in `src/middleware/security.js`. The data access functions are in `src/services/contactRequest.service.js`.

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
| `createdAt`, `updatedAt` | Automatic |

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
NOTIFICATION_TIMEZONE=Asia/Riyadh
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
- **CORS:** only origins listed in `CORS_ORIGINS` are allowed. Development defaults to `localhost:5173` and `localhost:4173`.
- **Rate limiting:** per IP on `/api/contact`, and a separate limit on the admin API. Behind a proxy or load balancer, set `TRUST_PROXY=1` so the real client IP is used.
- **Input handling:**
  - Mongoose `sanitizeFilter` is enabled globally.
  - Admin search input is regex-escaped.
  - Request bodies are reduced to known string fields.
- **Email safety:** all values are HTML-escaped in the email, and header values are forced to a single line.
- **Secrets:** they live only in environment variables. They are never logged and never returned by the API.
- **Admin key:** compared in constant time.

---

## Deployment

The website (Vercel) and this API are deployed separately.

1. **Database:** create a MongoDB Atlas cluster, or use any MongoDB 6+. Create a database user and copy the connection string into `MONGO_URI`.
2. **API hosting:** any Node host works, e.g. Render, Railway, Fly.io or a VPS with PM2/systemd.
   - Root directory: **the website root** (the API imports `../shared/contact.js`).
   - Build command: `npm run api:install`
   - Start command: `npm run api:start`
   - Health check path: `/api/health`
3. **API environment variables:**
   - `NODE_ENV=production`
   - `MONGO_URI`
   - `CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com`
   - `TRUST_PROXY=1`
   - `IP_HASH_SECRET`
   - `SMTP_*` and `CONTACT_NOTIFICATION_EMAIL`
   - optionally `ADMIN_API_KEY`
4. **Website (Vercel):** set `VITE_API_URL=https://api.your-domain.com` and redeploy.

**Alternative:** serve the API on the same domain under `/api`, e.g. through a reverse proxy, and leave `VITE_API_URL` empty.
