import { View } from 'react-native';
import { Text } from '@sureground/ui-native';
import {
  PAYOUT_ARRIVAL_NOTE,
  PAYOUT_FAILED_NEXT_STEP,
  payoutSentToLabel,
  type PayoutSentTo,
} from '@sureground/shared';
import { formatDate } from '@/lib/format';

/**
 * What someone needs to track one payout without asking support (UX-31), the
 * same as the web PayoutRowDetails: the date it was paid, the transfer
 * reference to show their bank (long-press to copy), and for a failed one why
 * and what happens next. Fields the API does not send are left out.
 */
export function PayoutRowDetails({
  state,
  paidAt,
  transferRef,
  failureReason,
  sentTo,
}: {
  state: 'pending' | 'paid' | 'failed';
  paidAt?: string | null;
  transferRef?: string | null;
  failureReason?: string | null;
  /** Where it went, only when the API can prove it. */
  sentTo?: PayoutSentTo | null;
}) {
  const sentToLabel = payoutSentToLabel(sentTo);
  return (
    <View style={{ gap: 2 }}>
      {state === 'paid' && paidAt ? (
        <Text variant="caption" color="mutedForeground">
          Paid {formatDate(paidAt, 'medium')}
        </Text>
      ) : null}
      {sentToLabel ? (
        <Text variant="caption" color="mutedForeground">
          {sentToLabel}
        </Text>
      ) : null}
      {state === 'pending' ? (
        <Text variant="caption" color="mutedForeground">
          {PAYOUT_ARRIVAL_NOTE}
        </Text>
      ) : null}
      {transferRef ? (
        <Text variant="caption" color="mutedForeground" selectable>
          Ref {transferRef}
        </Text>
      ) : null}
      {state === 'failed' ? (
        <>
          {failureReason ? (
            <Text variant="caption" color="destructive">
              {failureReason}
            </Text>
          ) : null}
          <Text variant="caption" color="mutedForeground">
            {PAYOUT_FAILED_NEXT_STEP}
          </Text>
        </>
      ) : null}
    </View>
  );
}
