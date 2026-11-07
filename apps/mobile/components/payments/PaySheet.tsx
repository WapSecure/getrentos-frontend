import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Lock, ShieldCheck } from 'lucide-react-native';
import { Badge, Button, FormAlert, Text, useTheme } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { PaymentProviderPicker } from '@/components/payments/PaymentProviderPicker';
import { useCheckoutFee } from '@/hooks/useCheckoutFee';
import type { PaymentProviderChoice } from '@/hooks/usePaymentProviders';
import { formatDate, formatNaira } from '@/lib/format';

export interface PaySheetProps {
  open: boolean;
  onClose: () => void;
  /** "Pay rent", "Pay estate dues". */
  title: string;
  /** What is being paid for: a property, an estate, a plot. */
  context?: string | null;
  /** When it is due; shown as "due 4 Nov 2026" in Lagos time. */
  dueDate?: string | null;
  overdue?: boolean;
  /** The large figure under the title. */
  owed: number;
  /** The small word beside it. Defaults to "owed". */
  owedLabel?: string;
  /** What this payment is, before the fee: the base of the breakdown. 0 while not yet chosen. */
  amount: number;
  /** The breakdown's first line: "Rent", "Deposit", "Installment". */
  itemLabel: string;
  /** Under the breakdown when there is a fee: who still gets the full amount. */
  receiverLine?: string | null;
  /** One sentence on what happens to the money: "Your rent is held by GetRentos until…". */
  protection?: string;
  /** Step "How much": only where a part payment is possible. */
  howMuch?: ReactNode;
  /** Shown above the breakdown, for anything the payer must know first. */
  note?: ReactNode;
  /** False while the payer still has to finish the how-much step. Defaults to amount > 0. */
  ready?: boolean;
  /** The button while not ready. */
  notReadyLabel?: string;
  /** Leave out the fee breakdown when the card amount is not known up front. */
  breakdown?: boolean;
  /** Replaces "Pay ₦X with <company>" when that would not be true. */
  payLabel?: string;
  /** Replaces the "You finish on <company>'s secure page" sentence. */
  secureLine?: string;
  /** Which company takes the payment (Paystack or Monnify). */
  providers: PaymentProviderChoice;
  /** Why the last try failed when the chosen company could not take it: choose another. */
  providerError?: string | null;
  onPay: () => void;
  busy?: boolean;
}

/** A small numbered heading for each step of the sheet. */
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

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
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

/**
 * One pay sheet for everything paid on GetRentos, matching the web pay
 * dialog: what is owed, how much (where a part payment is possible), which
 * company takes it, exactly what will be charged, then that company's secure
 * page. The screen keeps the pay call; this only presents it.
 */
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
  const { fee, total } = useCheckoutFee(breakdown && open ? amount : 0, providers.provider);
  const chosen = providers.options.find((o) => o.provider === providers.provider);
  const choose = providers.canChoose;
  const pays = total ?? amount;
  const company = chosen?.label ?? 'the payment company';

  const button = !ready
    ? notReadyLabel
    : (payLabel ??
      `Pay ${formatNaira(breakdown ? pays : amount)}${chosen && choose ? ` with ${chosen.label}` : ''}`);

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
            disabled={!ready}
            loading={busy}
            loadingLabel="Starting payment…"
            onPress={onPay}
          />
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
            <ShieldCheck size={16} color={colors.success} style={{ marginTop: 1 }} />
            <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
              {secureLine ??
                `You finish on ${company}’s secure page: GetRentos never sees your card details.`}
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
          </View>
        ) : providerError ? (
          <FormAlert tone="warning" message={providerError} />
        ) : null}

        {note}

        {breakdown && ready && amount > 0 ? (
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
            <Line label={itemLabel} value={formatNaira(amount)} />
            <Line
              label="Card or bank fee"
              value={fee == null ? '…' : fee > 0 ? formatNaira(fee) : 'None'}
            />
            <Line label="You pay" value={formatNaira(pays)} strong />
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
      </View>
    </Sheet>
  );
}
