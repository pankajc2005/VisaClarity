# Migration Complete — VisaClarity Independent Hosting Guide

The migration off the Lovable platform has been successfully completed. All platform-specific dependencies, configs, and integrations have been removed. The application is now fully portable and ready to run on any VPS, Docker environment, or Cloud platform.

## Changes Made

1. **Build Configuration**:
   - Removed `@lovable.dev/vite-tanstack-config` devDependency.
   - Hand-wired standard Vite + TanStack plugins manually in [vite.config.ts](file:///d:/Visa%20Clarity/vite.config.ts) (including `tanstackStart`, `@tailwindcss/vite`, `vite-tsconfig-paths`, and `nitro`).
   - Deduplicated `react`, `react-dom`, and `@tanstack/react-router` references to ensure bundle compatibility.

2. **Authentication Seam**:
   - Swapped the Lovable OAuth broker with native Supabase OAuth (`signInWithOAuth`) in [src/lib/platform.ts](file:///d:/Visa%20Clarity/src/lib/platform.ts).
   - Deleted the `src/integrations/lovable/` folder entirely.
   - Removed `@lovable.dev/cloud-auth-js` from dependencies.

3. **Mocks & Error Messages**:
   - Enhanced the local mock client in [src/integrations/supabase/client.server.ts](file:///d:/Visa%20Clarity/src/integrations/supabase/client.server.ts) to support mock storage uploads and signed URLs (using fetchable base64 data URIs).
   - Replaced all "Connect Supabase in Lovable Cloud" error messages in the Supabase initialization files with generic environment configuration instructions.

4. **References & Cleanups**:
   - Renamed `callLovableAI` inside [src/lib/roadmap.functions.ts](file:///d:/Visa%20Clarity/src/lib/roadmap.functions.ts) to a generic `callAI` function.
   - Changed the hardcoded referer in [src/lib/blog/llm-chain.server.ts](file:///d:/Visa%20Clarity/src/lib/blog/llm-chain.server.ts) and the User-Agent in [src/lib/blog/research-agent.server.ts](file:///d:/Visa%20Clarity/src/lib/blog/research-agent.server.ts) to dynamically use the configured `process.env.VITE_SITE_URL` at runtime.
   - Deleted the `.lovable` directory containing Lovable sandbox metadata.
   - Updated website URLs in [robots.txt](file:///d:/Visa%20Clarity/public/robots.txt) and [llms.txt](file:///d:/Visa%20Clarity/public/llms.txt) to target `https://visaclarity.me`.

---

## Required Environment Variables

Ensure the following variables are configured in your hosting dashboard or local `.env`:

| Variable                        | Type   | Description                                                 |
| ------------------------------- | ------ | ----------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | Public | Client-side Supabase URL                                    |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public | Client-side Supabase anon key                               |
| `VITE_SUPABASE_PROJECT_ID`      | Public | Client-side Supabase project identifier                     |
| `SUPABASE_URL`                  | Server | Server-side Supabase URL                                    |
| `SUPABASE_PUBLISHABLE_KEY`      | Server | Server-side Supabase anon key                               |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server | Server-side Supabase service role key (RLS bypass)          |
| `AI_GATEWAY_URL`                | Server | OpenAI-compatible endpoint (e.g. OpenRouter/Groq/OpenAI)    |
| `AI_GATEWAY_API_KEY`            | Server | API key for the custom AI Gateway                           |
| `TAVILY_API_KEY`                | Server | Web research API key (required for Pro roadmaps)            |
| `VITE_SITE_URL`                 | Public | Canonical URL of your app (e.g., `https://visaclarity.me`)  |
| `STORAGE_BACKEND`               | Server | Set to `s3` to switch object storage from Supabase to S3/R2 |

---

## Hosting Recommendations & Deployment Instructions

### 1. Cloudflare Workers (Recommended)

By default, the Vite bundle is preset with the `cloudflare-module` preset.

- Create a `wrangler.toml` in the root directory.
- Specify your project name and entrypoint (`.output/server/index.mjs`).
- Deploy using `wrangler deploy`.

### 2. Node / Docker / VPS

If you prefer to host on a standard Linux VPS, Railway, or Fly.io:

1. Change the `preset` parameter in `vite.config.ts` from `cloudflare-module` to `node-server`.
2. Run `bun run build` to compile the project.
3. Start the node server:
   ```bash
   node .output/server/index.mjs
   ```
4. Configure an Nginx reverse proxy pointing to port `3000`.

### 3. Vercel / Netlify

1. Update `preset` in `vite.config.ts` to `vercel` or `netlify`.
2. Deploy using `vercel deploy` or `netlify deploy`.

---

## Database Migration & Initial Setup

1. **Provision a new Supabase Project** at supabase.com.
2. **Enable extensions** `pg_cron` and `pg_net` in the Database dashboard.
3. **Import schema**: From a machine with `psql` installed, run:
   ```bash
   psql "$SUPABASE_DB_URL" < schema.sql
   psql "$SUPABASE_DB_URL" < data.sql
   ```
4. **Triggers**: Wire the triggers `grant_admin_on_signup` and `create_free_subscription_on_signup` to `AFTER INSERT ON auth.users` if not included in the schema.
5. **pg_cron job**: Create a scheduled task executing the craft endpoint:
   ```sql
   SELECT cron.schedule('craft-personalized-roadmaps', '* * * * *', 'SELECT net.http_post(url:=''https://<your-domain>/api/public/hooks/craft-personalized-roadmap'')');
   ```
6. **Bucket**: Create a private storage bucket named `personalized-roadmaps` with RLS policies restricting read access to owning users.
7. **OAuth**: Enable Google OAuth in your new Supabase project settings using your Google Cloud Credentials.
