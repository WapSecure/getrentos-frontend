import { CheckoutFeeNote } from '@/components/payments/CheckoutFeeNote';
import { usePaystackCheckout } from '@/hooks/usePaystackCheckout';
import { View } from 'react-native';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReceiptText, Repeat } from 'lucide-react-native';
import {
  Badge,
  type BadgeTone,
  Button,
  Card,
  ListSkeleton,
  QueryState,
  Screen,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { residentApi, type Due, type DueCategory, type DueStatus } from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import { formatDate, formatNaira } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';
import { PaymentProviderPicker } from '@/components/payments/PaymentProviderPicker';
import { usePaymentProviders } from '@/hooks/usePaymentProviders';
import type { PaymentProvider } from '@/lib/api/paymentStatus';
import { errorMessage } from '@/lib/api/client';

const STATUS_LABEL: Record<DueStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  overdue: 'Overdue',
  processing: 'Payment started',
  waived: 'Waived',
};

const STATUS_TONE: Record<DueStatus, BadgeTone> = {
  pending: 'warning',
  paid: 'success',
  overdue: 'danger',
  processing: 'warning',
  waived: 'success',
};

const CATEGORY_LABEL: Record<DueCategory, string> = {
  rent: 'Rent',
  service_charge: 'Service Charge',
  deposit: 'Deposit',
  levy: 'Levy',
};

export default function ResidentDues() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const checkout = usePaystackCheckout();
  // Which company takes the payment (Paystack or Monnify): one choice for every due here.
  const providers = usePaymentProviders();

  const query = useQuery({
    queryKey: qk.resident.dues,
    queryFn: () => residentApi.listDues(1, 50),
  });

  const pay = useMutation({
    mutationFn: ({ dueId, provider }: { dueId: string; provider?: PaymentProvider }) =>
      residentApi.payDue(dueId, provider),
    onSuccess: async (updated) => {
      // A real gateway checkout was started: open it in an in-app browser.
      // The webhook confirms payment server-side once the resident finishes
      // there; refetch once they close the browser to pick up the new status.
      if (updated.authorizationUrl) {
        await checkout(updated.authorizationUrl, updated.reference);
      } else if (updated.status === 'paid') {
        // An earlier checkout had already gone through: it was credited instead
        // of charging again.
        toast.show('Your earlier payment went through. This due is paid.', 'success');
      }
      qc.invalidateQueries({ queryKey: qk.resident.dues });
    },
    // That company cannot take it right now: say so, and the choice moves to the other one.
    onError: (err, { provider }) =>
      toast.show(
        providers.recover(err, provider) ??
          errorMessage(err, 'Unable to start payment. Please try again.'),
        'error'
      ),
  });

  const dues = query.data?.items ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Estate finance"
        title="Dues"
        subtitle="Charges, payments and recurring obligations"
        onBack={() => goBack()}
      />
      <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
        <QueryState
          query={query}
          skeleton={<ListSkeleton variant="card" rows={2} height={90} />}
          isEmpty={dues.length === 0}
          empty={{
            icon: <ReceiptText size={34} color={colors.mutedForeground} />,
            title: 'No dues yet',
            description: "Your estate manager hasn't charged any dues to your household.",
          }}
        >
          {dues.some((due) => ['pending', 'overdue', 'processing'].includes(due.status)) ? (
            <PaymentProviderPicker choice={providers} />
          ) : null}
          {dues.map((due) => (
            <DueCard
              key={due.id}
              due={due}
              onPay={(dueId) => pay.mutate({ dueId, provider: providers.provider })}
              paying={pay.isPending && pay.variables?.dueId === due.id}
              provider={providers.provider}
            />
          ))}
        </QueryState>
      </Screen>
    </View>
  );
}

function DueCard({
  due,
  onPay,
  paying,
  provider,
}: {
  due: Due;
  onPay: (id: string) => void;
  paying: boolean;
  /** The company the payer chose: fees differ per company. */
  provider?: PaymentProvider;
}) {
  const { spacing, colors } = useTheme();
  // A checkout that was opened and left can be picked up again: the API checks
  // whether the earlier one went through before starting another.
  const canPay =
    due.status === 'pending' || due.status === 'overdue' || due.status === 'processing';
  // `amount` already includes any late fee; adding it again overstated the bill.
  const totalAmount = due.amount;

  return (
    <Card elevated>
      <View
        style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text variant="bodyStrong">{CATEGORY_LABEL[due.category]}</Text>
            {due.isRecurring ? <Repeat size={12} color={colors.mutedForeground} /> : null}
          </View>
          <Text variant="title">{formatNaira(totalAmount)}</Text>
          {due.lateFeeApplied > 0 ? (
            <Text variant="caption" color="mutedForeground">
              Includes {formatNaira(due.lateFeeApplied)} late fee
            </Text>
          ) : null}
          <Text variant="caption" color="mutedForeground">
            {due.status === 'paid' && due.paidDate
              ? `Paid ${formatDate(due.paidDate, 'short')}`
              : due.status === 'waived'
                ? 'Waived by your estate office'
                : `Due ${formatDate(due.dueDate, 'short')}`}
          </Text>
        </View>
        <Badge label={STATUS_LABEL[due.status]} tone={STATUS_TONE[due.status]} />
      </View>
      {canPay ? (
        <Button
          label={due.status === 'processing' ? 'Finish paying' : 'Pay Now'}
          size="sm"
          fullWidth={false}
          loading={paying}
          onPress={() => onPay(due.id)}
          style={{ marginTop: spacing.md, alignSelf: 'flex-start' }}
        />
      ) : null}
      {canPay ? <CheckoutFeeNote amount={due.amount} provider={provider} /> : null}
    </Card>
  );
}
