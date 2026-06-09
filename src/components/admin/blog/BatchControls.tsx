import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { processNextBatch } from "@/lib/blog/blog.functions";

export function BatchControls({ onProcessed }: { onProcessed: () => void }) {
  const [profile, setProfile] = useState<"balanced" | "quality" | "fast">("balanced");
  const m = useMutation({
    mutationFn: async (count: number) =>
      await processNextBatch({ data: { count, llm_profile: profile } }),
    onSuccess: (data) => {
      toast.success(`Processed ${data.processed} items`);
      onProcessed();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="border border-border-strong/60 p-5 rounded bg-card/40 backdrop-blur-sm mb-6 shadow-sm">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Play className="size-4 text-cream" />
            <h3 className="font-display font-medium text-[15px]">Batch Process Queue</h3>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Execute parallel generation of queued items.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="min-w-44">
            <select
              value={profile}
              onChange={(e) => setProfile(e.target.value as any)}
              className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-[12px] font-sans focus:outline-none"
            >
              <option value="balanced">Balanced Profile</option>
              <option value="quality">Quality Profile</option>
              <option value="fast">Fast Profile</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => m.mutate(1)}
              disabled={m.isPending}
              className="text-[12px] h-9"
            >
              {m.isPending ? "Processing..." : "Generate Next"}
            </Button>
            <Button
              variant="outline"
              onClick={() => m.mutate(3)}
              disabled={m.isPending}
              className="text-[12px] h-9 border-gold/30 hover:border-gold/60 hover:text-gold-deep transition-all"
            >
              Generate Batch (3)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
