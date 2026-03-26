# UNISA Study Tracker
### Mutshidzi Madzivhandila — 2026

A personal study tracker for all 9 UNISA modules. All data saves in your browser (localStorage) so it works on any device.

---

## Option A — Run locally on your PC

### First time setup
1. Install **Node.js** from https://nodejs.org (LTS version)
2. Open this folder in VS Code
3. Open the terminal (`Ctrl+``) and run:
```
npm install
```

### Run it
```
npm start
```
Then open **http://localhost:3000** in your browser.

---

## Option B — Deploy to the internet (access from phone/iPad/anywhere)

### Step 1 — Create a GitHub account
Go to **github.com** and sign up for free.

### Step 2 — Upload this project to GitHub
1. Go to **github.com/new**
2. Name it `unisa-tracker`, set to **Private**, click **Create repository**
3. On the next screen click **"uploading an existing file"**
4. Upload ALL files from this folder:
   - `server.js`
   - `package.json`
   - `railway.json`
   - `.gitignore`
   - `README.md`
   - The entire `public/` folder (drag the folder itself)
5. Click **Commit changes**

### Step 3 — Deploy on Railway (free)
1. Go to **railway.app** and sign up using your GitHub account
2. Click **New Project → Deploy from GitHub repo**
3. Select your `unisa-tracker` repository
4. Railway detects it's Node.js and runs `npm start` automatically
5. After ~60 seconds, go to **Settings → Networking → Generate Domain**
6. You'll get a URL like `https://unisa-tracker-production.up.railway.app`

### Step 4 — Add to your phone home screen
- **iPhone/iPad**: Open the URL in Safari → tap the Share button (box with arrow) → **Add to Home Screen**
- **Android**: Open in Chrome → tap the 3-dot menu → **Add to Home Screen**

It will appear as a proper app icon on your home screen!

---

## Notes
- **All your data** (completed items, custom tasks, tick states) saves in your browser's localStorage on each device
- Your phone and PC are independent — ticking something on your phone won't auto-sync to your PC (and vice versa)
- The 9 UNISA modules, all learning units, all assessments, and the study schedule generator are all built in — nothing needs to be uploaded to work
- Railway's free plan gives 500 hours/month — more than enough for personal use
