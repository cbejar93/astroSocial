# ColliMate

ColliMate is a full-stack social app for sharing and discovering cosmic photography and musings. Users can sign up via Google or Facebook, complete their profile, post images with captions, interact (like, share, repost), and browse a weighted feed.

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
# push Prisma schema (non-destructive):
npx prisma db push --accept-data-loss
# generate Prisma client:
npx prisma generate
# start dev server:
npm run start:dev
```

### Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and backend on `http://localhost:3000` by default.

---

## 🤝 Contributing

1. Fork & clone
2. Install deps in both `backend/` & `frontend/`
3. Add your feature under a new branch
4. Submit PR with description & tests

---

## 📄 License

MIT © Your Carlos Bejar
