import { useEffect, useState } from "react";
import type { Roadmap } from "@/lib/roadmap.functions";
import type { BLOG_POSTS } from "@/lib/blog/posts";

// ---- Progress (checkbox) tracking, scoped per shareSlug -------------------

function progressKey(slug: string) {
  return `vc:roadmap-progress:${slug}`;
}

function useProgress(slug: string) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(progressKey(slug));
      if (raw) setDone(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [slug]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(progressKey(slug), JSON.stringify(done));
    } catch {
      /* ignore */
    }
  }, [done, slug, hydrated]);

  const toggle = (id: string) => setDone((d) => ({ ...d, [id]: !d[id] }));
  const isDone = (id: string) => !!done[id];
  const reset = () => setDone({});
  return { isDone, toggle, reset };
}

// ---- Collapsible section -------------------------------------------------

const COLLAPSE_KEY = "vc:roadmap-collapsed";

function useCollapse(id: string, defaultOpen: boolean) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSE_KEY);
      if (!raw) return;
      const map = JSON.parse(raw) as Record<string, boolean>;
      if (typeof map[id] === "boolean") setOpen(map[id]);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAndPersist = (next: boolean) => {
    setOpen(next);
    try {
      const raw = localStorage.getItem(COLLAPSE_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
      map[id] = next;
      localStorage.setItem(COLLAPSE_KEY, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  };

  return [open, setAndPersist] as const;
}

function Section({
  id,
  label,
  title,
  children,
  defaultOpen = true,
}: {
  id: string;
  label: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useCollapse(id, defaultOpen);
  return (
    <section
      id={`section-${id}`}
      data-roadmap-section
      data-section-open={open}
      className="mt-12 scroll-mt-24"
    >
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream mb-2">
            {label}
          </p>
          <h2 className="font-display text-[24px] md:text-[28px] leading-tight text-cream">
            {title}
          </h2>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="no-print font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-cream shrink-0"
          aria-expanded={open}
          aria-controls={`section-${id}-body`}
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>
      <div
        id={`section-${id}-body`}
        data-collapsible-content
        className={open ? "mt-5" : "hidden mt-5"}
      >
        {children}
      </div>
    </section>
  );
}

// ---- Checkbox ------------------------------------------------------------

function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <span
        className={`shrink-0 mt-0.5 inline-flex items-center justify-center w-4 h-4 border ${
          checked ? "bg-cream border-cream" : "border-border-strong group-hover:border-cream/60"
        } transition-colors`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="w-3 h-3 text-cream-foreground">
            <path
              d="M2 6l3 3 5-6"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          </svg>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
        aria-label={label}
      />
      <span
        className={`text-[13px] leading-[1.6] ${
          checked ? "text-muted-foreground line-through" : "text-foreground"
        }`}
      >
        {label}
      </span>
    </label>
  );
}

// ---- Stat ----------------------------------------------------------------

function Stat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="border border-border-strong bg-card p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
        {label}
      </p>
      <p
        className={`font-display text-[18px] leading-tight break-words ${valueClassName ?? "text-cream"}`}
      >
        {value}
      </p>
    </div>
  );
}

function difficultyClass(difficulty: string) {
  switch (difficulty) {
    case "Very Hard":
      return "text-destructive";
    case "Hard":
      return "text-amber-400";
    default:
      return "text-cream";
  }
}

// ---- Main view -----------------------------------------------------------

export function RoadmapView({
  roadmap,
  relatedPosts,
  blurred = false,
}: {
  roadmap: Roadmap;
  relatedPosts: typeof BLOG_POSTS;
  blurred?: boolean;
}) {
  const slug = roadmap.shareSlug ?? "anon";
  const progress = useProgress(slug);

  // total checkable items for the progress bar
  const totalItems =
    roadmap.steps.reduce((acc, s) => acc + 1 + s.actionItems.length, 0) + roadmap.documents.length;
  const doneCount =
    roadmap.steps.reduce(
      (acc, s) =>
        acc +
        (progress.isDone(`step-${s.order}`) ? 1 : 0) +
        s.actionItems.filter((_, i) => progress.isDone(`step-${s.order}-a-${i}`)).length,
      0,
    ) + roadmap.documents.filter((_, i) => progress.isDone(`doc-${i}`)).length;
  const pct = totalItems ? Math.round((doneCount / totalItems) * 100) : 0;

  return (
    <div className={blurred ? "blur-md transition-all" : "transition-all"}>
      {/* Overview */}
      <section className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Visa Type" value={roadmap.visaType} />
        <Stat label="Processing" value={roadmap.estimatedProcessingTime} />
        <Stat label="Est. Total Cost" value={roadmap.estimatedTotalCost} />
        <Stat
          label="Difficulty"
          value={roadmap.difficulty}
          valueClassName={difficultyClass(roadmap.difficulty)}
        />
      </section>

      <p className="mt-8 text-[15px] leading-[1.75] text-muted-foreground">{roadmap.summary}</p>

      {roadmap.difficultyReason && (
        <p className="mt-4 text-[13px] text-muted-foreground border-l-2 border-cream/40 pl-4">
          <span className="text-cream">Why "{roadmap.difficulty}":</span> {roadmap.difficultyReason}
        </p>
      )}

      {/* Progress bar */}
      {!blurred && totalItems > 0 && (
        <div className="mt-8 border border-border-strong bg-card p-4 no-print">
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream">
              Your progress
            </p>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {doneCount} / {totalItems} · {pct}%
              </span>
              {doneCount > 0 && (
                <button
                  onClick={progress.reset}
                  className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-cream"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          <div className="h-[3px] bg-border-strong overflow-hidden">
            <div
              className="h-full bg-cream transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* 01 Steps */}
      <Section id="01" label="01" title="Step-by-step roadmap">
        <ol className="space-y-4">
          {roadmap.steps.map((s) => {
            const stepId = `step-${s.order}`;
            const stepDone = progress.isDone(stepId);
            return (
              <li
                key={s.order}
                className={`border border-border-strong bg-card p-5 break-inside-avoid ${
                  stepDone ? "opacity-70" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => progress.toggle(stepId)}
                    className={`shrink-0 mt-1 inline-flex items-center justify-center w-5 h-5 border ${
                      stepDone
                        ? "bg-cream border-cream"
                        : "border-border-strong hover:border-cream/60"
                    } transition-colors no-print`}
                    aria-label={`Mark step ${s.order} ${stepDone ? "incomplete" : "complete"}`}
                  >
                    {stepDone && (
                      <svg viewBox="0 0 12 12" className="w-3.5 h-3.5 text-cream-foreground">
                        <path
                          d="M2 6l3 3 5-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="square"
                        />
                      </svg>
                    )}
                  </button>
                  <span className="font-mono text-[11px] text-cream shrink-0 mt-1 hidden print:inline">
                    {String(s.order).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <h3
                        className={`font-display text-[18px] ${
                          stepDone ? "text-muted-foreground line-through" : "text-cream"
                        }`}
                      >
                        {String(s.order).padStart(2, "0")}. {s.title}
                      </h3>
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {s.timeframe}
                      </span>
                    </div>
                    <p className="mt-2 text-[14px] leading-[1.7] text-muted-foreground">
                      {s.description}
                    </p>
                    {s.actionItems.length > 0 && (
                      <ul className="mt-4 space-y-2.5">
                        {s.actionItems.map((a, i) => {
                          const aid = `step-${s.order}-a-${i}`;
                          return (
                            <li key={i}>
                              <Check
                                checked={progress.isDone(aid)}
                                onChange={() => progress.toggle(aid)}
                                label={a}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Section>

      {/* 02 Documents */}
      <Section id="02" label="02" title="Required documents">
        <div className="grid md:grid-cols-2 gap-3">
          {roadmap.documents.map((d, i) => {
            const id = `doc-${i}`;
            const done = progress.isDone(id);
            return (
              <div
                key={i}
                className={`border ${
                  d.critical ? "border-cream/40" : "border-border-strong"
                } bg-card p-4 break-inside-avoid ${done ? "opacity-70" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => progress.toggle(id)}
                    className={`shrink-0 mt-0.5 inline-flex items-center justify-center w-4 h-4 border ${
                      done ? "bg-cream border-cream" : "border-border-strong hover:border-cream/60"
                    } transition-colors no-print`}
                    aria-label={`Mark ${d.name} ${done ? "incomplete" : "complete"}`}
                  >
                    {done && (
                      <svg viewBox="0 0 12 12" className="w-3 h-3 text-cream-foreground">
                        <path
                          d="M2 6l3 3 5-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="square"
                        />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`text-[14px] font-medium ${
                          done ? "text-muted-foreground line-through" : "text-cream"
                        }`}
                      >
                        {d.name}
                      </h3>
                      {d.critical && (
                        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-amber-400">
                          Critical
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[13px] text-muted-foreground leading-[1.55]">
                      {d.details}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 03 Financial */}
      {roadmap.financialRequirements.length > 0 && (
        <Section id="03" label="03" title="Financial requirements">
          <div className="border border-border-strong bg-card">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-strong">
                  <th className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground p-4">
                    Item
                  </th>
                  <th className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground p-4">
                    Amount
                  </th>
                  <th className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground p-4 hidden md:table-cell">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody>
                {roadmap.financialRequirements.map((f, i) => (
                  <tr
                    key={i}
                    className="border-b border-border-strong/60 last:border-b-0 break-inside-avoid"
                  >
                    <td className="p-4 text-[14px] text-foreground">{f.item}</td>
                    <td className="p-4 text-[14px] text-cream font-medium break-words">
                      {f.amount}
                    </td>
                    <td className="p-4 text-[13px] text-muted-foreground hidden md:table-cell">
                      {f.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* 04 Appointment / biometrics / interview */}
      {(roadmap.appointmentBooking?.url ||
        roadmap.biometrics?.required ||
        roadmap.interview?.required) && (
        <Section id="04" label="04" title="Appointment, biometrics & interview">
          <div className="grid md:grid-cols-3 gap-3">
            {roadmap.appointmentBooking?.url && (
              <div className="border border-border-strong bg-card p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  Booking
                </p>
                <p className="text-[14px] text-cream font-medium mb-2">
                  {roadmap.appointmentBooking.label || "Appointment portal"}
                </p>
                <a
                  href={roadmap.appointmentBooking.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-cream hover:underline break-all"
                >
                  {roadmap.appointmentBooking.url}
                </a>
                {roadmap.appointmentBooking.note && (
                  <p className="mt-2 text-[12px] text-muted-foreground">
                    {roadmap.appointmentBooking.note}
                  </p>
                )}
              </div>
            )}
            {roadmap.biometrics?.required && (
              <div className="border border-border-strong bg-card p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  Biometrics
                </p>
                <p className="text-[14px] text-cream font-medium mb-1">Required</p>
                {roadmap.biometrics.where && (
                  <p className="text-[13px] text-muted-foreground">{roadmap.biometrics.where}</p>
                )}
                {roadmap.biometrics.cost && (
                  <p className="text-[12px] text-cream mt-1">{roadmap.biometrics.cost}</p>
                )}
                {roadmap.biometrics.note && (
                  <p className="mt-2 text-[12px] text-muted-foreground">
                    {roadmap.biometrics.note}
                  </p>
                )}
              </div>
            )}
            {roadmap.interview?.required && (
              <div className="border border-border-strong bg-card p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  Interview
                </p>
                <p className="text-[14px] text-cream font-medium mb-2">Required</p>
                {roadmap.interview.typicalQuestions.length > 0 && (
                  <ul className="space-y-1.5">
                    {roadmap.interview.typicalQuestions.map((q, i) => (
                      <li key={i} className="text-[12px] text-muted-foreground">
                        • {q}
                      </li>
                    ))}
                  </ul>
                )}
                {roadmap.interview.tips && (
                  <p className="mt-3 text-[12px] text-foreground border-l-2 border-cream/40 pl-3">
                    {roadmap.interview.tips}
                  </p>
                )}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* 05 Rejections */}
      {roadmap.commonRejectionReasons.length > 0 && (
        <Section id="05" label="05" title="Common rejection reasons" defaultOpen={false}>
          <ul className="space-y-2">
            {roadmap.commonRejectionReasons.map((r, i) => (
              <li
                key={i}
                className="text-[14px] text-foreground flex gap-3 border-l-2 border-destructive/40 pl-4 py-1 break-inside-avoid"
              >
                <span className="font-mono text-[11px] text-destructive shrink-0 mt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 06 Embassy */}
      {roadmap.embassyContacts.length > 0 && (
        <Section id="06" label="06" title="Embassy & consulate">
          <div className="grid md:grid-cols-2 gap-3">
            {roadmap.embassyContacts.map((e, i) => (
              <div key={i} className="border border-border-strong bg-card p-5 break-inside-avoid">
                <h3 className="font-display text-[18px] text-cream mb-1">{e.name}</h3>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-4">
                  {e.city}
                </p>
                {e.address && (
                  <div className="mb-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Address
                    </p>
                    <p className="text-[13px] text-foreground mt-1">{e.address}</p>
                  </div>
                )}
                {e.phone && (
                  <div className="mb-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Phone
                    </p>
                    <p className="text-[13px] text-foreground mt-1">{e.phone}</p>
                  </div>
                )}
                {e.email && (
                  <div className="mb-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Email
                    </p>
                    <a
                      href={`mailto:${e.email}`}
                      className="text-[13px] text-cream hover:underline break-all"
                    >
                      {e.email}
                    </a>
                  </div>
                )}
                {e.website && (
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Web
                    </p>
                    <a
                      href={e.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] text-cream hover:underline break-all"
                    >
                      {e.website}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 07 Official links */}
      {roadmap.officialLinks.length > 0 && (
        <Section id="07" label="07" title="Official links" defaultOpen={false}>
          <ul className="space-y-2">
            {roadmap.officialLinks.map((l, i) => (
              <li key={i} className="border border-border-strong bg-card p-4 break-inside-avoid">
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] text-cream hover:underline"
                >
                  {l.title}
                </a>
                <p className="mt-1 text-[12px] text-muted-foreground">{l.purpose}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 08 Useful resources */}
      {roadmap.usefulResources.length > 0 && (
        <Section id="08" label="08" title="Useful resources" defaultOpen={false}>
          <ul className="space-y-2">
            {roadmap.usefulResources.map((l, i) => (
              <li key={i} className="border border-border-strong bg-card p-4 break-inside-avoid">
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] text-cream hover:underline"
                >
                  {l.title}
                </a>
                {l.note && <p className="mt-1 text-[12px] text-muted-foreground">{l.note}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 09 Pro tips */}
      {roadmap.proTips.length > 0 && (
        <Section id="09" label="09" title="Pro tips" defaultOpen={false}>
          <ul className="space-y-2">
            {roadmap.proTips.map((t, i) => (
              <li
                key={i}
                className="text-[14px] text-foreground border-l-2 border-cream/40 pl-4 py-1 break-inside-avoid"
              >
                {t}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 10 Related guides */}
      {relatedPosts.length > 0 && (
        <Section id="10" label="10" title="Related guides" defaultOpen={false}>
          <div className="grid md:grid-cols-3 gap-3">
            {relatedPosts.map((p) => (
              <a
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="border border-border-strong bg-card p-4 hover:border-cream/40 transition-colors break-inside-avoid"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  Guide
                </p>
                <p className="text-[14px] text-cream">{p.title}</p>
              </a>
            ))}
          </div>
        </Section>
      )}

      {/* 11 After arrival */}
      {roadmap.postArrival.length > 0 && (
        <Section id="11" label="11" title="After you arrive" defaultOpen={false}>
          <ul className="space-y-2">
            {roadmap.postArrival.map((p, i) => (
              <li key={i} className="text-[14px] text-foreground flex gap-3 break-inside-avoid">
                <span className="text-cream">→</span>
                {p}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 12 Sources */}
      {(roadmap.sources?.length ?? 0) > 0 && (
        <Section id="12" label="12" title="Sources" defaultOpen={false}>
          <p className="text-[12px] text-muted-foreground mb-3">
            All URLs are filtered to official government and accredited visa-service domains.
            Anything outside the allow-list is dropped.
          </p>
          <ul className="space-y-1.5">
            {roadmap.sources!.map((s, i) => (
              <li key={i} className="text-[12px] break-inside-avoid flex items-start gap-2">
                <span
                  className="shrink-0 mt-0.5 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-cream/15 text-cream"
                  title="Verified official source"
                  aria-label="Verified"
                >
                  <svg viewBox="0 0 12 12" className="w-2.5 h-2.5">
                    <path
                      d="M2 6l3 3 5-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="square"
                    />
                  </svg>
                </span>
                <span className="min-w-0">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cream hover:underline"
                  >
                    {s.title}
                  </a>{" "}
                  <span className="text-muted-foreground break-all">— {s.url}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

// ---- Mobile TOC ----------------------------------------------------------

const TOC_ITEMS = [
  { id: "01", label: "Steps" },
  { id: "02", label: "Documents" },
  { id: "03", label: "Financial" },
  { id: "04", label: "Appointment" },
  { id: "05", label: "Rejections" },
  { id: "06", label: "Embassy" },
  { id: "07", label: "Official links" },
  { id: "08", label: "Resources" },
  { id: "09", label: "Pro tips" },
  { id: "10", label: "Related" },
  { id: "11", label: "After arrival" },
  { id: "12", label: "Sources" },
];

export function MobileTOC() {
  const [open, setOpen] = useState(false);

  const jump = (id: string) => {
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden no-print fixed bottom-5 right-5 z-40 h-11 px-4 bg-cream text-cream-foreground font-mono text-[10px] uppercase tracking-[0.18em] shadow-2xl hover:bg-cream/90"
      >
        Sections
      </button>
      {open && (
        <div
          className="md:hidden no-print fixed inset-0 z-50 flex items-end"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div
            className="relative w-full bg-card border-t border-border-strong p-5 max-h-[70vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream">
                Jump to section
              </p>
              <button
                onClick={() => setOpen(false)}
                className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-cream"
              >
                Close
              </button>
            </div>
            <ul className="space-y-1">
              {TOC_ITEMS.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => jump(t.id)}
                    className="w-full text-left flex items-baseline gap-3 py-2.5 border-b border-border-strong/60 hover:text-cream"
                  >
                    <span className="font-mono text-[11px] text-cream w-6 shrink-0">{t.id}</span>
                    <span className="text-[14px] text-foreground">{t.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
