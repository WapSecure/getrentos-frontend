'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Check, Loader2, MapPin, ShieldCheck, X } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Textarea, Toast, type ToastVariant } from '@getrentos/ui';
import { estateAgreementService } from '@/services/estateMarketplaceService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import type { EstateAgreement } from '@/types/estate-marketplace';

/**
 * Estates asking to market a property the signed-in user owns.
 *
 * The copy does the reassuring, because the question is a nervous one: an owner
 * being asked to hand a third party the right to advertise their property needs
 * to know, before they click, that they keep the property and the money. Making
 * that explicit is the difference between an approval and a support ticket.
 */
export default function OwnerEstateAgreementsPage() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const agreements = useQuery({
    queryKey: estateKeys.myAgreements,
    queryFn: () => unwrap(estateAgreementService.mine()),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: estateKeys.myAgreements });
    setExpanded(null);
    setReason('');
  };

  const approve = useMutation({
    mutationFn: (id: string) => unwrap(estateAgreementService.approve(id, {})),
    onSuccess: () => {
      setToast({
        message: 'Approved — the estate can now market your property.',
        variant: 'success',
      });
      refresh();
    },
    onError: (err: Error) => setToast({ message: err.message, variant: 'error' }),
  });

  const decline = useMutation({
    mutationFn: (id: string) => unwrap(estateAgreementService.decline(id, reason.trim())),
    onSuccess: () => {
      setToast({ message: 'Request declined.', variant: 'success' });
      refresh();
    },
    onError: (err: Error) => setToast({ message: err.message, variant: 'error' }),
  });

  const revoke = useMutation({
    mutationFn: (id: string) =>
      unwrap(estateAgreementService.revoke(id, reason.trim() || 'Authorisation withdrawn')),
    onSuccess: () => {
      setToast({
        message: 'Withdrawn — their published listings for this property are now paused.',
        variant: 'success',
      });
      refresh();
    },
    onError: (err: Error) => setToast({ message: err.message, variant: 'error' }),
  });

  const all = agreements.data ?? [];
  const requests = all.filter((a) => a.status === 'PENDING');
  const active = all.filter((a) => a.status === 'ACTIVE');

  const Row = ({ agreement }: { agreement: EstateAgreement }) => {
    const isOpen = expanded === agreement.id;
    const isPending = agreement.status === 'PENDING';

    return (
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="font-medium text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary shrink-0" />
              {agreement.estateName}
            </p>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {agreement.propertyTitle} · {agreement.propertyAddress}
              </span>
            </p>
            {agreement.note && (
              <p className="text-sm text-muted-foreground mt-2">“{agreement.note}”</p>
            )}
            {isPending && agreement.requestedByEmail && (
              <p className="text-xs text-muted-foreground mt-2">
                Asked by {agreement.requestedByEmail}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isPending ? (
              <>
                <Button
                  variant="primary"
                  onClick={() => approve.mutate(agreement.id)}
                  disabled={approve.isPending}
                >
                  {approve.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Allow
                </Button>
                <Button variant="outline" onClick={() => setExpanded(isOpen ? null : agreement.id)}>
                  {isOpen ? 'Cancel' : 'Decline'}
                </Button>
              </>
            ) : (
              <>
                <Badge variant="success">Marketing live</Badge>
                <Button variant="outline" onClick={() => setExpanded(isOpen ? null : agreement.id)}>
                  {isOpen ? 'Cancel' : 'Withdraw'}
                </Button>
              </>
            )}
          </div>
        </div>

        {isOpen && (
          <div className="border-t border-border mt-4 pt-4 space-y-3">
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={
                isPending
                  ? 'Optional: tell the estate why you are declining'
                  : 'Optional: why you are withdrawing'
              }
            />
            <div className="flex gap-2">
              {isPending ? (
                <Button
                  variant="outline"
                  disabled={decline.isPending}
                  onClick={() => decline.mutate(agreement.id)}
                >
                  Confirm decline
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled={revoke.isPending}
                  onClick={() => revoke.mutate(agreement.id)}
                >
                  Confirm withdraw
                </Button>
              )}
            </div>
            {active.length > 0 && !isPending && (
              <p className="text-xs text-muted-foreground">
                Withdrawing also pauses any listings this estate has published for the property.
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Estate requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Estates inside your properties&apos; communities can ask to advertise them. You keep
          ownership and control of any money — an estate only ever gains the right to market.
        </p>
      </header>

      <Card static>
        <div className="p-6">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Waiting on you
          </h2>

          {agreements.isLoading ? (
            <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </p>
          ) : requests.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={ShieldCheck}
                title="Nothing to review"
                description="When an estate asks to market one of your properties, it will appear here."
              />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {requests.map((agreement) => (
                <Row key={agreement.id} agreement={agreement} />
              ))}
            </div>
          )}
        </div>
      </Card>

      {active.length > 0 && (
        <Card static>
          <div className="p-6">
            <h2 className="font-semibold text-foreground">Currently marketing your properties</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Take any of these back at any time.
            </p>
            <div className="mt-4 space-y-3">
              {active.map((agreement) => (
                <Row key={agreement.id} agreement={agreement} />
              ))}
            </div>
          </div>
        </Card>
      )}

      {toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
    </div>
  );
}
