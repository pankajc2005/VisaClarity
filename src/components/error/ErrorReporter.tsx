import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  error?: Error | unknown;
  context?: Record<string, unknown>;
}

export function ErrorReporter({ error, context }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit() {
    setStatus("sending");
    const err = error as { message?: string; stack?: string } | undefined;
    const payload = {
      message: err?.message ?? "Unknown error",
      stack: err?.stack ?? null,
      url: typeof window !== "undefined" ? window.location.href : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      user_email: email.trim() || null,
      user_note: note.trim() || null,
      context: context ?? null,
    };
    const { error: insertError } = await supabase.from("error_reports").insert(payload as never);
    if (insertError) {
      console.error("Report failed:", insertError);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <p className="text-sm text-muted-foreground">
        Thanks — your report has been sent. We'll look into it.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        Report this problem
      </button>
    );
  }

  return (
    <div className="mt-4 w-full max-w-md text-left">
      <label className="block text-xs text-muted-foreground mb-1">Email (optional)</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="mb-3 w-full h-10 px-3 text-sm bg-card border border-border-strong rounded-md focus:outline-none focus:border-foreground/40"
      />
      <label className="block text-xs text-muted-foreground mb-1">What were you doing?</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="A short description helps us fix it faster."
        className="mb-3 w-full px-3 py-2 text-sm bg-card border border-border-strong rounded-md focus:outline-none focus:border-foreground/40 resize-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={status === "sending"}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Send report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Cancel
        </button>
      </div>
      {status === "error" && (
        <p className="mt-2 text-xs text-destructive">Couldn't send the report. Please try again.</p>
      )}
    </div>
  );
}
