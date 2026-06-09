import { type ReactNode, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LeadForm } from "./LeadForm";

interface Props {
  trigger: ReactNode;
  idPrefix?: string;
}

export function WaitlistDialog({ trigger, idPrefix = "waitlist-dialog" }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[820px] bg-background border-border-strong">
        <DialogHeader>
          <DialogTitle className="font-display text-[26px] md:text-[32px] font-normal text-foreground">
            Join the waitlist
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Three inputs. We send your personalized roadmap when your route is ready.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <LeadForm idPrefix={idPrefix} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
