# AstroLounge

ColliMate is a full-stack social app for sharing and discovering cosmic photography and musings. Users can sign up via Google or Facebook, complete their profile, post images with captions, interact (like, share, repost), and browse a weighted feed.

Posts are limited to **314** characters, while comments have no character limit.

---

## 🚀 Tech Stack

* **Backend**: NestJS, TypeScript, Prisma (PostgreSQL), Passport (JWT, OAuth), Supabase Storage, Fly.io
* **Frontend**: React, TypeScript, Vite, Tailwind CSS, React Router, `date-fns`, `lucide-react`
* **Auth**: Google & Facebook OAuth, JWT access tokens & secure refresh cookies

---

## 📦 Prerequisites

* Node.js v18+ & npm
* A Supabase project (for storage)
* Google & Facebook OAuth credentials
* Fly.io CLI (for deployment)

---



## 🔧 Setup & Running Locally

### Backend

```bash
cd backend
npm install
# start dev server:
npm run start:dev
```

### Frontend

```bash
cd ../astrosocial
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and backend on `http://localhost:3000` by default.

---

## 🔐 Environment variables & secrets

### Frontend (Vite build-time variables)

The Vite build reads its Supabase credentials directly from `import.meta.env`, so you must inject them during the **Docker build** phase. The `Dockerfile` exposes build args for each variable:

* `VITE_API_BASE_URL`
* `VITE_SUPABASE_URL`
* `VITE_SUPABASE_ANON_KEY`

When building locally you can pass them as `--build-arg` flags:

```bash
docker build \
  --build-arg VITE_API_BASE_URL=$VITE_API_BASE_URL \
  --build-arg VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
  --build-arg VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
  -t astrolounge .
```

In CI (e.g., GitHub Actions) store the values as **repository secrets** (not just environment-scoped secrets) and forward them as build args so the frontend bundle can initialize Supabase during the build. The Docker-image workflow runs the build job without an environment, so any Supabase secrets that only exist on an environment will resolve to empty strings and bake missing credentials into the bundle.

### Backend (runtime variables)

The NestJS backend reads `SUPA_URL` and `SUPA_SERVICE_KEY` via `process.env`. When deploying to Fly.io (or any other runtime) set them through the platform’s secret manager, for example:

```bash
fly secrets set SUPA_URL=... SUPA_SERVICE_KEY=...
```

Do **not** bake the service role key into the Docker image; keep it injected at runtime only.

---

## 🤝 Contributing

1. Fork & clone
2. Install deps in both `backend/` & `frontend/`
3. Add your feature under a new branch
4. Submit PR with description & tests

---

## 📄 License

MIT © Carlos Bejar
