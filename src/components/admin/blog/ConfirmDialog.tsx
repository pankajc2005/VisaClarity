import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  variant = "default",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full mx-4 p-6 bg-card border border-border-strong rounded-lg shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`size-10 rounded-full flex items-center justify-center ${
              variant === "destructive" ? "bg-red-500/15" : "bg-cream/15"
            }`}
          >
            {variant === "destructive" ? (
              <AlertTriangle className="size-5 text-red-500" />
            ) : (
              <CheckCircle2 className="size-5 text-cream" />
            )}
          </div>
          <h3 className="font-display text-[16px] font-medium">{title}</h3>
        </div>
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-6 ml-[52px]">
          {message}
        </p>
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-9 text-[12px] text-muted-foreground"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            className={`h-9 text-[12px] font-medium ${
              variant === "destructive"
                ? "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25"
                : "bg-cream text-cream-foreground hover:bg-cream/90"
            }`}
          >
            {confirmLabel}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
