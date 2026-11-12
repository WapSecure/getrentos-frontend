'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ruler } from '@sureground/icons';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  PageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
  useToast,
} from '@sureground/ui';
import { formatDate, formatMetres, unwrap } from '@sureground/shared';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import {
  adminFloorPlansService,
  type AdminFloorPlan,
  type FloorPlanMeasurementStatus,
} from '@/services/adminFloorPlansService';

const size = (r: AdminFloorPlan['rooms'][number]) =>
  r.widthM !== undefined && r.lengthM !== undefined
    ? `${formatMetres(r.widthM)} × ${formatMetres(r.lengthM)} m`
    : 'No size given';

export default function FloorPlanChecksPage() {
  const [view, setView] = useState<FloorPlanMeasurementStatus>('ESTIMATED');
  const user = useAdminUser();
  const canAct = hasAdminPermission(user?.roles, 'verifications.approve');
  const queryClient = useQueryClient();
  const toast = useToast();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ['admin', 'floor-plans', view],
    queryFn: () => unwrap(adminFloorPlansService.list(view)),
  });
  const rows = query.data ?? [];

  const act = async (plan: AdminFloorPlan, status: FloorPlanMeasurementStatus) => {
    setBusy(plan.id);
    try {
      await unwrap(adminFloorPlansService.setMeasurement(plan, status, notes[plan.id]));
      toast.success(
        status === 'CHECKED'
          ? 'Marked as checked. The listing now says “Measured, checked by Sureground”.'
          : 'Sent back to estimated. The listing now labels these sizes “Estimated”.'
      );
    } catch (e) {
      toast.error((e as Error).message || 'Could not update this floor plan.');
    } finally {
      setBusy(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'floor-plans'] });
    }
  };

  return (
    <>
      <PageHeader
        title="Floor plan checks"
        description="Room sizes listers gave on their floor plans. Listings show them as “Estimated” until you check them against the plan, an inspection or a site measurement. Only mark a plan as checked when every size on it matches."
      />

      <Tabs value={view} onValueChange={(v) => setView(v as FloorPlanMeasurementStatus)}>
        <TabsList className="mb-4">
          <TabsTrigger value="ESTIMATED">Awaiting a check</TabsTrigger>
          <TabsTrigger value="CHECKED">Checked</TabsTrigger>
        </TabsList>
      </Tabs>

      {query.isLoading ? (
        <ListSkeleton variant="cards" />
      ) : query.isError && !query.data ? (
        <PageErrorState
          title="Could not load floor plans"
          description={(query.error as Error).message}
          onRetry={() => query.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Ruler}
          title={view === 'ESTIMATED' ? 'Nothing to check' : 'No checked floor plans yet'}
          description={
            view === 'ESTIMATED'
              ? 'No floor plan with room sizes is waiting for a check.'
              : 'Floor plans you mark as checked appear here.'
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map((plan) => (
            <Card key={plan.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {plan.propertyTitle} · {plan.levelName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[
                      plan.propertyReference,
                      plan.location,
                      `updated ${formatDate(plan.updatedAt)}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <Badge variant={plan.measurementStatus === 'CHECKED' ? 'success' : 'neutral'}>
                  {plan.measurementStatus === 'CHECKED' ? 'Checked' : 'Estimated'}
                </Badge>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                {plan.imageUrl ? (
                  <div className="relative self-start">
                    {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URL */}
                    <img
                      src={plan.imageUrl}
                      alt={`Floor plan, ${plan.levelName}`}
                      className="block h-auto max-h-96 w-auto max-w-full rounded border border-border bg-white"
                    />
                    {plan.rooms.map((r, i) =>
                      r.planX !== undefined && r.planY !== undefined ? (
                        <span
                          key={r.id}
                          aria-hidden="true"
                          className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground ring-2 ring-white"
                          style={{ left: `${r.planX}%`, top: `${r.planY}%` }}
                        >
                          {i + 1}
                        </span>
                      ) : null
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">The plan image could not load.</p>
                )}
                <ol className="space-y-1 text-sm">
                  {plan.rooms.map((r, i) => (
                    <li key={r.id} className="flex justify-between gap-3">
                      <span className="text-foreground">
                        {i + 1}. {r.name}
                      </span>
                      <span className="data-value text-muted-foreground">{size(r)}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {plan.measurementStatus === 'CHECKED' && plan.checkedAt && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Checked {formatDate(plan.checkedAt)}
                  {plan.checkedByName ? ` by ${plan.checkedByName}` : ''}. Any change by the lister
                  to a room name, a size or the plan image sends it back here.
                </p>
              )}

              {canAct ? (
                <div className="mt-4 space-y-2">
                  <Textarea
                    value={notes[plan.id] ?? ''}
                    maxLength={500}
                    onChange={(e) => setNotes((n) => ({ ...n, [plan.id]: e.target.value }))}
                    placeholder="How you checked the sizes (kept in the audit log)"
                    aria-label={`How you checked ${plan.levelName}`}
                  />
                  {plan.measurementStatus === 'ESTIMATED' ? (
                    <Button
                      variant="primary"
                      disabled={busy === plan.id}
                      onClick={() => act(plan, 'CHECKED')}
                    >
                      Mark as checked
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      disabled={busy === plan.id}
                      onClick={() => act(plan, 'ESTIMATED')}
                    >
                      Back to estimated
                    </Button>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  Marking sizes as checked needs the verification approval permission.
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
