export function QAScoreRing({ score }: { score?: number | null }) {
  if (score == null) {
    return (
      <div className="size-16 rounded-full border border-border-strong flex flex-col items-center justify-center bg-card/50">
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">N/A</span>
      </div>
    );
  }

  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference;

  let color = "stroke-emerald-500";
  let bgColor = "bg-emerald-500/5";
  let textColor = "text-emerald-400";
  if (score < 60) {
    color = "stroke-red-500";
    bgColor = "bg-red-500/5";
    textColor = "text-red-400";
  } else if (score < 80) {
    color = "stroke-amber-500";
    bgColor = "bg-amber-500/5";
    textColor = "text-amber-400";
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`relative size-16 rounded-full flex items-center justify-center ${bgColor} border border-border-strong/50`}
      >
        <svg className="absolute inset-0 size-full -rotate-90">
          <circle
            cx="32"
            cy="32"
            r={radius}
            className="stroke-border/40"
            strokeWidth="3.5"
            fill="transparent"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            className={`${color} transition-all duration-700`}
            strokeWidth="3.5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span className={`text-base font-display font-semibold z-10 ${textColor}`}>{score}</span>
      </div>
      <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground font-medium">
        QA Score
      </span>
    </div>
  );
}
