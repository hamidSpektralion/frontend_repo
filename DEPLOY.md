# Spektralion — Deployment Guide

This project has two independent parts that deploy to different places:

```
spektralion_web/
├── src/              ← React frontend  →  GitHub Pages (or Vercel/Netlify)
├── backend/          ← FastAPI backend →  Render (or Railway / Fly.io)
├── vite.config.ts
└── package.json
```

---

## Part 1 — Frontend (React/Vite) → GitHub Pages

The frontend is a fully static React app. Everything (`.mat` parsing, pipeline
preview, revert, download) runs in the browser — no backend required for the
basic viewer.

### Step 1 — Set the base path in `vite.config.ts`

GitHub Pages serves your site at `https://<username>.github.io/<repo-name>/`,
so Vite must know the sub-path.

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/spektralion_web/',   // ← must match your GitHub repo name exactly
  plugins: [react(), tailwindcss()],
})
```

### Step 2 — Install the deploy helper

```bash
npm install --save-dev gh-pages
```

### Step 3 — Add deploy scripts to `package.json`

```json
"scripts": {
  "predeploy": "npm run build",
  "deploy":    "gh-pages -d dist"
}
```

### Step 4 — Push your code to GitHub

```bash
git init                          # if not already a git repo
git remote add origin https://github.com/<username>/spektralion_web.git
git add .
git commit -m "initial commit"
git push -u origin main
```

### Step 5 — Deploy

```bash
npm run deploy
```

This builds the app into `dist/` and pushes it to the `gh-pages` branch
automatically. GitHub Pages will serve it from that branch.

### Step 6 — Enable GitHub Pages in repo settings

1. Go to your repo on GitHub → **Settings** → **Pages**
2. Under **Branch**, select `gh-pages` / `/ (root)`
3. Click **Save**

Your frontend will be live at:
```
https://<username>.github.io/spektralion_web/
```

---

## Part 2 — Backend (FastAPI/Python) → Render

The backend lives entirely in the `backend/` folder. It needs a Python server
— GitHub Pages cannot run it. **Render** is recommended (free tier available).

### What you need before deploying

Make sure `backend/requirements.txt` is up to date. It currently includes:
```
fastapi, uvicorn, numpy, scipy, scikit-image, tifffile, spectral,
h5py, opencv-python-headless, PyWavelets, Pillow, pydantic, python-dotenv
```

### Step 1 — Push your repo to GitHub (same repo is fine)

Render can deploy a sub-folder of a monorepo.

### Step 2 — Create a new Web Service on Render

1. Go to https://render.com and sign in
2. Click **New** → **Web Service**
3. Connect your GitHub repo
4. Fill in the settings:

| Field | Value |
|---|---|
| **Name** | `spektralion-api` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

### Step 3 — Set environment variables on Render

Go to **Environment** tab in your Render service and add:

| Key | Value |
|---|---|
| `ALLOWED_ORIGINS` | `https://<username>.github.io` |
| `SESSION_TTL` | `1800` |
| `MODELS_DIR` | `./models` |

`ALLOWED_ORIGINS` tells the backend to accept requests from your GitHub Pages
frontend. Without it, the browser will block API calls (CORS error).

### Step 4 — Deploy

Click **Create Web Service**. Render will install dependencies and start the
server. Your API will be live at:
```
https://spektralion-api.onrender.com
```

Health check endpoint to verify it works:
```
https://spektralion-api.onrender.com/api/health
```

### Step 5 — Point the frontend at the backend API

Once the backend URL is known, add it to the frontend. Create a `.env` file
at the project root (next to `package.json`):

```bash
# .env  (do NOT commit this — add .env to .gitignore)
VITE_API_URL=https://spektralion-api.onrender.com
```

Then in any frontend fetch call use:
```ts
const API = import.meta.env.VITE_API_URL ?? '';
fetch(`${API}/api/ingest`, { ... })
```

---

## Summary Table

| | Frontend | Backend |
|---|---|---|
| **What it is** | React + Vite static app | FastAPI Python server |
| **Where it lives** | `src/`, `index.html`, `vite.config.ts` | `backend/` |
| **Deployment target** | GitHub Pages | Render (or Railway / Fly.io) |
| **Build command** | `npm run build` | `pip install -r requirements.txt` |
| **Start command** | *(static, no server)* | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **URL** | `https://<user>.github.io/spektralion_web/` | `https://spektralion-api.onrender.com` |
| **Needs each other?** | No (works standalone) | No (works standalone) |

---

## Local development

```bash
# Terminal 1 — frontend
npm install
npm run dev
# → http://localhost:5173

# Terminal 2 — backend
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → http://localhost:8000/docs
```
