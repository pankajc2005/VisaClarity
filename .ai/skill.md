# VisaClarity AI Agent Skill & Guidelines

Welcome! If you are an AI coding assistant (Cursor, Copilot, Windsurf, Lovable, Aider, etc.) working on **VisaClarity**, this folder and this specific `skill.md` file act as your primary system instructions.

**You must strictly follow these rules.** This is a trust-based product. Breaking these rules breaks the user's trust, the build, or the deployment.

---

## 1. Quick Context

- **Project:** VisaClarity (AI-crafted personalized visa roadmaps).
- **Stack:** TanStack Start, Vite, React 19, Tailwind CSS v4, Supabase Auth/DB, Lovable AI Gateway, Cloudflare Workers.
- **Deep Documentation:** You MUST read `d:\Visa Clarity\Documentions\AGENT.md` for the comprehensive set of rules and constraints before doing major feature work.
- **Production Rules:** Read `d:\Visa Clarity\Version\Production.md` for the git and deployment workflows.

---

## 2. Hard Code Rules (Non-Negotiable)

1. **Server vs Client Boundary:**
   - Server logic goes in `src/lib/<feature>.functions.ts` using `createServerFn`.
   - Pure server helpers go in `src/lib/<feature>.server.ts` (NEVER import these into client components).
   - Use `.middleware([requireSupabaseAuth])` for any function reading/writing user data.

2. **Cloudflare Workers Runtime Compatibility:**
   - **NO Node-only packages.** `workerd` does not support Node.js native modules (`fs`, `child_process`, `sharp`, `puppeteer`, etc.). If you add a package, verify it runs in Cloudflare Workers.

3. **Styling & UI:**
   - Use Shadcn components in `src/components/ui/`. DO NOT alter their shape.
   - Use semantic design tokens (`--background`, `--primary`, etc.) from `src/styles.css` defined in `oklch`. Do NOT hardcode colors like `text-white` or `bg-[#000]`.

4. **Database (Supabase):**
   - **Never edit auto-generated files** in `src/integrations/supabase/`.
   - When creating tables in migrations, you MUST include:
     ```sql
     GRANT SELECT, INSERT, UPDATE, DELETE ON public.x TO authenticated;
     GRANT ALL ON public.x TO service_role;
     ALTER TABLE public.x ENABLE ROW LEVEL SECURITY;
     CREATE POLICY ...;
     ```
   - RLS is mandatory for all new tables.

5. **AI Gateway:**
   - ALL AI chat completions MUST route through `src/lib/ai-gateway.server.ts`. Do not call OpenAI, Google, or Anthropic directly.
   - Default to `google/gemini-2.5-flash-lite` for standard tasks to save costs, unless reasoning is needed (then use `pro`).

---

## 3. Product & Brand Constraints

- **This is a Trust Product:** NEVER generate marketing copy that says "100% approval", "Guaranteed", "We book your slot", or "Official Partner".
- **Verified Sources Only:** URLs returned by the AI or placed in `sources[]` arrays must be actual URLs sourced via Tavily research. Do not fabricate or guess government URLs.
- **Beta / Free Access:** During v1, there are no paywalls exposed in the UI. Keep Pro/Pro Max features behind feature flags in `src/lib/platform.ts`.

---

## 4. Required Agent Verification Workflow

Before you complete your task or commit code, perform this self-check:

- [ ] Have I avoided importing `.server.ts` files into client React components?
- [ ] Have I ensured my database migration contains `GRANT` and RLS `CREATE POLICY` statements?
- [ ] Are all my new styles using semantic tokens from `src/styles.css` instead of hardcoded hex values?
- [ ] Did I avoid adding any Node.js native dependencies?
- [ ] Have I read the existing file content before modifying it to preserve unrelated logic?

If you are unsure about any decision, **STOP AND ASK THE USER**. Do not guess when working on VisaClarity.
