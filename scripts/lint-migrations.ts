#!/usr/bin/env bun
/**
 * Database Migration Security Linter
 *
 * Verifies that all newly created public tables in migrations have:
 * 1. Row Level Security (RLS) enabled
 * 2. Explicit GRANT statements defined for authenticated/service_role roles
 *
 * Enforces security guidelines defined in AGENTS.md.
 * Run with: `bun scripts/lint-migrations.ts`
 */
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const migrationsDir = join(process.cwd(), "supabase", "migrations");
let failed = false;

try {
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));

  if (files.length === 0) {
    console.log("ℹ️ No migration files found in supabase/migrations.");
    process.exit(0);
  }

  for (const file of files) {
    const content = readFileSync(join(migrationsDir, file), "utf-8");

    // Find all table names in CREATE TABLE statements in the migration
    const createTableRegex =
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_\-]+)/gi;
    let match;
    const tables: string[] = [];

    while ((match = createTableRegex.exec(content)) !== null) {
      tables.push(match[1]);
    }

    for (const table of tables) {
      // Look for ALTER TABLE public.table ENABLE ROW LEVEL SECURITY or ALTER TABLE table ENABLE ROW LEVEL SECURITY
      const rlsRegex = new RegExp(
        `ALTER\\s+TABLE\\s+(?:public\\.)?${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
        "i",
      );
      const rlsOk = rlsRegex.test(content);

      // Look for GRANT ... ON public.table TO or GRANT ... ON table TO
      const grantRegex = new RegExp(`GRANT\\s+.*\\s+ON\\s+(?:public\\.)?${table}\\s+TO`, "i");
      const grantOk = grantRegex.test(content);

      if (!rlsOk || !grantOk) {
        console.error(
          `\x1b[31m❌ DB Security Check Failed in [supabase/migrations/${file}]:\x1b[0m`,
        );
        console.error(`   Table: "\x1b[33m${table}\x1b[0m"`);
        if (!rlsOk) {
          console.error(`   - Missing: ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
        }
        if (!grantOk) {
          console.error(
            `   - Missing: GRANT SELECT, INSERT, UPDATE, DELETE ON public.${table} TO authenticated;`,
          );
        }
        failed = true;
      }
    }
  }
} catch (err) {
  console.error("Failed to run migration security linter:", err);
  process.exit(1);
}

if (failed) {
  console.error(
    "\n\x1b[31m❌ Database migration security checks failed. Please add RLS and GRANT statements.\x1b[0m",
  );
  process.exit(1);
} else {
  console.log("\x1b[32m✅ All database migrations passed RLS and GRANT security checks.\x1b[0m");
  process.exit(0);
}
