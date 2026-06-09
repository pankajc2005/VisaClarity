import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Loader2,
  Crown,
  Mail,
  Clock,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Shield,
} from "lucide-react";
import { createPersonalizedRoadmapRequest } from "@/lib/roadmap/personalized-roadmap.functions";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

type Props = {
  open: boolean;
  onClose: () => void;
  defaults?: { nationality?: string; destination?: string; purpose?: string };
};

type FormState = {
  nationality: string;
  destination: string;
  purpose: string;
  travelDatesFrom: string;
  travelDatesTo: string;
  budgetAmount: string;
  budgetCurrency: string;
  incomeMonthly: string;
  incomeCurrency: string;
  hasSponsor: boolean;
  sponsorRelation: string;
  sponsorNotes: string;
  blockedAccountNeeded: boolean;
  employmentStatus: string;
  familyTies: string;
  priorRefusals: string;
  insuranceNeeded: boolean;
  flightsNeeded: boolean;
  hotelPreference: string;
  additionalContext: string;
  notifyEmail: string;
};

const CURRENCIES = ["EUR", "USD", "GBP", "INR", "AED", "AUD", "CAD", "JPY", "CHF", "SGD"];
const NATIONALITIES = [
  "India",
  "Pakistan",
  "Bangladesh",
  "Nepal",
  "Sri Lanka",
  "UAE",
  "Saudi Arabia",
  "Nigeria",
  "Philippines",
  "China",
  "Turkey",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Other",
];
const DESTINATIONS = [
  "Germany",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "France",
  "Italy",
  "Spain",
  "Netherlands",
  "Ireland",
  "New Zealand",
  "UAE",
  "Japan",
  "Singapore",
  "Other",
];
const PURPOSES = [
  "Study",
  "Tourism",
  "Work",
  "Job seeker",
  "Business",
  "Family visit",
  "Dependent visa",
  "Permanent residence",
  "Medical treatment",
  "Transit",
  "Other",
];
const EMPLOYMENT_OPTIONS = [
  "Student",
  "Employed",
  "Self-employed",
  "Business owner",
  "Freelancer",
  "Unemployed",
  "Retired",
  "Other",
];
const SPONSOR_RELATIONS = [
  "Parent",
  "Spouse",
  "Sibling",
  "Relative",
  "Employer",
  "University / scholarship",
  "Self-funded",
  "Other",
];
const FAMILY_TIES_OPTIONS = [
  "Strong ties — spouse/children/property",
  "Moderate ties — parents/job/assets",
  "Student with family in home country",
  "Limited ties",
  "Not sure",
  "Other",
];
const PRIOR_REFUSAL_OPTIONS = [
  "No prior refusals",
  "Yes — Schengen",
  "Yes — UK",
  "Yes — US",
  "Yes — Canada",
  "Yes — Australia",
  "Yes — other country",
  "Prefer to explain in notes",
];
const HOTEL_OPTIONS = [
  "Not needed",
  "Refundable hotel booking",
  "Budget stay",
  "Mid-range hotel",
  "Near university/workplace",
  "With host/family invitation",
  "Need help deciding",
  "Other",
];

const initial: FormState = {
  nationality: "",
  destination: "",
  purpose: "",
  travelDatesFrom: "",
  travelDatesTo: "",
  budgetAmount: "",
  budgetCurrency: "EUR",
  incomeMonthly: "",
  incomeCurrency: "EUR",
  hasSponsor: false,
  sponsorRelation: "",
  sponsorNotes: "",
  blockedAccountNeeded: false,
  employmentStatus: "",
  familyTies: "",
  priorRefusals: "",
  insuranceNeeded: true,
  flightsNeeded: false,
  hotelPreference: "",
  additionalContext: "",
  notifyEmail: "",
};

export function PersonalizedRoadmapForm({ open, onClose, defaults }: Props) {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const qc = useQueryClient();
  const create = useServerFn(createPersonalizedRoadmapRequest);

  const [step, setStep] = useState(1);
  const [f, setF] = useState<FormState>(initial);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setDone(false);
    setF((prev) => ({
      ...initial,
      nationality: defaults?.nationality ?? prev.nationality,
      destination: defaults?.destination ?? prev.destination,
      purpose: defaults?.purpose ?? prev.purpose,
      notifyEmail: user?.email ?? prev.notifyEmail,
    }));
  }, [open, defaults?.nationality, defaults?.destination, defaults?.purpose, user?.email]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  const mutation = useMutation({
    mutationFn: () =>
      create({
        data: {
          nationality: f.nationality.trim(),
          destination: f.destination.trim(),
          purpose: f.purpose.trim(),
          travelDatesFrom: f.travelDatesFrom || null,
          travelDatesTo: f.travelDatesTo || null,
          budgetAmount: f.budgetAmount ? Number(f.budgetAmount) : null,
          budgetCurrency: f.budgetCurrency || null,
          incomeMonthly: f.incomeMonthly ? Number(f.incomeMonthly) : null,
          incomeCurrency: f.incomeCurrency || null,
          sponsor: f.hasSponsor
            ? {
                hasSponsor: true,
                relation: f.sponsorRelation || undefined,
                notes: f.sponsorNotes || undefined,
              }
            : null,
          blockedAccountNeeded: f.blockedAccountNeeded,
          employmentStatus: f.employmentStatus || null,
          familyTies: f.familyTies || null,
          priorRefusals: f.priorRefusals || null,
          insuranceNeeded: f.insuranceNeeded,
          flightsNeeded: f.flightsNeeded,
          hotelPreference: f.hotelPreference || null,
          additionalContext: f.additionalContext || null,
          notifyEmail: f.notifyEmail,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["personalized-roadmaps"] });
      setDone(true);
    },
  });

  if (!open) return null;

  const canSubmit =
    f.nationality.trim() && f.destination.trim() && f.purpose.trim() && f.notifyEmail.trim();

  function close() {
    setDone(false);
    setF(initial);
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
        className="w-full max-w-2xl bg-card border border-border-strong shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-border-strong sticky top-0 bg-card z-10">
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
                Pro · Personalized · 10–15 min crafting
              </p>
              <h2 className="text-lg font-medium">Personalized roadmap</h2>
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
            This is a Pro feature. Upgrade your plan to get a hand-crafted personalized roadmap.
          </div>
        ) : done ? (
          <SubmittedState email={f.notifyEmail} onClose={close} />
        ) : (
          <>
            <ProgressBar step={step} />
            <form
              className="p-5 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (step < 3) setStep(step + 1);
                else if (canSubmit) mutation.mutate();
              }}
            >
              <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 flex gap-2 text-[12px] text-foreground">
                <Sparkles className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p>
                    <strong>This is hand-crafted by our AI consultants in 10–15 minutes.</strong> We
                    research your exact case (visa, e-visa, blocked account, insurance, hotel
                    booking, currency-accurate amounts) and deliver a PDF + DOCX you can act on
                    immediately.
                  </p>
                  <p className="text-muted-foreground mt-1">
                    You'll be notified by email and on your dashboard the moment it's ready. You can
                    keep using the instant AI roadmap meanwhile.
                  </p>
                </div>
              </div>

              {step === 1 && (
                <Section title="Step 1 — Core details">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SelectField
                      label="Your nationality"
                      value={f.nationality}
                      onChange={(v) => set("nationality", v)}
                      options={NATIONALITIES}
                      placeholder="Select nationality"
                      required
                    />
                    <SelectField
                      label="Destination"
                      value={f.destination}
                      onChange={(v) => set("destination", v)}
                      options={DESTINATIONS}
                      placeholder="Select destination"
                      required
                    />
                  </div>
                  <SelectField
                    label="Purpose"
                    value={f.purpose}
                    onChange={(v) => set("purpose", v)}
                    options={PURPOSES}
                    placeholder="Select purpose"
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Travel from"
                      value={f.travelDatesFrom}
                      onChange={(v) => set("travelDatesFrom", v)}
                      type="date"
                    />
                    <Field
                      label="Travel to"
                      value={f.travelDatesTo}
                      onChange={(v) => set("travelDatesTo", v)}
                      type="date"
                    />
                  </div>
                  <div className="grid grid-cols-[1fr_120px] gap-3">
                    <Field
                      label="Total budget for the trip"
                      value={f.budgetAmount}
                      onChange={(v) => set("budgetAmount", v.replace(/[^0-9.]/g, ""))}
                      placeholder="e.g. 15000"
                      type="number"
                    />
                    <SelectField
                      label="Currency"
                      value={f.budgetCurrency}
                      onChange={(v) => set("budgetCurrency", v)}
                      options={CURRENCIES}
                    />
                  </div>
                </Section>
              )}

              {step === 2 && (
                <Section title="Step 2 — Money & background">
                  <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 flex gap-2 text-[12px]">
                    <Shield className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Your details are secure</p>
                      <p className="text-muted-foreground mt-0.5">
                        Income, sponsor, family ties, and refusal history are encrypted and only
                        used by our internal AI consultants to craft your roadmap. We never share,
                        sell, or store this data outside our protected systems.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_120px] gap-3">
                    <Field
                      label="Monthly income"
                      value={f.incomeMonthly}
                      onChange={(v) => set("incomeMonthly", v.replace(/[^0-9.]/g, ""))}
                      placeholder="e.g. 2500"
                      type="number"
                    />
                    <SelectField
                      label="Currency"
                      value={f.incomeCurrency}
                      onChange={(v) => set("incomeCurrency", v)}
                      options={CURRENCIES}
                    />
                  </div>
                  <SelectField
                    label="Employment status"
                    value={f.employmentStatus}
                    onChange={(v) => set("employmentStatus", v)}
                    options={EMPLOYMENT_OPTIONS}
                    placeholder="Select status"
                  />
                  <Toggle
                    label="Do you have a financial sponsor?"
                    value={f.hasSponsor}
                    onChange={(v) => set("hasSponsor", v)}
                  />
                  {f.hasSponsor && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4 border-l border-amber-500/30">
                      <SelectField
                        label="Sponsor relation"
                        value={f.sponsorRelation}
                        onChange={(v) => set("sponsorRelation", v)}
                        options={SPONSOR_RELATIONS}
                        placeholder="Select relation"
                      />
                      <Field
                        label="Sponsor notes"
                        value={f.sponsorNotes}
                        onChange={(v) => set("sponsorNotes", v)}
                        placeholder="e.g. covers tuition + living"
                      />
                    </div>
                  )}
                  <Toggle
                    label="Do you need to open a blocked account?"
                    value={f.blockedAccountNeeded}
                    onChange={(v) => set("blockedAccountNeeded", v)}
                    hint="Common for Germany student visas, etc."
                  />
                  <SelectField
                    label="Family / home-country ties"
                    value={f.familyTies}
                    onChange={(v) => set("familyTies", v)}
                    options={FAMILY_TIES_OPTIONS}
                    placeholder="Select closest match"
                  />
                  <SelectField
                    label="Any prior visa refusals?"
                    value={f.priorRefusals}
                    onChange={(v) => set("priorRefusals", v)}
                    options={PRIOR_REFUSAL_OPTIONS}
                    placeholder="Select refusal history"
                  />
                </Section>
              )}

              {step === 3 && (
                <Section title="Step 3 — Travel & extras">
                  <Toggle
                    label="Need travel/health insurance guidance?"
                    value={f.insuranceNeeded}
                    onChange={(v) => set("insuranceNeeded", v)}
                  />
                  <Toggle
                    label="Need flight reservation guidance?"
                    value={f.flightsNeeded}
                    onChange={(v) => set("flightsNeeded", v)}
                    hint="Includes dummy-ticket vs real-ticket strategy"
                  />
                  <SelectField
                    label="Hotel / accommodation preference"
                    value={f.hotelPreference}
                    onChange={(v) => set("hotelPreference", v)}
                    options={HOTEL_OPTIONS}
                    placeholder="Select accommodation plan"
                  />
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                      Anything else we should know? (optional)
                    </label>
                    <textarea
                      value={f.additionalContext}
                      onChange={(e) => set("additionalContext", e.target.value.slice(0, 2000))}
                      rows={4}
                      placeholder="Job offer, exact intake date, dependents, specific embassy you'd like to apply through, etc."
                      className="w-full bg-background border border-border-strong px-3 py-2 text-[13px] focus:outline-none focus:border-cream/60"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {f.additionalContext.length}/2000
                    </p>
                  </div>
                  <Field
                    label="Notify email"
                    value={f.notifyEmail}
                    onChange={(v) => set("notifyEmail", v)}
                    placeholder="you@example.com"
                    type="email"
                    required
                  />
                </Section>
              )}

              {mutation.isError && (
                <p className="text-[12px] text-destructive">{(mutation.error as Error).message}</p>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-border-strong">
                <button
                  type="button"
                  onClick={close}
                  className="h-10 px-4 text-[12px] text-muted-foreground hover:text-foreground"
                >
                  Skip for now
                </button>
                <div className="flex-1" />
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="inline-flex items-center gap-1.5 h-10 px-4 border border-border-strong text-[13px] hover:bg-cream/5"
                  >
                    <ChevronLeft className="size-4" /> Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 h-10 px-5 bg-foreground text-background text-[13px] font-medium hover:opacity-90"
                  >
                    Continue <ChevronRight className="size-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={mutation.isPending || !canSubmit}
                    className="inline-flex items-center gap-2 h-10 px-5 bg-foreground text-background text-[13px] font-medium hover:opacity-90 disabled:opacity-60"
                  >
                    {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
                    Start crafting
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="px-5 pt-4">
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className={`h-1 flex-1 ${n <= step ? "bg-amber-500" : "bg-border"}`} />
        ))}
      </div>
      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mt-1.5">
        Step {step} of 3
      </p>
    </div>
  );
}

function SubmittedState({ email, onClose }: { email: string; onClose: () => void }) {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Crafting started</p>
          <p className="text-[13px] text-muted-foreground mt-1">
            Our AI consultants are now researching your exact case (visa rules, e-visa portal,
            blocked account, insurance, hotel proof, currency-accurate amounts). It usually takes{" "}
            <strong className="text-foreground">10–15 minutes</strong>. We'll email you at{" "}
            <strong className="text-foreground">{email}</strong> and update your dashboard the
            moment your personalized PDF + DOCX are ready.
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
          <p>10–15 minutes</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-full h-10 bg-foreground text-background text-[13px] font-medium hover:opacity-90"
      >
        Got it
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-500">{title}</p>
      <div className="space-y-3">{children}</div>
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

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select one",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full h-10 bg-background border border-border-strong px-3 text-[13px] focus:outline-none focus:border-cream/60"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 accent-amber-500"
      />
      <div>
        <p className="text-[13px]">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
    </label>
  );
}
