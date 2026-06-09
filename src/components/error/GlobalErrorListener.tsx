import { useEffect, useState } from "react";
import { ErrorReporter } from "./ErrorReporter";

/**
 * Listens to window 'error' and 'unhandledrejection' events.
 * When something blows up outside a React boundary, shows a small
 * dismissible card with a Report button — never shows the raw stack.
 */
export function GlobalErrorListener() {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const err =
        event.error instanceof Error ? event.error : new Error(event.message || "Unknown error");
      setError(err);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const err =
        reason instanceof Error
          ? reason
          : new Error(typeof reason === "string" ? reason : "Unhandled promise rejection");
      setError(err);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  if (!error) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm rounded-lg border border-border-strong bg-card p-4 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Something didn't work</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Help us fix it — send a quick report.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setError(null)}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>
      <div className="mt-3">
        <ErrorReporter error={error} context={{ source: "global-window-error" }} />
      </div>
    </div>
  );
}
