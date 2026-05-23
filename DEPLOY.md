# URIBOH curriculum — Vercel + Supabase auth

## Vercel

1. Import this folder (`【カリキュラム】本稿用一式`) as the project root (or set **Root Directory** to this folder in an monorepo).
2. Framework preset: **Other** (static). Build uses `vercel.json`:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
3. **Environment variables** (Production and Preview):

   | Name | Value |
   |------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL` | Project URL from Supabase → Settings → API |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `SUPABASE_ANON_KEY` | Publishable or `anon` public key |
   | `ALLOWED_EMAILS` | Optional. Comma-separated emails allowed to enter the site |

   Local: put the same values in `.env.local` and run `npm run build` (or `npm run preview`).

4. Deploy. Add your custom domain under Vercel → Domains.

**Note:** `img/` is large (~380MB). If the deploy fails or is slow, host images on Supabase Storage or a CDN and update paths later.

## Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. **Authentication → Providers**
   - Enable **Email** (confirm email if you want verification before login).
   - Enable **Google** and paste Client ID / Secret from Google Cloud.
3. **Authentication → URL configuration**
   - **Site URL:** `https://your-production-domain.com`
   - **Redirect URLs** (add all that apply):
     - `https://your-production-domain.com/**`
     - `https://*.vercel.app/**` (preview deployments; Google OAuth may require each preview origin separately)

## Google Cloud (for Google sign-in)

1. APIs & Services → **OAuth consent screen** (configure app).
2. **Credentials** → Create **OAuth 2.0 Client ID** → Web application.
3. **Authorized JavaScript origins:**
   - `https://your-production-domain.com`
   - `http://localhost:3000` (if using `npx serve` locally)
   - Preview: `https://your-project.vercel.app`
4. **Authorized redirect URIs:** use the callback URL shown in Supabase → Authentication → Google provider (usually `https://<project-ref>.supabase.co/auth/v1/callback`).

## Local preview

```bash
cd "【カリキュラム】本稿用一式"
# Optional: put keys in .env and run build (see below)
npm run build
npx serve dist -p 3000
```

To bake env into `dist/config.js` locally (PowerShell):

```powershell
$env:SUPABASE_URL="https://xxx.supabase.co"
$env:SUPABASE_ANON_KEY="eyJ..."
npm run build
```

Without keys, the login screen shows a configuration message.

## Security

Auth gates the UI for normal users. Curriculum HTML is still shipped in `index.html`. For stronger protection, content must be loaded from a protected backend or storage, not embedded in the static bundle.
