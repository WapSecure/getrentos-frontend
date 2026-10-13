'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wrench, Camera, Check, Play } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  PageErrorState,
  PageLoadingState,
  Textarea,
  Toast,
  type BadgeVariant,
  type ToastVariant,
} from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { agentService, type AgentWorkOrder } from '@/services/agentService';

const KEY = ['agent', 'work-orders'] as const;

const STATUS_META: Record<AgentWorkOrder['status'], { label: string; variant: BadgeVariant }> = {
  SUBMITTED: { label: 'To do', variant: 'neutral' },
  ASSIGNED: { label: 'To do', variant: 'neutral' },
  IN_PROGRESS: { label: 'In progress', variant: 'warning' },
  RESOLVED: { label: 'Resolved', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'neutral' },
};

export default function AgentWorkOrdersPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [completing, setCompleting] = useState<AgentWorkOrder | null>(null);
  const [report, setReport] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const workOrdersQuery = useQuery({
    queryKey: KEY,
    queryFn: () => unwrap(agentService.listWorkOrders()),
  });
  const { data: workOrders = [], isLoading } = workOrdersQuery;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: KEY });

  const start = useMutation({
    mutationFn: (id: string) => unwrap(agentService.startWorkOrder(id)),
    onSuccess: () => {
      invalidate();
      setToast({ message: 'Work started.', variant: 'success' });
    },
    onError: (e: Error) => setToast({ message: e.message || 'Unable to start.', variant: 'error' }),
  });

  const complete = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      unwrap(agentService.completeWorkOrder(id, note)),
    onSuccess: () => {
      invalidate();
      setCompleting(null);
      setReport('');
      setToast({ message: 'Reported done — the owner can review it.', variant: 'success' });
    },
    onError: (e: Error) =>
      setToast({ message: e.message || 'Unable to complete.', variant: 'error' }),
  });

  const uploadPhoto = async (id: string, file: File | undefined) => {
    if (!file) return;
    setUploadingId(id);
    try {
      await unwrap(agentService.addWorkOrderPhoto(id, file));
      invalidate();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : 'Upload failed.', variant: 'error' });
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">Work orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          On-site maintenance jobs assigned to you. Start a job, add photos, and report it done —
          the property owner reviews and closes it.
        </p>
      </div>

      {isLoading ? (
        <PageLoadingState />
      ) : workOrdersQuery.isError ? (
        <PageErrorState
          title="Work orders are unavailable"
          description="We could not load your assigned maintenance jobs. No work order has been changed."
          onRetry={() => void workOrdersQuery.refetch()}
          isRetrying={workOrdersQuery.isFetching}
        />
      ) : workOrders.length === 0 ? (
        <Card className="p-2">
          <EmptyState
            icon={Wrench}
            title="No work orders assigned"
            description="When a property owner assigns you an on-site maintenance job, it shows up here."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {workOrders.map((wo) => {
            const meta = STATUS_META[wo.status];
            const startable = wo.status === 'ASSIGNED' || wo.status === 'SUBMITTED';
            const inProgress = wo.status === 'IN_PROGRESS';
            return (
              <Card key={wo.id} className="rounded-xl p-5 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{wo.issueTitle}</h3>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      {wo.fieldCompletedAt && <Badge variant="success">Reported done</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {wo.propertyTitle} · {wo.unitName} · {wo.category}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{wo.description}</p>
                    {wo.fieldReport && (
                      <p className="mt-2 text-sm text-foreground">
                        <span className="text-muted-foreground">Your report:</span> {wo.fieldReport}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {startable && (
                      <Button
                        size="sm"
                        icon={<Play className="h-4 w-4" />}
                        onClick={() => start.mutate(wo.id)}
                        disabled={start.isPending && start.variables === wo.id}
                      >
                        Start
                      </Button>
                    )}
                    {inProgress && (
                      <>
                        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-primary">
                          <Camera className="h-4 w-4" />
                          {uploadingId === wo.id ? 'Uploading…' : 'Add photo'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingId !== null}
                            onChange={(e) => {
                              void uploadPhoto(wo.id, e.target.files?.[0]);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        {!wo.fieldCompletedAt && (
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<Check className="h-4 w-4" />}
                            onClick={() => {
                              setCompleting(wo);
                              setReport('');
                            }}
                          >
                            Mark done
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {wo.photos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {wo.photos.map((p, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={p.url}
                        alt="Evidence"
                        className="h-16 w-16 rounded-md object-cover"
                      />
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!completing} onOpenChange={(o) => !o && setCompleting(null)}>
        <DialogContent className="max-w-lg p-6">
          <DialogTitle className="text-lg font-semibold text-foreground">
            Report work done
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Add a note on what you did. The owner reviews and closes the job.
          </DialogDescription>
          <div className="mt-5">
            <Field label="Completion note">
              <Textarea
                value={report}
                onChange={(e) => setReport(e.target.value)}
                rows={4}
                placeholder="e.g. Replaced the washer; tap no longer drips."
                disabled={complete.isPending}
              />
            </Field>
            {completing?.photos.length === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Add a completion photo before reporting done when the result can be shown visually.
              </p>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              rounded="md"
              onClick={() => setCompleting(null)}
              disabled={complete.isPending}
            >
              Cancel
            </Button>
            <Button
              rounded="md"
              onClick={() => completing && complete.mutate({ id: completing.id, note: report })}
              disabled={complete.isPending || !report.trim()}
            >
              {complete.isPending ? 'Saving…' : 'Report done'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
