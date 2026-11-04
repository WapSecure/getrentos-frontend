'use client';

import { useState } from 'react';
import { Check, Pencil, Sparkles, UserCog, X } from 'lucide-react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Select,
  Textarea,
} from '@getrentos/ui';
import { categoryIcons } from '@/components/landlord/maintenance/MaintenanceRequestCard';
import { maintenancePriorityBadges } from '@/lib/statusBadge';
import type {
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceTriage,
  MaintenanceTriageCategory,
  MaintenanceTriageDecision,
  MaintenanceTriageUrgency,
} from '@/types/maintenance';

const CATEGORIES: MaintenanceTriageCategory[] = [
  'PLUMBING',
  'ELECTRICAL',
  'INTERNET',
  'SECURITY',
  'APPLIANCES',
  'OTHER',
];
const URGENCIES: MaintenanceTriageUrgency[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

interface TriageResultModalProps {
  /** The triage result to show, or null while it is still loading. */
  triage: MaintenanceTriage | null;
  open: boolean;
  onClose: () => void;
  onAssignVendor?: (vendorId: string) => void;
  isAssigning?: boolean;
  /** Accept (as proposed or edited) or reject the proposal. Hidden when absent. */
  onDecide?: (decision: MaintenanceTriageDecision) => void;
  isDeciding?: boolean;
}

const categoryLabel = (category: MaintenanceCategory): string =>
  category.charAt(0).toUpperCase() + category.slice(1);

export const TriageResultModal = ({
  triage,
  open,
  onClose,
  onAssignVendor,
  isAssigning = false,
  onDecide,
  isDeciding = false,
}: TriageResultModalProps) => (
  <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
    <DialogContent className="p-0">
      <div className="p-4 border-b border-border">
        <DialogTitle className="flex items-center gap-2 text-xl font-semibold tracking-[-0.02em] text-foreground">
          <Sparkles className="w-4.5 h-4.5 text-primary" />
          Automated triage
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
        <TriageBody
          // A new proposal starts fresh: no edits or rejection carried over.
          key={triage.reviewId ?? triage.triagedAt}
          triage={triage}
          onAssignVendor={onAssignVendor}
          isAssigning={isAssigning}
          onDecide={onDecide}
          isDeciding={isDeciding}
        />
      )}
    </DialogContent>
  </Dialog>
);

const TriageBody = ({
  triage,
  onAssignVendor,
  isAssigning,
  onDecide,
  isDeciding,
}: {
  triage: MaintenanceTriage;
  onAssignVendor?: (vendorId: string) => void;
  isAssigning: boolean;
  onDecide?: (decision: MaintenanceTriageDecision) => void;
  isDeciding: boolean;
}) => {
  const [mode, setMode] = useState<'review' | 'edit' | 'reject'>('review');
  const [editCategory, setEditCategory] = useState(triage.category);
  const [editUrgency, setEditUrgency] = useState(triage.urgency);
  const [editDraft, setEditDraft] = useState(triage.draftWorkOrder);
  const [reason, setReason] = useState('');
  const canDecide = Boolean(onDecide && triage.reviewId);

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
        <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Why</h4>
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

      {mode === 'edit' && (
        <section className="space-y-3 rounded-lg border border-border p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="triage-category">
                Category
              </label>
              <Select
                id="triage-category"
                value={editCategory}
                onValueChange={(v) => setEditCategory(v as MaintenanceTriageCategory)}
                options={CATEGORIES.map((c) => ({
                  value: c,
                  label: categoryLabel(c.toLowerCase() as MaintenanceCategory),
                }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="triage-urgency">
                Urgency
              </label>
              <Select
                id="triage-urgency"
                value={editUrgency}
                onValueChange={(v) => setEditUrgency(v as MaintenanceTriageUrgency)}
                options={URGENCIES.map((u) => ({
                  value: u,
                  label:
                    maintenancePriorityBadges[u.toLowerCase() as MaintenancePriority]?.label ?? u,
                }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="triage-draft">
              Work order
            </label>
            <Textarea
              id="triage-draft"
              rows={4}
              maxLength={2000}
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
            />
          </div>
        </section>
      )}

      {mode === 'reject' && (
        <section className="space-y-1 rounded-lg border border-border p-3">
          <label className="text-xs text-muted-foreground" htmlFor="triage-reason">
            What did it get wrong?
          </label>
          <Textarea
            id="triage-reason"
            rows={3}
            maxLength={500}
            value={reason}
            placeholder="For example: it is a plumbing leak, not electrical"
            onChange={(e) => setReason(e.target.value)}
          />
        </section>
      )}

      {canDecide && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {mode === 'review' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => setMode('reject')}
              >
                <X className="w-3.5 h-3.5" />
                Not right
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setMode('edit')}
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5"
                isLoading={isDeciding}
                onClick={() => onDecide?.({ decision: 'accept' })}
              >
                <Check className="w-3.5 h-3.5" />
                Apply category and urgency
              </Button>
            </>
          )}
          {mode === 'edit' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setMode('review')}>
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5"
                isLoading={isDeciding}
                disabled={!editDraft.trim()}
                onClick={() =>
                  onDecide?.({
                    decision: 'accept',
                    category: editCategory,
                    urgency: editUrgency,
                    draftWorkOrder: editDraft.trim(),
                  })
                }
              >
                <Check className="w-3.5 h-3.5" />
                Apply my version
              </Button>
            </>
          )}
          {mode === 'reject' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setMode('review')}>
                Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                isLoading={isDeciding}
                disabled={reason.trim().length < 3}
                onClick={() => onDecide?.({ decision: 'reject', reason: reason.trim() })}
              >
                Reject suggestion
              </Button>
            </>
          )}
        </div>
      )}

      {triage.suggestedVendor && onAssignVendor && (
        <section className="rounded-lg border border-border p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Suggested vendor</p>
              <p className="font-medium text-foreground truncate">{triage.suggestedVendor.name}</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={() => triage.suggestedVendor && onAssignVendor?.(triage.suggestedVendor.id)}
              isLoading={isAssigning}
            >
              <UserCog className="w-3.5 h-3.5" />
              Assign this vendor
            </Button>
          </div>
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        {triage.source === 'ai' ? 'Automated suggestion.' : 'Suggested from your rules.'} Always
        your call.
      </p>
    </div>
  );
};
