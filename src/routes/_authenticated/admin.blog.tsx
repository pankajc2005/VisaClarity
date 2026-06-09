/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  addTopicToQueue,
  adminGetPost,
  adminListPosts,
  adminRegenerateHero,
  adminSetStatus,
  adminUpdatePost,
  cancelQueueItem,
  generateFromQueueItem,
  importCsvToQueue,
  listQueue,
  adminListAuthors,
  quickAddKeywords,
  processNextBatch,
  getDailyStats,
  getPostQAResults,
  bulkPublish,
  deleteQueueItem,
  updateQueueItemPriority,
  expandTopicQueueItem,
  getGenerationLogs,
} from "@/lib/blog/blog.functions";
import { importLegacyPosts } from "@/lib/blog/import-legacy.functions";
import {
  Play,
  Trash2,
  Edit3,
  Eye,
  ArrowUp,
  ArrowDown,
  Settings,
  FilePlus,
  Search,
  RefreshCw,
  X,
  Check,
  AlertCircle,
  BarChart2,
  Plus,
  Clock,
  FileText,
  Globe,
  Layers,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
  User,
  ExternalLink,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Info,
  Save,
  Upload,
  Undo2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Link2,
  Terminal,
  Bug,
  Code,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Extracted Subcomponents
import { ConfirmDialog } from "@/components/admin/blog/ConfirmDialog";
import { DebugLogsModal } from "@/components/admin/blog/DebugLogsModal";
import { DailyStats } from "@/components/admin/blog/DailyStats";
import { QuickPasteBox } from "@/components/admin/blog/QuickPasteBox";
import { BatchControls } from "@/components/admin/blog/BatchControls";
import { QABadge, QAPanel } from "@/components/admin/blog/QAPanel";
import { MarkdownPreview } from "@/components/admin/blog/MarkdownRenderer";

export const Route = createFileRoute("/_authenticated/admin/blog")({
  component: AdminBlogPage,
});

type Tab = "queue" | "posts" | "editor";

/** Relative time display */
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getGenerationProgress(logs: any[]) {
  if (!logs || logs.length === 0) return { percent: 5, label: "Initializing..." };

  const stepWeights: Record<string, { percent: number; label: string }> = {
    plan: { percent: 15, label: "Planning article structure" },
    expand: { percent: 30, label: "Expanding topic and keywords" },
    research: { percent: 45, label: "Crawling sources and research" },
    draft: { percent: 60, label: "Writing article content" },
    qa: { percent: 75, label: "Running quality assurance checks" },
    image: { percent: 90, label: "Generating hero cover image" },
    finalize: { percent: 100, label: "Finalizing and saving article" },
  };

  let lastStep = "plan";
  let lastLog = logs[0];

  for (const l of logs) {
    if (stepWeights[l.step]) {
      lastStep = l.step;
      lastLog = l;
    }
  }

  const weight = stepWeights[lastStep] || { percent: 10, label: "Processing..." };

  if (!lastLog.ok) {
    return {
      percent: weight.percent,
      label: `Failed at: ${lastStep} (${lastLog.error ?? "error"})`,
      isError: true,
    };
  }

  return { percent: weight.percent, label: weight.label, isError: false };
}

function AdminBlogPage() {
  const [tab, setTab] = useState<Tab>("queue");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "in_review" | "published" | "archived"
  >("in_review");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [hasProcessing, setHasProcessing] = useState(false);
  const [debugLogsItem, setDebugLogsItem] = useState<any | null>(null);
  const [lastGenerateInstantly, setLastGenerateInstantly] = useState(true);

  const qc = useQueryClient();

  const queue = useQuery({
    queryKey: ["admin-blog", "queue"],
    queryFn: () => listQueue(),
    refetchInterval: hasProcessing ? 2000 : 10000,
  });

  useEffect(() => {
    const isProcessing = (queue.data?.queue ?? []).some((q: any) => q.status === "processing");
    if (isProcessing !== hasProcessing) {
      setHasProcessing(isProcessing);
    }
  }, [queue.data?.queue, hasProcessing]);
  const posts = useQuery({
    queryKey: ["admin-blog", "posts", statusFilter],
    queryFn: () => adminListPosts({ data: { status: statusFilter } }),
  });
  const authors = useQuery({
    queryKey: ["admin-blog", "authors"],
    queryFn: () => adminListAuthors(),
  });

  const addTopic = useMutation({
    mutationFn: addTopicToQueue,
    onSuccess: (r: any) => {
      toast.success("Topic added to queue");
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
      if (lastGenerateInstantly && r?.queue_id) {
        generate.mutate({ id: r.queue_id });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const importCsv = useMutation({
    mutationFn: importCsvToQueue,
    onSuccess: (r) => {
      toast.success(`Imported ${r.inserted} topics`);
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const importLegacy = useMutation({
    mutationFn: importLegacyPosts,
    onSuccess: (r) => {
      toast.success(`Imported ${r.imported}/${r.total} legacy posts`);
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const generate = useMutation({
    mutationFn: ({ id, profile }: { id: string; profile?: "balanced" | "quality" | "fast" }) =>
      generateFromQueueItem({ data: { id, llm_profile: profile } }),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success("Generation started in background");
      } else {
        toast.error(`Generation failed: ${r.error ?? r.refusal}`);
      }
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: ({ id }: { id: string }) => cancelQueueItem({ data: { id } }),
    onSuccess: () => {
      toast.success("Cancelled");
      qc.invalidateQueries({ queryKey: ["admin-blog", "queue"] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: (variables: { id: string }) => deleteQueueItem({ data: variables }),
    onSuccess: () => {
      toast.success("Queue item deleted");
      qc.invalidateQueries({ queryKey: ["admin-blog", "queue"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updatePriority = useMutation({
    mutationFn: (variables: { id: string; priority: number }) =>
      updateQueueItemPriority({ data: variables }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-blog", "queue"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const expandTopic = useMutation({
    mutationFn: (variables: { id: string }) => expandTopicQueueItem({ data: variables }),
    onSuccess: (res) => {
      toast.success(`Expanded keyword: "${res.topic}"`);
      qc.invalidateQueries({ queryKey: ["admin-blog", "queue"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publishM = useMutation({
    mutationFn: async (ids: string[]) => await bulkPublish({ data: { ids } }),
    onSuccess: (data) => {
      toast.success(`Published ${data.published} posts`);
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
    },
    onError: (e) => toast.error(e.message),
  });

  // Client-side search filters
  const filteredQueue = useMemo(() => {
    return (queue.data?.queue ?? []).filter(
      (q: any) =>
        q.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.primary_keyword.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [queue.data?.queue, searchQuery]);

  const filteredPosts = useMemo(() => {
    return (posts.data?.posts ?? []).filter(
      (p: any) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())),
    );
  }, [posts.data?.posts, searchQuery]);

  const handlePriorityChange = (id: string, current: number, delta: number) => {
    const nextVal = Math.min(Math.max(current + delta, 1), 10);
    updatePriority.mutate({ id, priority: nextVal });
  };

  const handleClearQueue = async () => {
    const items = queue.data?.queue ?? [];
    const clearable = items.filter((x: any) => x.status === "cancelled" || x.status === "failed");
    if (clearable.length === 0) {
      toast.info("No failed or cancelled items to clear");
      return;
    }
    let successCount = 0;
    for (const item of clearable) {
      try {
        await deleteQueueItem({ data: { id: item.id } });
        successCount++;
      } catch (err) {
        // ignore individual delete failure
      }
    }
    toast.success(`Cleared ${successCount} items from queue`);
    qc.invalidateQueries({ queryKey: ["admin-blog"] });
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-all duration-700">
      {/* Subnav header */}
      <nav className="border-b border-border h-16 px-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="text-[13px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Dashboard
          </Link>
          <span className="text-border">|</span>
          <h1 className="font-display text-[17px] font-medium tracking-tight">
            Blog Control Center
          </h1>
        </div>

        {/* Navigation tabs */}
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded border border-border-strong/40">
          <button
            onClick={() => {
              setTab("queue");
              setEditingId(null);
            }}
            className={`text-[12px] px-3.5 py-1.5 rounded transition-all font-medium flex items-center gap-1.5 ${
              tab === "queue" && !editingId
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="size-3.5" /> Topic Queue
          </button>
          <button
            onClick={() => {
              setTab("posts");
              setEditingId(null);
            }}
            className={`text-[12px] px-3.5 py-1.5 rounded transition-all font-medium flex items-center gap-1.5 ${
              tab === "posts" && !editingId
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="size-3.5" /> Posts
          </button>
          {editingId && (
            <span className="text-[12px] px-3.5 py-1.5 bg-cream/10 text-cream rounded font-medium border border-cream/20 flex items-center gap-1.5 animate-pulse">
              <Edit3 className="size-3.5" /> Editor Active
            </span>
          )}
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <DailyStats />

        {/* Search and Filters Bar */}
        {!editingId && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder={
                  tab === "queue"
                    ? "Search queue by keyword..."
                    : "Search posts by title/category..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-[13px] bg-card/40 border border-border-strong/50 focus:border-cream/40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {tab === "posts" && (
              <div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded border border-border/40">
                {(["in_review", "draft", "published", "archived", "all"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded text-[11px] uppercase tracking-wider font-semibold transition-all ${
                      statusFilter === s
                        ? "bg-cream text-cream-foreground font-bold shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            )}

            {tab === "queue" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearQueue}
                className="text-[12px] h-9 border-destructive/20 text-destructive/80 hover:bg-destructive/5 hover:border-destructive/40"
              >
                Clear Cancelled/Failed
              </Button>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          {tab === "queue" && !editingId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid lg:grid-cols-[1fr_380px] gap-8"
            >
              {/* Queue Items Table */}
              <section>
                {/* Onboarding Guide Banner */}
                <div className="bg-cream/5 border border-cream/15 p-5 rounded-lg mb-6 flex gap-4 items-start">
                  <Sparkles className="size-5 text-cream shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-display font-medium text-[15px] text-cream">
                      AI Blog Control Center Onboarding
                    </h3>
                    <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                      Follow these steps to generate a blog post:
                    </p>
                    <ol className="list-decimal pl-4 mt-1.5 space-y-1 text-[11.5px] text-muted-foreground leading-normal">
                      <li>
                        Use the <strong className="text-foreground">Add Single Topic</strong> or{" "}
                        <strong className="text-foreground">Quick Paste</strong> panels on the
                        right.
                      </li>
                      <li>
                        Make sure the{" "}
                        <strong className="text-foreground">
                          "Generate article instantly in background"
                        </strong>{" "}
                        checkbox is checked to run the generation immediately.
                      </li>
                      <li>
                        If you want to queue topics first and run them later, uncheck it, then click
                        the <strong className="text-foreground">Play/Draft</strong> button next to
                        the topic in the table below, or use the{" "}
                        <strong className="text-foreground">Batch Process Queue</strong> panel.
                      </li>
                    </ol>
                  </div>
                </div>

                <BatchControls
                  onProcessed={() => qc.invalidateQueries({ queryKey: ["admin-blog"] })}
                />

                <div className="border border-border-strong/50 rounded-lg overflow-hidden bg-card/20 backdrop-blur-sm shadow-sm">
                  {queue.isLoading ? (
                    <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                      <RefreshCw className="size-6 animate-spin text-cream" />
                      Loading queue data...
                    </div>
                  ) : filteredQueue.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                      No queue items found matching your criteria.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[13px] text-left border-collapse">
                        <thead className="bg-muted/40 text-[10px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border-strong/40">
                          <tr>
                            <th className="p-3">Topic & Keyword</th>
                            <th className="p-3 w-24">Priority</th>
                            <th className="p-3 w-24">Profile</th>
                            <th className="p-3 w-28">Status</th>
                            <th className="p-3 w-24">Created</th>
                            <th className="p-3 w-44 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredQueue.map((q: any, idx: number) => {
                            const isProcessing = q.status === "processing";
                            const isQueued = q.status === "queued";
                            const isFailed = q.status === "failed";

                            return (
                              <motion.tr
                                key={q.id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                                className="border-b border-border/50 hover:bg-card/40 transition-colors last:border-b-0"
                              >
                                <td className="p-3">
                                  <div className="font-medium text-foreground/90 leading-snug">
                                    {q.topic}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground mt-1 flex flex-wrap items-center gap-1.5">
                                    <span className="flex items-center gap-1">
                                      <Globe className="size-3" /> {q.primary_keyword}
                                    </span>
                                    {q.secondary_keywords && q.secondary_keywords.length > 0 && (
                                      <>
                                        <span className="text-border">•</span>
                                        <span
                                          className="truncate max-w-[200px]"
                                          title={q.secondary_keywords.join(", ")}
                                        >
                                          {q.secondary_keywords.join(", ")}
                                        </span>
                                      </>
                                    )}
                                  </div>

                                  {isProcessing &&
                                    (() => {
                                      const progress = getGenerationProgress(q.logs);
                                      return (
                                        <div className="mt-3.5 space-y-2 max-w-md bg-muted/20 border border-border/40 p-2.5 rounded">
                                          <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground">
                                            <span className="flex items-center gap-1.5 font-medium">
                                              <span className="inline-block size-1.5 rounded-full bg-amber-500 animate-ping" />
                                              {progress.label}
                                            </span>
                                            <span className="font-bold">{progress.percent}%</span>
                                          </div>
                                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border/20">
                                            <div
                                              className="h-full bg-gradient-to-r from-amber-500 to-gold transition-all duration-500 rounded-full"
                                              style={{ width: `${progress.percent}%` }}
                                            />
                                          </div>
                                          {q.logs && q.logs.length > 0 && (
                                            <details className="text-[10px] text-muted-foreground font-sans mt-2 cursor-pointer group">
                                              <summary className="hover:text-foreground transition-colors font-semibold flex items-center gap-1">
                                                <span>View active steps log ({q.logs.length})</span>
                                              </summary>
                                              <ul className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pl-2 border-l border-border-strong/50 py-1 font-mono text-[9px]">
                                                {q.logs.map((l: any, i: number) => (
                                                  <li
                                                    key={i}
                                                    className="flex flex-col gap-0.5 border-b border-border/10 pb-1 last:border-0 last:pb-0"
                                                  >
                                                    <span className="font-semibold text-foreground/80 flex items-center gap-1">
                                                      {l.ok ? (
                                                        <span className="text-emerald-500">✓</span>
                                                      ) : (
                                                        <span className="text-red-500">✗</span>
                                                      )}
                                                      {l.step.toUpperCase()}{" "}
                                                      {l.tool ? `(${l.tool})` : ""}
                                                    </span>
                                                    {l.response_summary && (
                                                      <span className="text-[9px] text-muted-foreground leading-normal block pl-3">
                                                        {l.response_summary}
                                                      </span>
                                                    )}
                                                    {l.error && (
                                                      <span className="text-[9px] text-red-400 leading-normal block pl-3">
                                                        Error: {l.error}
                                                      </span>
                                                    )}
                                                  </li>
                                                ))}
                                              </ul>
                                            </details>
                                          )}
                                        </div>
                                      );
                                    })()}

                                  {!isProcessing &&
                                    (q.status === "failed" || q.status === "done") &&
                                    q.logs &&
                                    q.logs.length > 0 && (
                                      <div className="mt-2.5 max-w-md">
                                        <details className="text-[10px] text-muted-foreground font-sans cursor-pointer">
                                          <summary className="hover:text-foreground transition-colors font-medium">
                                            View execution logs ({q.logs.length})
                                          </summary>
                                          <ul className="mt-2 space-y-1.5 max-h-32 overflow-y-auto pl-2 border-l border-border-strong/50 py-1 font-mono text-[9px]">
                                            {q.logs.map((l: any, i: number) => (
                                              <li
                                                key={i}
                                                className="flex flex-col gap-0.5 border-b border-border/10 pb-1 last:border-0 last:pb-0"
                                              >
                                                <span className="font-semibold text-foreground/80 flex items-center gap-1">
                                                  {l.ok ? (
                                                    <span className="text-emerald-500">✓</span>
                                                  ) : (
                                                    <span className="text-red-500">✗</span>
                                                  )}
                                                  {l.step.toUpperCase()}{" "}
                                                  {l.tool ? `(${l.tool})` : ""}
                                                </span>
                                                {l.response_summary && (
                                                  <span className="text-[9px] text-muted-foreground leading-normal block pl-3">
                                                    {l.response_summary}
                                                  </span>
                                                )}
                                                {l.error && (
                                                  <span className="text-[9px] text-red-500 leading-normal block pl-3">
                                                    Error: {l.error}
                                                  </span>
                                                )}
                                              </li>
                                            ))}
                                          </ul>
                                        </details>
                                      </div>
                                    )}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono bg-muted px-2 py-0.5 rounded text-[11px] font-semibold border border-border">
                                      {q.priority}
                                    </span>
                                    {isQueued && (
                                      <div className="flex flex-col">
                                        <button
                                          onClick={() => handlePriorityChange(q.id, q.priority, 1)}
                                          className="text-muted-foreground hover:text-foreground"
                                          disabled={updatePriority.isPending}
                                        >
                                          <ChevronUp className="size-3" />
                                        </button>
                                        <button
                                          onClick={() => handlePriorityChange(q.id, q.priority, -1)}
                                          className="text-muted-foreground hover:text-foreground"
                                          disabled={updatePriority.isPending}
                                        >
                                          <ChevronDown className="size-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded font-medium border ${
                                      q.llm_profile === "quality"
                                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                        : q.llm_profile === "fast"
                                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                          : "bg-muted text-muted-foreground border-border"
                                    }`}
                                  >
                                    {q.llm_profile ?? "balanced"}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`font-mono text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                                      isProcessing
                                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse"
                                        : q.status === "done"
                                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                          : isFailed
                                            ? "bg-red-500/20 text-red-600 dark:text-red-400"
                                            : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {q.status}
                                  </span>
                                  {q.error && (
                                    <p
                                      className="text-red-500 dark:text-red-400 text-[10px] mt-1 leading-snug max-w-[180px] truncate"
                                      title={q.error}
                                    >
                                      {q.error}
                                    </p>
                                  )}
                                </td>
                                <td className="p-3">
                                  <span
                                    className="text-[11px] text-muted-foreground font-mono"
                                    title={new Date(q.created_at).toLocaleString()}
                                  >
                                    {timeAgo(q.created_at)}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {!q.expanded && isQueued && (
                                      <button
                                        onClick={() => expandTopic.mutate({ id: q.id })}
                                        disabled={expandTopic.isPending}
                                        title="Expand Keyword to Brief"
                                        className="p-1.5 text-muted-foreground hover:text-cream hover:bg-muted rounded transition-colors"
                                      >
                                        <Sparkles className="size-4" />
                                      </button>
                                    )}
                                    {q.logs && q.logs.length > 0 && (
                                      <button
                                        onClick={() => setDebugLogsItem(q)}
                                        title="Open Debug Console"
                                        className="p-1.5 text-muted-foreground hover:text-cream hover:bg-muted rounded transition-colors"
                                      >
                                        <Terminal className="size-3.5" />
                                      </button>
                                    )}
                                    {isQueued && (
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() =>
                                          generate.mutate({ id: q.id, profile: q.llm_profile })
                                        }
                                        disabled={generate.isPending}
                                        className="h-7 text-[11px] bg-cream text-cream-foreground hover:bg-cream/90 flex items-center gap-1"
                                      >
                                        <Play className="size-3 fill-current" /> Draft
                                      </Button>
                                    )}
                                    {isProcessing && (
                                      <button
                                        onClick={() => cancel.mutate({ id: q.id })}
                                        title="Cancel Generation"
                                        className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                      >
                                        <X className="size-4" />
                                      </button>
                                    )}
                                    {isFailed && (
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() =>
                                          generate.mutate({ id: q.id, profile: q.llm_profile })
                                        }
                                        disabled={generate.isPending}
                                        className="h-7 text-[11px]"
                                      >
                                        Retry
                                      </Button>
                                    )}
                                    {q.post_id && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setEditingId(q.post_id!);
                                          setTab("editor");
                                        }}
                                        className="h-7 text-[11px] border-border-strong/60"
                                      >
                                        Open
                                      </Button>
                                    )}
                                    {(isQueued || isFailed || q.status === "cancelled") && (
                                      <button
                                        onClick={() => deleteItem.mutate({ id: q.id })}
                                        title="Delete from Queue"
                                        disabled={deleteItem.isPending}
                                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded transition-all"
                                      >
                                        <Trash2 className="size-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  className="mt-6 text-[12px] h-9 border-border-strong/50"
                  onClick={() => importLegacy.mutate(undefined)}
                  disabled={importLegacy.isPending}
                >
                  <RefreshCw
                    className={`size-3.5 mr-1.5 ${importLegacy.isPending ? "animate-spin" : ""}`}
                  />
                  Import legacy posts (one-shot)
                </Button>
              </section>

              {/* Side Panels */}
              <aside className="space-y-6">
                <div className="border border-border-strong/60 p-5 rounded bg-card/40 backdrop-blur-sm shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Plus className="size-4 text-cream" />
                    <h3 className="font-display font-medium text-[15px]">Add Single Topic</h3>
                  </div>
                  <TopicForm
                    onSubmit={(v, instant) => {
                      setLastGenerateInstantly(instant);
                      addTopic.mutate({ data: v });
                    }}
                    pending={addTopic.isPending}
                  />
                </div>

                <QuickPasteBox onAdded={() => qc.invalidateQueries({ queryKey: ["admin-blog"] })} />

                <div className="border border-border-strong/60 p-5 rounded bg-card/40 backdrop-blur-sm shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <FilePlus className="size-4 text-cream" />
                    <h3 className="font-display font-medium text-[15px]">Import CSV</h3>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">
                    Headers required:{" "}
                    <span className="font-mono text-foreground/80">topic, primary_keyword</span>.
                    <br />
                    Optional:{" "}
                    <span className="font-mono text-foreground/80">
                      secondary_keywords (pipe-separated), audience, angle, priority
                    </span>
                    .
                  </p>
                  <CsvForm
                    onSubmit={(csv) => importCsv.mutate({ data: { csv } })}
                    pending={importCsv.isPending}
                  />
                </div>
              </aside>
            </motion.div>
          )}

          {tab === "posts" && !editingId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-[1200px] mx-auto"
            >
              {/* Posts Table */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <FileText className="size-5 text-cream" />
                  <h2 className="font-display text-[18px] font-medium">
                    Generated Posts ({filteredPosts.length})
                  </h2>
                </div>

                {selectedIds.size > 0 && (
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
                    <Button
                      size="sm"
                      onClick={() => publishM.mutate(Array.from(selectedIds))}
                      disabled={publishM.isPending}
                      className="text-[12px] bg-cream text-cream-foreground hover:bg-cream/90 shadow-sm"
                    >
                      {publishM.isPending
                        ? "Publishing..."
                        : `Publish Selected (${selectedIds.size})`}
                    </Button>
                  </motion.div>
                )}
              </div>

              <div className="border border-border-strong/50 rounded-lg overflow-hidden bg-card/20 backdrop-blur-sm shadow-sm">
                {posts.isLoading ? (
                  <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                    <RefreshCw className="size-6 animate-spin text-cream" />
                    Loading articles...
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    No articles found matching the current filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px] text-left border-collapse">
                      <thead className="bg-muted/40 text-[10px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border-strong/40">
                        <tr>
                          <th className="p-3 w-8">
                            <input
                              type="checkbox"
                              className="rounded border-borderaccent text-cream focus:ring-cream/40"
                              onChange={(e) => {
                                const allReviewable = filteredPosts.filter(
                                  (p: any) => p.status === "in_review",
                                );
                                if (e.target.checked) {
                                  setSelectedIds(new Set(allReviewable.map((p: any) => p.id)));
                                } else {
                                  setSelectedIds(new Set());
                                }
                              }}
                            />
                          </th>
                          <th className="p-3">Title</th>
                          <th className="p-3 w-28">Status</th>
                          <th className="p-3 w-32">Category</th>
                          <th className="p-3 w-24">QA Score</th>
                          <th className="p-3 w-40">Updated</th>
                          <th className="p-3 w-20 text-right"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPosts.map((p: any, idx: number) => {
                          const canSelect = p.status === "in_review";
                          return (
                            <motion.tr
                              key={p.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                              className="border-b border-border/50 hover:bg-card/40 transition-colors last:border-b-0"
                            >
                              <td className="p-3">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(p.id)}
                                  disabled={!canSelect}
                                  className="rounded border-border text-cream focus:ring-cream/40 disabled:opacity-40"
                                  onChange={(e) => {
                                    const newSet = new Set(selectedIds);
                                    if (e.target.checked) newSet.add(p.id);
                                    else newSet.delete(p.id);
                                    setSelectedIds(newSet);
                                  }}
                                />
                              </td>
                              <td className="p-3">
                                <div className="font-medium text-foreground/90 leading-snug">
                                  {p.title}
                                </div>
                                {p.slug && (
                                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                    {p.slug}
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                <span
                                  className={`font-mono text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                                    p.status === "published"
                                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                      : p.status === "in_review"
                                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                        : p.status === "draft"
                                          ? "bg-muted text-muted-foreground"
                                          : "bg-red-500/15 text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {p.status}
                                </span>
                              </td>
                              <td className="p-3 text-muted-foreground font-medium">
                                {p.category || "—"}
                              </td>
                              <td className="p-3">
                                <QABadge score={p.qa_score} passed={p.qa_passed} />
                              </td>
                              <td className="p-3 text-muted-foreground text-[11px] font-sans">
                                {new Date(p.updated_at ?? "").toLocaleString([], {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {p.status === "published" && p.slug && (
                                    <a
                                      href={`/blog/${p.slug}`}
                                      target="_blank"
                                      rel="noopener"
                                      className="inline-flex items-center gap-1 h-8 px-2 rounded text-[11px] text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                                      title="View live on website"
                                    >
                                      <ExternalLink className="size-3.5" />
                                    </a>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingId(p.id);
                                      setTab("editor");
                                    }}
                                    className="h-8 text-[12px] hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1"
                                  >
                                    <Edit3 className="size-3.5" /> Open
                                  </Button>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {tab === "editor" && editingId && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PostEditor
                id={editingId}
                authors={authors.data?.authors ?? []}
                onClose={() => {
                  setEditingId(null);
                  setTab("posts");
                }}
                setDebugLogsItem={setDebugLogsItem}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Debug Logs Console Modal */}
      {debugLogsItem && (
        <DebugLogsModal item={debugLogsItem} onClose={() => setDebugLogsItem(null)} />
      )}
    </div>
  );
}

function TopicForm({
  onSubmit,
  pending,
}: {
  onSubmit: (
    v: {
      topic: string;
      primary_keyword: string;
      angle?: string;
      llm_profile: "balanced" | "quality" | "fast";
    },
    generateInstantly: boolean,
  ) => void;
  pending: boolean;
}) {
  const [topic, setTopic] = useState("");
  const [kw, setKw] = useState("");
  const [angle, setAngle] = useState("");
  const [profile, setProfile] = useState<"balanced" | "quality" | "fast">("balanced");
  const [generateInstantly, setGenerateInstantly] = useState(true);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (topic && kw) {
          onSubmit(
            { topic, primary_keyword: kw, angle: angle || undefined, llm_profile: profile },
            generateInstantly,
          );
          setTopic("");
          setKw("");
          setAngle("");
        }
      }}
    >
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
          Topic Title
        </label>
        <Input
          placeholder="Topic title"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
          className="bg-background/80 h-9 text-[12px]"
        />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
          Primary Keyword
        </label>
        <Input
          placeholder="Primary keyword"
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          required
          className="bg-background/80 h-9 text-[12px]"
        />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
          Angle / Perspective
        </label>
        <Input
          placeholder="Angle (optional)"
          value={angle}
          onChange={(e) => setAngle(e.target.value)}
          className="bg-background/80 h-9 text-[12px]"
        />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
          LLM Generation Profile
        </label>
        <select
          value={profile}
          onChange={(e) => setProfile(e.target.value as any)}
          className="w-full bg-background border border-border rounded p-2 text-[12px] font-sans focus:outline-none"
        >
          <option value="balanced">Balanced Fallback</option>
          <option value="quality">High Quality (Groq/Llama)</option>
          <option value="fast">Fast & Economical (Gemini)</option>
        </select>
      </div>

      <div className="flex items-center gap-2 py-1">
        <input
          type="checkbox"
          id="generateInstantly"
          checked={generateInstantly}
          onChange={(e) => setGenerateInstantly(e.target.checked)}
          className="rounded border-border text-cream focus:ring-cream/40"
        />
        <label
          htmlFor="generateInstantly"
          className="text-[11px] text-muted-foreground select-none cursor-pointer"
        >
          Generate article instantly in background
        </label>
      </div>

      <Button
        type="submit"
        size="sm"
        disabled={pending || !topic || !kw}
        className="w-full text-[12px] h-9 bg-cream text-cream-foreground hover:bg-cream/90"
      >
        {pending ? "Adding..." : "Queue & Generate Topic"}
      </Button>
    </form>
  );
}

function CsvForm({ onSubmit, pending }: { onSubmit: (csv: string) => void; pending: boolean }) {
  const [csv, setCsv] = useState(
    "topic,primary_keyword,secondary_keywords,audience,angle,priority\n",
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(csv);
      }}
      className="space-y-3"
    >
      <Textarea
        rows={6}
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        className="font-mono text-[11px] bg-background border border-border rounded p-2 focus:outline-none focus:ring-1 focus:ring-cream/40"
      />
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) f.text().then(setCsv);
          }}
          className="text-[11px] max-w-full truncate text-muted-foreground"
        />
        <Button
          type="submit"
          size="sm"
          disabled={pending || csv.length < 70}
          className="h-8 text-[12px] bg-cream text-cream-foreground ml-auto"
        >
          Import CSV
        </Button>
      </div>
    </form>
  );
}

function PostEditor({
  id,
  authors,
  onClose,
  setDebugLogsItem,
}: {
  id: string;
  authors: Array<{ id: string; slug: string; name: string }>;
  onClose: () => void;
  setDebugLogsItem: (item: any) => void;
}) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-blog", "post", id],
    queryFn: () => adminGetPost({ data: { id } }),
  });

  const post = q.data?.post;
  const logs = q.data?.logs ?? [];

  const [edited, setEdited] = useState<Record<string, unknown>>({});
  const [editorMode, setEditorMode] = useState<"write" | "preview" | "split">("split");

  const dirty = (k: string, v: unknown) => setEdited((p) => ({ ...p, [k]: v }));
  const get = <T,>(k: string, fallback: T): T =>
    k in edited
      ? (edited[k] as T)
      : post
        ? ((post as unknown as Record<string, T>)[k] ?? fallback)
        : fallback;

  const selectedAuthorId = get("author_id", post?.author_id);
  const selectedAuthor = selectedAuthorId
    ? authors.find((a: any) => a.id === selectedAuthorId)
    : null;
  const hasChanges = Object.keys(edited).length > 0;
  const [confirmAction, setConfirmAction] = useState<{ action: string; status?: string } | null>(
    null,
  );
  const { copied, copy } = useCopyToClipboard();

  const save = useMutation({
    mutationFn: () => adminUpdatePost({ data: { id, ...(edited as object) } }),
    onSuccess: () => {
      toast.success("Saved successfully");
      setEdited({});
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: (status: "draft" | "in_review" | "published" | "archived") =>
      adminSetStatus({ data: { id, status } }),
    onSuccess: (_d, status) => {
      toast.success(`Status updated to: ${status}`);
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const regen = useMutation({
    mutationFn: (provider_index: number) => adminRegenerateHero({ data: { id, provider_index } }),
    onSuccess: (r) => {
      toast.success(`Hero regenerated: ${r.provider}`);
      qc.invalidateQueries({ queryKey: ["admin-blog", "post", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Editor stats calculations
  const bodyText = get("body_mdx", post?.body_mdx || "");
  const wordCount = useMemo(() => {
    return bodyText.trim() === "" ? 0 : bodyText.trim().split(/\s+/).length;
  }, [bodyText]);

  const charCount = bodyText.length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  const keywordDensity = useMemo(() => {
    const primaryKeyword = post?.primary_keyword || "";
    if (!primaryKeyword || !bodyText) return 0;
    try {
      const regex = new RegExp(primaryKeyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "gi");
      const matches = bodyText.match(regex);
      const matchCount = matches ? matches.length : 0;
      return wordCount > 0 ? parseFloat(((matchCount / wordCount) * 100).toFixed(2)) : 0;
    } catch (e) {
      return 0;
    }
  }, [bodyText, post?.primary_keyword, wordCount]);

  if (q.isLoading)
    return <div className="p-8 text-center text-muted-foreground">Loading editor assets...</div>;
  if (!post) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Article assets not found.{" "}
        <Button onClick={onClose} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const meta = (post.generation_meta ?? {}) as {
    confidence?: string;
    needs_source_count?: number;
    research_by_tier?: Record<string, number>;
    voice_notes?: string;
  };
  const sources = Array.isArray(post.sources)
    ? (post.sources as Array<{ index: number; tier: string; url: string; title: string }>)
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Editor top toolbar */}
      <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (hasChanges) {
                setConfirmAction({ action: "discard" });
              } else {
                onClose();
              }
            }}
            className="text-muted-foreground hover:text-foreground h-8 text-[12px] shrink-0"
          >
            <ArrowLeft className="size-4 mr-1" /> Back
          </Button>
          <span className="text-border shrink-0">/</span>
          <span
            className={`font-mono text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shrink-0 ${
              post.status === "published"
                ? "bg-emerald-500/15 text-emerald-500"
                : post.status === "in_review"
                  ? "bg-amber-500/15 text-amber-500"
                  : "bg-muted text-muted-foreground"
            } border border-border`}
          >
            {post.status}
          </span>
          <button
            onClick={() => copy(`/blog/${post.slug}`)}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 truncate max-w-[220px] transition-colors"
            title="Copy slug to clipboard"
          >
            {copied ? (
              <Check className="size-3 text-emerald-500 shrink-0" />
            ) : (
              <Copy className="size-3 shrink-0" />
            )}
            <span className="truncate">{post.slug}</span>
          </button>
          {post.status === "published" && post.slug && (
            <a
              href={`/blog/${post.slug}`}
              target="_blank"
              rel="noopener"
              className="text-[11px] text-emerald-500 hover:text-emerald-400 flex items-center gap-1 shrink-0 transition-colors"
              title="View published article"
            >
              <ExternalLink className="size-3.5" />
            </a>
          )}
          {hasChanges && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 font-semibold border border-amber-500/20 shrink-0 animate-pulse">
              Unsaved
            </span>
          )}
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded border border-border-strong/40">
          <button
            onClick={() => setEditorMode("write")}
            className={`text-[11px] px-3 py-1 rounded font-semibold transition-all flex items-center gap-1 ${
              editorMode === "write"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Edit3 className="size-3" /> Edit
          </button>
          <button
            onClick={() => setEditorMode("preview")}
            className={`text-[11px] px-3 py-1 rounded font-semibold transition-all flex items-center gap-1 ${
              editorMode === "preview"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="size-3" /> Live Preview
          </button>
          <button
            onClick={() => setEditorMode("split")}
            className={`text-[11px] px-3 py-1 rounded font-semibold transition-all flex items-center gap-1 ${
              editorMode === "split"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="size-3" /> Split View
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        {/* Left pane: Write, Preview, or Split View */}
        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {editorMode === "write" && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                    Article Title
                  </label>
                  <Input
                    value={get("title", post.title)}
                    onChange={(e) => dirty("title", e.target.value)}
                    className="text-[17px] font-display font-medium bg-background border-border-strong/60"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                    Subtitle
                  </label>
                  <Input
                    value={get("subtitle", post.subtitle ?? "")}
                    onChange={(e) => dirty("subtitle", e.target.value)}
                    placeholder="Provide subtitle..."
                    className="bg-background border-border-strong/60 text-[13px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                    Meta Description (SEO)
                  </label>
                  <Textarea
                    value={get("description", post.description)}
                    onChange={(e) => dirty("description", e.target.value)}
                    rows={2}
                    placeholder="Brief description for SEO search queries..."
                    className="bg-background border-border-strong/60 text-[13px] rounded focus:ring-1 focus:ring-cream/40"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                    MDX Body Content
                  </label>
                  <Textarea
                    value={get("body_mdx", post.body_mdx)}
                    onChange={(e) => dirty("body_mdx", e.target.value)}
                    rows={26}
                    className="font-mono text-[12px] leading-[1.6] bg-background border border-border-strong rounded p-3 focus:outline-none focus:ring-1 focus:ring-cream/40"
                  />
                </div>
              </div>
            )}

            {editorMode === "preview" && (
              <MarkdownPreview
                text={bodyText}
                title={get("title", post.title)}
                subtitle={get("subtitle", post.subtitle || "")}
                category={get("category", post.category || "")}
                heroImageUrl={post.hero_image_url || undefined}
                heroImageAlt={get("hero_image_alt", post.hero_image_alt || "")}
                author={selectedAuthor}
                sources={post.sources}
                generationMeta={post.generation_meta}
                updatedAt={post.updated_at}
              />
            )}

            {editorMode === "split" && (
              <div className="grid md:grid-cols-2 gap-6 items-start">
                {/* Edit column */}
                <div className="space-y-4 sticky top-20">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                      Article Title
                    </label>
                    <Input
                      value={get("title", post.title)}
                      onChange={(e) => dirty("title", e.target.value)}
                      className="text-[15px] font-display font-medium bg-background border-border-strong/60 h-9"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                      Subtitle
                    </label>
                    <Input
                      value={get("subtitle", post.subtitle ?? "")}
                      onChange={(e) => dirty("subtitle", e.target.value)}
                      placeholder="Subtitle..."
                      className="bg-background border-border-strong/60 text-[12px] h-9"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                      MDX Body Content
                    </label>
                    <Textarea
                      value={get("body_mdx", post.body_mdx)}
                      onChange={(e) => dirty("body_mdx", e.target.value)}
                      rows={22}
                      className="font-mono text-[11px] leading-[1.6] bg-background border border-border-strong rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-cream/40"
                    />
                  </div>
                </div>

                {/* Preview column */}
                <div className="overflow-y-auto max-h-[calc(100vh-160px)] border-l border-border pl-6">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                    <Eye className="size-3" /> Live Render Preview
                  </div>
                  <MarkdownPreview
                    text={bodyText}
                    title={get("title", post.title)}
                    subtitle={get("subtitle", post.subtitle || "")}
                    category={get("category", post.category || "")}
                    heroImageUrl={post.hero_image_url || undefined}
                    heroImageAlt={get("hero_image_alt", post.hero_image_alt || "")}
                    author={selectedAuthor}
                    sources={post.sources}
                    generationMeta={post.generation_meta}
                    updatedAt={post.updated_at}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Real-time Stats Footer Bar */}
          <div className="flex flex-wrap items-center gap-6 p-3 bg-muted/40 rounded border border-border-strong/50 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-foreground/80">
              <FileText className="size-3.5" /> Words:{" "}
              <strong className="text-foreground">{wordCount}</strong>
            </span>
            <span className="flex items-center gap-1 text-foreground/80">
              <Layers className="size-3.5" /> Characters:{" "}
              <strong className="text-foreground">{charCount}</strong>
            </span>
            <span className="flex items-center gap-1 text-foreground/80">
              <Clock className="size-3.5" /> Reading Time:{" "}
              <strong className="text-foreground">{readingTime} min</strong>
            </span>
            <span
              className="flex items-center gap-1 text-foreground/80"
              title="Primary keyword frequency in text"
            >
              <Globe className="size-3.5" /> Keyword Density:{" "}
              <strong
                className={`font-semibold ${
                  keywordDensity >= 1 && keywordDensity <= 2.5
                    ? "text-emerald-500"
                    : "text-amber-500"
                }`}
              >
                {keywordDensity}%
              </strong>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap pt-4 border-t border-border mt-4">
            <Button
              onClick={() => save.mutate()}
              disabled={save.isPending || !hasChanges}
              className="bg-cream text-cream-foreground hover:bg-cream/90 h-9 text-[12px] font-medium flex items-center gap-1.5"
            >
              <Save className="size-3.5" />
              {save.isPending ? "Saving..." : "Save Changes"}
            </Button>
            {hasChanges && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEdited({})}
                className="h-9 text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <Undo2 className="size-3.5" /> Reset
              </Button>
            )}
            <div className="w-px bg-border mx-1" />
            {post.status !== "in_review" && (
              <Button
                variant="outline"
                onClick={() => setStatus.mutate("in_review")}
                disabled={setStatus.isPending}
                className="h-9 text-[12px] border-border-strong/50 flex items-center gap-1"
              >
                <RefreshCw className="size-3" /> Send to Review
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => setConfirmAction({ action: "publish", status: "published" })}
              disabled={setStatus.isPending}
              className="h-9 text-[12px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 flex items-center gap-1"
            >
              <Globe className="size-3" /> Publish
            </Button>
            {post.status !== "draft" && (
              <Button
                variant="outline"
                onClick={() => setStatus.mutate("draft")}
                disabled={setStatus.isPending}
                className="h-9 text-[12px] flex items-center gap-1"
              >
                <FileText className="size-3" /> Draft
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => setConfirmAction({ action: "archive", status: "archived" })}
              disabled={setStatus.isPending}
              className="h-9 text-[12px] ml-auto border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 flex items-center gap-1"
            >
              <Trash2 className="size-3" /> Archive
            </Button>
          </div>

          {/* Confirmation Dialogs */}
          <ConfirmDialog
            open={confirmAction?.action === "publish"}
            title="Publish Post"
            message={`This will make "${get("title", post.title)}" visible on the public website immediately. Are you sure?`}
            confirmLabel="Yes, Publish Now"
            onConfirm={() => {
              setStatus.mutate("published");
              setConfirmAction(null);
            }}
            onCancel={() => setConfirmAction(null)}
          />
          <ConfirmDialog
            open={confirmAction?.action === "archive"}
            title="Archive Post"
            message="This will remove the article from the public website and move it to the archive. This can be undone by returning it to draft."
            confirmLabel="Archive Post"
            variant="destructive"
            onConfirm={() => {
              setStatus.mutate("archived");
              setConfirmAction(null);
            }}
            onCancel={() => setConfirmAction(null)}
          />
          <ConfirmDialog
            open={confirmAction?.action === "discard"}
            title="Discard Changes?"
            message={`You have ${Object.keys(edited).length} unsaved change(s). Going back will discard them.`}
            confirmLabel="Discard & Go Back"
            variant="destructive"
            onConfirm={() => {
              setEdited({});
              setConfirmAction(null);
              onClose();
            }}
            onCancel={() => setConfirmAction(null)}
          />
        </section>

        {/* Right pane: Sidebars & Metadata */}
        <aside className="space-y-6">
          <QAPanel postId={id} />

          {/* Hero Image Section */}
          <div className="border border-border-strong/60 p-4 rounded bg-card/40 backdrop-blur-sm text-[12px] shadow-sm">
            <h4 className="font-display text-[13px] font-medium mb-3 flex items-center gap-1.5">
              <ImageIcon className="size-4 text-cream" /> Hero Image Cover
            </h4>
            {post.hero_image_url ? (
              <div className="aspect-[16/10] rounded overflow-hidden bg-muted border border-border-strong/50 relative mb-3 group">
                <img
                  src={post.hero_image_url}
                  alt=""
                  className="object-cover size-full group-hover:scale-[1.02] transition-transform duration-700"
                />
              </div>
            ) : (
              <div className="aspect-[16/10] rounded flex flex-col items-center justify-center bg-muted/30 border border-dashed border-border-strong/60 mb-3 text-muted-foreground text-[11px]">
                <ImageIcon className="size-6 mb-1 text-muted-foreground/40" />
                No hero image generated
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-1">
                  Image Alt Text
                </label>
                <Input
                  value={get("hero_image_alt", post.hero_image_alt ?? "")}
                  onChange={(e) => dirty("hero_image_alt", e.target.value)}
                  placeholder="Alt text describing cover image..."
                  className="bg-background/80 text-[11px] h-8 focus:ring-1 focus:ring-cream/40"
                />
              </div>
              <div className="flex gap-1.5 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => regen.mutate(0)}
                  disabled={regen.isPending}
                  className="w-full text-[11px] h-8 flex items-center gap-1 border-border-strong/50"
                >
                  <RefreshCw className={`size-3 ${regen.isPending ? "animate-spin" : ""}`} />{" "}
                  Regenerate (Flux)
                </Button>
              </div>
            </div>
          </div>

          {/* Article Settings Section */}
          <div className="border border-border-strong/60 p-4 rounded bg-card/40 backdrop-blur-sm text-[12px] shadow-sm space-y-4">
            <h4 className="font-display text-[13px] font-medium border-b border-border/40 pb-2 flex items-center gap-1.5">
              <Settings className="size-4 text-cream" /> Article Settings
            </h4>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                Author Profile
              </label>
              <select
                className="w-full bg-background border border-border-strong/60 rounded p-2 text-[12px] font-sans focus:outline-none"
                value={get("author_id", post.author_id ?? "")}
                onChange={(e) => dirty("author_id", e.target.value || null)}
              >
                <option value="">— rotate/no explicit author —</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                Slug
              </label>
              <Input
                value={get("slug", post.slug ?? "")}
                onChange={(e) => dirty("slug", e.target.value)}
                placeholder="e.g. us-student-visa-guide"
                className="bg-background/80 text-[12px] h-9 focus:ring-1 focus:ring-cream/40 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                Category
              </label>
              <Input
                value={get("category", post.category ?? "")}
                onChange={(e) => dirty("category", e.target.value)}
                placeholder="e.g. Guide, Visa, Tax"
                className="bg-background/80 text-[12px] h-9 focus:ring-1 focus:ring-cream/40"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                Keywords
              </label>
              <Input
                value={get("keywords", post.keywords ?? "")}
                onChange={(e) => dirty("keywords", e.target.value)}
                placeholder="comma-separated keywords..."
                className="bg-background/80 text-[12px] h-9 focus:ring-1 focus:ring-cream/40"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                Reading Minutes
              </label>
              <Input
                type="number"
                min={1}
                max={60}
                value={get("reading_minutes", post.reading_minutes ?? 5)}
                onChange={(e) => dirty("reading_minutes", Number(e.target.value))}
                className="bg-background/80 text-[12px] h-9 focus:ring-1 focus:ring-cream/40 font-mono"
              />
            </div>
          </div>

          {/* Generation Stats */}
          <div className="border border-border-strong/60 p-4 rounded bg-card/40 backdrop-blur-sm text-[11px] leading-relaxed shadow-sm space-y-2.5">
            <h4 className="font-display text-[13px] font-medium text-foreground mb-2 flex items-center gap-1.5">
              <Info className="size-4 text-cream" /> Generation Metadata
            </h4>
            <div className="flex justify-between border-b border-border/40 pb-1">
              <span className="text-muted-foreground">LLM Confidence score:</span>
              <span
                className={`font-semibold uppercase tracking-wider font-mono ${
                  meta.confidence === "high" ? "text-emerald-500" : "text-amber-500"
                }`}
              >
                {meta.confidence ?? "?"}
              </span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1">
              <span className="text-muted-foreground">NEEDS SOURCE tags:</span>
              <span
                className={`font-semibold font-mono ${meta.needs_source_count ? "text-red-400" : "text-muted-foreground"}`}
              >
                {meta.needs_source_count ?? 0}
              </span>
            </div>
            {meta.voice_notes && (
              <div className="pt-1">
                <span className="text-muted-foreground block mb-0.5">
                  Voice Tone matching notes:
                </span>
                <span className="italic text-muted-foreground block pl-2 border-l border-border-strong/60">
                  {meta.voice_notes}
                </span>
              </div>
            )}
            {meta.research_by_tier && (
              <div className="pt-1 border-t border-border/40 mt-1">
                <span className="text-muted-foreground block mb-1">
                  Official Research Sources read:
                </span>
                <ul className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground font-mono">
                  {Object.entries(meta.research_by_tier).map(([k, v]) => (
                    <li key={k} className="flex justify-between pr-2">
                      <span className="capitalize">{k}:</span>
                      <strong className="text-foreground/80">{v}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Citations List */}
          <div className="border border-border-strong/60 p-4 rounded bg-card/40 backdrop-blur-sm text-[11px] shadow-sm">
            <h4 className="font-display text-[13px] font-medium mb-3 flex items-center gap-1.5">
              <BookOpen className="size-4 text-cream" /> Verified Citations ({sources.length})
            </h4>
            <ol className="space-y-2 list-decimal pl-4 text-muted-foreground">
              {sources.map((s) => (
                <li
                  key={s.index}
                  className="leading-normal pb-1 border-b border-border/30 last:border-b-0"
                >
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener"
                    className="text-foreground hover:text-gold-deep break-all transition-colors inline-block"
                  >
                    {s.title}
                  </a>
                  <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[9px]">
                    <span className="uppercase text-gold font-semibold tracking-wider">
                      {s.tier}
                    </span>
                    <span className="text-border">•</span>
                    <span className="truncate max-w-[200px]" title={s.url}>
                      {s.url}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Live Step Logs */}
          <div className="border border-border-strong/60 p-4 rounded bg-card/40 backdrop-blur-sm text-[11px] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-display text-[13px] font-medium flex items-center gap-1.5">
                <BarChart2 className="size-4 text-cream" /> Execution Steps Log ({logs.length})
              </h4>
              {logs.length > 0 && (
                <button
                  onClick={() =>
                    setDebugLogsItem({
                      topic: post.title,
                      primary_keyword: post.primary_keyword ?? "",
                      status: post.status,
                      logs,
                    })
                  }
                  className="text-[10px] text-cream hover:underline flex items-center gap-1"
                  title="Inspect Logs JSON"
                >
                  <Terminal className="size-3" /> Inspect Logs
                </button>
              )}
            </div>
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {logs.map((l: any) => (
                <li
                  key={l.id}
                  className={`p-2 rounded border border-border/40 leading-snug flex flex-col gap-0.5 ${
                    l.ok
                      ? "bg-muted/10 text-muted-foreground"
                      : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}
                >
                  <div className="flex justify-between font-mono text-[9px] font-semibold uppercase">
                    <span>
                      {l.step} {l.tool ? `[${l.tool}]` : ""}
                    </span>
                    <span>{l.ok ? "SUCCESS" : "FAILED"}</span>
                  </div>
                  <div className="text-[10px] text-foreground/80 mt-0.5 break-words">
                    {l.response_summary ?? l.error ?? "Completed step"}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
