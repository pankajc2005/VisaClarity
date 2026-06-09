import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { FileText, Sparkles, Layers, Clock } from "lucide-react";
import { getDailyStats } from "@/lib/blog/blog.functions";

export function DailyStats() {
  const { data, isLoading } = useQuery({
    queryKey: ["blog-daily-stats"],
    queryFn: async () => await getDailyStats(),
    refetchInterval: 30000, // Refresh every 30s
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded bg-card/30 border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  const successRate =
    data.success + data.failed > 0
      ? Math.round((data.success / (data.success + data.failed)) * 100)
      : 0;

  const stats = [
    {
      label: "Generated Today",
      value: `${data.today} / 12`,
      icon: FileText,
      desc: "Daily cap quota",
    },
    {
      label: "QA Pass Rate",
      value: `${successRate}%`,
      icon: Sparkles,
      desc: "Articles passing QA",
    },
    { label: "Queue Depth", value: data.queueDepth, icon: Layers, desc: "Topics waiting in queue" },
    {
      label: "Last Generated",
      value: data.lastGenerated
        ? new Date(data.lastGenerated).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "None today",
      icon: Clock,
      desc: "Latest article timestamp",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((s, idx) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="border border-border-strong/50 rounded bg-card/60 backdrop-blur-sm p-4 relative overflow-hidden group shadow-sm"
        >
          <div className="absolute right-3 top-3 text-muted-foreground/20 group-hover:text-cream/10 transition-colors">
            <s.icon className="size-8 stroke-[1.5]" />
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] mb-1">
            {s.label}
          </div>
          <div className="font-display text-2xl font-medium text-foreground mb-0.5">{s.value}</div>
          <div className="text-[11px] text-muted-foreground">{s.desc}</div>
        </motion.div>
      ))}
    </div>
  );
}
