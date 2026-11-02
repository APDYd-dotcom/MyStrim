# MyStrim

A single-page media-learning app. Browse curated Google Documents, take an
interactive quiz on each one, and earn coins for scoring 80% or higher.

Built with **vanilla JavaScript**, **Tailwind CSS**, and the browser's
**localStorage** — no backend, no build step, no dependencies to install.

---

## 1. Run it

Because everything runs client-side, you have two options:

**Option A — just open it**
Double-click `index.html` (or open it with your browser's "Open File" menu).

**Option B — serve it locally (recommended)**
Some browsers restrict `<iframe>` and font/script loading on the `file://`
protocol. For the smoothest experience, serve the folder with any static
server, for example:

```bash
# from inside the mystrim/ folder
python3 -m http.server 8080
# then open http://localhost:8080 in your browser
```

or, if you have Node installed:

```bash
npx serve .
```

No `npm install` is required — Tailwind CSS and the icon set are loaded from
a CDN at runtime, and the app has no other dependencies.

---

## 2. Default admin login

An admin account is seeded automatically the first time the app loads:

| Field    | Value               |
|----------|----------------------|
| Email    | `admin@mystrim.com` |
| Password | `Admin@2026`         |

On the login screen you can also click **"Use default admin credentials"**
to auto-fill this for you.

> ⚠️ This is a local demo app. Passwords are stored in `localStorage` with a
> lightweight, non-cryptographic hash — good enough to keep plaintext
> passwords out of the browser storage for a demo, but **not** a substitute
> for a real authentication system. Do not reuse this pattern in production
> or with real user data.

Regular users create their own account from the **"Create account"** tab on
the login screen — no admin approval is needed.

---

## 3. Features

### For everyone
- Create an account / log in (stored locally in this browser).
- Simple, uncluttered interface in the spirit of Google's own products —
  white background, a single blue accent, Roboto type, modern line icons.

### For users
- Browse the document library as a card grid (search by title).
- Click a document to open it in an embedded viewer, or open it in a new tab.
- Take that document's quiz: an interactive, one-question-at-a-time game with
  a progress bar and instant right/wrong feedback per answer.
- Score **80% or higher** to earn **20 coins**, shown live in the navbar.
- Coins are only awarded the first time you pass a given quiz — you can
  retake any quiz for practice without earning duplicate coins.
- A "Completed" badge appears on documents you've already passed.

### For admins
- Full CRUD on documents: **title, Google Document URL, and volume**.
- Manage each document's quiz: add multiple-choice questions (4 options,
  1 correct answer) and delete questions, all from an in-app screen —
  no code or JSON editing required.
- Confirmation prompts before any delete.

---

## 4. Project structure

```
mystrim/
├── index.html          # Single-page app shell (all views live here)
├── css/
│   └── styles.css       # Small custom styles layered on Tailwind utilities
├── js/
│   ├── storage.js        # Data layer: localStorage, seed data, auth helpers
│   └── main.js           # App logic: views, auth, CRUD, quiz engine
└── README.md
```

**How data is stored:** everything lives under a few `localStorage` keys
(`mystrim_users`, `mystrim_documents`, `mystrim_session`). There is no server
and no external database — data is local to the browser profile you're
using. Clearing your browser's site data for this page will reset the app
back to its seeded state (the default admin account plus two sample
documents with ready-made quizzes).

To fully reset the app during development, open your browser's DevTools
console on the page and run:

```js
localStorage.clear();
location.reload();
```

---

## 5. Notes on the Google Document links

The **URL** field expects a normal Google Docs sharing link, e.g.
`https://docs.google.com/document/d/<FILE_ID>/edit`. The app automatically
converts this into Google's embeddable `/preview` link for the in-app
viewer, and keeps the original link available under "Open in new tab". For
the embedded viewer to actually render, the document must be shared as
"Anyone with the link can view."

---

## 6. Tech notes

- No build tools, bundlers, or `npm install` needed — open and go.
- Tailwind CSS is loaded via the Play CDN; icons via the Lucide CDN.
- All application code is plain, dependency-free JavaScript (ES2017+).
- Tested end-to-end (registration, login, document CRUD, quiz authoring,
  quiz-taking, coin awarding, and repeat-attempt handling) before delivery.

---

## 6. Notes on the JavaScript rewrite

- The JavaScript uses simple beginner-friendly code with global functions, no modules/classes.
- After updating, clear localStorage once (`localStorage.clear()`) because old accounts use the old hash.

The two sample documents use placeholder links, so their preview will not load. Replace them with your own links from Admin -> Edit.
