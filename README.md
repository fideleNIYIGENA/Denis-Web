# Denis Ndayishimiye — Official Website

Production-ready website for **Denis Ndayishimiye**, a Rwandan Gospel Artist, Guitarist, Singer-Songwriter, Music Producer and Worship Leader.

- **Frontend:** React (Vite) + Tailwind CSS + React Router + Axios + Framer Motion + React Icons
- **Backend:** Node.js + Express (ES Modules) + JWT + Bcrypt + Helmet + Rate Limiting
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (audio, covers, gallery, event-posters, news-images)
- **Hosting:** Vercel / Netlify (frontend) · Render / Railway (backend) · Supabase (DB + storage)

---

## Features

- Full public website: Home, About, Biography, Music, Videos, Gallery, Events, News, Contact, Privacy Policy, 404
- Built-in **audio player**, **YouTube embed player**, **gallery lightbox**, search + filter + pagination everywhere
- **Dark / light mode**, responsive design, mobile drawer navigation
- **Admin dashboard** with sidebar: Dashboard stats, Songs, Videos, Gallery, Events, News, Messages, Social Links, Settings, Profile (change password), Logout
- One administrator only — seeded automatically with bcrypt-hashed password
- Contact form + newsletter signups stored in the database
- Social links configured in the dashboard appear automatically in the footer and contact page
- SEO: dynamic titles, meta tags, Open Graph, Twitter cards, sitemap.xml, robots.txt, Schema.org JSON-LD
- Security: JWT (Bearer), bcrypt password hashing, input sanitization, validation, Helmet headers, CORS allow-list, rate limiting, Supabase parameterized queries (SQL-injection safe)

---

## Project Structure

```
DenisWeb/
├── client/                     # React frontend (Vite)
│   ├── public/                 # robots.txt, sitemap.xml, favicon
│   ├── src/
│   │   ├── admin/              # Admin login + dashboard + managers
│   │   ├── components/         # Reusable UI (cards, players, layout…)
│   │   ├── contexts/           # Theme, Auth, Data providers
│   │   ├── hooks/              # useSEO
│   │   ├── pages/              # Public pages
│   │   └── api/client.js       # Axios instance
│   ├── vercel.json / netlify.toml   # SPA rewrites
│   └── .env.example
├── server/                     # Express API (ES Modules)
│   ├── src/
│   │   ├── config/             # Supabase client + storage helpers
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/         # auth, validation, error handling
│   │   ├── routes/             # REST endpoints
│   │   ├── seed/admin.js       # Auto-seed default admin
│   │   └── utils/              # multer uploads, helpers
│   ├── supabase/
│   │   ├── schema.sql          # Run first in Supabase SQL Editor
│   │   └── storage.sql         # Run second (creates buckets)
│   └── .env.example
├── DEPLOYMENT.md               # Step-by-step deployment guide
└── README.md
```

---

## Prerequisites

- Node.js **18+** and npm
- A free [Supabase](https://supabase.com) project

---

## 1. Setup Supabase

1. Create a project at [supabase.com](https://supabase.com) → **New project**.
2. Open **SQL Editor** → **New query** and run the files in order:
   - `server/supabase/schema.sql` (creates all tables, triggers, indexes)
   - `server/supabase/storage.sql` (creates the 5 public storage buckets)
3. Go to **Settings → API** and copy:
   - Project URL → `SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server only — never expose it)

> The buckets can also be created manually: **Storage → New bucket** named `audio`, `covers`, `gallery`, `event-posters`, `news-images` (all **Public**).

---

## 2. Backend Setup

```bash
cd server
npm install
cp .env.example .env
```

Fill in `.env`:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=any-long-random-string
ADMIN_EMAIL=DenisAdmin@web
ADMIN_PASSWORD=DenisWeb@2026
```

Generate a strong JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Run the API

```bash
npm run dev        # development (nodemon)
npm start          # production
```

The server auto-seeds the administrator when it starts if it does not exist.

**Default administrator:**

| Field    | Value           |
|----------|-----------------|
| Username | `DenisAdmin@web`|
| Password | `DenisWeb@2026` |

> The admin is stored with a bcrypt hash (12 rounds). **Change the password after first login** (Dashboard → Profile).

---

## 3. Frontend Setup

```bash
cd client
npm install
cp .env.example .env.local
```

`.env.local`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SITE_URL=http://localhost:5173
VITE_SITE_NAME=Denis Ndayishimiye
```

### Run the frontend

```bash
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the production build
```

Open **http://localhost:5173** (public site) and **http://localhost:5173/admin** (admin dashboard).

---

## API Overview

All endpoints are under `/api` and return JSON (`{ success, data|message }`).

| Method | Endpoint                 | Auth | Purpose                        |
|--------|--------------------------|------|--------------------------------|
| POST   | `/api/auth/login`        | –    | Admin login → JWT Bearer token |
| POST   | `/api/auth/logout`       | –    | Logout (stateless)             |
| GET    | `/api/auth/me`           | ✓    | Current admin profile          |
| PUT    | `/api/auth/password`     | ✓    | Change password                |
| GET    | `/api/songs`             | –    | List + search + filter + paginate |
| GET    | `/api/songs/:id`         | –    | Single song                    |
| GET    | `/api/songs/genres`      | –    | Distinct genres                |
| GET    | `/api/songs/featured`    | –    | Featured songs                 |
| POST   | `/api/songs`             | ✓    | Create (cover + audio upload)  |
| PUT    | `/api/songs/:id`         | ✓    | Update                         |
| DELETE | `/api/songs/:id`         | ✓    | Delete (removes storage files) |
| GET    | `/api/videos`            | –    | List videos                    |
| POST   | `/api/videos`            | ✓    | Create video                   |
| PUT    | `/api/videos/:id`        | ✓    | Update                         |
| DELETE | `/api/videos/:id`        | ✓    | Delete                         |
| GET    | `/api/gallery`           | –    | List gallery images            |
| POST   | `/api/gallery`           | ✓    | Upload multiple images         |
| PUT    | `/api/gallery/:id`       | ✓    | Update image                   |
| DELETE | `/api/gallery/:id`       | ✓    | Delete image                   |
| GET    | `/api/events`            | –    | List events (upcoming/past)    |
| POST   | `/api/events`            | ✓    | Create event                   |
| PUT    | `/api/events/:id`        | ✓    | Update                         |
| DELETE | `/api/events/:id`        | ✓    | Delete                         |
| GET    | `/api/news`              | –    | List articles                  |
| GET    | `/api/news/:slug`        | –    | Single article                 |
| POST   | `/api/news`              | ✓    | Create article                 |
| PUT    | `/api/news/:id`          | ✓    | Update                         |
| DELETE | `/api/news/:id`          | ✓    | Delete                         |
| GET    | `/api/social-links`      | –    | Get social links               |
| PUT    | `/api/social-links`      | ✓    | Update social links            |
| POST   | `/api/messages`          | –    | Public contact form            |
| POST   | `/api/messages/subscribers` | – | Newsletter signup            |
| GET    | `/api/messages`          | ✓    | List messages                  |
| PATCH  | `/api/messages/:id/read` | ✓    | Mark read / unread             |
| DELETE | `/api/messages/:id`      | ✓    | Delete message                 |
| GET    | `/api/settings`          | –    | Get site settings              |
| PUT    | `/api/settings`          | ✓    | Update site settings           |
| GET    | `/api/dashboard/stats`   | ✓    | Dashboard statistics           |

**Admin auth:** send `Authorization: Bearer <token>` on every protected request. The frontend stores the token and attaches it automatically.

---

## Security Notes

- `service_role` key is used **server-side only**; it never reaches the browser.
- All queries use the Supabase client (parameterized) — no raw SQL injection surface.
- User input is sanitized (HTML stripped) and validated before insert.
- Helmet sets secure HTTP headers; CORS is restricted to `CLIENT_URL`.
- Login is rate-limited (10 attempts / 15 min); the public API is rate-limited globally.
- Files are validated by MIME type and size, streamed to Supabase Storage, and removed from storage when records are deleted or replaced.

---

## Troubleshooting

- **`[seed]` errors on boot** → run `server/supabase/schema.sql` and confirm `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are correct.
- **CORS errors in the browser** → make sure `CLIENT_URL` in the server `.env` exactly matches the frontend origin (including the port).
- **Uploads fail** → run `server/supabase/storage.sql` and confirm the buckets exist.
- **Blank pages in production** → the SPA rewrites are included (`vercel.json`, `netlify.toml`); enable them per your host if needed.

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the full Vercel / Render / Railway / Supabase deployment walkthrough.
