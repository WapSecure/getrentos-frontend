'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, KeyRound, Plus, UserPlus, X } from 'lucide-react';
import { Badge, Button, EmptyState, LegacyInput } from '@getrentos/ui';
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
   * always reported — staying silent here leaves a visitor waiting with no idea
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
        <Button variant="primary" className="gap-2" onClick={() => setIsIssueModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Issue Pass
        </Button>
      </div>

      {notice && (
        <div className="flex items-start justify-between gap-3 p-4 rounded-lg bg-secondary text-foreground mb-4">
          <p className="text-sm">{notice}</p>
          <button
            type="button"
            className="text-xs underline shrink-0"
            onClick={() => setNotice(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Someone is at the gate, so this sits above everything else on the page. */}
      {awaiting.length > 0 && (
        <div className="space-y-3 mb-6">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-destructive" />
            Waiting at the gate
          </h2>
          {awaiting.map((pass) => (
            <div key={pass.id} className="bg-card rounded-2xl border border-border p-4 space-y-3">
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
                  disabled={approveMutation.isPending}
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
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : others.length === 0 && awaiting.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={KeyRound}
            title="No visitor passes yet"
            description="Issue a pass so your visitor can check in at the gate."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {others.map((pass) => (
            <div key={pass.id} className="p-4 flex items-center justify-between gap-4">
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
                    disabled={revokeMutation.isPending}
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
        Collects why a visitor was refused. The reason is optional — somebody
        declining a visitor should not have to justify it to reach the button —
        but when it is given the guard reads it out loud, so it is framed as
        something to say to the person at the barrier rather than as a note for
        the record.
      */}
      <AnimatePresence>
        {denying && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-card rounded-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-4 border-b border-border flex justify-between items-center">
                <h3 className="font-semibold text-foreground">Refuse {denying.visitorName}?</h3>
                <button
                  onClick={() => {
                    setDenying(null);
                    setDenyReason('');
                  }}
                  className="p-1 rounded-lg hover:bg-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  The gate will be told not to admit them, and the visitor will be turned away.
                </p>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Reason <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <LegacyInput
                    type="text"
                    value={denyReason}
                    onChange={(e) => setDenyReason(e.target.value)}
                    placeholder="e.g. I am not expecting anyone"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Shown to the guard, who may repeat it to the visitor.
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-border">
                <Button
                  variant="primary"
                  fullWidth
                  disabled={denyMutation.isPending}
                  onClick={() =>
                    denyMutation.mutate({
                      passId: denying.id,
                      reason: denyReason.trim() || undefined,
                    })
                  }
                >
                  {denyMutation.isPending ? 'Refusing…' : 'Refuse entry'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
