import { useState } from 'react';
import { Text } from '@sureground/ui-native';
import { PAYOUT_CHANGE_COOLDOWN_HINT } from '@sureground/shared';
import { formatDateTime } from '@/lib/format';

// Same words as the web PayoutHoldNotice.
export function PayoutHoldNotice({ holdUntil }: { holdUntil?: string | null }) {
  // Captured once: render must not read the clock.
  const [now] = useState(() => Date.now());
  if (!holdUntil || Date.parse(holdUntil) <= now) return null;
  return (
    <Text variant="caption" color="warning">
      This account was changed recently. To protect you, payouts to it start{' '}
      {formatDateTime(holdUntil)}. If you didn’t make this change, contact Sureground support now.
    </Text>
  );
}

export function PayoutCooldownHint() {
  return (
    <Text variant="caption" color="mutedForeground">
      {PAYOUT_CHANGE_COOLDOWN_HINT}
    </Text>
  );
}
