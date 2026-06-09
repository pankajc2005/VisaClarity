import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Crown,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  FileText,
  ListChecks,
} from "lucide-react";
import {
  listPersonalizedRequests,
  cancelPersonalizedRequest,
} from "@/lib/roadmap/personalized.functions";
import { PersonalizedRequestDialog } from "./PersonalizedRequestDialog";

type Kind = "roadmap" | "checklist_template";

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; Icon: typeof Clock }> = {
    queued: {
      label: "Queued",
      cls: "text-amber-500 border-amber-500/40 bg-amber-500/5",
      Icon: Clock,
    },
    in_progress: {
      label: "Crafting",
      cls: "text-sky-500 border-sky-500/40 bg-sky-500/5",
      Icon: Loader2,
    },
    ready: {
      label: "Ready",
      cls: "text-emerald-500 border-emerald-500/40 bg-emerald-500/5",
      Icon: CheckCircle2,
    },
    failed: {
      label: "Failed",
      cls: "text-destructive border-destructive/40 bg-destructive/5",
      Icon: XCircle,
    },
    cancelled: { label: "Cancelled", cls: "text-muted-foreground border-border", Icon: XCircle },
  };
  const cfg = map[status] ?? map.queued;
  const { Icon } = cfg;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] border ${cfg.cls}`}
    >
      <Icon className={`size-3 ${status === "in_progress" ? "animate-spin" : ""}`} />
      {cfg.label}
    </span>
  );
}

export function PersonalizedRequestsList() {
  const qc = useQueryClient();
  const list = useServerFn(listPersonalizedRequests);
  const cancel = useServerFn(cancelPersonalizedRequest);
  const [dialog, setDialog] = useState<Kind | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["personalized-requests"],
    queryFn: () => list(),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => cancel({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personalized-requests"] }),
  });

  return (
    <section className="mt-16">
      <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-500 mb-2 inline-flex items-center gap-1.5">
            <Crown className="size-3" /> Pro · Hand-crafted
          </p>
          <h2 className="text-2xl md:text-3xl font-medium tracking-tight">Personalized requests</h2>
          <p className="text-[13px] text-muted-foreground mt-1 max-w-xl">
            Request a consultant-grade roadmap or a tailored checklist + template for your exact
            case. Our team delivers it to your dashboard and email in 24–48 hours.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDialog("roadmap")}
            className="inline-flex items-center gap-2 h-10 px-4 bg-foreground text-background text-[13px] font-medium hover:opacity-90"
          >
            <Plus className="size-4" /> Personalized roadmap
          </button>
          <button
            type="button"
            onClick={() => setDialog("checklist_template")}
            className="inline-flex items-center gap-2 h-10 px-4 border border-border-strong text-[13px] hover:bg-cream/5"
          >
            <ListChecks className="size-4" /> Personalized checklist & template
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-24 border border-border bg-card/40 animate-pulse" />
      ) : error ? (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      ) : !data?.requests.length ? (
        <div className="border border-border bg-card/40 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No personalized requests yet. Submit one above — you can keep using the instant AI
            roadmap meanwhile.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.requests.map((r) => (
            <li
              key={r.id}
              className="border border-border bg-card/40 p-4 flex items-start justify-between gap-4 flex-wrap"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {r.kind === "roadmap" ? (
                    <FileText className="size-4 text-muted-foreground" />
                  ) : (
                    <ListChecks className="size-4 text-muted-foreground" />
                  )}
                  <p className="font-medium text-[14px]">
                    {r.kind === "roadmap" ? "Personalized roadmap" : "Checklist & template"}
                  </p>
                  <StatusPill status={r.status} />
                </div>
                <p className="text-[12px] text-muted-foreground">
                  {r.nationality} → {r.destination} · {r.purpose}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Submitted {new Date(r.created_at).toLocaleString()} · Notify {r.notify_email}
                </p>
                {r.notes && (
                  <p className="text-[12px] text-foreground/80 mt-2 max-w-2xl">"{r.notes}"</p>
                )}
              </div>
              {(r.status === "queued" || r.status === "failed") && (
                <button
                  type="button"
                  onClick={() => cancelMut.mutate(r.id)}
                  disabled={cancelMut.isPending}
                  className="text-[12px] text-muted-foreground hover:text-destructive"
                >
                  {cancelMut.isPending ? "…" : "Cancel"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <PersonalizedRequestDialog
        open={!!dialog}
        onClose={() => setDialog(null)}
        kind={dialog ?? "roadmap"}
      />
    </section>
  );
}
