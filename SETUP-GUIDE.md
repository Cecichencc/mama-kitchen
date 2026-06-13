# 妈妈厨房 — Setup & Deploy Guide

This gets the app live on the internet with a URL your mom can open on her phone,
including the AI "有啥做啋" feature working safely.

There are two parts:
1. **The app** (the four tabs) — works on its own.
2. **The backend** (`/api/recipe`) — holds your secret API key so the AI feature
   works without exposing the key in the browser.

You do **not** need to be a developer to follow this. It's mostly clicking buttons.

---

## What you need before starting

- A **GitHub** account (free) — https://github.com/signup
- A **Vercel** account (free) — https://vercel.com/signup (sign up *with GitHub*, it's easier)
- An **Anthropic API key** — https://console.anthropic.com → API Keys → Create Key.
  Copy it somewhere safe; it starts with `sk-ant-`.
  > Note: API usage is paid (separate from your Claude.ai subscription), but for
  > one person using it a few times a day, the cost is a few cents. You can set a
  > spending limit in the Anthropic console under Billing → Limits.

---

## Step 1 — Put the code on GitHub

You have a folder called `mama-kitchen` with all the files. Get it onto GitHub:

**Easiest way (no command line):**
1. Go to https://github.com/new and create a repository named `mama-kitchen`.
   Leave it empty (don't add a README).
2. On the next screen, click **"uploading an existing file"**.
3. Drag in **all the files and folders** from the `mama-kitchen` folder
   (including the `api` and `src` folders). Commit.

**If you prefer the command line:**
```bash
cd mama-kitchen
git init
git add .
git commit -m "妈妈厨房 initial"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/mama-kitchen.git
git push -u origin main
```

---

## Step 2 — Deploy on Vercel

1. Go to https://vercel.com/new
2. Click **Import** next to your `mama-kitchen` repository.
3. Vercel auto-detects it's a Vite project — leave all build settings as-is.
4. **Before clicking Deploy**, expand **Environment Variables** and add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** your `sk-ant-...` key
   - Click **Add**.
5. Click **Deploy**. Wait ~1 minute.
6. You'll get a URL like `https://mama-kitchen-xxxx.vercel.app`. That's the app.

> The API key lives only in Vercel's settings and inside the backend function.
> It is never sent to the browser, so it stays secure.

---

## Step 3 — Test it

Open the URL. Try each tab:
- **今天吃什么 / 本周菜单 / 买菜清单** — should work instantly.
- **有啥做啥** — type `鳕鱼，西兰花`, tap 生成菜谱. After a few seconds you should
  see a recipe. (This is the part that needed the backend — it now works because
  the call goes through `/api/recipe`, not directly to Anthropic.)

If 有啥做啥 shows an error, see Troubleshooting below.

---

## Step 4 — Put it on mom's phone

Open the URL in her phone browser, then:
- **iPhone (Safari):** Share button → **Add to Home Screen**.
- **Android (Chrome):** menu (⋮) → **Add to Home screen**.

It now opens like an app, full screen, with its own icon.

---

## Making changes later

Edit the files on GitHub (or push from your computer). Vercel automatically
re-deploys every time you change the `main` branch. No cache problem like the
preview had — every change goes live in about a minute.

---

## Running locally (optional, for testing changes first)

```bash
cd mama-kitchen
npm install
cp .env.example .env.local      # then edit .env.local and paste your real key
npx vercel dev                  # runs BOTH the app and the /api function locally
```
Open http://localhost:3000. (Plain `npm run dev` runs the app but NOT the
`/api/recipe` function — use `npx vercel dev` to test the AI feature locally.)

---

## Troubleshooting the 有啥做啥 feature

The app shows a small grey "技术信息" line under any error. Match it here:

| 技术信息 says | Meaning | Fix |
|---|---|---|
| `Server missing ANTHROPIC_API_KEY` | Vercel doesn't have your key | Step 2.4 — add the env var, then redeploy |
| `Claude API 401` | Key is wrong or expired | Make a new key in the Anthropic console, update it in Vercel |
| `Claude API 400` | Bad request (rare) | Usually a too-large photo — try a smaller image |
| `Claude API 429` | Rate/credit limit hit | Add credit in Anthropic console → Billing |
| `无法解析菜谱` | Claude replied but not as clean JSON | Tap 生成菜谱 again; it's usually a one-off |

After changing the env var in Vercel, go to the project → Deployments →
click the latest → **Redeploy** so it picks up the new value.

---

## File map (what each piece does)

```
mama-kitchen/
├─ api/
│  └─ recipe.js        ← the backend. Holds the key, calls Claude. (Vercel runs this)
├─ src/
│  ├─ App.jsx          ← the whole app (4 tabs). Calls /api/recipe for the AI feature.
│  └─ main.jsx         ← starts the React app
├─ index.html          ← page shell
├─ package.json        ← dependency list
├─ vite.config.js      ← build config
├─ vercel.json         ← tells Vercel how to build
├─ .env.example        ← shows which env var you need (copy to .env.local locally)
└─ .gitignore          ← keeps node_modules / .env out of git
```

---

## A note on the recipes

The dish library and AI prompt are tuned to your mom's needs: warm Chinese home
cooking only, low oil / low salt / less rice, more dark-green vegetables and
deep-sea fish, plus 滋阴养肾润燥 ingredients. To add or change dishes, edit the
`DISHES` array near the top of `src/App.jsx`. To adjust the AI's rules, edit the
`prompt` text in `api/recipe.js`.

If any of the dietary limits are tied to an actual medical condition, it's worth
running the general approach past her doctor — the app is a planning helper, not
medical advice.
