'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { IconButton } from '@getrentos/ui';
import { PAYOUT_ARRIVAL_NOTE, PAYOUT_FAILED_NEXT_STEP } from '@getrentos/shared';
import { formatDate } from '@/lib/format';

/**
 * What someone needs to track one payout without asking support (UX-31): the
 * date it was paid, the transfer reference to show their bank, and for a failed
 * one why and what happens next. Fields the API does not send are left out.
 */
export function PayoutRowDetails({
  state,
  paidAt,
  transferRef,
  failureReason,
}: {
  state: 'pending' | 'paid' | 'failed';
  paidAt?: string | null;
  transferRef?: string | null;
  failureReason?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!transferRef) return;
    try {
      await navigator.clipboard.writeText(transferRef);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard refused (permissions): the reference is still on screen to copy by hand.
    }
  };

  return (
    <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
      {state === 'paid' && paidAt && <p>Paid {formatDate(paidAt)}</p>}
      {state === 'pending' && <p>{PAYOUT_ARRIVAL_NOTE}</p>}
      {transferRef && (
        <p className="flex items-center gap-1">
          <span className="break-all">Ref {transferRef}</span>
          <IconButton
            size="sm"
            variant="ghost"
            label={copied ? 'Reference copied' : 'Copy reference'}
            icon={copied ? <Check /> : <Copy />}
            onClick={copy}
          />
        </p>
      )}
      {state === 'failed' && (
        <>
          {failureReason && <p className="text-destructive">{failureReason}</p>}
          <p>{PAYOUT_FAILED_NEXT_STEP}</p>
        </>
      )}
    </div>
  );
}
