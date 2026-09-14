'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList,
  Search,
  UserRound,
  Building2,
  ListTodo,
  Star,
  BadgeCheck,
  ClipboardCheck,
  ShieldCheck,
} from 'lucide-react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Input,
  PageErrorState,
  Pagination,
  LegacyInput,
  Toast,
  type BadgeVariant,
} from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { adminMarketplaceService } from '@/services/adminMarketplaceService';
import { useProfessionalActions, downloadBlob } from './useProfessionalActions';
import type { AdminAgent, AdminAgentDetail, AdminAgentTask } from '@/types/marketplace';

const PAGE_SIZE = 10;

const TASK_STATUS_VARIANT: Record<string, BadgeVariant> = {
  ASSIGNED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  OVERDUE: 'danger',
  CANCELLED: 'neutral',
};

export const AgentRegister = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [active, setActive] = useState<AdminAgent | null>(null);
  const [exporting, setExporting] = useState(false);
  const actions = useProfessionalActions('agents');

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'agents', { search, page }],
    queryFn: () =>
      unwrap(
        adminMarketplaceService.listAgents({
          search: search.trim() || undefined,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const items = data?.items ?? [];

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await adminMarketplaceService.exportAgents({
        search: search.trim() || undefined,
      });
      downloadBlob(blob, 'agents.csv');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
          <p className="mt-1 text-muted-foreground">
            Field-agent register — clients, assigned properties, tasks, inspections and reviews.
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exporting…' : 'Export CSV'}
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <LegacyInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name or email..."
              className="w-full pl-9"
            />
          </div>
        </div>

        {isError ? (
          <PageErrorState
            title="Could not load agents"
            description="The agent register is temporarily unavailable."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
            className="min-h-[220px] rounded-none border-0"
          />
        ) : isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No agents"
            description="Try adjusting your filters."
          />
        ) : (
          <div className="divide-y divide-border">
            {items.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setActive(a)}
                className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-secondary/40"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{a.legalName}</p>
                    {a.verificationStatus === 'APPROVED' && (
                      <Badge variant="success">Verified</Badge>
                    )}
                    {a.suspended && <Badge variant="danger">Suspended</Badge>}
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <UserRound className="h-3.5 w-3.5" /> {a.email ?? 'No email'}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {a.activeClientCount} active client{a.activeClientCount === 1 ? '' : 's'} ·{' '}
                    {a.propertyCount} properties · {a.openTaskCount} open task
                    {a.openTaskCount === 1 ? '' : 's'} · {a.completedTaskCount} completed ·{' '}
                    {a.inspectionCount} inspections · {a.verificationCount} verifications
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className="flex items-center justify-end gap-1 font-semibold">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {a.averageRating || '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">{a.reviewCount} reviews</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data?.total ?? 0}
          onPageChange={setPage}
        />
      </div>

      {active && (
        <AgentDetailDialog agentId={active.id} onClose={() => setActive(null)} actions={actions} />
      )}
      {actions.feedback}
    </div>
  );
};

function AgentDetailDialog({
  agentId,
  onClose,
  actions,
}: {
  agentId: string;
  onClose: () => void;
  actions: ReturnType<typeof useProfessionalActions>;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'agents', agentId, 'detail'],
    queryFn: () => unwrap(adminMarketplaceService.agentDetail(agentId)),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading agent…</div>
        ) : isError || !data ? (
          <div className="p-8 text-center">
            <p className="text-destructive">Could not load the agent case.</p>
            <Button className="mt-3" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <AgentCase360 detail={data} onClose={onClose} actions={actions} />
        )}
      </div>
    </div>
  );
}

function AgentCase360({
  detail,
  onClose,
  actions,
}: {
  detail: AdminAgentDetail;
  onClose: () => void;
  actions: ReturnType<typeof useProfessionalActions>;
}) {
  const [reassigning, setReassigning] = useState<AdminAgentTask | null>(null);
  const tasks = detail.tasks;
  const stats = [
    {
      icon: UserRound,
      label: 'Active clients',
      value: detail.activeClientCount,
      sub: `${detail.pendingClientCount} pending`,
    },
    { icon: Building2, label: 'Properties', value: detail.propertyCount },
    { icon: ClipboardCheck, label: 'Inspections', value: detail.inspectionCount },
    { icon: ShieldCheck, label: 'Verifications', value: detail.verificationCount },
  ];

  const taskSummary = tasks
    ? [
        { label: 'Assigned', value: tasks.assigned, variant: 'info' as BadgeVariant },
        { label: 'In progress', value: tasks.inProgress, variant: 'warning' as BadgeVariant },
        { label: 'Completed', value: tasks.completed, variant: 'success' as BadgeVariant },
        { label: 'Overdue', value: tasks.overdue, variant: 'danger' as BadgeVariant },
      ]
    : [];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5">
        <div>
          <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold">
            {detail.legalName}
            {detail.verificationStatus === 'APPROVED' && (
              <Badge variant="success">
                <BadgeCheck className="mr-1 h-3.5 w-3.5" /> Verified
              </Badge>
            )}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {detail.email ?? 'No email'}
            {detail.phone ? ` · ${detail.phone}` : ''} · Joined {formatDate(detail.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={detail.accountStatus === 'ACTIVE' ? 'success' : 'neutral'}>
            {detail.accountStatus}
          </Badge>
          <Badge variant="neutral">Trust {detail.trustScore}</Badge>
          {detail.suspended ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                actions.request({
                  title: 'Restore agent activity?',
                  description:
                    'The agent will immediately regain the ability to take new clients and field work.',
                  label: 'Restore',
                  run: (reason) => unwrap(adminMarketplaceService.restoreAgent(detail.id, reason)),
                })
              }
            >
              Restore
            </Button>
          ) : (
            <Button
              size="sm"
              variant="danger"
              onClick={() =>
                actions.request({
                  title: 'Suspend agent activity?',
                  description:
                    'Blocks new client invitations and inspection/verification submissions immediately — independent of the account, which stays otherwise usable.',
                  label: 'Suspend',
                  run: (reason) => unwrap(adminMarketplaceService.suspendAgent(detail.id, reason)),
                })
              }
            >
              Suspend
            </Button>
          )}
        </div>
      </div>
      {detail.suspended && detail.suspendedReason && (
        <p className="border-b border-border bg-destructive/5 px-5 py-2 text-sm text-destructive">
          Suspended{detail.suspendedAt ? ` ${formatDate(detail.suspendedAt)}` : ''}:{' '}
          {detail.suspendedReason}
        </p>
      )}

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-secondary/40 p-3">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <s.icon className="h-3.5 w-3.5" /> {s.label}
              </p>
              <p className="mt-1 text-xl font-semibold">{s.value}</p>
              {s.sub && <p className="text-xs text-muted-foreground">{s.sub}</p>}
            </div>
          ))}
        </div>

        {taskSummary.length > 0 && (
          <div className="rounded-xl border border-border p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <ListTodo className="h-4 w-4" /> Task summary
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {taskSummary.map((t) => (
                <div key={t.label} className="rounded-lg bg-secondary/40 px-3 py-2 text-sm">
                  <Badge variant={t.variant}>{t.value}</Badge>
                  <span className="ml-2 text-muted-foreground">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {detail.recentClients.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Recent clients</p>
              <div className="space-y-2">
                {detail.recentClients.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-2.5 text-sm"
                  >
                    <p className="font-medium">{c.clientName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="neutral">{c.status}</Badge>
                      <span>{c.propertyCount ?? 0} props</span>
                      {c.status === 'ACTIVE' && (
                        <button
                          type="button"
                          className="font-medium text-destructive hover:underline"
                          onClick={() =>
                            actions.request({
                              title: 'Revoke this client relationship?',
                              description: `${detail.legalName} will immediately lose access to ${c.clientName}'s properties.`,
                              label: 'Revoke',
                              run: (reason) =>
                                unwrap(
                                  adminMarketplaceService.revokeAgentClient(detail.id, c.id, reason)
                                ),
                            })
                          }
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detail.recentTasks.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Recent tasks</p>
              <div className="space-y-2">
                {detail.recentTasks.map((t) => (
                  <div key={t.id} className="rounded-lg border border-border p-2.5 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{t.title}</p>
                      <Badge variant={TASK_STATUS_VARIANT[t.status] ?? 'neutral'}>{t.status}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t.type} · {t.propertyTitle ?? 'No property'}
                      {t.assignedByName ? ` · by ${t.assignedByName}` : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Due {formatDate(t.dueAt ?? t.createdAt, 'short')}
                    </p>
                    <div className="mt-2 flex gap-3">
                      {(t.status === 'ASSIGNED' ||
                        t.status === 'IN_PROGRESS' ||
                        t.status === 'OVERDUE') && (
                        <button
                          type="button"
                          className="text-xs font-medium text-primary hover:underline"
                          onClick={() => setReassigning(t)}
                        >
                          Reassign
                        </button>
                      )}
                      {t.status === 'CANCELLED' && (
                        <button
                          type="button"
                          className="text-xs font-medium text-primary hover:underline"
                          onClick={() =>
                            actions.request({
                              title: 'Reopen this cancelled task?',
                              description:
                                'The task returns to Assigned so it can be worked or reassigned.',
                              label: 'Reopen',
                              run: (reason) =>
                                unwrap(
                                  adminMarketplaceService.setAgentTaskStatus(
                                    t.id,
                                    'ASSIGNED',
                                    reason
                                  )
                                ),
                            })
                          }
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border p-4">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      {reassigning && (
        <TaskReassignDialog task={reassigning} onClose={() => setReassigning(null)} />
      )}
    </div>
  );
}

function TaskReassignDialog({ task, onClose }: { task: AdminAgentTask; onClose: () => void }) {
  const client = useQueryClient();
  const [newAgentId, setNewAgentId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!newAgentId.trim()) throw new Error('Enter the target agent’s user ID.');
      if (reason.trim().length < 10)
        throw new Error('Provide an administrative reason of at least 10 characters.');
      return unwrap(
        adminMarketplaceService.reassignAgentTask(task.id, newAgentId.trim(), reason.trim())
      );
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin', 'agents'] });
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogTitle className="font-semibold">Reassign task</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            {task.title} — find the target agent&apos;s user ID from their own case-360 URL or the
            users register.
          </DialogDescription>
          <div className="mt-5 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Target agent user ID</span>
              <Input value={newAgentId} onChange={(e) => setNewAgentId(e.target.value)} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Administrative reason</span>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="At least 10 characters"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                {mutation.isPending ? 'Reassigning…' : 'Reassign'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {error && <Toast message={error} variant="error" onClose={() => setError(null)} />}
    </>
  );
}
