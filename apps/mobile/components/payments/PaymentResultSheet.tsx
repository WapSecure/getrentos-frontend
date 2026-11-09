import { useState } from 'react';
import { Share, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge, Button, Text, useTheme, type BadgeTone } from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';
import type { PaymentStatus } from '@/lib/api/paymentStatus';
import { formatDateTime, formatNaira } from '@/lib/format';
import { FAILED_BODY, TRANSFER_SLOWER } from '@/lib/paymentCopy';
import {
  closePaymentResult,
  confirmPayment,
  usePaymentResult,
  type PaymentResult,
} from '@/lib/paymentResult';

const FALLBACK_TITLE: Record<PaymentStatus['kind'], string> = {
  RENT: 'Rent',
  ESCROW: 'Deposit',
  SHORTLET: 'Short-let stay',
  LAND: 'Land payment',
  FLEX: 'Flex instalment',
  DUE: 'Estate dues',
  VENDOR_TOP_UP: 'Card top-up',
};

const HISTORY: Partial<Record<PaymentStatus['kind'], { label: string; href: string }>> = {
  RENT: { label: 'View my payments', href: '/(app)/payments' },
  FLEX: { label: 'View my Flex plan', href: '/(app)/financing' },
};

const HEADING: Record<PaymentResult['phase'], { badge: string; tone: BadgeTone; body: string }> = {
  CONFIRMING: {
    badge: 'Confirming',
    tone: 'info',
    body: 'We’re checking with the payment company. This usually takes a few seconds. You won’t be charged twice.',
  },
  PAID: {
    badge: 'Paid',
    tone: 'success',
    body: 'Your payment is confirmed. It now shows in your payment history.',
  },
  PENDING: {
    badge: 'Still confirming',
    tone: 'warning',
    body: `We haven’t had the result yet. ${TRANSFER_SLOWER} If you were charged it will show as paid, so please don’t pay again.`,
  },
  FAILED: {
    badge: 'Not paid',
    tone: 'danger',
    body: `That payment didn’t go through. ${FAILED_BODY}`,
  },
};

function Row({ label, value, selectable }: { label: string; value: string; selectable?: boolean }) {
  const { spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.md,
        paddingVertical: spacing.sm,
      }}
    >
      <Text variant="callout" color="mutedForeground">
        {label}
      </Text>
      <Text
        variant="callout"
        selectable={selectable}
        style={{ flexShrink: 1, textAlign: 'right', fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
    </View>
  );
}

// Mounted once at the app root; usePaystackCheckout fills it.
export function PaymentResultSheet() {
  const result = usePaymentResult();
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const [checking, setChecking] = useState(false);

  // Keep the last result while the sheet animates closed.
  const [shown, setShown] = useState<PaymentResult | null>(result);
  if (result && result !== shown) setShown(result);
  const view = result ?? shown;
  if (!view) return null;

  const payment = view.payment;
  const heading = HEADING[view.phase];
  const history = payment ? HISTORY[payment.kind] : undefined;
  const confirming = view.phase === 'CONFIRMING';

  const checkAgain = async () => {
    setChecking(true);
    try {
      await confirmPayment(view.reference);
    } finally {
      setChecking(false);
    }
  };

  return (
    <Sheet
      open={!!result}
      onClose={closePaymentResult}
      footer={
        <View style={{ gap: spacing.sm }}>
          {view.phase === 'PENDING' ? (
            <Button
              label="Check again"
              variant="outline"
              loading={checking}
              onPress={() => void checkAgain()}
            />
          ) : null}
          {view.phase === 'PAID' && history ? (
            <Button
              label={history.label}
              variant="outline"
              onPress={() => {
                closePaymentResult();
                router.push(history.href as never);
              }}
            />
          ) : null}
          <Button label="Done" onPress={closePaymentResult} />
        </View>
      }
    >
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row' }}>
            <Badge label={heading.badge} tone={heading.tone} />
          </View>
          <Text variant="title" headingLevel={2} style={{ fontVariant: ['tabular-nums'] }}>
            {payment ? formatNaira(payment.amount) : 'Your payment'}
          </Text>
          <Text variant="callout" color="mutedForeground">
            {heading.body}
          </Text>
        </View>

        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.lg,
            backgroundColor: colors.muted,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.xs,
          }}
        >
          {payment ? (
            <Row label="For" value={payment.title || FALLBACK_TITLE[payment.kind]} />
          ) : null}
          {payment && view.phase === 'PAID' && payment.paidAt ? (
            <Row label="Paid on" value={formatDateTime(payment.paidAt)} />
          ) : null}
          {payment ? <Row label="Amount" value={formatNaira(payment.amount)} /> : null}
          {payment && view.phase === 'PAID' && payment.fee ? (
            <Row label="Card or bank fee" value={formatNaira(payment.fee)} />
          ) : null}
          {payment &&
          view.phase === 'PAID' &&
          payment.totalCharged &&
          payment.totalCharged !== payment.amount ? (
            <Row label="Total charged" value={formatNaira(payment.totalCharged)} />
          ) : null}
          <Row label="Reference" value={view.reference} selectable />
        </View>

        {!confirming ? (
          <Button
            label="Share reference"
            variant="ghost"
            size="sm"
            fullWidth={false}
            onPress={() => void Share.share({ message: view.reference })}
            style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }}
          />
        ) : null}
      </View>
    </Sheet>
  );
}
