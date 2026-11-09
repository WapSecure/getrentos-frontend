import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Lock, ShieldCheck } from 'lucide-react-native';
import { Badge, Button, FormAlert, Text, useTheme } from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';
import { PaymentProviderPicker } from '@/components/payments/PaymentProviderPicker';
import { useCheckoutFee } from '@/hooks/useCheckoutFee';
import type { PaymentProviderChoice } from '@/hooks/usePaymentProviders';
import { formatDate, formatNaira } from '@/lib/format';
import { transferNote } from '@/lib/paymentCopy';

export interface PaySheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  context?: string | null;
  dueDate?: string | null;
  overdue?: boolean;
  owed: number;
  owedLabel?: string;
  amount: number;
  itemLabel: string;
  itemParts?: { label: string; amount: number }[];
  receiverLine?: string | null;
  protection?: string;
  howMuch?: ReactNode;
  note?: ReactNode;
  ready?: boolean;
  notReadyLabel?: string;
  breakdown?: boolean;
  payLabel?: string;
  secureLine?: string;
  providers: PaymentProviderChoice;
  providerError?: string | null;
  onPay: () => void;
  busy?: boolean;
}

function Step({ n, children }: { n?: number; children: string }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      {n ? (
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.muted,
          }}
        >
          <Text variant="label">{n}</Text>
        </View>
      ) : null}
      <Text variant="label" color="mutedForeground" uppercase headingLevel={3}>
        {children}
      </Text>
    </View>
  );
}

function Line({
  label,
  value,
  strong,
  spokenValue,
  live,
}: {
  label: string;
  value: string;
  strong?: boolean;
  spokenValue?: string;
  live?: boolean;
}) {
  const { spacing } = useTheme();
  return (
    <View
      // One stop per line for a screen reader: "Card or bank fee, ₦1,500".
      accessible
      accessibilityLabel={`${label}, ${spokenValue ?? value}`}
      accessibilityLiveRegion={live ? 'polite' : undefined}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.md,
        paddingVertical: spacing.sm,
      }}
    >
      <Text
        variant={strong ? 'bodyStrong' : 'callout'}
        color={strong ? undefined : 'mutedForeground'}
      >
        {label}
      </Text>
      <Text variant={strong ? 'bodyStrong' : 'callout'} style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
    </View>
  );
}

export function PaySheet({
  open,
  onClose,
  title,
  context,
  dueDate,
  overdue,
  owed,
  owedLabel = 'owed',
  amount,
  itemLabel,
  itemParts,
  receiverLine,
  protection,
  howMuch,
  note,
  ready = amount > 0,
  notReadyLabel = 'Enter an amount to pay',
  breakdown = true,
  payLabel,
  secureLine,
  providers,
  providerError,
  onPay,
  busy,
}: PaySheetProps) {
  const { colors, spacing, radius } = useTheme();
  // The payer covers the card or bank fee, so the receiver gets the full amount.
  const {
    fee,
    total,
    state: feeState,
    retry: retryFee,
    retrying: retryingFee,
  } = useCheckoutFee(breakdown && open ? amount : 0, providers.provider);
  const chosen = providers.options.find((o) => o.provider === providers.provider);
  const choose = providers.canChoose;
  const company = chosen?.label ?? 'the payment company';
  // Never promise a total that leaves the fee out: wait for it, or say it comes next.
  const withFee = breakdown && ready && amount > 0;
  const feeLoading = withFee && feeState === 'loading';
  const feeUnknown = withFee && feeState === 'unknown';

  const howTransfer = transferNote(
    providers.provider,
    breakdown && total != null ? formatNaira(total) : null
  );

  const button = !ready
    ? notReadyLabel
    : (payLabel ??
      (feeUnknown
        ? `Continue to ${company}`
        : `Pay ${formatNaira(breakdown && total != null ? total : amount)}${chosen && choose ? ` with ${chosen.label}` : ''}`));

  return (
    <Sheet
      open={open}
      onClose={onClose}
      footer={
        <View style={{ gap: spacing.md }}>
          <Button
            label={button}
            size="lg"
            icon={<Lock size={16} color={colors.primaryForeground} />}
            disabled={!ready || feeLoading}
            loading={busy || feeLoading}
            loadingLabel={busy ? 'Starting payment…' : 'Working out the fee…'}
            onPress={onPay}
          />
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
            <ShieldCheck size={16} color={colors.success} style={{ marginTop: 1 }} />
            <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
              {secureLine ??
                `You finish on ${company}’s secure page: Sureground never sees your card details.`}
              {protection ? ` ${protection}` : ''}
            </Text>
          </View>
        </View>
      }
    >
      <View style={{ gap: spacing.xl }}>
        <View
          style={{
            gap: spacing.xs,
            paddingBottom: spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <Text variant="heading" headingLevel={2}>
              {title}
            </Text>
            {overdue ? <Badge label="Overdue" tone="danger" /> : null}
          </View>
          {context || dueDate ? (
            <Text variant="callout" color="mutedForeground">
              {[context, dueDate ? `due ${formatDate(dueDate)}` : null].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
          <View
            style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}
            accessible
            accessibilityLabel={`${formatNaira(owed)} ${owedLabel}`}
          >
            <Text variant="title" style={{ fontVariant: ['tabular-nums'] }}>
              {formatNaira(owed)}
            </Text>
            <Text variant="callout" color="mutedForeground">
              {owedLabel}
            </Text>
          </View>
        </View>

        {howMuch ? (
          <View style={{ gap: spacing.md }}>
            <Step n={choose ? 1 : undefined}>How much</Step>
            {howMuch}
          </View>
        ) : null}

        {choose ? (
          <View style={{ gap: spacing.md }}>
            <Step n={howMuch ? 2 : undefined}>Pay with</Step>
            {providerError ? <FormAlert tone="warning" message={providerError} /> : null}
            <PaymentProviderPicker choice={providers} variant="card" hideLabel />
            {ready ? (
              <Text variant="caption" color="mutedForeground">
                {howTransfer}
              </Text>
            ) : null}
          </View>
        ) : (
          <>
            {providerError ? <FormAlert tone="warning" message={providerError} /> : null}
            {ready ? (
              <Text variant="caption" color="mutedForeground">
                {howTransfer}
              </Text>
            ) : null}
          </>
        )}

        {note}

        {!breakdown && itemParts && itemParts.length > 0 ? (
          // No fee row of its own: the parts already say what the card covers.
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
            {itemParts.map((part) => (
              <Line key={part.label} label={part.label} value={formatNaira(part.amount)} />
            ))}
          </View>
        ) : null}

        {withFee ? (
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
            {itemParts && itemParts.length > 0 ? (
              itemParts.map((part) => (
                <Line key={part.label} label={part.label} value={formatNaira(part.amount)} />
              ))
            ) : (
              <Line label={itemLabel} value={formatNaira(amount)} />
            )}
            <Line
              label="Card or bank fee"
              value={
                feeUnknown
                  ? 'Shown on the next page'
                  : fee == null
                    ? 'Working it out…'
                    : fee > 0
                      ? formatNaira(fee)
                      : 'None'
              }
              spokenValue={!feeUnknown && fee == null ? 'working it out' : undefined}
            />
            <Line
              label="You pay"
              value={total != null ? formatNaira(total) : `${formatNaira(amount)} + fee`}
              spokenValue={total != null ? undefined : `${formatNaira(amount)} plus the fee`}
              strong
              live
            />
            {fee && receiverLine ? (
              <Text
                variant="caption"
                color="mutedForeground"
                style={{
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingVertical: spacing.sm,
                }}
              >
                {receiverLine}
              </Text>
            ) : null}
          </View>
        ) : null}

        {feeUnknown ? (
          <View style={{ gap: spacing.sm }}>
            <FormAlert
              tone="warning"
              message={`We couldn’t work out the card or bank fee here. You’ll see it on ${company}’s page before you pay.`}
            />
            {retryFee ? (
              <Button
                label="Try again"
                variant="outline"
                size="sm"
                fullWidth={false}
                loading={retryingFee}
                onPress={retryFee}
                style={{ alignSelf: 'flex-start' }}
              />
            ) : null}
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}
