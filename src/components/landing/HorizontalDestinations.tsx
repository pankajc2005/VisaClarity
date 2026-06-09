import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

const DESTINATIONS = [
  { code: "DEU", name: "Germany", visa: "Student Visa", note: "11,904 € blocked account" },
  { code: "GBR", name: "United Kingdom", visa: "Tier 4 / Student", note: "CAS + 28-day funds" },
  { code: "USA", name: "United States", visa: "F-1 / B1-B2", note: "DS-160 + interview" },
  { code: "CAN", name: "Canada", visa: "Study Permit", note: "GIC + PAL letter" },
  { code: "AUS", name: "Australia", visa: "Subclass 500", note: "GTE statement" },
  { code: "FRA", name: "France", visa: "VLS-TS Étudiant", note: "Campus France OFII" },
  { code: "NLD", name: "Netherlands", visa: "MVV + VVR", note: "IND-recognized sponsor" },
  { code: "JPN", name: "Japan", visa: "Student / Work", note: "COE before visa" },
  { code: "ARE", name: "UAE", visa: "Employment", note: "Entry permit + medical" },
  { code: "SGP", name: "Singapore", visa: "Student Pass", note: "ICA SOLAR portal" },
];

/**
 * Pin-and-scroll horizontal section.
 * The user scrolls vertically; the cards translate horizontally based on
 * the section's scroll progress. Standard Motion pattern.
 */
export function HorizontalDestinations() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Translate from 0 to -((cards width) - viewport)
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-78%"]);

  return (
    <section
      ref={containerRef}
      className="relative border-t border-border"
      style={{ height: reduce ? "auto" : "320vh" }}
    >
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        <div className="px-6 md:px-10 max-w-[1100px] mx-auto w-full mb-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            47+ Destinations
          </p>
          <h2 className="mt-4 font-display text-[34px] md:text-[52px] leading-[1.1] text-foreground">
            Every route, <em className="italic text-cream font-normal">mapped.</em>
          </h2>
          <p className="mt-5 max-w-[520px] text-[14px] md:text-[15px] leading-[1.7] text-muted-foreground">
            Scroll horizontally through some of the routes we cover — each one with its own
            timeline, blocked-account math, and rejection patterns.
          </p>
        </div>

        <motion.div
          style={reduce ? undefined : { x }}
          className={`flex gap-6 px-6 md:px-10 ${reduce ? "flex-wrap" : "flex-nowrap"}`}
        >
          {DESTINATIONS.map((d, i) => (
            <article
              key={d.code}
              className="shrink-0 w-[280px] md:w-[360px] aspect-[3/4] border border-border-strong bg-card p-6 md:p-8 flex flex-col justify-between hover:border-cream/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Route {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[11px] text-cream">{d.code}</span>
                </div>
                <h3 className="mt-10 font-display text-[28px] md:text-[36px] leading-[1.05] text-foreground">
                  {d.name}
                </h3>
              </div>
              <div className="border-t border-border-strong pt-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {d.visa}
                </p>
                <p className="mt-2 text-[13px] text-cream/90">{d.note}</p>
              </div>
            </article>
          ))}
          {/* Trailing breathing room */}
          <div className="shrink-0 w-[20vw]" aria-hidden />
        </motion.div>

        <p className="mt-10 px-6 md:px-10 max-w-[1100px] mx-auto w-full font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {reduce ? "Reduced motion — list view" : "Keep scrolling ↓"}
        </p>
      </div>
    </section>
  );
}
