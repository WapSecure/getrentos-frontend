'use client';

import { useQuery } from '@tanstack/react-query';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';
import { unwrap } from '@/lib/apiHelpers';

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  });

/** Tells hosts what GetRentos takes from each stay, and until when a launch rate runs. */
export function HostFeeNote() {
  const { data } = useQuery({
    queryKey: shortletKeys.hostFees,
    queryFn: () => unwrap(shortletService.hostFees()),
    staleTime: 10 * 60 * 1000,
  });
  if (!data) return null;

  // The launch rate ends at midnight Lagos time, so name the last day it applies.
  const lastIntroDay = data.introEndsAt
    ? formatDay(new Date(new Date(data.introEndsAt).getTime() - 1).toISOString())
    : null;

  return (
    <p className="mt-1 text-sm text-muted-foreground">
      {data.commissionPct === 0 ? (
        <>GetRentos takes no fee on new bookings right now.</>
      ) : (
        <>
          GetRentos fee: <span className="font-medium text-foreground">{data.commissionPct}%</span>{' '}
          of each stay, taken from your payout
        </>
      )}
      {lastIntroDay && data.standardCommissionPct !== data.commissionPct
        ? `: launch rate for bookings made by ${lastIntroDay}, then ${data.standardCommissionPct}%.`
        : '.'}{' '}
      Guests don&apos;t pay it, and each booking keeps the rate it was made at.
    </p>
  );
}
