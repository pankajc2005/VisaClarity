import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Bookmark,
  BookmarkCheck,
  FileDown,
  FileText,
  Lock,
  Loader2,
  Crown,
  Sparkles,
} from "lucide-react";
import type { Roadmap } from "@/lib/roadmap/roadmap.functions";
import { useSubscription } from "@/hooks/useSubscription";
import { saveRoadmap } from "@/lib/roadmap/saved-roadmaps.functions";
import { exportRoadmapPdf, exportRoadmapDocx } from "@/lib/roadmap/roadmap-export.functions";
import { PersonalizedRequestDialog } from "@/components/personalized/PersonalizedRequestDialog";
import { PersonalizedRoadmapForm } from "@/components/personalized/PersonalizedRoadmapForm";

type Props = {
  roadmap: Roadmap;
  nationality: string;
  destination: string;
  purpose: string;
};

function base64ToBlob(base64: string, contentType: string): Blob {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: contentType });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function RoadmapActions({ roadmap, nationality, destination, purpose }: Props) {
  const navigate = useNavigate();
  const { isPro, isProMax, isAuthenticated, loading } = useSubscription();
  const callSave = useServerFn(saveRoadmap);
  const callPdf = useServerFn(exportRoadmapPdf);
  const callDocx = useServerFn(exportRoadmapDocx);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [personalizedOpen, setPersonalizedOpen] = useState<"roadmap" | "checklist_template" | null>(
    null,
  );
  const [personalizedRoadmapOpen, setPersonalizedRoadmapOpen] = useState(false);

  const gated = !isPro; // requires pro or pro_max

  const upgrade = () => navigate({ to: "/pricing" });

  async function handleSave() {
    setErr(null);
    if (gated) return upgrade();
    setSaving(true);
    try {
      await callSave({
        data: {
          title: `${nationality} → ${destination} (${purpose})`,
          nationality,
          destination,
          purpose,
          roadmap,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleExport(kind: "pdf" | "docx") {
    setErr(null);
    if (gated) return upgrade();
    const setLoading = kind === "pdf" ? setPdfLoading : setDocxLoading;
    const call = kind === "pdf" ? callPdf : callDocx;
    setLoading(true);
    try {
      const res = await call({
        data: { roadmap, nationality, destination, purpose },
      });
      const blob = base64ToBlob(res.base64, res.contentType);
      triggerDownload(blob, res.filename);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 border border-border-strong bg-card p-4 no-print">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream">
            Roadmap tools
          </p>
          {!loading && isProMax && (
            <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.18em] text-amber-400">
              <Crown className="size-3" /> Pro Max · deep mode
            </span>
          )}
          {!loading && isPro && !isProMax && (
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-cream">
              · Pro · deep mode
            </span>
          )}
        </div>
        {gated && !loading && (
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            {isAuthenticated ? "Pro feature" : "Sign in & upgrade"}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <ActionBtn
          onClick={handleSave}
          gated={gated}
          loading={saving}
          icon={saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
          label={saved ? "Saved" : "Save roadmap"}
        />
        <ActionBtn
          onClick={() => handleExport("pdf")}
          gated={gated}
          loading={pdfLoading}
          icon={<FileDown className="size-4" />}
          label="Export PDF"
        />
        <ActionBtn
          onClick={() => handleExport("docx")}
          gated={gated}
          loading={docxLoading}
          icon={<FileText className="size-4" />}
          label="Export DOCX"
        />
        <ActionBtn
          onClick={() => (gated ? upgrade() : setPersonalizedRoadmapOpen(true))}
          gated={gated}
          loading={false}
          icon={<Sparkles className="size-4" />}
          label="Personalized roadmap (10–15 min)"
        />
        <ActionBtn
          onClick={() => (gated ? upgrade() : setPersonalizedOpen("checklist_template"))}
          gated={gated}
          loading={false}
          icon={<Sparkles className="size-4" />}
          label="Custom checklist + template"
        />
      </div>

      {err && <p className="mt-3 text-[12px] text-destructive">{err}</p>}

      <PersonalizedRequestDialog
        open={!!personalizedOpen}
        onClose={() => setPersonalizedOpen(null)}
        kind={personalizedOpen ?? "roadmap"}
        defaults={{ nationality, destination, purpose }}
      />
      <PersonalizedRoadmapForm
        open={personalizedRoadmapOpen}
        onClose={() => setPersonalizedRoadmapOpen(false)}
        defaults={{ nationality, destination, purpose }}
      />
    </div>
  );
}

function ActionBtn({
  onClick,
  gated,
  loading,
  icon,
  label,
}: {
  onClick: () => void;
  gated: boolean;
  loading: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 h-10 px-4 text-[13px] font-medium border transition-colors disabled:opacity-60 ${
        gated
          ? "border-border-strong text-muted-foreground hover:border-cream/40 hover:text-cream"
          : "border-cream/40 text-cream hover:bg-cream/5"
      }`}
      title={gated ? "Upgrade to Pro to unlock" : label}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : gated ? (
        <Lock className="size-3.5" />
      ) : (
        icon
      )}
      <span>{label}</span>
    </button>
  );
}
