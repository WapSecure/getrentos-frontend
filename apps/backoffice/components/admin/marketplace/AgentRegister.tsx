'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList,
  UserRound,
  Building2,
  ListTodo,
  Star,
  BadgeCheck,
  ClipboardCheck,
  ShieldCheck,
} from '@sureground/icons';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  CardSkeleton,
  EmptyState,
  Field,
  Input,
  ListSkeleton,
  PageErrorState,
  Pagination,
  SearchInput,
  Select,
  useToast,
  type BadgeVariant,
  PageHeader,
} from '@sureground/ui';
import { formatDate, unwrap, humaniseEnum } from '@sureground/shared';
import { adminMarketplaceService } from '@/services/adminMarketplaceService';
import { useProfessionalActions, downloadBlob } from './useProfessionalActions';
import type { AdminAgent, AdminAgentDetail, AdminAgentTask } from '@/types/marketplace';
import { useAdminCan } from '@/hooks/useAdminCan';

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
    placeholderData: keepPreviousData,
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
      <PageHeader
        title="Agents"
        description="Field-agent register: clients, assigned properties, tasks, inspections and reviews."
        actions={
          <Button
            variant="outline"
            onClick={handleExport}
            isLoading={exporting}
            loadingText="Exporting…"
          >
            Export CSV
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <SearchInput
            value={search}
            onValueChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            label="Search agents"
            placeholder="Search name or email..."
            className="flex-1 min-w-[220px] max-w-sm"
          />
        </div>

        {isLoading ? (
          <ListSkeleton rows={5} className="rounded-none border-0" />
        ) : isError && !data ? (
          <PageErrorState
            title="Could not load agents"
            description="The agent register is temporarily unavailable."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
            className="min-h-[220px] rounded-none border-0"
          />
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
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="xl" padded={false}>
        {isLoading ? (
          <div className="space-y-4 p-5">
            <DialogTitle className="sr-only">Loading agent case</DialogTitle>
            <CardSkeleton lines={2} />
            <CardSkeleton lines={4} />
          </div>
        ) : isError || !data ? (
          <div className="p-8 text-center">
            <DialogTitle className="text-destructive">Could not load the agent case.</DialogTitle>
            <Button className="mt-3" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <AgentCase360 detail={data} onClose={onClose} actions={actions} />
        )}
      </DialogContent>
    </Dialog>
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
  const canModerate = useAdminCan('professionals.moderate');
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
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5 pr-12">
        <div className="min-w-0">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-lg font-semibold text-foreground">
            {detail.legalName}
            {detail.verificationStatus === 'APPROVED' && (
              <Badge variant="success">
                <BadgeCheck className="mr-1 h-3.5 w-3.5" /> Verified
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            {detail.email ?? 'No email'}
            {detail.phone ? ` · ${detail.phone}` : ''} · Joined {formatDate(detail.createdAt)}
          </DialogDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={detail.accountStatus === 'ACTIVE' ? 'success' : 'neutral'}>
            {detail.accountStatus}
          </Badge>
          <Badge variant="neutral">Trust {detail.trustScore}</Badge>
          {!canModerate ? null : detail.suspended ? (
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
                    'Blocks new client invitations and inspection/verification submissions immediately: independent of the account, which stays otherwise usable.',
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
        <p className="border-b border-border bg-destructive-subtle px-5 py-2 text-sm text-destructive">
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
                      <Badge variant="neutral">{humaniseEnum(c.status)}</Badge>
                      <span>{c.propertyCount ?? 0} props</span>
                      {canModerate && c.status === 'ACTIVE' && (
                        <Button
                          variant="link"
                          className="text-xs font-medium text-destructive"
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
                        </Button>
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
                      <Badge variant={TASK_STATUS_VARIANT[t.status] ?? 'neutral'}>
                        {humaniseEnum(t.status)}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t.type} · {t.propertyTitle ?? 'No property'}
                      {t.assignedByName ? ` · by ${t.assignedByName}` : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Due {formatDate(t.dueAt ?? t.createdAt, 'short')}
                    </p>
                    {canModerate && (
                      <div className="mt-2 flex gap-3">
                        {(t.status === 'ASSIGNED' ||
                          t.status === 'IN_PROGRESS' ||
                          t.status === 'OVERDUE') && (
                          <Button
                            variant="link"
                            className="text-xs font-medium"
                            onClick={() => setReassigning(t)}
                          >
                            Reassign
                          </Button>
                        )}
                        {t.status === 'CANCELLED' && (
                          <Button
                            variant="link"
                            className="text-xs font-medium"
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
                          </Button>
                        )}
                      </div>
                    )}
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
        <TaskReassignDialog
          task={reassigning}
          currentAgentId={detail.id}
          onClose={() => setReassigning(null)}
        />
      )}
    </div>
  );
}

function TaskReassignDialog({
  task,
  currentAgentId,
  onClose,
}: {
  task: AdminAgentTask;
  currentAgentId: string;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const [newAgentId, setNewAgentId] = useState('');
  const [reason, setReason] = useState('');
  const toast = useToast();

  const { data: candidates, isFetching: searching } = useQuery({
    queryKey: ['admin', 'agents', 'reassign-picker', search.trim()],
    queryFn: () =>
      unwrap(
        adminMarketplaceService.listAgents({ search: search.trim() || undefined, pageSize: 20 })
      ),
    placeholderData: keepPreviousData,
  });
  const agentOptions = (candidates?.items ?? [])
    .filter((agent) => agent.id !== currentAgentId)
    .map((agent) => ({
      value: agent.id,
      label: agent.email ? `${agent.legalName} · ${agent.email}` : agent.legalName,
      disabled: agent.suspended,
    }));

  const mutation = useMutation({
    mutationFn: async () => {
      if (!newAgentId) throw new Error('Choose the agent to take over this task.');
      if (reason.trim().length < 10)
        throw new Error('Provide an administrative reason of at least 10 characters.');
      return unwrap(adminMarketplaceService.reassignAgentTask(task.id, newAgentId, reason.trim()));
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin', 'agents'] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-6">
        <DialogTitle className="font-semibold">Reassign task</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-muted-foreground">
          Move &ldquo;{task.title}&rdquo; to another agent. Suspended agents can&apos;t take new
          work.
        </DialogDescription>
        <div className="mt-5 space-y-4">
          <SearchInput
            value={search}
            onValueChange={(value) => {
              setSearch(value);
              setNewAgentId('');
            }}
            label="Find an agent"
            placeholder="Search name or email..."
          />
          <Field label="New agent">
            <Select
              ariaLabel="New agent"
              value={newAgentId || undefined}
              onValueChange={setNewAgentId}
              options={agentOptions}
              placeholder={
                searching
                  ? 'Searching…'
                  : agentOptions.length
                    ? 'Choose an agent'
                    : 'No other agents match'
              }
            />
          </Field>
          <Field label="Administrative reason">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="At least 10 characters"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!newAgentId}
              isLoading={mutation.isPending}
              loadingText="Reassigning…"
            >
              Reassign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
