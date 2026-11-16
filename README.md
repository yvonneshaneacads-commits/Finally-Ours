# Our Little Universe

Vite + React + Supabase, hosted on GitHub Pages (or Netlify).

## GitHub Pages
Push to `main`, then Settings → Pages → Source: **GitHub Actions**. `.github/workflows/deploy.yml` builds and deploys.
Set the edge-function `APP_URL` secret to `https://USER.github.io/REPO` and add that URL as the Site URL in Supabase Auth.
(User site `USER.github.io` or custom domain: add repo variable `VITE_BASE` = `/`.)

## Setup
1. **Supabase**: create a project, then run `supabase/schema.sql` in the SQL editor.
   Enable Realtime for `universe_spaces` if the script's last publication line errors.
2. **Env vars** (Netlify → Site settings → Environment variables, and a local `.env`):
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (see `.env.example`).
3. **Auth**: Supabase → Authentication → URL Configuration → set Site URL to your Netlify URL
   (add `http://localhost:8080` as a redirect URL for local dev).
4. **Edge functions**:
   ```
   supabase login
   supabase link --project-ref iifdsbwcpmfflwmvemkh
   supabase functions deploy google-calendar-sync --no-verify-jwt
   supabase functions deploy youtube-lookup
   supabase secrets set YOUTUBE_API_KEY=... GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... \
     OAUTH_STATE_SECRET=$(openssl rand -hex 32) APP_URL=https://YOUR-SITE.netlify.app,http://localhost:8080
   ```
5. **Google Calendar**: Google Cloud Console → create a project → enable *Google Calendar API* →
   OAuth consent screen (External; add both of your Google accounts as Test users) →
   Credentials → OAuth client ID → *Web application* → Authorized redirect URI:
   `https://iifdsbwcpmfflwmvemkh.supabase.co/functions/v1/google-calendar-sync`
6. **Netlify**: import the repo; `netlify.toml` already sets the build command and SPA redirect.

## Dev
`pnpm install && pnpm dev`
