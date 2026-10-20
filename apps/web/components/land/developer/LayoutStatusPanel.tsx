'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Badge, Button, ConfirmDialog } from '@getrentos/ui';
import { AlertTriangle, CheckCircle2, Circle, Pencil, Rocket, Square } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { landDeveloperKeys } from '@/lib/landDeveloperQueryKeys';
import { landDeveloperService } from '@/services/landDeveloperService';
import type { OwnerLandRecord } from '@/types/land';
import type { OwnerLandLayout } from '@/types/landDeveloper';
import { errorMessage, type Notify } from './feedback';
import { LAYOUT_STATUS } from './labels';

interface LayoutStatusPanelProps {
  record: OwnerLandRecord;
  layout: OwnerLandLayout;
  onEdit: () => void;
  notify: Notify;
}

/** Whether the master parcel itself could be sold: the bar a layout must clear to publish. */
export const isParcelSaleReady = (record: OwnerLandRecord, now = Date.now()) => {
  const diligence = record.diligence;
  return (
    record.property.verificationStatus === 'APPROVED' &&
    diligence?.status === 'VERIFIED' &&
    (!diligence.expiresAt || new Date(diligence.expiresAt).getTime() > now)
  );
};

/**
 * Where the layout stands (draft, on sale, closed) and the switch between
 * them. Publishing has three preconditions on the server; they are shown as a
 * checklist so the owner sees what is missing before pressing the button, and
 * anything else the server refuses with is kept on screen, not just toasted.
 */
export const LayoutStatusPanel = ({ record, layout, onEdit, notify }: LayoutStatusPanelProps) => {
  const queryClient = useQueryClient();
  const propertyId = layout.propertyId;
  const [closeOpen, setCloseOpen] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: landDeveloperKeys.all });

  const publish = useMutation({
    mutationFn: () => unwrap(landDeveloperService.publishLayout(propertyId)),
    onSuccess: () => {
      setPublishError(null);
      refresh();
      notify('Your estate is on sale. Buyers can now reserve available plots.');
    },
    onError: (error) => setPublishError(errorMessage(error)),
  });

  const close = useMutation({
    mutationFn: () => unwrap(landDeveloperService.closeLayout(propertyId)),
    onSuccess: () => {
      refresh();
      notify('Sales closed. Live contracts carry on as agreed.', 'info');
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const available = layout.plotCounts.AVAILABLE ?? 0;
  const activePlans = layout.paymentPlans.filter((plan) => plan.active).length;
  const checklist = [
    {
      done: isParcelSaleReady(record),
      label: 'Master parcel verified',
      detail: 'The property and its land diligence must be verified and in date.',
    },
    {
      done: available > 0,
      label: 'At least one available plot',
      detail: `${available} available now.`,
    },
    {
      done: activePlans > 0,
      label: 'At least one active payment plan',
      detail: `${activePlans} active now.`,
    },
  ];
  const ready = checklist.every((item) => item.done);
  const status = LAYOUT_STATUS[layout.status];

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-foreground">{layout.name}</h2>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {layout.status === 'PUBLISHED' && layout.publishedAt
              ? `On sale since ${formatDate(layout.publishedAt)}.`
              : layout.status === 'CLOSED' && layout.closedAt
                ? `Closed to new reservations on ${formatDate(layout.closedAt)}. Live contracts continue.`
                : 'Not yet visible to buyers.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            rounded="lg"
            onClick={onEdit}
            disabled={layout.status === 'CLOSED'}
            title={layout.status === 'CLOSED' ? 'A closed layout cannot be edited' : undefined}
            icon={<Pencil className="h-4 w-4" />}
          >
            Edit details
          </Button>
          {layout.status === 'PUBLISHED' ? (
            <Button
              variant="danger"
              size="sm"
              rounded="lg"
              onClick={() => setCloseOpen(true)}
              icon={<Square className="h-4 w-4" />}
            >
              Close sales
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              rounded="lg"
              isLoading={publish.isPending}
              onClick={() => publish.mutate()}
              icon={<Rocket className="h-4 w-4" />}
            >
              {layout.status === 'CLOSED' ? 'Reopen sales' : 'Publish estate'}
            </Button>
          )}
        </div>
      </div>

      {layout.status !== 'PUBLISHED' && (
        <ul
          className="mt-4 grid gap-2 sm:grid-cols-3"
          aria-label={ready ? 'Ready to publish' : 'Before you publish'}
        >
          {checklist.map((item) => {
            const Icon = item.done ? CheckCircle2 : Circle;
            return (
              <li
                key={item.label}
                className="flex gap-2 rounded-xl border border-border bg-secondary/40 p-3 text-sm"
              >
                <Icon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${item.done ? 'text-success' : 'text-muted-foreground'}`}
                  aria-hidden="true"
                />
                <span>
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="block text-xs text-muted-foreground">{item.detail}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {publishError && (
        <Alert
          variant="warning"
          icon={AlertTriangle}
          title="The estate could not be published."
          className="mt-4"
        >
          {publishError}
        </Alert>
      )}

      <ConfirmDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title="Close sales on this estate?"
        description="Buyers will not be able to reserve plots any more. Existing reservations run out on their own and live contracts continue on their agreed terms. You can reopen sales later."
        confirmLabel="Close sales"
        isLoading={close.isPending}
        onConfirm={async () => {
          try {
            await close.mutateAsync();
          } catch {
            // Reported by onError.
          }
        }}
      />
    </section>
  );
};
