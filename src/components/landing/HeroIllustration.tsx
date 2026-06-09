import { motion, useReducedMotion } from "motion/react";

/**
 * Refined hero illustration — minimal, editorial.
 * Globe (origin) → drawn arc → destination pin. Single horizontal gesture.
 * Monochrome cream on black. Compact, balanced, intentional.
 */
export function HeroIllustration() {
  const reduce = useReducedMotion();

  // Arc path (from origin globe to destination pin)
  const arcD = "M 110 130 Q 300 10 490 130";

  return (
    <div className="relative mx-auto w-full max-w-[560px] aspect-[600/200] select-none">
      <svg viewBox="0 0 600 200" className="relative w-full h-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="arcGrad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="var(--cream)" stopOpacity="0" />
            <stop offset=".2" stopColor="var(--cream)" stopOpacity=".75" />
            <stop offset=".8" stopColor="var(--cream)" stopOpacity=".75" />
            <stop offset="1" stopColor="var(--cream)" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="globeAura" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="var(--cream)" stopOpacity=".14" />
            <stop offset="1" stopColor="var(--cream)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* === FLIGHT ARC === */}
        <motion.path
          d={arcD}
          fill="none"
          stroke="url(#arcGrad)"
          strokeWidth="1.2"
          strokeDasharray="2 5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.8, delay: 0.6, ease: [0.65, 0, 0.35, 1] }}
        />

        {/* Plane traveling the arc */}
        {!reduce && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2, duration: 0.4 }}
          >
            <motion.g
              animate={{ offsetDistance: ["0%", "100%"] }}
              transition={{
                duration: 5.5,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 1.4,
              }}
              style={{
                offsetPath: `path('${arcD}')`,
                offsetRotate: "auto",
              }}
            >
              <path
                d="M -7 0 L 5 0 M 0 -2.6 L 6 0 L 0 2.6 Z"
                stroke="var(--cream)"
                strokeWidth="1"
                strokeLinejoin="round"
                fill="var(--cream)"
              />
            </motion.g>
          </motion.g>
        )}

        {/* === Subtle drifting particles === */}
        {!reduce &&
          Array.from({ length: 8 }).map((_, i) => {
            const cx = 80 + ((i * 71) % 440);
            const cy = 30 + ((i * 43) % 140);
            return (
              <motion.circle
                key={i}
                cx={cx}
                cy={cy}
                r="0.7"
                fill="var(--cream)"
                fillOpacity="0.35"
                animate={{
                  cy: [cy, cy - 10, cy],
                  opacity: [0.15, 0.5, 0.15],
                }}
                transition={{
                  duration: 7 + (i % 4),
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: (i * 0.4) % 3,
                }}
              />
            );
          })}
      </svg>
    </div>
  );
}
