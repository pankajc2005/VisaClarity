import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, X, Loader2, Crown, Mail, Clock, CheckCircle2, Shield } from "lucide-react";
import { createPersonalizedRequest } from "@/lib/roadmap/personalized.functions";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

type Kind = "roadmap" | "checklist_template";

type Props = {
  open: boolean;
  onClose: () => void;
  kind: Kind;
  defaults?: { nationality?: string; destination?: string; purpose?: string };
};

const COPY: Record<Kind, { title: string; subtitle: string; deliverable: string }> = {
  roadmap: {
    title: "Personalized roadmap",
    subtitle:
      "A consultant-grade roadmap, hand-crafted for your exact case — beyond what the AI generator produces.",
    deliverable: "Full personalized roadmap, delivered as PDF + DOCX in your dashboard.",
  },
  checklist_template: {
    title: "Personalized checklist + template",
    subtitle:
      "A tailored document checklist and ready-to-fill cover letter / sponsor letter template for your case.",
    deliverable: "Checklist (PDF) + editable template (DOCX), delivered in your dashboard.",
  },
};

export function PersonalizedRequestDialog({ open, onClose, kind, defaults }: Props) {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const qc = useQueryClient();
  const create = useServerFn(createPersonalizedRequest);

  const [nationality, setNationality] = useState(defaults?.nationality ?? "");
  const [destination, setDestination] = useState(defaults?.destination ?? "");
  const [purpose, setPurpose] = useState(defaults?.purpose ?? "");
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
  }, [user?.email, email]);

  useEffect(() => {
    if (defaults?.nationality) setNationality(defaults.nationality);
    if (defaults?.destination) setDestination(defaults.destination);
    if (defaults?.purpose) setPurpose(defaults.purpose);
  }, [defaults?.nationality, defaults?.destination, defaults?.purpose]);

  const mutation = useMutation({
    mutationFn: (data: {
      kind: Kind;
      nationality: string;
      destination: string;
      purpose: string;
      notes: string | null;
      notifyEmail: string;
    }) => create({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["personalized-requests"] });
      setDone(true);
    },
  });

  if (!open) return null;
  const c = COPY[kind];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nationality || !destination || !purpose || !email) return;
    mutation.mutate({
      kind,
      nationality,
      destination,
      purpose,
      notes: notes.trim() ? notes.trim() : null,
      notifyEmail: email,
    });
  }

  function close() {
    setDone(false);
    setNotes("");
    mutation.reset();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={close}
    >
      <div
        className="w-full max-w-lg bg-card border border-border-strong shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-border-strong">
          <div className="flex items-start gap-3">
            <div
              className="grid place-content-center size-9 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in oklab, var(--gold, #d4a84c) 30%, transparent), transparent)",
                color: "var(--gold, #d4a84c)",
              }}
            >
              <Crown className="size-4" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-500">
                Pro feature
              </p>
              <h2 className="text-lg font-medium">{c.title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="p-1 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {!isPro ? (
          <div className="p-6 text-sm text-muted-foreground">
            This is a Pro feature. Upgrade your plan to request a personalized{" "}
            {kind === "roadmap" ? "roadmap" : "checklist & template"}.
          </div>
        ) : done ? (
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Request received</p>
                <p className="text-[13px] text-muted-foreground mt-1">
                  Our team is now crafting your {c.title.toLowerCase()}. This usually takes
                  <strong className="text-foreground"> 24–48 hours</strong>. We'll email you at{" "}
                  <strong className="text-foreground">{email}</strong> and post it to your dashboard
                  the moment it's ready.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div className="border border-border p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Mail className="size-3" /> Email
                </div>
                <p className="truncate">{email}</p>
              </div>
              <div className="border border-border p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Clock className="size-3" /> ETA
                </div>
                <p>24–48 hours</p>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              className="w-full h-10 bg-foreground text-background text-[13px] font-medium hover:opacity-90"
            >
              Got it
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-4">
            <p className="text-[13px] text-muted-foreground">{c.subtitle}</p>

            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 flex gap-2 text-[12px] text-foreground">
              <Sparkles className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p>
                  <strong>This is hand-crafted, not instant.</strong> Our team takes{" "}
                  <strong>24–48 hours</strong> to research, validate every source, and tailor the
                  deliverable to your exact case.
                </p>
                <p className="text-muted-foreground mt-1">
                  You'll be notified by email and on your dashboard when it's ready. You can skip
                  this and keep using the instant AI roadmap anytime.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="Your nationality"
                value={nationality}
                onChange={setNationality}
                placeholder="e.g. India"
                required
              />
              <Field
                label="Destination"
                value={destination}
                onChange={setDestination}
                placeholder="e.g. Germany"
                required
              />
            </div>
            <Field
              label="Purpose"
              value={purpose}
              onChange={setPurpose}
              placeholder="e.g. Study Masters, Work, Tourism"
              required
            />
            <Field
              label="Notify email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              type="email"
              required
            />

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                Anything specific we should know? (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Job offer, family ties, prior refusals, exact intake date, sponsor details, etc."
                className="w-full bg-background border border-border-strong px-3 py-2 text-[13px] focus:outline-none focus:border-cream/60"
              />
              <p className="text-[10px] text-muted-foreground mt-1">{notes.length}/2000</p>
            </div>

            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 flex gap-2 text-[12px]">
              <Shield className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Your details are secure</p>
                <p className="text-muted-foreground mt-0.5">
                  We encrypt and store your information securely. It is only used by our internal
                  team to craft your personalized roadmap and is never shared, sold, or stored
                  anywhere outside our protected systems.
                </p>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">{c.deliverable}</p>

            {mutation.isError && (
              <p className="text-[12px] text-destructive">{(mutation.error as Error).message}</p>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={close}
                className="flex-1 h-10 border border-border-strong text-[13px] text-muted-foreground hover:text-foreground"
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 h-10 bg-foreground text-background text-[13px] font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
                Submit request
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full h-10 bg-background border border-border-strong px-3 text-[13px] focus:outline-none focus:border-cream/60"
      />
    </div>
  );
}
