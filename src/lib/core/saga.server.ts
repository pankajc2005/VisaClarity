// Saga / outbox helper for distributed transactions.
//
// Why: the personalized-roadmap craft loop touches three systems in one
// logical unit — Postgres (request row), an external AI provider, and
// object storage. A plain DB transaction can't span all three. We model it
// as a saga: each step is recorded in `public.saga_steps`, and on failure
// we run the compensations of completed steps in reverse order.
//
// Portability: pure Postgres + your own compensations. No vendor lock-in.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type SagaStep<T = unknown> = {
  name: string;
  /** Forward action. Return value is logged for debugging. */
  run: () => Promise<T>;
  /** Undo. Called only if a later step fails. Must be idempotent. */
  compensate?: (result: T) => Promise<void>;
};

export class SagaFailure extends Error {
  constructor(
    public readonly stepName: string,
    public readonly cause: unknown,
  ) {
    super(`Saga step "${stepName}" failed: ${(cause as Error)?.message ?? cause}`);
    this.name = "SagaFailure";
  }
}

async function logStep(
  sagaId: string,
  name: string,
  status: "completed" | "failed" | "compensated",
  extra: { payload?: unknown; error?: string } = {},
): Promise<void> {
  await supabaseAdmin.from("saga_steps").upsert(
    {
      saga_id: sagaId,
      step_name: name,
      status,
      payload: (extra.payload ?? null) as never,
      error_message: extra.error ?? null,
    },
    { onConflict: "saga_id,step_name" },
  );
}

/**
 * Run steps in order. If any step throws, walk back and call `compensate`
 * on every completed step (newest first), then rethrow as SagaFailure.
 * All transitions are persisted to `saga_steps` so a crashed worker can
 * resume or be audited.
 */
export async function runSaga(sagaId: string, steps: SagaStep[]): Promise<void> {
  const completed: Array<{ step: SagaStep; result: unknown }> = [];

  for (const step of steps) {
    try {
      const result = await step.run();
      completed.push({ step, result });
      await logStep(sagaId, step.name, "completed", { payload: result });
    } catch (err) {
      await logStep(sagaId, step.name, "failed", {
        error: (err as Error).message?.slice(0, 500),
      });
      // Compensate in reverse.
      for (const c of [...completed].reverse()) {
        if (!c.step.compensate) continue;
        try {
          await c.step.compensate(c.result);
          await logStep(sagaId, c.step.name, "compensated");
        } catch (compErr) {
          console.error(`[saga ${sagaId}] compensation failed for ${c.step.name}:`, compErr);
        }
      }
      throw new SagaFailure(step.name, err);
    }
  }
}
