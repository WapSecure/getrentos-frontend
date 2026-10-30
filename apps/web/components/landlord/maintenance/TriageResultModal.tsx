'use client';

import { Sparkles, UserCog } from 'lucide-react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@getrentos/ui';
import { categoryIcons } from '@/components/landlord/maintenance/MaintenanceRequestCard';
import { maintenancePriorityBadges } from '@/lib/statusBadge';
import type {
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceTriage,
} from '@/types/maintenance';

interface TriageResultModalProps {
  /** The triage result to show, or null while it is still loading. */
  triage: MaintenanceTriage | null;
  open: boolean;
  onClose: () => void;
  onAssignVendor: (vendorId: string) => void;
  isAssigning?: boolean;
}

const categoryLabel = (category: MaintenanceCategory): string =>
  category.charAt(0).toUpperCase() + category.slice(1);

export const TriageResultModal = ({
  triage,
  open,
  onClose,
  onAssignVendor,
  isAssigning = false,
}: TriageResultModalProps) => (
  <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
    <DialogContent className="p-0">
      <div className="p-4 border-b border-border">
        <DialogTitle className="flex items-center gap-2 text-xl font-semibold tracking-[-0.02em] text-foreground">
          <Sparkles className="w-4.5 h-4.5 text-primary" />
          AI triage
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
          A suggested category, urgency and work order for this request. Review before you act.
        </DialogDescription>
      </div>

      {!triage ? (
        <div className="p-4">
          <p className="text-sm text-muted-foreground">Reading the request…</p>
        </div>
      ) : (
        <TriageBody triage={triage} onAssignVendor={onAssignVendor} isAssigning={isAssigning} />
      )}
    </DialogContent>
  </Dialog>
);

const TriageBody = ({
  triage,
  onAssignVendor,
  isAssigning,
}: {
  triage: MaintenanceTriage;
  onAssignVendor: (vendorId: string) => void;
  isAssigning: boolean;
}) => {
  const category = triage.category.toLowerCase() as MaintenanceCategory;
  const urgency = triage.urgency.toLowerCase() as MaintenancePriority;
  const CategoryIcon = categoryIcons[category] ?? categoryIcons.other;
  const priority = maintenancePriorityBadges[urgency] ?? maintenancePriorityBadges.low;

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="neutral" icon={<CategoryIcon className="w-3 h-3" />}>
          {categoryLabel(category)}
        </Badge>
        <Badge variant={priority.variant}>{priority.label}</Badge>
        {triage.needsVendor && <Badge variant="info">Needs a vendor</Badge>}
      </div>

      <section className="space-y-1">
        <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Why
        </h4>
        <p className="text-sm text-foreground whitespace-pre-line">{triage.rationale}</p>
      </section>

      <section className="space-y-1">
        <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Draft work order
        </h4>
        <p className="rounded-lg border border-border bg-secondary/40 p-3 text-sm text-foreground whitespace-pre-line">
          {triage.draftWorkOrder}
        </p>
      </section>

      {triage.suggestedVendor && (
        <section className="rounded-lg border border-border p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Suggested vendor</p>
              <p className="font-medium text-foreground truncate">
                {triage.suggestedVendor.name}
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={() => triage.suggestedVendor && onAssignVendor(triage.suggestedVendor.id)}
              isLoading={isAssigning}
            >
              <UserCog className="w-3.5 h-3.5" />
              Assign this vendor
            </Button>
          </div>
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        {triage.source === 'ai'
          ? `Suggested by AI (${triage.model}).`
          : 'Suggested by rules, not AI.'}{' '}
        Always your call.
      </p>
    </div>
  );
};
