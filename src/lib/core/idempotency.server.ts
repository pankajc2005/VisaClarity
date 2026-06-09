// Idempotency helper. Wrap any non-idempotent server operation so that
// retries with the same key return the original result instead of
// re-executing. Backed by `public.idempotency_keys` (service role only).
//
// Portability: this is just a Postgres table + service-role writes.
// Works on any Postgres host without code changes.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type IdempotencyOptions = {
  /** Caller-supplied key. Required. Typically a UUID from the client. */
  key: string;
  /** Logical scope, e.g. "personalized_roadmap.create". Required. */
  scope: string;
  /** Owning user id when applicable (helps debugging + cleanup). */
  userId?: string;
  /** Optional hash of inputs to detect mismatched reuse. */
  requestHash?: string;
};

export class IdempotencyConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdempotencyConflictError";
  }
}

/**
 * Run `fn` exactly once per (key, scope). Subsequent calls with the same key
 * return the cached response. In-flight duplicates throw
 * IdempotencyConflictError so the caller can return 409.
 */
export async function withIdempotency<T>(
  opts: IdempotencyOptions,
  fn: () => Promise<T>,
): Promise<T> {
  const { key, scope, userId, requestHash } = opts;
  if (!key) throw new Error("withIdempotency: key is required");

  // 1. Try to reserve the key. INSERT ... ON CONFLICT DO NOTHING via upsert.
  const { data: existing } = await supabaseAdmin
    .from("idempotency_keys")
    .select("status, response, request_hash")
    .eq("key", key)
    .eq("scope", scope)
    .maybeSingle();

  if (existing) {
    if (requestHash && existing.request_hash && existing.request_hash !== requestHash) {
      throw new IdempotencyConflictError("Idempotency key reused with a different request body.");
    }
    if (existing.status === "completed") {
      return existing.response as T;
    }
    // in_progress: another worker is doing it.
    throw new IdempotencyConflictError("Request with this key is still in progress.");
  }

  const { error: insertErr } = await supabaseAdmin
    .from("idempotency_keys")
    .insert({ key, scope, user_id: userId, request_hash: requestHash });
  if (insertErr) {
    // Lost the race → treat as conflict.
    throw new IdempotencyConflictError(insertErr.message);
  }

  try {
    const result = await fn();
    await supabaseAdmin
      .from("idempotency_keys")
      .update({ status: "completed", response: result as never })
      .eq("key", key);
    return result;
  } catch (err) {
    // Release the slot so the next retry can proceed.
    await supabaseAdmin.from("idempotency_keys").delete().eq("key", key);
    throw err;
  }
}
