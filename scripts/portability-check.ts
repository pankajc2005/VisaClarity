#!/usr/bin/env bun
/**
 * Portability test harness.
 *
 * Run: `bun scripts/portability-check.ts`
 *
 * Verifies every external seam the app depends on so a migration can be
 * smoke-tested before flipping DNS. Exits non-zero on the first failure
 * with a human-readable explanation.
 *
 * Checks:
 *   1. Required env vars present
 *   2. Supabase Auth + DB reachable (REST ping)
 *   3. AI gateway reachable (chat completion echo)
 *   4. Tavily API key valid
 *   5. Storage backend reachable (put + signedUrl roundtrip)
 *   6. Site URL resolves
 */
import process from "node:process";

type Check = { name: string; run: () => Promise<string> };

const required = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const checks: Check[] = [
  {
    name: "Required env vars",
    run: async () => {
      const missing = required.filter((k) => !process.env[k]);
      if (missing.length) throw new Error(`Missing: ${missing.join(", ")}`);
      return `ok (${required.length} vars)`;
    },
  },
  {
    name: "Supabase REST reachable",
    run: async () => {
      const url = `${process.env.SUPABASE_URL}/rest/v1/`;
      const res = await fetch(url, {
        headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY! },
      });
      if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
      return `ok (${res.status})`;
    },
  },
  {
    name: "Supabase Auth reachable",
    run: async () => {
      const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return "ok";
    },
  },
  {
    name: "AI gateway chat completion",
    run: async () => {
      const url =
        process.env.AI_GATEWAY_URL ?? "https://ai.gateway.lovable.dev/v1/chat/completions";
      const key = process.env.AI_GATEWAY_API_KEY ?? process.env.LOVABLE_API_KEY;
      if (!key) throw new Error("No AI_GATEWAY_API_KEY or LOVABLE_API_KEY set");
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL ?? "google/gemini-2.5-flash-lite",
          messages: [{ role: "user", content: "Reply with the single word: ok" }],
          max_tokens: 5,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      return "ok";
    },
  },
  {
    name: "Tavily API key",
    run: async () => {
      const key = process.env.TAVILY_API_KEY;
      if (!key) return "skipped (TAVILY_API_KEY not set)";
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: key, query: "ping", max_results: 1 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return "ok";
    },
  },
  {
    name: "Storage backend roundtrip",
    run: async () => {
      const { storage } = await import("../src/lib/services/storage.server");
      const bucket = process.env.PORTABILITY_TEST_BUCKET ?? "personalized-roadmaps";
      const path = `_portability/${Date.now()}.txt`;
      await storage.put({
        bucket,
        path,
        body: new TextEncoder().encode("portability-check"),
        contentType: "text/plain",
      });
      const url = await storage.signedUrl(bucket, path, 60);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`download HTTP ${res.status}`);
      return `ok (backend=${process.env.STORAGE_BACKEND ?? "supabase"})`;
    },
  },
  {
    name: "Site URL resolves",
    run: async () => {
      const site = process.env.VITE_SITE_URL ?? "https://visaclarity.lovable.app";
      try {
        const res = await fetch(site, { method: "HEAD" });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${site}`);
        return `ok (${site})`;
      } catch (err: any) {
        if (
          err.message?.includes("Unable to connect") ||
          err.message?.includes("fetch failed") ||
          err.message?.includes("ENOTFOUND")
        ) {
          return `warning (site is unreachable: ${err.message}. This is expected if DNS is not yet pointed to the host)`;
        }
        throw err;
      }
    },
  },
];

let failed = 0;
for (const c of checks) {
  process.stdout.write(`• ${c.name} ... `);
  try {
    const detail = await c.run();
    console.log(`PASS — ${detail}`);
  } catch (err) {
    failed++;
    console.log(`FAIL — ${(err as Error).message}`);
  }
}

console.log("");
console.log(failed === 0 ? "✅ All portability checks passed." : `❌ ${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
