# Deploying Bloom (GitHub → Vercel)

Same workflow as the Wellness Store: push to GitHub, Vercel auto-deploys on every push.

## First-time setup

1. **Create a GitHub repo** named `bloom-salon` under the `leroyburgess27-art` account (empty, no README).

2. **Push the code** from the project root (`I:\Projects\Ecommerce\Hair Dresser`):

   ```bash
   git init
   git add .
   git commit -m "Bloom salon booking app — prototype"
   git branch -M main
   git remote add origin https://github.com/leroyburgess27-art/bloom-salon.git
   git push -u origin main
   ```

   `.gitignore` already excludes `node_modules`, `.next`, and `.env.local`, so no secrets are committed.

3. **Import into Vercel**: vercel.com → Add New → Project → Import `bloom-salon`.
   Next.js is auto-detected; leave build settings default.

4. **Add Environment Variables** (Project Settings → Environment Variables, or on the import screen).
   These are build-time vars, so they must be set before the first build:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://qhkkwmdgexhifdmtrrvn.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the Supabase **publishable** key (`sb_publishable_…`) |
   | `NEXT_PUBLIC_BUSINESS_ID` | `11111111-1111-1111-1111-111111111111` |

   Later, when email reminders go live, add `RESEND_API_KEY` (server-side only — do NOT prefix with `NEXT_PUBLIC_`).

5. **Deploy.** Vercel builds and gives a `…vercel.app` URL.

## Ongoing

- `git push` to `main` → automatic production deploy.
- The daily reminder cron is configured in `vercel.json` (`/api/reminders/run`, 07:00 UTC ≈ 09:00 SAST).

## Notes

- The Supabase publishable key is safe to expose in the browser (it respects Row-Level Security). Never put the **secret** key in a `NEXT_PUBLIC_` variable.
- RLS policies are currently permissive (prototype). Tighten them with auth-scoped policies before any real launch.
