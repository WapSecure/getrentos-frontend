'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, KeyRound, Plus, UserPlus } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  ListSkeleton,
} from '@getrentos/ui';
import { estateResidentService } from '@/services/estateResidentService';
import { unwrap } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';
import { IssueResidentVisitorPassModal } from '@/components/estate/resident/IssueResidentVisitorPassModal';
import { VisitorPinDialog } from '@/components/estate/visitor-passes/VisitorPinDialog';
import type { IssuedVisitorPass, VisitorPass } from '@/types/estate';

const statusVariant: Record<VisitorPass['status'], 'success' | 'warning' | 'neutral' | 'danger'> = {
  pending: 'warning',
  // Warning, not neutral: this one is waiting on this household to answer.
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
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  expired: 'Expired',
  revoked: 'Revoked',
  denied: 'Refused',
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

export default function ResidentVisitorPassesPage() {
  const queryClient = useQueryClient();
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issuedPass, setIssuedPass] = useState<IssuedVisitorPass | null>(null);
  /** A short message about the last walk-in decision, or a failure to make one. */
  const [notice, setNotice] = useState<string | null>(null);
  /** The walk-in being refused, so the reason can be collected. */
  const [denying, setDenying] = useState<VisitorPass | null>(null);
  const [denyReason, setDenyReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: estateResidentKeys.visitorPasses(),
    queryFn: () => unwrap(estateResidentService.listMyVisitorPasses({ pageSize: 50 })),
  });
  const passes = data?.items ?? [];

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: estateResidentKeys.visitorPasses() });

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

  /**
   * Consenting to a walk-in. Somebody is standing at the gate, so the outcome is
   * always reported: staying silent here leaves a visitor waiting with no idea
   * whether anyone is deciding.
   */
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

  // Walk-ins waiting on this household get their own block above the list: this
  // is the one thing here where a person is standing at a barrier while the
  // resident reads the screen.
  const awaiting = passes.filter((pass) => pass.status === 'awaiting_approval');
  const others = passes.filter((pass) => pass.status !== 'awaiting_approval');

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Visitor Passes</h1>
          <p className="text-muted-foreground mt-1">{data?.total ?? 0} passes for your household</p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsIssueModalOpen(true)}
        >
          Issue Pass
        </Button>
      </div>

      {notice && (
        <Alert variant="neutral" onDismiss={() => setNotice(null)} className="mb-4">
          {notice}
        </Alert>
      )}

      {/* Someone is at the gate, so this sits above everything else on the page. */}
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
      ) : others.length === 0 && awaiting.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No visitor passes yet"
          description="Issue a pass so your visitor can check in at the gate."
        />
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {others.map((pass) => (
            <div
              key={pass.id}
              className="p-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{pass.visitorName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pass.purpose ? `${pass.purpose} · ` : ''}Expires {formatDate(pass.expiresAt)}
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
                    onClick={() => revokeMutation.mutate(pass.id)}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <IssueResidentVisitorPassModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSubmit={(data) => issueMutation.mutate(data)}
        isSubmitting={issueMutation.isPending}
      />

      <VisitorPinDialog pass={issuedPass} onClose={() => setIssuedPass(null)} />

      {/*
        Collects why a visitor was refused. The reason is optional: somebody
        declining a visitor should not have to justify it to reach the button:
        but when it is given the guard reads it out loud, so it is framed as
        something to say to the person at the barrier rather than as a note for
        the record.
      */}
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
