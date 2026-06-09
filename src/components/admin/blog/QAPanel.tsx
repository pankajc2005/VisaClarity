import { useQuery } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { getPostQAResults } from "@/lib/blog/blog.functions";
import { QAScoreRing } from "./QAScoreRing";

export function QABadge({ score, passed }: { score?: number | null; passed?: boolean | null }) {
  if (score == null)
    return (
      <span className="bg-muted/80 text-muted-foreground px-2 py-0.5 rounded text-[10px] border border-border">
        N/A
      </span>
    );

  if (score >= 80)
    return (
      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-mono border border-emerald-500/20">
        {score} / Pass
      </span>
    );
  if (score >= 60)
    return (
      <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-mono border border-amber-500/20">
        {score} / Warn
      </span>
    );
  return (
    <span className="bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-mono border border-red-500/20">
      {score} / Fail
    </span>
  );
}

export function QAPanel({ postId }: { postId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["qa-results", postId],
    queryFn: async () => await getPostQAResults({ data: { id: postId } }),
  });

  if (isLoading || !data) {
    return <div className="h-32 rounded bg-card animate-pulse border border-border" />;
  }

  return (
    <div className="border border-border-strong/60 rounded p-4 bg-card/30 backdrop-blur-sm text-[12px] shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
        <div>
          <h3 className="font-display text-[14px] font-medium">Quality Assurance</h3>
          <p className="text-[10px] text-muted-foreground">Automatic 8-step pipeline validation</p>
        </div>
        <QAScoreRing score={data.qa_score} />
      </div>

      <div className="space-y-3">
        {(data.checks || []).map((check: any, i: number) => (
          <div
            key={i}
            className="text-[12px] border-b border-border/40 pb-2 last:border-b-0 last:pb-0"
          >
            <div className="flex justify-between font-medium">
              <span className="flex items-center gap-1.5">
                {check.passed ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <X className="size-3.5 text-red-500" />
                )}
                <span className="text-foreground/90">{check.name}</span>
              </span>
              <span className="font-mono text-[10px]">{check.score}/100</span>
            </div>
            {check.details && (
              <div className="text-muted-foreground mt-1 ml-5 text-[11px] leading-relaxed">
                {check.details}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border text-[10px] text-muted-foreground flex justify-between">
        <span>
          Engine: <span className="font-mono">{data.llm_provider}</span>
        </span>
        <span className={`${data.qa_passed ? "text-emerald-500" : "text-red-400"} font-medium`}>
          {data.qa_passed ? "PASSED CONTRACT" : "CONTRACT REJECTED"}
        </span>
      </div>
    </div>
  );
}
