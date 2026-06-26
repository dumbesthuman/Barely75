# Attendance Tracker

A mobile-first PWA for tracking college attendance.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Deploy with GitHub + Vercel

This is the recommended way to get a public link like `https://attendance-tracker.vercel.app`.

### Step 1 — Push the project to GitHub

1. Create a free account at [github.com](https://github.com) if you don’t have one.

2. Create a new repository on GitHub:
   - Click **New repository**
   - Name it e.g. `attendance-tracker`
   - Leave it **Public** (works fine on free Vercel)
   - Do **not** add a README or .gitignore (this project already has them)
   - Click **Create repository**

3. In your terminal, from this project folder:

```bash
cd /Users/riteshhiremath/Documents/Hackathon

git init
git add .
git commit -m "Initial commit: attendance tracker PWA"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/attendance-tracker.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `attendance-tracker` with your GitHub username and repo name.

Git may ask you to sign in — use a [Personal Access Token](https://github.com/settings/tokens) as the password if prompted.

---

### Step 2 — Deploy on Vercel

1. Create a free account at [vercel.com](https://vercel.com) (you can sign in with GitHub).

2. Click **Add New… → Project**.

3. **Import** the GitHub repository you just pushed.

4. Vercel auto-detects this as a Vite app. Keep these settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

5. Click **Deploy**.

6. Wait ~1 minute. Vercel gives you a live URL, e.g.:
   `https://attendance-tracker-abc123.vercel.app`

That URL is your **shareable link**. Open it on your phone and use **Add to Home Screen** to install.

---

### Step 3 — Share the app

After deploy, open the live site → **Settings → Share app** → **Copy share link**.

(The share section is hidden on localhost — it only appears on the deployed URL.)

---

### Updating the live app

Whenever you change the code:

```bash
git add .
git commit -m "Describe your change"
git push
```

Vercel redeploys automatically on every push to `main`.

---

## Alternative: deploy without GitHub (Vercel CLI only)

```bash
npm i -g vercel
vercel login
cd /Users/riteshhiremath/Documents/Hackathon
vercel --prod
```

You still get a public URL, but GitHub + Vercel is easier for updates.

---

## Features

- Add, edit, and delete subjects with weekly timetables
- Browse schedule for past, today, and upcoming days
- Mark weekend college days when classes happen on Sat/Sun
- Install on phone (PWA)
- Export/import JSON backup

The app starts **empty**. Tap **+** to add subjects. Demo data is optional under **Settings → Load demo timetable**.
