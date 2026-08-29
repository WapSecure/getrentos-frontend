'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Plus } from 'lucide-react';
import { Badge, Button, EmptyState } from '@getrentos/ui';
import { estateResidentService } from '@/services/estateResidentService';
import { unwrap } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';
import { IssueResidentVisitorPassModal } from '@/components/estate/resident/IssueResidentVisitorPassModal';
import { VisitorPinDialog } from '@/components/estate/visitor-passes/VisitorPinDialog';
import type { IssuedVisitorPass, VisitorPass } from '@/types/estate';

const statusVariant: Record<VisitorPass['status'], 'success' | 'warning' | 'neutral' | 'danger'> = {
  pending: 'warning',
  checked_in: 'success',
  expired: 'neutral',
  revoked: 'danger',
};

const statusLabels: Record<VisitorPass['status'], string> = {
  pending: 'Pending',
  checked_in: 'Checked In',
  expired: 'Expired',
  revoked: 'Revoked',
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

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : passes.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={KeyRound}
            title="No visitor passes yet"
            description="Issue a pass so your visitor can check in at the gate."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {passes.map((pass) => (
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
    </>
  );
}
