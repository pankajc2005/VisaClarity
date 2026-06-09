# VisaClarity Architecture Documentation

This document describes the project architecture, folder structure, coding/naming conventions, development guidelines, and deployment details for VisaClarity.

---

## 1. Project Reorganization Summary

To achieve production-grade quality, scalability, and clean modular boundaries, the VisaClarity codebase is structured into distinct, decoupled domains:

```
Visa Clarity/
├── documentation/            # General docs, migration guidelines, and roadmaps
├── public/                   # Static browser assets (favicons, crawler files)
├── scripts/                  # Development scripts and portability checks
├── src/
│   ├── components/
│   │   ├── common/           # Shared UI blocks (theme toggles, custom cursor, reveal animations)
│   │   ├── error/            # Global error boundaries and reporters
│   │   ├── auth/             # Authentication components (UserNav)
│   │   ├── admin/            # Administrative pages and blog queue management components
│   │   ├── personalized/     # Custom roadmap questionnaire components
│   │   ├── landing/          # Landing page custom illustrations, forms, etc.
│   │   ├── roadmap/          # Core roadmap sections and print controllers
│   │   └── ui/               # Base visual atoms (radix-based buttons, dialogs, dropdowns)
│   ├── hooks/                # Global react hooks (useAuth, useSubscription, etc.)
│   ├── integrations/
│   │   └── supabase/         # Client initialization, type definitions, and middleware
│   ├── lib/
│   │   ├── core/             # Configuration, platform variables, and cross-cutting systems (saga, idempotency)
│   │   ├── services/         # Third-party integrations (ai-gateway, storage, exchange-rate)
│   │   ├── blog/             # Blog content generation and curation domain
│   │   ├── roadmap/          # Visa roadmap extraction and personalization domain
│   │   ├── subscription/     # Entitlements and licensing verification domain
│   │   └── admin/            # Administrative services
│   ├── routes/               # File-based routes for pages (index, pricing, dashboard, auth)
│   ├── router.tsx            # Route tree composition and initialization
│   ├── start.ts              # Entry point for browser runtime
│   ├── server.ts             # Entry point for serverless/edge SSR runtime
│   └── styles.css            # Tailwind custom global layout and design styles
```

---

## 2. Naming Conventions

All files, directories, variables, and components must adhere to the following naming conventions to preserve codebase consistency:

- **Directories**: Always use lowercase, dash-separated naming (e.g., `src/components/personalized/`, `src/lib/services/`).
- **React Components**: Always use PascalCase and end with `.tsx` (e.g., `QuickPasteBox.tsx`, `ConfirmDialog.tsx`).
- **Utility Modules**: Always use lowercase, dot-separated naming (e.g., `storage.server.ts`, `blog.functions.ts`).
  - `.server.ts` suffix represents files that execute _strictly on the server side_ and contains server-only packages/dependencies. Vite is instructed to exclude these from client bundles.
  - `.functions.ts` suffix is used for files that export `@tanstack/react-start` server functions (`createServerFn`) which can be safely imported by client components to fetch server-side data.
- **Types / Interfaces**: Use PascalCase (e.g., `BlogPost`, `ResearchBundle`).
- **Constants / Env Variables**: Use SCREAMING_SNAKE_CASE (e.g., `SITE_URL`, `EXCHANGERATE_API_KEY`).

---

## 3. Production Architecture & Best Practices

### Authentication & Authorization

All authenticated routes and APIs are guarded by the `requireSupabaseAuth` middleware. Administrative tasks check the user's role in Supabase through a secure `rpc` call helper `assertAdmin` and enforce role boundaries.

### API & Data Fetching Layer

Data fetching and mutations are handled using `@tanstack/react-query` coupled with `@tanstack/react-start` Server Functions (`createServerFn`). Server functions wrap database queries or LLM processes securely, isolating secrets from the browser and supporting Server-Side Rendering (SSR).

### Error Handling & Resiliency

1. **Route Level Boundaries**: `src/routes/__root.tsx` defines a global `ErrorComponent` utilizing `ErrorReporter` to track and report errors during page transitions.
2. **Pessimistic Concurrency**: External requests (e.g., exchange rate fetches) are locked in the database using PostgreSQL row updates to avoid race conditions.
3. **Graceful Fallbacks**: If external APIs fail, hardcoded local fallbacks (e.g., `LOCAL_FALLBACK_RATES`) ensure the application remains functional.

---

## 4. Development Guidelines

- **Adding a new route**: Create a file in `src/routes/` matching the route hierarchy (e.g., `src/routes/about.tsx` for `/about`).
- **Adding server-only code**: Ensure the file ends with `.server.ts` to prevent it from leaking into client-side JS bundles.
- **Modifying database calls**: If writing queries, verify the correct types are being used from `src/integrations/supabase/types.ts`.

---

## 5. Environment Variables & Deployment Requirements

Ensure the following environment variables are configured in production:

| Name                            | Type           | Description                                                    |
| ------------------------------- | -------------- | -------------------------------------------------------------- |
| `VITE_SITE_URL`                 | Public URL     | Canonical URL of the application.                              |
| `VITE_SUPABASE_URL`             | Public URL     | URL of the Supabase API.                                       |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public Key     | Public credentials to initialize the Supabase client.          |
| `SUPABASE_SERVICE_ROLE_KEY`     | Private Secret | Key used on the server to bypass RLS for administrative tasks. |
| `EXCHANGERATE_API_KEY`          | Private Secret | Key used to fetch currency rates.                              |
| `AI_GATEWAY_API_KEY`            | Private Secret | Key used to communicate with the LLM API.                      |
| `AI_GATEWAY_URL`                | Private URL    | Gateway Endpoint for AI services.                              |

_To verify all secrets are bound correctly before a release, execute:_

```bash
bun run portability:check
```
