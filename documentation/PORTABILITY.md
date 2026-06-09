# VisaClarity — Portability & Migration Guide

> **Audience:** An AI agent (or human dev) tasked with moving this project off Lovable to another platform — or simply running it locally without Lovable's managed pipeline.
>
> **Goal:** After following this single document end-to-end, the app should build, deploy, and run on the new host with feature parity, no Lovable dependencies, and no manual archaeology required.

This file is the single source of truth. `MIGRATION.md` (older) and `.env.example` are referenced from here.

---

## 0. TL;DR (for the agent)

The project is a standard **TanStack Start v1 + React 19 + Tailwind v4 + Supabase** app, SSR-bundled by **Nitro** for **Cloudflare Workers** today. Four things tie it to Lovable:

1. `@lovable.dev/vite-tanstack-config` — a wrapper around standard Vite plugins.
2. `@lovable.dev/cloud-auth-js` — OAuth broker used **only** for Google sign-in.
3. **Lovable AI Gateway** (`https://ai.gateway.lovable.dev`) — every Gemini call goes through it. Behind the `chatCompletion()` seam in `src/lib/ai-gateway.server.ts`, swappable with two env vars (§ 9.1).
4. Hosting on `*.lovable.app` via Lovable's Cloudflare Workers deployment.

Everything else (Supabase, GA4, TanStack, shadcn/ui, error reporter, Tavily web research, PDF/DOCX generation, pg_cron worker) is upstream OSS and host-agnostic.

All Lovable-bound runtime behavior is funneled through three seams: **`src/lib/platform.ts`** (OAuth + site URL), **`src/lib/ai-gateway.server.ts`** (AI provider), and env vars. On migration day, those plus `vite.config.ts` are typically all you change in code.

---

## 1. Stack inventory

| Layer        | Technology                                    | Notes                                                 |
| ------------ | --------------------------------------------- | ----------------------------------------------------- |
| Framework    | TanStack Start v1.167+                        | File-based routing under `src/routes/`                |
| UI           | React 19 + shadcn/ui (Radix)                  | All components in `src/components/ui/`                |
| Styling      | Tailwind CSS v4                               | Config in `src/styles.css` (no `tailwind.config.js`)  |
| Build        | Vite 7 + Nitro 3                              | SSR entry `src/server.ts` → Cloudflare Workers preset |
| Server logic | `createServerFn` from `@tanstack/react-start` | Files: `src/lib/*.functions.ts`                       |
| Database     | Supabase (Postgres + Auth + RLS)              | Client at `src/integrations/supabase/client.ts`       |
| AI (unused)  | `ai` + `@ai-sdk/google`                       | Wired but no calls in code                            |
| Analytics    | GA4                                           | ID via `VITE_GA_MEASUREMENT_ID`                       |
| Runtime      | Cloudflare workerd + `nodejs_compat`          | See § 7 for caveats                                   |
| Package mgr  | bun                                           | `bun install`, `bun add`                              |

Node-style native modules, `child_process`, `sharp`, `puppeteer`, file watching, `os.cpus()` — **do not work** in the current runtime. Keep this in mind if you swap hosts; moving to Node lifts these restrictions.

---

## 2. Repository map

```
src/
  routes/              File-based routes (do NOT edit routeTree.gen.ts)
    __root.tsx         Root layout, <html>/<head>/<body>, GA4 script
    index.tsx          Home page
    about.tsx pricing.tsx auth.tsx roadmap.tsx blog.*.tsx r.$slug.tsx
    sitemap[.]xml.ts   Dynamic sitemap server route
  components/
    ui/                shadcn/ui primitives
    landing/           Marketing components
    roadmap/           Roadmap UI
    ErrorReporter.tsx GlobalErrorListener.tsx  Self-hosted error capture
  integrations/
    supabase/
      client.ts        Browser Supabase client (auto-generated, do NOT edit)
      client.server.ts Service-role server client (auto-generated)
      auth-middleware.ts auth-attacher.ts types.ts
    lovable/
      index.ts         Lovable OAuth broker — DELETE on migration
  lib/
    platform.ts                  *** Portability seam — OAuth + site URL ***
    ai-gateway.server.ts         *** Portability seam — AI chat completions ***
    blog/posts.ts                Static blog content
    roadmap.functions.ts                          Free/instant roadmap server fns
    saved-roadmaps.functions.ts                   Save/list/delete user-owned roadmaps
    personalized.functions.ts                     Pro-tier personalized request CRUD
    personalized-roadmap.functions.ts             Pro/Max craft request + signed downloads
    personalized-roadmap-research.server.ts       Tavily web-research agent
    personalized-roadmap-craft.server.ts          Gemini synthesis agent
    roadmap-export.functions.ts roadmap-export.server.ts  PDF/DOCX export
    subscription.functions.ts admin.functions.ts admin.server.ts
    entitlements.server.ts                        Server-side tier gating
    api/example.functions.ts error-capture.ts error-page.ts config.server.ts
  routes/api/public/hooks/craft-personalized-roadmap.ts  pg_cron worker endpoint
  hooks/  styles.css  router.tsx  server.ts  start.ts
supabase/
  config.toml          Auto-managed project_id; do not edit
public/
  robots.txt llms.txt favicon.ico …
.env.example           Env var contract (copy to .env)
MIGRATION.md           Legacy migration notes (this file supersedes)
PORTABILITY.md         <-- you are here
```

Auto-generated files — **never hand-edit**:

- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/client.server.ts`
- `src/integrations/supabase/auth-middleware.ts`
- `src/integrations/supabase/auth-attacher.ts`
- `src/integrations/supabase/types.ts`
- `src/routeTree.gen.ts`
- `.env` (Lovable-injected; recreate manually off-platform)

---

## 3. Environment variables

Authoritative list. Copy `.env.example` → `.env` for local development; set the same on your host's dashboard.

### Required (every host)

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
VITE_SUPABASE_PROJECT_ID=<ref>

SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>     # server only, never bundle
```

### AI + research (server only, required for AI features)

```
LOVABLE_API_KEY=...                       # default AI gateway bearer (Lovable). Drop after migration.
TAVILY_API_KEY=...                        # Web research for personalized roadmaps. Free tier at tavily.com.
```

### Optional / portability

```
VITE_SITE_URL=https://your-domain.example # canonical URL (default: https://visaclarity.lovable.app)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX       # blank disables GA
AI_GATEWAY_URL=...                        # override AI endpoint (OpenAI-compatible /v1/chat/completions)
AI_GATEWAY_API_KEY=...                    # override AI bearer; when set, LOVABLE_API_KEY is ignored
```

Rules:

- `VITE_*` are public, build-time replaced by Vite. Safe in the browser bundle.
- Non-`VITE_*` are server-only via `process.env.*` inside `createServerFn` handlers. Never reference at module scope of shared files.

---

## 4. Database (Supabase) — schema, exports, re-import

The Supabase project is a standard Supabase project provisioned inside Lovable's org. Everything is exportable.

### 4.1 Tables (public schema)

- `error_reports` — captured runtime errors from `ErrorReporter`
- `leads` — lead form submissions
- `roadmap_cache` — generated roadmap output cache (shareable by `share_slug`)
- `roadmap_usage` — per-IP/fingerprint monthly usage counter
- `saved_roadmaps` — user-owned saved free roadmaps
- `user_roles` — `(user_id uuid, role app_role)`, role storage for auth
- `user_subscriptions` — `(user_id uuid, tier subscription_tier)`, plan gating
- `personalized_requests` — Pro-tier short-form personalized request queue
- `personalized_roadmap_requests` — Pro/Pro Max full craft jobs (status, progress, `pdf_path`, `docx_path`, `result jsonb`, `attempts`, `eta_minutes`)

### 4.2 Enums

- `app_role` — at minimum `'admin'`
- `subscription_tier` — `'free' | 'pro' | 'pro_max'`
- `personalized_request_status` — `'queued' | 'in_progress' | 'ready' | 'failed' | 'cancelled'`

### 4.3 Functions (all `SECURITY DEFINER`, `search_path = public`)

- `has_role(_user_id uuid, _role app_role) returns boolean`
- `is_admin_email(_email text) returns boolean`
- `grant_admin_on_signup() returns trigger` — auto-grants admin to a hardcoded email on signup
- `create_free_subscription_on_signup() returns trigger` — inserts a `free` row in `user_subscriptions` on signup
- `get_user_tier(_user_id uuid) returns subscription_tier`
- `increment_roadmap_usage(_ip_hash, _fingerprint, _month, _email) returns integer`
- `update_updated_at_column() returns trigger`

### 4.4 Triggers & extensions

- `auth.users` triggers: wire `grant_admin_on_signup` and `create_free_subscription_on_signup` to `AFTER INSERT ON auth.users` in the new project — Lovable's provisioning does not always copy them.
- `pg_cron` (extension `cron`): one job every minute that POSTs to `https://<your-host>/api/public/hooks/craft-personalized-roadmap` via `pg_net.http_post`. On migration, recreate it with `cron.schedule(...)` and point the URL at the new host. Required extensions: `pg_cron`, `pg_net`.
- `updated_at` triggers using `update_updated_at_column` on tables that have an `updated_at` column.

### 4.5 Storage buckets

- `personalized-roadmaps` — private. Layout: `<user_id>/<request_id>/roadmap.pdf` and `.../roadmap.docx`. RLS restricts read to the owning user (signed URLs are minted server-side via `personalized-roadmap.functions.ts`). Recreate the bucket and the same RLS policies on migration.

### 4.6 Export commands

From a machine with `psql` and `SUPABASE_DB_URL` (Database settings → Connection string):

```bash
pg_dump --no-owner --no-privileges --schema=public --schema-only \
  "$SUPABASE_DB_URL" > schema.sql

pg_dump --no-owner --no-privileges --schema=public --data-only \
  --table=public.error_reports \
  --table=public.leads \
  --table=public.roadmap_cache \
  --table=public.roadmap_usage \
  --table=public.saved_roadmaps \
  --table=public.user_roles \
  --table=public.user_subscriptions \
  --table=public.personalized_requests \
  --table=public.personalized_roadmap_requests \
  "$SUPABASE_DB_URL" > data.sql
```

For auth users use Supabase's [Auth migration tool](https://supabase.com/docs/guides/platform/migrating-and-upgrading-projects) (or accept re-signups for a small user base). For storage objects in the `personalized-roadmaps` bucket, use `supabase storage` CLI or the dashboard's bucket export.

### 4.7 Re-import

1. Create a new Supabase project; enable extensions `pg_cron`, `pg_net`.
2. `psql "$NEW_DB_URL" < schema.sql && psql "$NEW_DB_URL" < data.sql`
3. Verify RLS policies are present (`schema.sql` should include them).
4. Recreate the `personalized-roadmaps` storage bucket + policies (§ 4.5).
5. Re-wire `auth.users` triggers (§ 4.4) and the `pg_cron` job (§ 4.4).
6. Enable Google OAuth (§ 5.2).
7. Update env vars (§ 3).
8. Regenerate types: `bunx supabase gen types typescript --project-id <ref> > src/integrations/supabase/types.ts`.

### 4.8 RLS / grants invariant

Every public-schema table has explicit `GRANT`s plus RLS policies. If you add tables off-platform, follow the same pattern: `CREATE TABLE → GRANT → ENABLE RLS → CREATE POLICY`. Without GRANTs, PostgREST returns permission errors even with permissive RLS.

---

## 5. Authentication

### 5.1 Today

- Email/password and Google OAuth via Supabase Auth.
- Google sign-in is routed through Lovable's broker: `lovable.auth.signInWithOAuth("google", …)` → exchanges code → calls `supabase.auth.setSession(tokens)`.
- All call sites use `signInWithGoogle()` from `src/lib/platform.ts`.

### 5.2 Migration — swap the broker

Edit `src/lib/platform.ts`:

```ts
// REMOVE:
import { lovable } from "@/integrations/lovable";

// REPLACE body of signInWithGoogle:
import { supabase } from "@/integrations/supabase/client";

export async function signInWithGoogle(redirectUri?: string) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectUri ?? window.location.origin },
  });
  return { error, redirected: true };
}
```

Then in the new Supabase project dashboard:

1. **Authentication → Providers → Google** → enable.
2. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
3. Add Supabase's callback URL (`https://<ref>.supabase.co/auth/v1/callback`) to **Authorized redirect URIs**.
4. Paste client ID + secret into Supabase.

Delete `src/integrations/lovable/` and remove `@lovable.dev/cloud-auth-js` from `package.json`.

---

## 6. Build configuration

### 6.1 Replace `vite.config.ts`

Current:

```ts
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
export default defineConfig({ tanstackStart: { server: { entry: "server" } } });
```

Portable replacement:

```ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import nitro from "nitro/vite";
import path from "node:path";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({ server: { entry: "server" } }),
    viteReact(),
    nitro({ config: { preset: "cloudflare-module" } }), // see § 7 for other presets
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: ["react", "react-dom", "@tanstack/react-router"],
  },
});
```

### 6.2 Dependency churn

```bash
bun add -d @tanstack/react-start vite @vitejs/plugin-react \
  @tailwindcss/vite vite-tsconfig-paths nitro
bun remove @lovable.dev/vite-tanstack-config @lovable.dev/cloud-auth-js
```

(Most of these are already direct deps; `bun add -d` is a no-op then.)

### 6.3 What you must NOT do

- Do **not** set `ssr.external` or `resolve.external` for the worker SSR environment — hard build failure.
- Do **not** create `entry-client.tsx` / `entry-server.tsx` (pre-1.0 vinxi pattern).
- Do **not** add `tailwind.config.js` — Tailwind v4 reads `src/styles.css`.
- Do **not** edit `src/routeTree.gen.ts` (regenerated each build).

---

## 7. Hosting

The SSR entry `src/server.ts` is host-agnostic — it just exports `{ fetch }`. Pick a Nitro preset:

| Host                          | `preset`            | Notes                                                                          |
| ----------------------------- | ------------------- | ------------------------------------------------------------------------------ |
| Cloudflare Workers            | `cloudflare-module` | Default. Add `wrangler.toml` with `compatibility_flags = ["nodejs_compat"]`.   |
| Vercel                        | `vercel`            | Zero config beyond preset; `vercel deploy`.                                    |
| Netlify                       | `netlify`           | Zero config beyond preset; `netlify deploy`.                                   |
| Node / Docker / Railway / Fly | `node-server`       | Run `node .output/server/index.mjs`. Frees you from the workerd limits in § 1. |

Example `wrangler.toml` for Cloudflare:

```toml
name = "visaclarity"
main = ".output/server/index.mjs"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]
[vars]
VITE_SITE_URL = "https://your-domain.example"
# secrets via: wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

After deployment: point your domain at the new host, then set `VITE_SITE_URL` to it so canonical URLs / sitemap / OG tags update.

---

## 8. SEO assets that depend on host

These auto-derive from `SITE_URL` once `VITE_SITE_URL` is set:

- `<link rel="canonical">` in route `head()` blocks
- `og:url`, `twitter:*` meta
- `src/routes/sitemap[.]xml.ts` URLs
- JSON-LD `url` fields

Files to manually update on a domain change:

- `public/robots.txt` — verify the `Sitemap:` line points at the new host.
- `public/llms.txt` — references the canonical URL.

---

## 9. Server-side runtime (createServerFn)

Pattern used throughout (`src/lib/*.functions.ts`):

```ts
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const myFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { foo: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context; // RLS-scoped client
    process.env.SOME_SECRET; // read inside handler, never at module scope
    return { ok: true };
  });
```

`src/start.ts` registers `attachSupabaseAuth` as a global `functionMiddleware` so the browser auto-attaches the user's bearer token on every RPC. Keep this when refactoring.

For raw HTTP (webhooks, public APIs, the pg_cron worker) use a file route under `src/routes/api/public/*.ts` with a `server.handlers` block. Always verify signatures before processing.

---

## 9.1 AI provider seam (Lovable AI Gateway → anything)

Every AI call in the app goes through `chatCompletion()` in **`src/lib/ai-gateway.server.ts`**. Call sites: `src/lib/roadmap.functions.ts` and `src/lib/personalized-roadmap-craft.server.ts`. Do not add new direct `fetch(...gateway...)` calls — route them through this seam.

Default behaviour:

- URL: `https://ai.gateway.lovable.dev/v1/chat/completions`
- Bearer: `LOVABLE_API_KEY`
- Model strings: `google/gemini-2.5-flash-lite`, `google/gemini-2.5-flash`

Override on migration (no code change, just env vars):

```
AI_GATEWAY_URL=https://openrouter.ai/api/v1/chat/completions
AI_GATEWAY_API_KEY=sk-or-...
```

The endpoint must be **OpenAI chat-completions compatible** (`messages`, `model`, `temperature`, `max_tokens`, `response_format`). Drop-in providers: OpenRouter, Together AI, Groq, OpenAI, Azure OpenAI. When switching providers, update the model strings in `roadmap.functions.ts` (`AI_MODEL_STANDARD`, `AI_MODEL_DEEP`) and in `personalized-roadmap-craft.server.ts` to model IDs that the new provider exposes.

For Google Gemini directly (non-OpenAI shape), replace the **body** of `chatCompletion` with a `@google/generative-ai` call — call sites do not change.

`TAVILY_API_KEY` (web research) is provider-agnostic: it points directly at `tavily.com`. Keep it as-is or swap for Brave Search / Serper by editing `src/lib/personalized-roadmap-research.server.ts`.

---

## 9.2 Background worker (pg_cron) portability

The personalized roadmap craft loop is **just an HTTP endpoint** + a scheduled POST:

- Endpoint: `src/routes/api/public/hooks/craft-personalized-roadmap.ts`
- Scheduler today: Supabase `pg_cron` job that runs every minute and calls the endpoint via `pg_net.http_post`.

To run elsewhere, swap the scheduler — the endpoint is portable:

- **Cloudflare Cron Triggers** — add a `[triggers]` block in `wrangler.toml` and call the URL from a `scheduled` handler.
- **Vercel Cron** — add a `vercel.json` `crons` entry pointing at the path.
- **GitHub Actions** — `schedule: cron: '* * * * *'` running `curl`.
- **Any external uptime/cron service** (cron-job.org, Upstash QStash, EasyCron).

The endpoint is idempotent and self-throttling (`attempts`, `started_at`), so over-triggering is safe.

---

## 9.3 Idempotency

`src/lib/idempotency.server.ts` exposes `withIdempotency({ key, scope, userId, requestHash }, fn)`. The first call runs `fn`, persists the result in `public.idempotency_keys`, and returns it. Subsequent calls with the same `(key, scope)` return the cached response without re-executing. In-flight duplicates throw `IdempotencyConflictError` (map to HTTP 409).

Usage pattern (any non-idempotent server fn or webhook):

```ts
import { withIdempotency } from "@/lib/idempotency.server";

await withIdempotency(
  { key: input.idempotencyKey, scope: "personalized_roadmap.create", userId },
  async () => {
    // do the work exactly once
  },
);
```

Storage is a single Postgres table with a TTL column (`expires_at`, default 24h). Schedule a cleanup with `DELETE FROM idempotency_keys WHERE expires_at < now();` via pg_cron if volume grows.

---

## 9.4 Distributed transactions (saga / outbox)

`src/lib/saga.server.ts` provides `runSaga(sagaId, steps[])` for multi-system workflows that can't share a Postgres transaction (DB + external API + object storage, etc.). Each step has a `run` and an optional `compensate`. If any step fails, completed steps' compensations run in reverse order. All transitions are persisted to `public.saga_steps` for audit and post-mortem.

```ts
await runSaga(`craft:${requestId}`, [
  { name: "research", run: async () => research(brief) },
  { name: "synthesize", run: async () => craft(brief) },
  {
    name: "upload-pdf",
    run: async () => storage.put({ bucket, path, body, contentType: "application/pdf" }),
    compensate: async ({ path }) => supabaseAdmin.storage.from(bucket).remove([path]),
  },
]);
```

This is **not** ACID across systems — it's the textbook saga pattern: best-effort eventual consistency with explicit compensations. Combine with idempotency keys (§ 9.3) so resumed sagas don't double-charge external APIs.

---

## 9.5 Configurable storage backend

`src/lib/storage.server.ts` is the single seam for object-storage I/O. `storage.put(...)` and `storage.signedUrl(...)` work against:

- `STORAGE_BACKEND=supabase` (default) — uses Supabase Storage via service role.
- `STORAGE_BACKEND=s3` — any S3-compatible service (AWS S3, Cloudflare R2, Backblaze B2, MinIO). Requires `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and optionally `S3_ENDPOINT` (for non-AWS).

Migration path: install `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`, set the four `S3_*` env vars, flip `STORAGE_BACKEND=s3` — no code changes. The AWS SDK is lazily imported only when this backend is active so the default Worker bundle stays small.

To migrate existing files: `aws s3 sync` (or rclone) from the Supabase bucket to the new bucket; the layout (`<user_id>/<request_id>.pdf`) is identical.

---

## 9.6 Portability test harness

Run `bun run portability:check` (or `bun scripts/portability-check.ts`) on any host to verify every external seam in under 10 seconds. It checks:

1. Required env vars are present
2. Supabase REST + Auth are reachable
3. AI gateway accepts a chat-completion call (honours `AI_GATEWAY_URL` override)
4. Tavily API key works (skipped if unset)
5. Storage backend put + signed URL roundtrip (honours `STORAGE_BACKEND`)
6. Canonical site URL responds

Exit code is non-zero on the first failure. Run this on the new host **before** flipping DNS — every failure maps to a specific bullet in the migration checklist (§ 12).

## 10. Optional: Lovable-injected UI

Lovable's deployment pipeline injects two things that disappear automatically off-platform:

- The **"Edit with Lovable"** badge (HTML injection at edge).
- The `componentTagger` dev plugin (only runs inside Lovable's sandbox).

`src/components/ErrorReporter.tsx` and `GlobalErrorListener.tsx` write to your own `error_reports` table — they keep working anywhere.

---

## 11. Local development checklist

```bash
git clone <repo>
cd <repo>
cp .env.example .env       # fill in Supabase values
bun install
bun dev                    # http://localhost:5173 (or whatever Vite reports)
```

To build & preview a production bundle:

```bash
bun run build
bun run preview
```

---

## 12. Migration checklist (mechanical, in order)

- [ ] Export Supabase schema + data including new tables (§ 4.6) (Pending new host database setup)
- [ ] Create new Supabase project, enable `pg_cron` + `pg_net`, import dump (§ 4.7) (Pending new host database setup)
- [ ] Recreate `personalized-roadmaps` storage bucket + RLS (§ 4.5) (Pending new host database setup)
- [ ] Re-wire `auth.users` triggers and the `pg_cron` craft job (§ 4.4) — point URL at the new host (Pending new host database setup)
- [ ] Enable Google OAuth in new Supabase (§ 5.2) (Pending new host database setup)
- [x] Edit `src/lib/platform.ts` → native Supabase OAuth (§ 5.2) (Codebase completed)
- [x] (Optional) Set `AI_GATEWAY_URL` + `AI_GATEWAY_API_KEY` to leave Lovable AI Gateway (§ 9.1). Otherwise keep `LOVABLE_API_KEY`. (Codebase completed)
- [x] Set `TAVILY_API_KEY` (free tier at tavily.com) for personalized roadmap research (Codebase completed)
- [x] Replace `vite.config.ts` (§ 6.1) and update deps (§ 6.2) (Codebase completed)
- [x] Pick host & Nitro preset (§ 7) (Codebase completed)
- [x] Set env vars on host (§ 3) (Codebase completed)
- [ ] Deploy, smoke-test: sign-in, free roadmap flow, lead form, personalized request end-to-end (queued → ready → PDF/DOCX download) (Pending new host deploy)
- [x] Update DNS, set `VITE_SITE_URL`, update `public/robots.txt` (Codebase completed)
- [x] Delete `src/integrations/lovable/`, `.lovable/`, `MIGRATION.md` (superseded), `supabase/config.toml` (if not using Supabase CLI) (Codebase completed)
- [x] Remove `@lovable.dev/*` from `package.json` (Codebase completed)

Estimated effort end-to-end: **3–5 focused hours**, mostly waiting on DNS, pg_dump, and storage export.

---

## 13. Quick reference — what to touch for what

| You want to…                         | Edit                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| Change canonical URL                 | `VITE_SITE_URL` env var                                                         |
| Disable / change GA                  | `VITE_GA_MEASUREMENT_ID` env var                                                |
| Swap OAuth provider                  | `src/lib/platform.ts`                                                           |
| Swap AI provider                     | `AI_GATEWAY_URL` + `AI_GATEWAY_API_KEY` env vars (§ 9.1)                        |
| Swap object storage (S3/R2/etc.)     | `STORAGE_BACKEND=s3` + `S3_*` env vars (§ 9.5)                                  |
| Dedupe a server fn or webhook        | Wrap with `withIdempotency()` (§ 9.3)                                           |
| Coordinate multi-system work         | Wrap with `runSaga()` (§ 9.4)                                                   |
| Verify a new host before DNS cutover | `bun run portability:check` (§ 9.6)                                             |
| Swap web-research provider           | `src/lib/personalized-roadmap-research.server.ts`                               |
| Add a new page                       | New file in `src/routes/`                                                       |
| Add a server endpoint                | New `*.functions.ts` in `src/lib/`                                              |
| Add a webhook                        | New file in `src/routes/api/public/`                                            |
| Add DB table                         | `supabase` migration (CREATE → GRANT → RLS → POLICY)                            |
| Change host                          | `vite.config.ts` nitro preset + redeploy                                        |
| Move the craft worker off pg_cron    | Repoint any scheduler at `/api/public/hooks/craft-personalized-roadmap` (§ 9.2) |
| Add an env-driven config             | Read in `platform.ts` (browser) or inside a `.handler()` (server)               |

---

_Maintained as the single migration reference. If you edit this file, also delete the legacy `MIGRATION.md` so there is no drift._
