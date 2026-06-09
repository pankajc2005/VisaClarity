import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Terminal, X, Check, Copy } from "lucide-react";
import { getGenerationLogs } from "@/lib/blog/blog.functions";

/** Toast-style copy feedback */
export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return { copied, copy };
}

export function DebugLogsModal({
  item,
  onClose,
}: {
  item: { id?: string; topic: string; primary_keyword: string; status: string; logs?: any[] };
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"terminal" | "json">("terminal");
  const { copied, copy } = useCopyToClipboard();

  // Poll for logs if queue id is present and status is queued or processing
  const isLive = item.status === "processing" || item.status === "queued";
  const { data: polledLogs } = useQuery({
    queryKey: ["generation-logs", item.id],
    queryFn: async () => {
      if (!item.id) return item.logs || [];
      return await getGenerationLogs({ data: { queueId: item.id } });
    },
    enabled: !!item.id,
    refetchInterval: isLive ? 2000 : false, // Poll every 2s while live
  });

  const displayLogs = polledLogs || item.logs || [];

  const formattedJson = useMemo(() => {
    return JSON.stringify(displayLogs, null, 2);
  }, [displayLogs]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full mx-4 bg-card border border-border-strong rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <Terminal className="size-5 text-cream" />
            <div>
              <h3 className="font-display text-[15px] font-medium leading-none">
                Generation Debug Console
              </h3>
              <p className="text-[10px] text-muted-foreground truncate max-w-[400px] mt-1">
                {item.topic}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tabs and Actions bar */}
        <div className="p-3 border-b border-border flex items-center justify-between flex-wrap gap-2 bg-muted/10">
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded border border-border">
            <button
              onClick={() => setActiveTab("terminal")}
              className={`text-[10px] px-2.5 py-1 rounded font-medium uppercase tracking-wider transition-all ${
                activeTab === "terminal"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Console Output
            </button>
            <button
              onClick={() => setActiveTab("json")}
              className={`text-[10px] px-2.5 py-1 rounded font-medium uppercase tracking-wider transition-all ${
                activeTab === "json"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Raw JSON
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                item.status === "done"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : item.status === "failed"
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
              }`}
            >
              {item.status}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copy(formattedJson)}
              className="h-7 text-[10px] px-2 border-border-strong/50 flex items-center gap-1"
            >
              {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              {copied ? "Copied" : "Copy JSON"}
            </Button>
          </div>
        </div>

        {/* Console view */}
        <div className="flex-1 overflow-y-auto p-4 bg-zinc-950 text-zinc-300 font-mono text-[11px] leading-relaxed min-h-[300px]">
          {activeTab === "terminal" ? (
            <div className="space-y-4">
              <div className="text-zinc-500 border-b border-zinc-800 pb-2">
                === VisaClarity Blog Agent Generation Session Started ===
                <br />
                Target Topic: "{item.topic}"<br />
                Keyword: "{item.primary_keyword}"<br />
                Timestamp: {new Date().toLocaleString()}
              </div>

              {displayLogs && displayLogs.length > 0 ? (
                displayLogs.map((log: any, idx: number) => {
                  const time = log.created_at ? new Date(log.created_at).toLocaleTimeString() : "";
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-zinc-400 font-semibold border-l-2 border-zinc-800 pl-2">
                        <span className="flex items-center gap-1.5">
                          <span className={log.ok ? "text-emerald-500" : "text-red-400"}>
                            {log.ok ? "✓" : "✗"}
                          </span>
                          <span>[{log.step.toUpperCase()}]</span>
                          {log.tool && (
                            <span className="text-zinc-500 font-normal">via {log.tool}</span>
                          )}
                        </span>
                        <span className="text-zinc-600 text-[10px]">{time}</span>
                      </div>
                      <div className="pl-6 text-zinc-300">
                        {log.response_summary && (
                          <div className="whitespace-pre-wrap">{log.response_summary}</div>
                        )}
                        {log.error && (
                          <div className="text-red-400 bg-red-950/20 border border-red-900/30 p-2 rounded mt-1 whitespace-pre-wrap font-sans text-[11px]">
                            Error Detail: {log.error}
                          </div>
                        )}
                        {log.request && (
                          <details className="mt-1.5 text-[10px] text-zinc-500 cursor-pointer group">
                            <summary className="hover:text-zinc-400 select-none flex items-center gap-1 font-sans">
                              <span>▶ View step parameters / payload</span>
                            </summary>
                            <pre className="mt-1.5 p-2.5 bg-zinc-900/60 rounded border border-zinc-850 text-[9.5px] overflow-x-auto text-emerald-500/90 leading-normal max-h-60 overflow-y-auto">
                              {JSON.stringify(log.request, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-zinc-500 italic p-4 text-center">
                  No execution steps recorded yet. Start generation to view output stream.
                </div>
              )}

              {item.status === "processing" && (
                <div className="text-zinc-400 animate-pulse flex items-center gap-1.5 pt-2">
                  <span className="inline-block size-1.5 rounded-full bg-amber-500 animate-ping" />
                  <span>Waiting for next execution step...</span>
                </div>
              )}
            </div>
          ) : (
            <pre className="text-emerald-400 text-[10px] overflow-x-auto whitespace-pre">
              {formattedJson}
            </pre>
          )}
        </div>
      </motion.div>
    </div>
  );
}
