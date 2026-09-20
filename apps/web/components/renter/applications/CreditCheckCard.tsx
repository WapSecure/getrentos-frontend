'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button, LegacyInput } from '@getrentos/ui';
import { formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { renterService } from '@/services/renterService';
import { CreditSummaryView } from '@/components/shared/credit/CreditSummaryView';

/**
 * Lets an applicant put a verified credit check in front of their landlord — on
 * their own terms. Nothing is shown at all until a credit provider is connected,
 * so the screen never advertises something that can't be done.
 */
export const CreditCheckCard = ({ applicationId }: { applicationId: string }) => {
  const queryClient = useQueryClient();
  const [bvn, setBvn] = useState('');
  const [agreed, setAgreed] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: renterKeys.applicationCreditCheck(applicationId),
    queryFn: () => unwrap(renterService.getCreditCheckState(applicationId)),
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: renterKeys.applicationCreditCheck(applicationId) });

  const share = useMutation({
    mutationFn: () =>
      unwrap(renterService.shareCreditCheck(applicationId, { bvn, consent: agreed })),
    onSuccess: async () => {
      setBvn('');
      setAgreed(false);
      await refresh();
    },
  });
  const revoke = useMutation({
    mutationFn: () => unwrap(renterService.revokeCreditCheck(applicationId)),
    onSuccess: refresh,
  });

  if (isPending) return null;
  if (!data?.available && !data?.shared) return null;

  const validBvn = /^\d{11}$/.test(bvn);

  return (
    <div className="p-3 rounded-lg border border-border">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-medium text-foreground">Verified credit check</h4>
      </div>

      {data.shared ? (
        <div className="space-y-3">
          <CreditSummaryView check={data.shared} />
          <p className="text-xs text-muted-foreground">
            Shared with your landlord on {formatDate(data.shared.sharedAt)}. It is removed on{' '}
            {formatDate(data.shared.expiresAt)}, or sooner if you take it back.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => revoke.mutate()}
            isLoading={revoke.isPending}
            disabled={revoke.isPending}
          >
            Take it back
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            A credit check can help your application. Your landlord sees a short summary only:
            whether you have overdue accounts and how much you owe, not your full report. You can
            take it back at any time.
          </p>
          <div>
            <label htmlFor="credit-bvn" className="block text-sm font-medium text-foreground mb-1">
              Your BVN
            </label>
            <LegacyInput
              id="credit-bvn"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={11}
              value={bvn}
              onChange={(event) => setBvn(event.target.value.replace(/\D/g, ''))}
              placeholder="11 digits"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Used for this one check and never saved.
            </p>
          </div>
          <label className="flex items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-0.5"
            />
            <span>
              I agree to a credit check being run on me and its summary being shared with my
              landlord for this application.
            </span>
          </label>
          {share.isError && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {share.error instanceof Error
                ? share.error.message
                : 'We could not run the credit check. Please try again.'}
            </p>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => share.mutate()}
            disabled={!validBvn || !agreed || share.isPending}
            isLoading={share.isPending}
          >
            {share.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking…
              </span>
            ) : (
              'Run and share credit check'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
