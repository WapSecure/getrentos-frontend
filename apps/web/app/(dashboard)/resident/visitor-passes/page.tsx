'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, KeyRound, Plus, UserPlus } from '@sureground/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  ListSkeleton,
  PageHeader,
  Pagination,
} from '@sureground/ui';
import { estateResidentService } from '@/services/estateResidentService';
import { unwrap } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';
import { IssueResidentVisitorPassModal } from '@/components/estate/resident/IssueResidentVisitorPassModal';
import { VisitorPinDialog } from '@/components/estate/visitor-passes/VisitorPinDialog';
import type { IssuedVisitorPass, VisitorPass } from '@/types/estate';
import { formatClock } from '@sureground/shared';

const statusVariant: Record<VisitorPass['status'], 'success' | 'warning' | 'neutral' | 'danger'> = {
  pending: 'warning',
  awaiting_approval: 'warning',
  approved: 'success',
  checked_in: 'success',
  checked_out: 'neutral',
  expired: 'neutral',
  revoked: 'danger',
  denied: 'danger',
};

const statusLabels: Record<VisitorPass['status'], string> = {
  pending: 'Pending',
  awaiting_approval: 'Needs your answer',
  approved: 'Approved',
  checked_in: 'Checked in',
  checked_out: 'Checked out',
  expired: 'Expired',
  revoked: 'Revoked',
  denied: 'Refused',
};

const PAGE_SIZE = 10;

// Once a visitor has been and gone, or the pass was cancelled, its expiry no longer means anything.
const SHOWS_EXPIRY = new Set<VisitorPass['status']>([
  'pending',
  'approved',
  'checked_in',
  'expired',
]);

const formatDate = (value: string) =>
  formatClock(new Date(value), { day: 'numeric', month: 'short', minute: '2-digit' });

// Module scope keeps the clock read out of render.
const expiryLabel = (iso: string) =>
  `${new Date(iso).getTime() < Date.now() ? 'Expired' : 'Expires'} ${formatDate(iso)}`;

export default function ResidentVisitorPassesPage() {
  const queryClient = useQueryClient();
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issuedPass, setIssuedPass] = useState<IssuedVisitorPass | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [denying, setDenying] = useState<VisitorPass | null>(null);
  const [denyReason, setDenyReason] = useState('');

  const [activePage, setActivePage] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  // A walk-in waiting at the gate times out within minutes, so these are few and never paged.
  const waiting = useQuery({
    queryKey: estateResidentKeys.visitorPasses('waiting'),
    queryFn: () =>
      unwrap(
        estateResidentService.listMyVisitorPasses({ status: 'awaiting_approval', pageSize: 50 })
      ),
  });
  const active = useQuery({
    queryKey: estateResidentKeys.visitorPasses('active', activePage),
    queryFn: () =>
      unwrap(
        estateResidentService.listMyVisitorPasses({
          scope: 'active',
          page: activePage,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const past = useQuery({
    queryKey: estateResidentKeys.visitorPasses('past', pastPage),
    queryFn: () =>
      unwrap(
        estateResidentService.listMyVisitorPasses({
          scope: 'past',
          page: pastPage,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const isLoading = waiting.isPending || active.isPending || past.isPending;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: estateResidentKeys.visitorPassesAll });

  const issueMutation = useMutation({
    mutationFn: (input: {
      visitorName: string;
      visitorPhone?: string;
      purpose?: string;
      expiresAt?: string;
    }) => unwrap(estateResidentService.issueMyVisitorPass(input)),
    onSuccess: (pass) => {
      invalidate();
      setIsIssueModalOpen(false);
      setIssuedPass(pass);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (passId: string) => unwrap(estateResidentService.revokeMyVisitorPass(passId)),
    onSuccess: invalidate,
  });
  const [revoking, setRevoking] = useState<{ id: string; visitorName: string } | null>(null);

  const approveMutation = useMutation({
    mutationFn: (passId: string) => unwrap(estateResidentService.approveWalkInVisitorPass(passId)),
    onSuccess: (pass) => {
      invalidate();
      setNotice(`The gate has been told to admit ${pass.visitorName}.`);
    },
    onError: (error) =>
      setNotice(error instanceof Error ? error.message : 'Could not approve that visitor.'),
  });

  const denyMutation = useMutation({
    mutationFn: ({ passId, reason }: { passId: string; reason?: string }) =>
      unwrap(estateResidentService.denyWalkInVisitorPass(passId, reason)),
    onSuccess: (pass) => {
      invalidate();
      setDenying(null);
      setDenyReason('');
      setNotice(`${pass.visitorName} was refused. The gate has been told.`);
    },
    onError: (error) =>
      setNotice(error instanceof Error ? error.message : 'Could not refuse that visitor.'),
  });

  const awaiting = waiting.data?.items ?? [];
  const activePasses = active.data?.items ?? [];
  const pastPasses = past.data?.items ?? [];
  const activeTotal = active.data?.total ?? 0;
  const pastTotal = past.data?.total ?? 0;

  const renderPass = (pass: VisitorPass) => (
    <div key={pass.id} className="p-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{pass.visitorName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {[pass.purpose, SHOWS_EXPIRY.has(pass.status) ? expiryLabel(pass.expiresAt) : null]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Badge variant={statusVariant[pass.status]}>{statusLabels[pass.status]}</Badge>
        {pass.status === 'pending' && (
          <Button
            variant="outline"
            size="sm"
            disabled={revokeMutation.isPending && revokeMutation.variables !== pass.id}
            isLoading={revokeMutation.isPending && revokeMutation.variables === pass.id}
            onClick={() => setRevoking({ id: pass.id, visitorName: pass.visitorName })}
          >
            Revoke
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Visitor passes"
        description={
          isLoading
            ? 'Loading…'
            : `${activeTotal} active pass${activeTotal === 1 ? '' : 'es'} for your household`
        }
        actions={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsIssueModalOpen(true)}
          >
            Issue pass
          </Button>
        }
      />

      {notice && (
        <Alert variant="neutral" onDismiss={() => setNotice(null)} className="mb-4">
          {notice}
        </Alert>
      )}

      {awaiting.length > 0 && (
        <div className="space-y-3 mb-6">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-destructive" />
            Waiting at the gate
          </h2>
          {awaiting.map((pass) => (
            <Card key={pass.id} className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <UserPlus className="w-5 h-5 shrink-0 mt-0.5 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{pass.visitorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {pass.purpose ? `${pass.purpose} · ` : ''}for {pass.unitLabel}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Asked at {formatDate(pass.createdAt)}. If nobody answers by{' '}
                    {formatDate(pass.expiresAt)}, they are turned away.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  className="flex-1"
                  disabled={approveMutation.isPending && approveMutation.variables !== pass.id}
                  isLoading={approveMutation.isPending && approveMutation.variables === pass.id}
                  onClick={() => approveMutation.mutate(pass.id)}
                >
                  Let them in
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={approveMutation.isPending || denyMutation.isPending}
                  onClick={() => {
                    setDenyReason('');
                    setDenying(pass);
                  }}
                >
                  Refuse
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : activeTotal + pastTotal === 0 && awaiting.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No visitor passes yet"
          description="Issue a pass so your visitor can check in at the gate."
        />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Active</h2>
            {activePasses.length === 0 ? (
              <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                No passes waiting to be used. Issue one before a visitor arrives.
              </p>
            ) : (
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="divide-y divide-border">{activePasses.map(renderPass)}</div>
                {activeTotal > PAGE_SIZE && (
                  <Pagination
                    page={activePage}
                    pageSize={PAGE_SIZE}
                    total={activeTotal}
                    onPageChange={setActivePage}
                  />
                )}
              </div>
            )}
          </section>

          {pastPasses.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-foreground">Past</h2>
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="divide-y divide-border">{pastPasses.map(renderPass)}</div>
                {pastTotal > PAGE_SIZE && (
                  <Pagination
                    page={pastPage}
                    pageSize={PAGE_SIZE}
                    total={pastTotal}
                    onPageChange={setPastPage}
                  />
                )}
              </div>
            </section>
          )}
        </div>
      )}

      <IssueResidentVisitorPassModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSubmit={(data) => issueMutation.mutate(data)}
        isSubmitting={issueMutation.isPending}
      />

      <VisitorPinDialog pass={issuedPass} onClose={() => setIssuedPass(null)} />

      <ConfirmDialog
        open={revoking !== null}
        onOpenChange={(open) => {
          if (!open) setRevoking(null);
        }}
        tone="danger"
        title="Revoke this visitor pass?"
        description={
          revoking
            ? `${revoking.visitorName} will be turned away at the gate. You can issue a new pass later, but this one cannot be restored.`
            : ''
        }
        confirmLabel="Revoke pass"
        onConfirm={() =>
          revoking && revokeMutation.mutateAsync(revoking.id).then(() => setRevoking(null))
        }
        isLoading={revokeMutation.isPending}
      />

      <Dialog
        open={!!denying}
        onOpenChange={(open) => {
          if (!open) {
            setDenying(null);
            setDenyReason('');
          }
        }}
      >
        {denying && (
          <DialogContent>
            <DialogTitle className="pr-8 font-semibold text-foreground">
              Refuse {denying.visitorName}?
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">
              The gate will be told not to admit them, and the visitor will be turned away.
            </DialogDescription>

            <Field
              label="Reason"
              optionalLabel="(optional)"
              hint="Shown to the guard, who may repeat it to the visitor."
              className="mt-4"
            >
              <Input
                type="text"
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                placeholder="e.g. I am not expecting anyone"
              />
            </Field>

            <Button
              variant="primary"
              fullWidth
              className="mt-5"
              isLoading={denyMutation.isPending}
              loadingText="Refusing…"
              onClick={() =>
                denyMutation.mutate({
                  passId: denying.id,
                  reason: denyReason.trim() || undefined,
                })
              }
            >
              Refuse entry
            </Button>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
