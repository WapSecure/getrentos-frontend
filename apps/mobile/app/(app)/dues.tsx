import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Receipt, Repeat } from 'lucide-react-native';
import {
  Badge,
  type BadgeTone,
  Button,
  Card,
  EmptyState,
  Screen,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { residentApi, type Due, type DueCategory, type DueStatus } from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import { formatDate, formatNaira } from '@/lib/format';

const STATUS_LABEL: Record<DueStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  overdue: 'Overdue',
  processing: 'Processing',
};

const STATUS_TONE: Record<DueStatus, BadgeTone> = {
  pending: 'warning',
  paid: 'success',
  overdue: 'danger',
  processing: 'warning',
};

const CATEGORY_LABEL: Record<DueCategory, string> = {
  rent: 'Rent',
  service_charge: 'Service Charge',
  deposit: 'Deposit',
  levy: 'Levy',
};

function BackHeader({ title }: { title: string }) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.xl,
        paddingTop: insets.top + spacing.sm,
        paddingBottom: spacing.md,
      }}
    >
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={10}
      >
        <ChevronLeft size={24} color={colors.foreground} />
      </Pressable>
      <Text variant="title">{title}</Text>
    </View>
  );
}

export default function ResidentDues() {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({
    queryKey: qk.resident.dues,
    queryFn: () => residentApi.listDues(1, 50),
  });

  const pay = useMutation({
    mutationFn: (dueId: string) => residentApi.payDue(dueId),
    onSuccess: async (updated) => {
      // A real gateway checkout was started — open it in an in-app browser.
      // The webhook confirms payment server-side once the resident finishes
      // there; refetch once they close the browser to pick up the new status.
      if (updated.authorizationUrl) {
        await WebBrowser.openBrowserAsync(updated.authorizationUrl);
      }
      qc.invalidateQueries({ queryKey: qk.resident.dues });
    },
    onError: () => toast.show('Unable to start payment. Please try again.', 'error'),
  });

  const dues = query.data?.items ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <BackHeader title="Dues" />
      <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
        {query.isLoading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={90} radius={16} />
            <Skeleton height={90} radius={16} />
          </View>
        ) : dues.length > 0 ? (
          dues.map((due) => (
            <DueCard
              key={due.id}
              due={due}
              onPay={pay.mutate}
              paying={pay.isPending && pay.variables === due.id}
            />
          ))
        ) : (
          <EmptyState
            icon={<Receipt size={34} color={colors.mutedForeground} />}
            title="No dues yet"
            description="Your estate manager hasn't charged any dues to your household."
          />
        )}
      </Screen>
    </View>
  );
}

function DueCard({
  due,
  onPay,
  paying,
}: {
  due: Due;
  onPay: (id: string) => void;
  paying: boolean;
}) {
  const { spacing, colors } = useTheme();
  const canPay = due.status === 'pending' || due.status === 'overdue';
  const totalAmount = due.amount + due.lateFeeApplied;

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
              : `Due ${formatDate(due.dueDate, 'short')}`}
          </Text>
        </View>
        <Badge label={STATUS_LABEL[due.status]} tone={STATUS_TONE[due.status]} />
      </View>
      {canPay ? (
        <Button
          label="Pay Now"
          size="sm"
          fullWidth={false}
          loading={paying}
          onPress={() => onPay(due.id)}
          style={{ marginTop: spacing.md, alignSelf: 'flex-start' }}
        />
      ) : null}
    </Card>
  );
}
