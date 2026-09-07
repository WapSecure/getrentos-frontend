'use client';

import { Sparkles } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@getrentos/ui';
import type { PlanGateReason } from '@/lib/planGate';

interface UpgradeToProModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: PlanGateReason;
}

const COPY: Record<PlanGateReason, { title: string; description: string }> = {
  PLAN_UPGRADE_REQUIRED: {
    title: 'This is a Pro feature',
    description: 'Upgrade to Pro to unlock this and everything else on the Pro plan.',
  },
  PLAN_LIMIT_REACHED: {
    title: "You've reached the Free plan limit",
    description: 'Upgrade to Pro to remove this limit and unlock the rest of the Pro plan too.',
  },
};

/**
 * Shown instead of a generic error toast whenever a gated action 403s with
 * PLAN_UPGRADE_REQUIRED or PLAN_LIMIT_REACHED (see lib/planGate.ts). No live
 * checkout exists yet — the CTA opens a mailto so the team can upgrade the
 * account manually via the admin backoffice.
 */
export const UpgradeToProModal = ({ isOpen, onClose, reason }: UpgradeToProModalProps) => {
  const copy = COPY[reason ?? 'PLAN_UPGRADE_REQUIRED'];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <div className="p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <DialogTitle className="mt-4 text-lg font-semibold text-foreground">
            {copy.title}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-muted-foreground">
            {copy.description}
          </DialogDescription>

          <div className="mt-6 flex flex-col gap-2">
            <Button
              variant="primary"
              fullWidth
              href="mailto:hello@getrentos.com?subject=Upgrade%20to%20Pro"
            >
              Contact us to upgrade
            </Button>
            <Button variant="ghost" fullWidth onClick={onClose}>
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
