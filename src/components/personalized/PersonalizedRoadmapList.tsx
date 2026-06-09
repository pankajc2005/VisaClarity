import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Crown,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  FileDown,
  FileText,
  Sparkles,
} from "lucide-react";
import {
  listPersonalizedRoadmapRequests,
  cancelPersonalizedRoadmapRequest,
  getPersonalizedRoadmapDownloads,
} from "@/lib/roadmap/personalized-roadmap.functions";
import { PersonalizedRoadmapForm } from "./PersonalizedRoadmapForm";

type Status = "queued" | "in_progress" | "crafting" | "ready" | "failed" | "cancelled";

function StatusPill({ status }: { status: string }) {
  const map: Record<Status, { label: string; cls: string; Icon: typeof Clock }> = {
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
    crafting: {
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
  const cfg = map[status as Status] ?? map.queued;
  const { Icon } = cfg;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] border ${cfg.cls}`}
    >
      <Icon
        className={`size-3 ${status === "in_progress" || status === "crafting" ? "animate-spin" : ""}`}
      />
      {cfg.label}
    </span>
  );
}

function CraftingProgress({
  status,
  createdAt,
  startedAt,
  etaMinutes,
}: {
  status: string;
  createdAt: string;
  startedAt: string | null;
  etaMinutes: number;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const startTime = new Date(startedAt || createdAt).getTime();
  const elapsed = Math.max(0, Math.floor((now - startTime) / 1000));
  const total = etaMinutes * 60;
  const remaining = Math.max(0, total - elapsed);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct =
    status === "queued"
      ? Math.min(18, Math.floor((elapsed / total) * 18))
      : Math.min(99, Math.floor((elapsed / total) * 100));
  const label =
    status === "queued"
      ? "Queued — research worker will start shortly"
      : remaining > 0
        ? `Crafting — about ${mins}m ${secs.toString().padStart(2, "0")}s left`
        : "Finalizing your PDF + DOCX…";
  return (
    <div className="mt-3 w-full max-w-sm">
      <div className="flex items-center justify-between gap-3 mb-1">
        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <p className="text-[10px] font-mono text-muted-foreground">{pct}%</p>
      </div>
      <div className="h-1.5 bg-border overflow-hidden">
        <div className="h-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">
        If it takes longer, we’ll still notify you on your registered email and dashboard.
      </p>
    </div>
  );
}

function DownloadButtons({ id }: { id: string }) {
  const getUrls = useServerFn(getPersonalizedRoadmapDownloads);
  const [loading, setLoading] = useState<"pdf" | "docx" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function download(kind: "pdf" | "docx") {
    setErr(null);
    setLoading(kind);
    try {
      const urls = await getUrls({ data: { id } });
      const url = kind === "pdf" ? urls.pdfUrl : urls.docxUrl;
      if (!url) throw new Error("File not available yet");
      window.open(url, "_blank", "noopener");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => download("pdf")}
          disabled={loading !== null}
          className="inline-flex items-center gap-1.5 h-9 px-3 border border-cream/40 text-cream text-[12px] hover:bg-cream/5 disabled:opacity-60"
        >
          {loading === "pdf" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <FileDown className="size-3.5" />
          )}
          PDF
        </button>
        <button
          type="button"
          onClick={() => download("docx")}
          disabled={loading !== null}
          className="inline-flex items-center gap-1.5 h-9 px-3 border border-cream/40 text-cream text-[12px] hover:bg-cream/5 disabled:opacity-60"
        >
          {loading === "docx" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <FileText className="size-3.5" />
          )}
          DOCX
        </button>
      </div>
      {err && <p className="text-[11px] text-destructive">{err}</p>}
    </div>
  );
}

export function PersonalizedRoadmapList() {
  const qc = useQueryClient();
  const list = useServerFn(listPersonalizedRoadmapRequests);
  const cancel = useServerFn(cancelPersonalizedRoadmapRequest);
  const [open, setOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["personalized-roadmaps"],
    queryFn: () => list(),
    // Poll every 20s if any row is still being crafted
    refetchInterval: (q) => {
      const reqs = q.state.data?.requests ?? [];
      return reqs.some(
        (r) => r.status === "queued" || r.status === "in_progress" || r.status === "crafting",
      )
        ? 5_000
        : false;
    },
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => cancel({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personalized-roadmaps"] }),
  });

  return (
    <section className="mt-16">
      <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-500 mb-2 inline-flex items-center gap-1.5">
            <Crown className="size-3" /> Pro · AI-crafted in 10–15 min
          </p>
          <h2 className="text-2xl md:text-3xl font-medium tracking-tight">Personalized roadmaps</h2>
          <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">
            Submit your case once. We research it (visa, e-visa, blocked account, insurance, hotel
            proof, currency-accurate amounts) and deliver a personalized PDF + DOCX to your
            dashboard and email — usually in 10–15 minutes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 h-10 px-4 bg-foreground text-background text-[13px] font-medium hover:opacity-90"
        >
          <Sparkles className="size-4" /> New personalized roadmap
        </button>
      </div>

      {isLoading ? (
        <div className="h-24 border border-border bg-card/40 animate-pulse" />
      ) : error ? (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      ) : !data?.requests.length ? (
        <div className="border border-border bg-card/40 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No personalized roadmaps yet. Submit one above — you can keep using the instant AI
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
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-medium text-[14px]">
                    {r.title ?? `${r.nationality} → ${r.destination} · ${r.purpose}`}
                  </p>
                  <StatusPill status={r.status} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Submitted {new Date(r.created_at).toLocaleString()} · Notify {r.notify_email}
                </p>
                {(r.status === "queued" ||
                  r.status === "in_progress" ||
                  r.status === "crafting") && (
                  <CraftingProgress
                    status={r.status}
                    createdAt={r.created_at}
                    startedAt={r.started_at}
                    etaMinutes={r.eta_minutes}
                  />
                )}
                {r.status === "ready" && r.ready_at && (
                  <p className="text-[11px] text-emerald-600 mt-1">
                    Ready {new Date(r.ready_at).toLocaleString()}
                  </p>
                )}
                {r.status === "failed" && r.error_message && (
                  <p className="text-[11px] text-destructive mt-1 max-w-md">{r.error_message}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {r.status === "ready" ? (
                  <DownloadButtons id={r.id} />
                ) : r.status === "queued" || r.status === "failed" || r.status === "cancelled" ? (
                  <button
                    type="button"
                    onClick={() => cancelMut.mutate(r.id)}
                    disabled={cancelMut.isPending}
                    className="text-[12px] text-muted-foreground hover:text-destructive"
                  >
                    {cancelMut.isPending ? "…" : "Remove"}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <PersonalizedRoadmapForm open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
