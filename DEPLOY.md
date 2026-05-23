# URIBOH curriculum — Vercel + Firebase Auth

Login uses **Firebase Authentication** (email/password + Google). You do **not** need Supabase Third-Party Auth for this static site gate.

## Firebase Console

1. [Firebase Console](https://console.firebase.google.com/) → create or open project.
2. **Build** → **Authentication** → **Get started**.
3. **Sign-in method**:
   - Enable **Email/Password**
   - Enable **Google** (set support email / project if prompted)
4. **Authentication** → **Settings** → **Authorized domains** — add:
   - `forspect-uriboh.vercel.app`
   - `localhost` (for local preview)
5. **Project settings** (gear) → **Your apps** → **Web** (`</>`) → register app → copy config object.

## Vercel environment variables

Set for **Production** and **Preview**, then **Redeploy**:

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIza...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `your-project-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `123456789` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:123:web:abc` |
| `ALLOWED_EMAILS` | optional comma-separated allowlist |

`.env.local` is loaded at build time locally only (not in git).

## Vercel project

- Root: this folder
- Build: `npm run build`
- Output: `dist`

## Local preview

```powershell
# Paste Firebase web config into .env.local (see .env.example)
npm run preview
```

Open http://localhost:3000

## Google sign-in

Configure Google in **Firebase** → Authentication → Google (not only Google Cloud for Supabase).

If you see `auth/unauthorized-domain`, add your Vercel URL under Firebase **Authorized domains**.

### `auth/api-key-not-valid` (sign-up / login fails)

1. Confirm you run **`npm run preview`** (serves `dist/`, not the repo root). In the browser open `http://localhost:3000/config.js` — `FIREBASE_CONFIG.apiKey` must not be empty.
2. [Google Cloud Console](https://console.cloud.google.com/) → select project **forspect-uriboh** → **APIs & Services** → **Enabled APIs** → enable **Identity Toolkit API** (Firebase Auth).
3. **Credentials** → click the **Browser key** used by Firebase (often auto-created) → **Edit**:
   - **Application restrictions:** None (for testing), or HTTP referrers: `http://localhost:3000/*`, `https://forspect-uriboh.vercel.app/*`
   - **API restrictions:** “Don’t restrict key”, or allow **Identity Toolkit API**
4. Firebase → **Project settings** → your web app → copy `apiKey` again into `.env.local` → `npm run build` → restart preview.

## Supabase Third-Party Auth

Skip **Authentication → Third-Party Auth → Firebase** in Supabase unless you later use Supabase Database/API with Firebase JWTs.

## Security

Auth gates the UI; curriculum HTML is still in the static bundle. Stronger protection requires serving content from a protected backend/storage.
