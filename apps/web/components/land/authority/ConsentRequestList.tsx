'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, CircleAlert, Inbox, MapPin, XCircle } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Skeleton, Textarea, useToast } from '@getrentos/ui';
import {
  LAND_CONSENT_LABELS,
  LAND_SELLER_CAPACITY_LABELS,
  LAND_SIGNATORY_ROLE_LABELS,
  type LandConsentRequest,
} from '@getrentos/shared';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { landKeys } from '@/lib/queryKeys';
import { landAuthorityService } from '@/services/landAuthorityService';
import { errorMessage } from '../developer/feedback';

/** The consent requests addressed to the signed-in account, each answerable in place. */
export const ConsentRequestList = () => {
  const query = useQuery({
    queryKey: landKeys.consentRequests,
    queryFn: () => unwrap(landAuthorityService.myConsentRequests()),
  });

  if (query.isLoading) {
    return <Skeleton className="h-48 rounded-2xl" />;
  }
  if (query.isError && !query.data) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="Your consent requests could not be loaded"
        description={query.error instanceof Error ? query.error.message : undefined}
        action={
          <Button
            variant="outline"
            onClick={() => void query.refetch()}
            isLoading={query.isFetching}
          >
            Try again
          </Button>
        }
      />
    );
  }
  const items = query.data ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No consent requests"
        description="When a seller names you on their land sale, it appears here."
      />
    );
  }
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.signatoryId}>
          <ConsentRequestCard item={item} />
        </li>
      ))}
    </ul>
  );
};

const ConsentRequestCard = ({ item }: { item: LandConsentRequest }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [objecting, setObjecting] = useState(false);
  const [reason, setReason] = useState('');
  const respond = useMutation({
    mutationFn: (decision: 'CONSENT' | 'OBJECT') =>
      unwrap(landAuthorityService.respond(item.signatoryId, decision, reason)),
    onSuccess: (_result, decision) => {
      setObjecting(false);
      setReason('');
      void queryClient.invalidateQueries({ queryKey: landKeys.consentRequests });
      toast.success(
        decision === 'OBJECT'
          ? 'Objection recorded. The sale is paused while GetRentos looks into it.'
          : 'Thank you. Your consent is recorded.'
      );
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not record your answer.')),
  });

  const answered = item.consent !== 'PENDING';
  return (
    <Card static className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-foreground">{item.property.title}</h2>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {item.property.city}
          </p>
        </div>
        <Badge
          variant={
            item.consent === 'CONSENTED'
              ? 'success'
              : item.consent === 'OBJECTED'
                ? 'danger'
                : item.consent === 'WAIVED'
                  ? 'neutral'
                  : 'warning'
          }
        >
          {LAND_CONSENT_LABELS[item.consent]}
        </Badge>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Seller</dt>
          <dd className="text-foreground">{item.seller}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">They say</dt>
          <dd className="text-foreground">{LAND_SELLER_CAPACITY_LABELS[item.capacity]}</dd>
        </div>
        {item.principalName && (
          <div>
            <dt className="text-muted-foreground">On behalf of</dt>
            <dd className="text-foreground">{item.principalName}</dd>
          </div>
        )}
        <div>
          <dt className="text-muted-foreground">You are listed as</dt>
          <dd className="text-foreground">{LAND_SIGNATORY_ROLE_LABELS[item.role]}</dd>
        </div>
      </dl>
      {answered && item.respondedAt && (
        <p className="mt-3 text-xs text-muted-foreground">
          You answered on {formatDate(item.respondedAt)}.
          {item.consent === 'CONSENTED' && ' You can still object if something changes.'}
        </p>
      )}
      {item.consent !== 'WAIVED' && (
        <div className="mt-4 space-y-3">
          {objecting ? (
            <>
              <Textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                maxLength={2000}
                showCount
                aria-label="Why you object"
                placeholder="Why you object (GetRentos and the seller see this)"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  icon={<XCircle className="h-4 w-4" />}
                  disabled={reason.trim().length < 5 || respond.isPending}
                  isLoading={respond.isPending && respond.variables === 'OBJECT'}
                  onClick={() => respond.mutate('OBJECT')}
                >
                  Object to the sale
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setObjecting(false)}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap gap-2">
              {item.consent !== 'CONSENTED' && (
                <Button
                  size="sm"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  isLoading={respond.isPending && respond.variables === 'CONSENT'}
                  disabled={respond.isPending}
                  onClick={() => respond.mutate('CONSENT')}
                >
                  I consent to the sale
                </Button>
              )}
              {item.consent !== 'OBJECTED' && (
                <Button size="sm" variant="outline" onClick={() => setObjecting(true)}>
                  I object
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
