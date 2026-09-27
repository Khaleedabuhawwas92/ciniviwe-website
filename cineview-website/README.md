# Cineview | سينيفيو — Company Website

Corporate website for **Cineview (سينيفيو)**, a software development & technology solutions company.
Arabic-first (RTL), built with **Vue 3 + Vite + Tailwind CSS v4**, with Lucide icons.

---

## Requirements

- Node.js 20+ (tested on Node 22)
- npm 10+

## Install & run

```bash
npm install        # install dependencies
npm run dev        # start the dev server  → http://localhost:5173
npm run build      # production build      → ./dist
npm run preview    # preview the production build locally
```

---

## Where to change things

| What | File |
| --- | --- |
| Company name, tagline, description, logo, phone, email, WhatsApp, address, social links | `src/data/company.js` |
| Services (خدماتنا) | `src/data/services.js` |
| Products (حلولنا) + product details pages | `src/data/solutions.js` |
| Portfolio projects (أعمالنا) | `src/data/portfolio.js` |
| "من نحن" points and "لماذا سينيفيو" advantages | `src/data/highlights.js` |
| "كيف نعمل؟" steps | `src/data/process.js` |
| Contact form service options | `src/data/contact.js` |
| Navigation links | `src/data/navigation.js` |
| Colors, fonts, shadows | `src/assets/styles/main.css` (`@theme` block) |
| Default SEO title/description | `index.html` and `src/composables/useSeo.js` |

### Company information

Open `src/data/company.js` and fill in the values:

```js
phone: '+9665XXXXXXXX',
email: 'info@your-domain.com',
whatsapp: '+9665XXXXXXXX',   // international format
address: 'المدينة، الدولة',
social: { linkedin: 'https://linkedin.com/company/...', facebook: '', instagram: '', youtube: '' },
```

**Every value left empty (`''`) is hidden automatically.** That covers the contact section, the footer, social icons, the CTA and the WhatsApp buttons.

WhatsApp:
- When `whatsapp` is set, WhatsApp buttons appear, pre-filled with `whatsappMessage`.
- A floating WhatsApp button also appears. To turn it off, set `showFloatingWhatsApp: false`.

### Add a service

Add an object to the array in `src/data/services.js`:

```js
{
  id: 'mobile-apps',
  icon: Smartphone,            // import it from 'lucide-vue-next' at the top of the file
  title: 'تطبيقات الجوال',
  description: 'وصف مختصر للخدمة.',
  contactValue: 'custom',      // which option to preselect in the contact form
},
```

Browse icons at https://lucide.dev/icons (use the PascalCase name).

### Add a product (solution)

Add an object to `src/data/solutions.js` with a unique `slug`. It gets its own page automatically at `/solutions/<slug>`.
- `featured: true` shows it as the large highlighted card.
- Otherwise it appears as a compact card below the featured one.

### Add a portfolio project

Add an object to `src/data/portfolio.js`:

```js
{
  id: 'new-project',
  title: 'اسم المشروع',
  type: 'Web Application',
  description: 'وصف مختصر.',
  tags: ['وسم 1', 'وسم 2'],
  image: '/portfolio/new-project.webp', // optional, file in public/portfolio/
  link: '',                              // optional internal route
},
```

Without an `image`, a built-in product mockup is shown. Use screenshots in **WebP**, around **1200×825 px** (16:11). They are lazy-loaded.

With a single project, the card is shown full-width. With two or more, cards switch to a two-column grid.

### Logo & favicon

- **Logo:** put your file in `public/` (e.g. `public/logo.svg`), then set `logo: '/logo.svg'` in `src/data/company.js`. The text logo is replaced everywhere.
- **Favicon:** replace `public/favicon.svg`. To add PNG icons as well, place `favicon-32x32.png` / `apple-touch-icon.png` in `public/` and update the `<link rel="icon">` tags in `index.html`.
- **Social sharing image:** add a 1200×630 image at `public/og-image.png`, then uncomment the `og:image` line in `index.html`.

---

## Environment variables

Copy `.env.example` to `.env`:

| Variable | Purpose |
| --- | --- |
| `VITE_SITE_URL` | Public URL (e.g. `https://www.example.com`). Enables the canonical link, `og:url` and structured-data URL. |
| `VITE_CONTACT_ENDPOINT` | URL that receives contact-form submissions as a JSON `POST`. |

### Contact form

- Validation runs entirely in the browser: required fields, email and phone format. Arabic-Indic digits are accepted.
- Submission logic lives in `src/utils/contactApi.js`. When `VITE_CONTACT_ENDPOINT` is set, the form posts:

```json
{ "fullName": "", "company": "", "phone": "", "email": "", "service": "inventory",
  "serviceLabel": "نظام إدارة مخزون", "message": "", "source": "cineview-website", "submittedAt": "ISO date" }
```

  This works with your own API or with services such as Formspree or Getform. A non-2xx response shows an error message.
- **No endpoint configured:** the form still validates the input. It then offers to send the same request through WhatsApp or email, if those are set in `company.js`. If neither is set, it shows a "not available yet" message.
- A hidden honeypot field filters out basic spam bots.

---

## Deploy to Vercel

1. Push the project to a GitHub/GitLab/Bitbucket repository.
2. In Vercel: **Add New → Project**, then import the repository.
3. Vercel detects Vite automatically:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Under **Settings → Environment Variables**, add `VITE_SITE_URL` (and `VITE_CONTACT_ENDPOINT` once you have one).
5. Deploy.

`vercel.json` is already included:
- It rewrites all routes to `index.html`, so pages like `/solutions/inventory-system` work on refresh.
- It sets long-term caching for hashed assets.

Using the CLI instead: `npm i -g vercel && vercel --prod`.

---

## Project structure

```
src/
  assets/styles/main.css   Tailwind theme, utilities, animations
  components/              Reusable UI (header, footer, cards, form, logo, mockups, icons)
    ui/                    BaseButton, SectionHeading, FormField
    mockups/               Illustrative dashboard / product visuals (no real data)
  sections/                Home page sections (Hero, Services, About, …, Contact)
  pages/                   HomePage, SolutionDetailsPage, NotFoundPage
  router/                  Routes + scroll behavior for section anchors
  composables/             Scroll spy, reveal-on-scroll, contact form, SEO, …
  utils/                   Validation, contact links, API submission, structured data
  data/                    All editable content and configuration
```

## Notes

- **RTL & future English:**
  - `<html lang="ar" dir="rtl">` is set in `index.html`.
  - Layout uses logical properties (`ms-`, `pe-`, `start-`, `end-`), so an LTR version needs no layout rewrite.
  - All copy lives in `src/data/` and the section components, ready to be moved into a translation layer later.
- **Accessibility:**
  - Skip link, visible focus styles and labelled form fields with linked error messages.
  - Mobile drawer with Escape-to-close and a focus trap.
- **Motion:**
  - Scroll animations and the hero entrance are disabled when `prefers-reduced-motion` is on.
- **Font:**
  - Cairo is self-hosted through `@fontsource-variable/cairo`, so the site makes no Google Fonts requests.
