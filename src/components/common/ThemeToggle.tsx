import { useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { createPortal } from "react-dom";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  return "light";
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

interface Burst {
  key: number;
  originX: number;
  originY: number;
  particles: Particle[];
  toDark: boolean;
}

function makePageBurst(toDark: boolean): Particle[] {
  const count = 1100;
  const maxDist = Math.hypot(window.innerWidth, window.innerHeight);
  return Array.from({ length: count }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = maxDist * (0.25 + Math.random() * 1.1);
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: 1.5 + Math.random() * 3.5,
      duration: 2200 + Math.random() * 1600,
      delay: Math.random() * 500,
      color: toDark
        ? Math.random() > 0.4
          ? "#ede6d3"
          : "#ffffff"
        : Math.random() > 0.4
          ? "#141414"
          : "#3a3a3a",
    };
  });
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  const [burst, setBurst] = useState<Burst | null>(null);
  const burstKey = useRef(0);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTheme(getInitialTheme());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  const isDark = theme === "dark";

  const handleToggle = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    const originX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const originY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    const goingDark = !isDark;

    burstKey.current += 1;
    setBurst({
      key: burstKey.current,
      originX,
      originY,
      particles: makePageBurst(goingDark),
      toDark: goingDark,
    });
    setTheme(goingDark ? "dark" : "light");
    window.setTimeout(() => setBurst(null), 4200);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
        aria-pressed={isDark}
        suppressHydrationWarning
        className="group relative inline-flex h-9 w-[68px] shrink-0 items-center rounded-full border border-border-strong bg-card px-1 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_10%,transparent),0_1px_2px_color-mix(in_oklab,var(--foreground)_8%,transparent)] transition-all duration-300 hover:border-foreground/50 hover:shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_12%,transparent),0_0_0_4px_color-mix(in_oklab,var(--foreground)_6%,transparent)]"
      >
        <Sun
          aria-hidden
          className={`absolute left-2 size-3.5 transition-all duration-400 ${
            isDark ? "opacity-40 scale-90" : "opacity-0 scale-50"
          }`}
        />
        <Moon
          aria-hidden
          className={`absolute right-2 size-3.5 transition-all duration-400 ${
            isDark ? "opacity-0 scale-50" : "opacity-40 scale-90"
          }`}
        />

        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-foreground text-background shadow-[0_4px_14px_color-mix(in_oklab,var(--foreground)_35%,transparent)] transition-[left] duration-[450ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:scale-90"
          style={{ left: isDark ? "calc(100% - 32px)" : "4px" }}
        >
          <span
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
              isDark ? "opacity-0 -rotate-180 scale-50" : "opacity-100 rotate-0 scale-100"
            }`}
          >
            <Sun className="size-3.5" strokeWidth={2.25} />
          </span>
          <span
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
              isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-180 scale-50"
            }`}
          >
            <Moon className="size-3.5" strokeWidth={2.25} />
          </span>
        </span>
      </button>

      {mounted &&
        burst &&
        createPortal(
          <div
            key={burst.key}
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden"
          >
            {/* Expanding ring shockwave */}
            <span
              className="absolute rounded-full border-2"
              style={{
                left: burst.originX,
                top: burst.originY,
                width: 0,
                height: 0,
                borderColor: burst.toDark ? "#ede6d3" : "#141414",
                animation: "theme-shockwave 2400ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
              }}
            />
            {burst.particles.map((p) => (
              <span
                key={p.id}
                className="absolute rounded-full"
                style={{
                  left: burst.originX,
                  top: burst.originY,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  background: p.color,
                  boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                  animation: `theme-page-spark ${p.duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${p.delay}ms forwards`,
                  ["--spark-x" as string]: `${p.x}px`,
                  ["--spark-y" as string]: `${p.y}px`,
                }}
              />
            ))}
          </div>,
          document.body,
        )}

      <style>{`
        @keyframes theme-page-spark {
          0% {
            transform: translate(-50%, -50%) scale(0.6);
            opacity: 1;
          }
          80% { opacity: 0.9; }
          100% {
            transform: translate(calc(-50% + var(--spark-x)), calc(-50% + var(--spark-y))) scale(0);
            opacity: 0;
          }
        }
        @keyframes theme-shockwave {
          0% {
            width: 0;
            height: 0;
            transform: translate(-50%, -50%);
            opacity: 0.55;
          }
          100% {
            width: 220vmax;
            height: 220vmax;
            transform: translate(-50%, -50%);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
