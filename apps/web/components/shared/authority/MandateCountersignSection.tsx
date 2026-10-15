'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Check, X } from 'lucide-react';
import { Badge, Button, Input, Toast, type ToastVariant } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import {
  propertyAuthorityService,
  AUTHORITY_RELATIONSHIP_LABELS,
  type AuthorityRelationship,
} from '@/services/propertyAuthorityService';

/**
 * Mandates awaiting the signed-in co-owner's countersignature.
 *
 * Co-owner quorum is unanimous: an agent/manager mandate on a property with more
 * than one co-owner only takes effect once every co-owner has countersigned. This
 * is the co-owner's side of that — review the ones waiting on them, countersign or
 * decline. Renders nothing when there are none, so it is invisible unless it
 * matters.
 */
export function MandateCountersignSection() {
  const queryClient = useQueryClient();
  const queryKey = ['property-authority', 'awaiting-countersignature'];
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data: pending } = useQuery({
    queryKey,
    queryFn: () => unwrap(propertyAuthorityService.awaitingCountersignature()),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const countersign = useMutation({
    mutationFn: (id: string) => unwrap(propertyAuthorityService.countersign(id)),
    onSuccess: (result) => {
      invalidate();
      setToast({
        message: result.awaitingCountersign
          ? 'Countersigned. Waiting on the other co-owners.'
          : 'Countersigned. The mandate is now active.',
        variant: 'success',
      });
    },
    onError: (e: Error) =>
      setToast({ message: e.message || 'Could not countersign.', variant: 'error' }),
  });

  const decline = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      unwrap(propertyAuthorityService.declineCountersign(id, reason)),
    onSuccess: () => {
      invalidate();
      setDecliningId(null);
      setDeclineReason('');
      setToast({ message: 'Mandate declined.', variant: 'success' });
    },
    onError: (e: Error) =>
      setToast({ message: e.message || 'Could not decline.', variant: 'error' }),
  });

  if (!pending || pending.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" />
        Mandates awaiting your approval
      </h2>
      <p className="mt-1 mb-3 text-sm text-muted-foreground">
        Every co-owner must approve a manager/agent mandate before it takes effect.
      </p>

      <div className="space-y-3">
        {pending.map((m) => {
          const label =
            AUTHORITY_RELATIONSHIP_LABELS[m.relationship as AuthorityRelationship] ??
            m.relationship;
          const busy = countersign.isPending || decline.isPending;
          return (
            <div key={m.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{label}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {m.propertyReferenceCode ?? 'Your property'}
                    {m.note ? ` · ${m.note}` : ''}
                  </p>
                </div>
                {m.countersignRequired != null && (
                  <Badge variant="warning">
                    {m.countersignApproved ?? 0}/{m.countersignRequired} approved
                  </Badge>
                )}
              </div>

              {decliningId === m.id ? (
                <div className="mt-3 space-y-2">
                  <Input
                    placeholder="Reason for declining (optional)"
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={busy}
                      onClick={() => decline.mutate({ id: m.id, reason: declineReason.trim() })}
                    >
                      Confirm decline
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDecliningId(null);
                        setDeclineReason('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="gap-1.5"
                    disabled={busy}
                    onClick={() => countersign.mutate(m.id)}
                  >
                    <Check className="h-4 w-4" />
                    Countersign
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    disabled={busy}
                    onClick={() => setDecliningId(m.id)}
                  >
                    <X className="h-4 w-4" />
                    Decline
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </section>
  );
}
