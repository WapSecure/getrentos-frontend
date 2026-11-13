'use client';

import { useState } from 'react';
import { Check, Pencil, Sparkles, UserCog, X } from '@sureground/icons';
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Select,
  Textarea,
} from '@sureground/ui';
import { maintenanceCategoryLabel } from '@sureground/shared';
import {
  MaintenanceCategoryIcon,
  maintenanceCategorySelectOptions,
} from '@/components/renter/maintenance/MaintenanceCategoryIcon';
import { maintenancePriorityBadges } from '@/lib/statusBadge';
import type {
  MaintenancePriority,
  MaintenanceTriage,
  MaintenanceTriageCategory,
  MaintenanceTriageDecision,
  MaintenanceTriageUrgency,
} from '@/types/maintenance';

const URGENCIES: MaintenanceTriageUrgency[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

interface TriageResultModalProps {
  triage: MaintenanceTriage | null;
  open: boolean;
  onClose: () => void;
  onAssignVendor?: (vendorId: string) => void;
  isAssigning?: boolean;
  onDecide?: (decision: MaintenanceTriageDecision, alsoAssignVendorId?: string) => void;
  isDeciding?: boolean;
  canAssignVendor?: boolean;
}

export const TriageResultModal = ({
  triage,
  open,
  onClose,
  onAssignVendor,
  isAssigning = false,
  onDecide,
  isDeciding = false,
  canAssignVendor = false,
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
          key={triage.reviewId ?? triage.triagedAt}
          triage={triage}
          onAssignVendor={onAssignVendor}
          isAssigning={isAssigning}
          onDecide={onDecide}
          isDeciding={isDeciding}
          canAssignVendor={canAssignVendor}
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
  canAssignVendor,
}: {
  triage: MaintenanceTriage;
  onAssignVendor?: (vendorId: string) => void;
  isAssigning: boolean;
  onDecide?: (decision: MaintenanceTriageDecision, alsoAssignVendorId?: string) => void;
  isDeciding: boolean;
  canAssignVendor: boolean;
}) => {
  const offerAssign = canAssignVendor && Boolean(triage.suggestedVendor);
  const [alsoAssign, setAlsoAssign] = useState(offerAssign && triage.needsVendor);
  const assignId = offerAssign && alsoAssign ? triage.suggestedVendor?.id : undefined;
  const [mode, setMode] = useState<'review' | 'edit' | 'reject'>('review');
  const [editCategory, setEditCategory] = useState(triage.category);
  const [editUrgency, setEditUrgency] = useState(triage.urgency);
  const [editDraft, setEditDraft] = useState(triage.draftWorkOrder);
  const [reason, setReason] = useState('');
  const canDecide = Boolean(onDecide && triage.reviewId);

  const urgency = triage.urgency.toLowerCase() as MaintenancePriority;
  const priority = maintenancePriorityBadges[urgency] ?? maintenancePriorityBadges.low;

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="neutral"
          icon={<MaintenanceCategoryIcon category={triage.category} className="w-3 h-3" />}
        >
          {maintenanceCategoryLabel(triage.category)}
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
                options={maintenanceCategorySelectOptions()}
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

      {canDecide && offerAssign && mode !== 'reject' && (
        <Checkbox
          checked={alsoAssign}
          onCheckedChange={setAlsoAssign}
          label={<>Also assign {triage.suggestedVendor?.name}</>}
        />
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
                onClick={() => onDecide?.({ decision: 'accept' }, assignId)}
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
                  onDecide?.(
                    {
                      decision: 'accept',
                      category: editCategory,
                      urgency: editUrgency,
                      draftWorkOrder: editDraft.trim(),
                    },
                    assignId
                  )
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

      {triage.suggestedVendor && onAssignVendor && !offerAssign && (
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
