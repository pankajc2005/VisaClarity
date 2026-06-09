// Smoke test runner for BlogAgent generatePost
// Usage: run with npx: `npx tsx scripts/smoke.ts`

async function run() {
  console.log("Starting BlogAgent smoke test in Visa Clarity");
  try {
    const mod = await import("../src/lib/blog/generate-post.server.ts");
    const gen = mod.generatePost || mod.default?.generatePost;
    if (!gen) {
      console.error("generatePost not found in module");
      process.exit(2);
    }

    const input = {
      topic: "student visa USA",
      primary_keyword: "student visa USA",
    };

    const res = await gen(input, { queueId: "smoke-run" });
    console.log("Result:", JSON.stringify(res, null, 2));
  } catch (e: any) {
    console.error("Smoke test failed:", e && e.stack ? e.stack : String(e));
    process.exit(1);
  }
}

run();
