import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Layers } from "lucide-react";
import { processNextBatch, quickAddKeywords } from "@/lib/blog/blog.functions";

export function QuickPasteBox({ onAdded }: { onAdded: () => void }) {
  const [text, setText] = useState("");
  const [profile, setProfile] = useState<"balanced" | "quality" | "fast">("balanced");
  const [generateInstantly, setGenerateInstantly] = useState(true);
  const qc = useQueryClient();

  const runBatch = useMutation({
    mutationFn: async (count: number) =>
      await processNextBatch({ data: { count, llm_profile: profile } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
    },
  });

  const m = useMutation({
    mutationFn: async (val: string) =>
      await quickAddKeywords({ data: { text: val, llm_profile: profile } }),
    onSuccess: (data) => {
      toast.success(`Queued ${data.queued} topics`);
      setText("");
      onAdded();
      if (generateInstantly && data.queued > 0) {
        runBatch.mutate(data.queued);
        toast.info(`Started background generation for ${data.queued} keyword(s)`);
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="border border-border-strong/60 p-5 rounded bg-card/40 backdrop-blur-sm shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Layers className="size-4 text-cream" />
        <h3 className="font-display font-medium text-[15px]">Quick Paste Keywords</h3>
      </div>
      <p className="text-[11px] text-muted-foreground mb-4">
        Paste one keyword per line. They will be auto-expanded during generation.
      </p>

      <div className="mb-3">
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
          LLM Generation Profile
        </label>
        <select
          value={profile}
          onChange={(e) => setProfile(e.target.value as any)}
          className="w-full bg-background border border-border rounded p-2 text-[12px] font-sans focus:outline-none focus:ring-1 focus:ring-cream/40"
        >
          <option value="balanced">Balanced (Multi-Model Fallback)</option>
          <option value="quality">High Quality (Groq / Llama-70B)</option>
          <option value="fast">Fast & Economical (Gemini Flash)</option>
        </select>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="student visa USA&#10;remote work taxes..."
        className="mb-4 font-mono text-[12px] bg-background border border-border rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-cream/40"
        rows={6}
      />

      <div className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          id="quickGenerateInstantly"
          checked={generateInstantly}
          onChange={(e) => setGenerateInstantly(e.target.checked)}
          className="rounded border-border text-cream focus:ring-cream/40"
        />
        <label
          htmlFor="quickGenerateInstantly"
          className="text-[11px] text-muted-foreground select-none cursor-pointer"
        >
          Generate articles instantly in background
        </label>
      </div>

      <Button
        onClick={() => m.mutate(text)}
        disabled={m.isPending || runBatch.isPending || !text.trim()}
        className="w-full text-[12px] h-9 bg-cream text-cream-foreground hover:bg-cream/90 transition-colors"
      >
        {m.isPending || runBatch.isPending ? "Starting..." : "Queue & Generate All"}
      </Button>
    </div>
  );
}
