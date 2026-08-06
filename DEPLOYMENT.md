# Denis Ndayishimiye — Deployment Guide

Step-by-step instructions for deploying the project with zero code changes.

> Production architecture: **Vercel/Netlify** serves the React frontend, **Render/Railway** runs the Express API, **Supabase** hosts the database and storage.

---

## 1. Supabase (Database + Storage)

1. Create a project → run `server/supabase/schema.sql`, then `server/supabase/storage.sql` in the **SQL Editor**.
2. Copy from **Settings → API**:
   - Project URL (e.g. `https://abcdxyz.supabase.co`)
   - `service_role` key
3. These two values are your production `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

---

## 2. Deploy the Backend (Render or Railway)

### Render

1. Push the repository to GitHub.
2. **Render → New → Web Service** → connect the repo.
3. Settings:
   - **Root directory:** `server`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Node version:** 18 or 20
4. Add **Environment Variables**:
   - `NODE_ENV=production`
   - `PORT=10000` (Render injects this automatically)
   - `CLIENT_URL=https://your-frontend.vercel.app` (the exact deployed frontend URL)
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET` (a long random string)
   - `ADMIN_EMAIL=DenisAdmin@web`, `ADMIN_PASSWORD=DenisWeb@2026`
5. Deploy. Copy the URL, e.g. `https://denis-api.onrender.com`.

### Railway

1. **Railway → New Project → Deploy from GitHub** → select repo.
2. In the service **Settings → Build & Deploy** set:
   - Root directory: `server`
3. Add the same environment variables under **Variables**.
4. Railway assigns a public URL, e.g. `https://denis-api.up.railway.app`.

---

## 3. Deploy the Frontend (Vercel or Netlify)

### Vercel

1. **Vercel → Add New Project → Import** the repo.
2. **Root directory:** `client`.
3. Framework preset auto-detects **Vite**.
4. Environment variables:
   - `VITE_API_URL=https://denis-api.onrender.com/api` (or your Railway URL)
   - `VITE_SITE_URL=https://your-domain.vercel.app`
   - `VITE_SITE_NAME=Denis Ndayishimiye`
5. Deploy. The included `vercel.json` handles SPA routing automatically.

### Netlify

1. **Netlify → Add new site → Import from Git.**
2. **Base directory:** `client`
3. **Build command:** `npm run build`
4. **Publish directory:** `dist`
5. Set the same environment variables (`VITE_*`).
6. Deploy. The included `netlify.toml` handles SPA routing automatically.

---

## 4. Final Steps

1. Open the deployed site → visit `/admin`.
2. Sign in with `DenisAdmin@web` / `DenisWeb@2026`.
3. **Immediately change the password** in **Profile**.
4. Configure your social media links in **Social Links** — they appear in the footer and contact page automatically.
5. Add songs, videos, gallery images, events and news.
6. Update `client/public/sitemap.xml` and `client/public/robots.txt` with your real domain.

---

## Environment Variable Reference

### Backend (`server/.env` / platform variables)

| Variable                   | Required | Description                                          |
|----------------------------|----------|------------------------------------------------------|
| `PORT`                     | yes      | API port (Render/Railway inject this)                |
| `CLIENT_URL`               | yes      | Allowed frontend origin (comma-separate multiple)    |
| `SUPABASE_URL`             | yes      | Supabase project URL                                 |
| `SUPABASE_SERVICE_ROLE_KEY`| yes      | Supabase service_role key (server only)              |
| `JWT_SECRET`               | yes      | Long random string used to sign JWTs                 |
| `JWT_EXPIRES_IN`           | no       | Default `7d`                                         |
| `ADMIN_EMAIL`              | no       | Seed username, default `DenisAdmin@web`              |
| `ADMIN_PASSWORD`           | no       | Seed password, default `DenisWeb@2026`               |
| `SITE_URL`                 | no       | Used for absolute links                              |

### Frontend (`client/.env` / platform variables)

| Variable             | Required | Description                       |
|----------------------|----------|-----------------------------------|
| `VITE_API_URL`       | yes      | Backend base URL + `/api`         |
| `VITE_SITE_URL`      | no       | Public site URL for SEO           |
| `VITE_SITE_NAME`     | no       | Site name shown in meta tags      |

---

## Updating in Production

| Change                  | Where                                            |
|-------------------------|--------------------------------------------------|
| New song / cover / MP3  | Admin → Songs → Upload Song                     |
| New video               | Admin → Videos → Add Video (YouTube link)       |
| New gallery images      | Admin → Gallery → Upload Images                 |
| New event               | Admin → Events → Create Event                   |
| New article             | Admin → News → Write Article                    |
| Contact messages        | Admin → Messages                                |
| Social media links      | Admin → Social Links                            |
| Hero / site copy        | Admin → Settings                                |
| Admin password          | Admin → Profile                                 |
