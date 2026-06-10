# AGENTS.md — Developer Onboarding for AI Tools & Google Jules

> **Read this file first.** Any AI coding tool (Google Jules, Cursor, Claude Code, Copilot, etc.) working on VisaClarity must read this top-to-bottom before touching code. It encodes the conventions, traps, and non-negotiables of this codebase. Following it ensures you don't break the build, the brand, or the trust contract with users.

---

## 1. Project One-Liner

**VisaClarity** = AI-crafted, personalized visa roadmaps for students, workers, and travelers.
Positioning: _"The trust layer for your visa journey — truthful, personalized, in plain English."_
Status: **Free public beta.** No paywalls exposed in UI (see `LAUNCH.md`).

---

## 2. Tech Stack (Locked — Do Not Swap)

| Layer        | Choice                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------- |
| Framework    | TanStack Start v1 (file-based routing, SSR, server functions)                                 |
| Build        | Vite 7                                                                                        |
| UI           | React 19 + TypeScript strict                                                                  |
| Styling      | Tailwind v4 via `src/styles.css` (no `tailwind.config.js`)                                    |
| Components   | shadcn/ui in `src/components/ui/*`                                                            |
| Backend      | Lovable Cloud (Supabase under the hood — never say "Supabase" to users)                       |
| Server logic | `createServerFn` from `@tanstack/react-start` — **NOT** Supabase Edge Functions               |
| Auth         | Supabase Auth (email + Google), middleware-based                                              |
| AI           | Lovable AI Gateway via `src/lib/services/ai-gateway.server.ts` (single seam, env-overridable) |
| Research     | Tavily (`TAVILY_API_KEY`) — 1k free searches/month                                            |
| Runtime      | Cloudflare Workers (`workerd`) — **Node-only packages WILL fail**                             |
| Analytics    | GA4 (already wired)                                                                           |

---

## 3. Repository Map (Updated Restructured Layout)

```
src/routes/                       file-based routes (NEVER use src/pages/)
  __root.tsx                      root layout — must keep <Outlet/>
  _authenticated.tsx              auth-gate pathless layout
  _authenticated/*                pages requiring login (protected loaders safe here)
  api/public/*                    webhooks / cron-callable endpoints (no auth, verify signatures)
  index.tsx                       landing page
  roadmap.tsx                     AI roadmap generator
  r.$slug.tsx                     public shareable roadmap
  blog.$slug.tsx, blog.index.tsx  SEO content
  pricing.tsx                     repurposed as "Free during beta" during v1

src/lib/
  core/
    config.server.ts              config/env variables resolver
    utils.ts                      common helpers (e.g. cn class merger)
    platform.ts                   feature flags — gate unfinished features here
    saga.server.ts                multi-step idempotent workflows
    idempotency.server.ts         dedupe queued jobs
  services/
    ai-gateway.server.ts          single AI call seam — all chat completions go here
    storage.server.ts             upload / storage helpers
    exchange-rate.server.ts       rates calculator & caching
  admin/
    admin.functions.ts            founder-only admin server functions
    admin.server.ts               admin helpers
  blog/
    blog.functions.ts             public reads + admin CRUD server functions
    posts.ts                      legacy blog posts data
  roadmap/
    roadmap.functions.ts          free roadmap generator (rate-limited)
    saved-roadmaps.functions.ts   CRUD for user-saved roadmaps
  subscription/
    subscription.functions.ts     subscription tier retrieval
    entitlements.server.ts        tier checks (free/pro/promax)

src/components/                   reusable UI
  admin/                          administration widgets
  auth/                           authentication controls
  common/                         cross-cutting components (ThemeToggle, SmoothScroll, etc.)
  error/                          Error boundaries & reporters
  landing/                        hero, forms, and landing components
  personalized/                   questionnaire forms & lists
  roadmap/                        actions and sections for roadmaps
  ui/                             shadcn primitives (DO NOT edit shape)
```

---

## 4. Files You MUST NEVER Edit

These are auto-generated or managed by the platform. Editing them silently breaks future regenerations.

- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/client.server.ts`
- `src/integrations/supabase/auth-middleware.ts`
- `src/integrations/supabase/auth-attacher.ts`
- `src/integrations/supabase/types.ts`
- `src/routeTree.gen.ts` (regenerated by router plugin on every build)
- `.env` and `.env.example` (managed by Cloud integration)

---

## 5. Hard Rules — The Top 10 Mistakes Agents Make

### 5.1 Server logic = `createServerFn`, not edge functions

- File goes in `src/lib/[domain]/[feature].functions.ts` (client-safe path).
- Read `process.env.*` **only inside `.handler()`** — never at module scope.
- Use `.inputValidator()` with Zod before `.handler()`.
- Server-only helpers live in `*.server.ts` siblings.

### 5.2 Use `requireSupabaseAuth` for user data

- Any fn that reads/writes user rows MUST have `.middleware([requireSupabaseAuth])`.
- Components call via `useServerFn` + `useQuery`.
- Loaders for protected fns are **only safe under `src/routes/_authenticated/*`** — anywhere else, SSR/prerender has no session and the build fails with `Unauthorized`.

### 5.3 No client import of `*.server.ts`

The template's import protection blocks `*.server.ts` from client bundles by filename. If you need shared logic, expose it via a `.functions.ts` wrapper.

### 5.4 Tables in `public` schema MUST have GRANT statements

PostgREST does NOT grant default privileges. RLS alone is not enough. Order inside every migration:

```sql
CREATE TABLE public.x (...);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.x TO authenticated;
GRANT ALL ON public.x TO service_role;
ALTER TABLE public.x ENABLE ROW LEVEL SECURITY;
CREATE POLICY ...;
```

### 5.5 User roles live in a separate table

Never store `role` on profiles/users. Use `public.user_roles` + `has_role(uuid, app_role)` security-definer function. Pattern is already in the DB.

### 5.6 Design tokens only — never hardcoded colors

No `text-white`, `bg-black`, `text-[#fff]` in components. Use semantic tokens defined in `src/styles.css` (`--background`, `--foreground`, `--primary`, etc.) in `oklch`. Add new tokens there before using them.

### 5.7 No Node-only packages

Workers runtime (`workerd`) does **NOT** support: `sharp`, `puppeteer`, `canvas`, `child_process`, `fs.watch`, native bindings, `node-gyp` packages. Find a Worker-compatible alternative or call an external HTTP API.

### 5.8 Route conventions

- Flat dot-separated naming: `blog.$slug.tsx`, NOT `blog/$slug.tsx`
- No trailing slashes in paths
- No `src/pages/` — TanStack uses `src/routes/`
- Every route with a loader needs `errorComponent` + `notFoundComponent`
- Root route needs `notFoundComponent`
- Parent layout routes MUST render `<Outlet />`

### 5.9 Import boundaries

- Router APIs (`createFileRoute`, `Link`, `useRouter`, `Outlet`): from `@tanstack/react-router`
- Server fn APIs (`createServerFn`, `useServerFn`): from `@tanstack/react-start`
- Never mix these. `createFileRoute` is NOT in `@tanstack/react-start`.

### 5.10 Free beta — no paywalls in UI

v1 ships 100% free. Pro / Pro Max code stays behind flags in `src/lib/core/platform.ts`. Do not surface `LockedFeature`, upgrade modals, or pricing tiers without explicit user approval.

### 5.11 UI Verification

For any user interface changes, you must always provide screenshots or a short video demonstrating the "before" and "after" states as part of your pull request or commit message summary. This ensures UI regressions are visibly checked.

---

## 6. AI Calls — The Only Pattern

All chat completions go through **one** seam:

```ts
import { chatCompletion } from "@/lib/services/ai-gateway.server";

const { choices } = await chatCompletion({
  model: "google/gemini-2.5-flash-lite",   // cheapest capable — default
  temperature: 0.25,
  max_tokens: 4096,
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userInput },
  ],
  response_format: { type: "json_schema", json_schema: { ... } },
});
```

Rules:

- Never call OpenAI/Google/Anthropic SDKs directly. The gateway is portable.
- Default model: `google/gemini-2.5-flash-lite`. Upgrade per task:
  - Heavy reasoning / multimodal → `google/gemini-2.5-pro`
  - Image generation → `google/gemini-2.5-flash-image`
- Always request structured output via `response_format` JSON schema when the result feeds UI.
- Never fabricate URLs in `sources[]` — only use URLs returned by the research agent (Tavily).

---

## 7. Trust Rules (Product-Level, Not Just Code)

VisaClarity is a **trust product**. Breaking these is worse than breaking the build.

- **Never** write copy claiming "guaranteed", "100% approval", "official partner", "we book your slot".
- Every corridor output must ship with a **"Last verified: <date>"** stamp.
- `sources[]` arrays must use URLs returned by Tavily verbatim — never fabricate, never guess.
- Empty / unverified corridors must not ship — hide them rather than show stale data.
- Disclaimers: link `/legal/disclaimer` from every roadmap output.

---

## 8. Verification Habits

- After code edits: run `bun run build` to verify compilation.
- After schema changes: confirm SQL GRANT blocks.
- After AI prompt changes: test one sample through the affected server function.
- After UI changes: verify mobile viewports (846px and narrower).

---

## 9. Google Jules Execution Guidelines

Google Jules must strictly adhere to the following guardrails when selecting and executing tasks:

- **Scope Restriction**: Only select, pick up, or resolve GitHub issues that contain the hashtag/prefix `#jules` in their issue title. Do not attempt to resolve or edit files for any other issues.

---

_Last updated: June 2026._
