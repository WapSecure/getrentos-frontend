import { useState } from 'react';
import { Image, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Plus } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Screen,
  SectionHeader,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
  type BadgeTone,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import {
  residentApi,
  type ExpectedDelivery,
  type IssuedExpectedDelivery,
} from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

/**
 * A household's parcels: what is coming, and what has already been taken in.
 *
 * The declaration comes first because it is the only actionable part. The reason
 * it exists: without a code, a parcel is released on a courier's word and the
 * resident whose name was used has no way to show it was never handed to them.
 * So the code leads the screen, not the log.
 *
 * Every label is written server-side and rendered as it arrives: the difference
 * between an expiry and a withdrawal is decided once, in `delivery.util.ts`, so
 * this screen cannot contradict what the guard's own refusal says.
 */
export default function ResidentDeliveries() {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const [declareOpen, setDeclareOpen] = useState(false);

  const query = useQuery({
    queryKey: qk.resident.deliveries(1, 50),
    queryFn: () => residentApi.listDeliveries(1, 50),
  });

  const expectedQuery = useQuery({
    queryKey: qk.resident.expectedDeliveries,
    queryFn: () => residentApi.listExpectedDeliveries(),
  });
  const expected = expectedQuery.data ?? [];
  const live = expected.filter((row) => row.live);

  const withdraw = useMutation({
    mutationFn: (id: string) => residentApi.cancelExpectedDelivery(id),
    onSuccess: () => {
      void haptics.success();
      void qc.invalidateQueries({ queryKey: qk.resident.expectedDeliveries });
    },
    onError: (error) =>
      toast.show(
        error instanceof Error ? error.message : 'Could not withdraw that parcel.',
        'error'
      ),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Household activity"
        title="Deliveries"
        subtitle="Parcels received at the gate, and ones on their way"
        onBack={() => router.back()}
      />
      <Screen
        refreshing={query.isRefetching || expectedQuery.isRefetching}
        onRefresh={() => {
          void query.refetch();
          void expectedQuery.refetch();
        }}
      >
        <Card>
          <View style={{ gap: spacing.sm }}>
            <Text variant="bodyStrong">Expecting a parcel?</Text>
            <Text variant="caption" color="mutedForeground">
              Get a code for the courier. The guard checks it before the gate opens, so nobody can
              take a parcel in your name without it.
            </Text>
            <Button
              label="Get a code"
              fullWidth={false}
              icon={<Plus size={16} color={colors.primaryForeground} />}
              onPress={() => setDeclareOpen(true)}
            />
          </View>
        </Card>

        {expectedQuery.isLoading ? (
          <Skeleton height={72} radius={16} />
        ) : expected.length === 0 ? (
          <Card>
            <Text variant="caption" color="mutedForeground">
              You have not told the estate about any parcels yet.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: spacing.sm }}>
            <SectionHeader
              title={live.length > 0 ? `${live.length} still expected` : 'Nothing outstanding'}
            />
            {expected.map((row) => (
              <Card key={row.id} elevated>
                <View style={{ gap: spacing.sm }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: spacing.md,
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong" numberOfLines={2}>
                        {row.summary}
                      </Text>
                      {row.receivedAtGateName ? (
                        <Text variant="caption" color="mutedForeground">
                          Taken in at {row.receivedAtGateName}
                        </Text>
                      ) : null}
                    </View>
                    <Badge label={row.statusLabel} tone={statusToneFor(row.status)} />
                  </View>
                  {row.live ? (
                    <Button
                      label="Withdraw"
                      variant="ghost"
                      size="sm"
                      fullWidth={false}
                      loading={withdraw.isPending}
                      onPress={() => withdraw.mutate(row.id)}
                    />
                  ) : null}
                </View>
              </Card>
            ))}
          </View>
        )}

        <SectionHeader title="At the gate" />
        {query.isLoading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={76} radius={16} />
            <Skeleton height={76} radius={16} />
          </View>
        ) : query.data && query.data.items.length > 0 ? (
          query.data.items.map((d) => (
            <Card key={d.id} elevated>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                {d.photoUrl ? (
                  <Image
                    source={{ uri: d.photoUrl }}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: radius.md,
                      backgroundColor: colors.secondary,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: radius.md,
                      backgroundColor: colors.accent,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Package size={22} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1, gap: 2 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text variant="bodyStrong">{d.courier ?? 'Package'}</Text>
                    <Badge
                      label={d.status === 'collected' ? 'Collected' : 'Received'}
                      tone={d.status === 'collected' ? 'success' : 'info'}
                    />
                  </View>
                  {d.recipientName ? (
                    <Text variant="caption" color="mutedForeground">
                      For {d.recipientName}
                    </Text>
                  ) : null}
                  <Text variant="caption" color="mutedForeground">
                    Received {formatDate(d.receivedAt, 'short')}
                    {d.collectedAt ? ` · Collected ${formatDate(d.collectedAt, 'short')}` : ''}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        ) : (
          <EmptyState
            icon={<Package size={34} color={colors.mutedForeground} />}
            title="No deliveries yet"
            description="Packages logged at the gate for your household will show up here."
          />
        )}
      </Screen>

      <DeclareDeliverySheet open={declareOpen} onClose={() => setDeclareOpen(false)} />
    </View>
  );
}

/**
 * A withdrawal and an expiry carry the same weight on purpose: neither is a
 * success, and neither is something the household has to act on. They stay
 * textually distinct inside the label, which is where it matters.
 */
const statusToneFor = (status: ExpectedDelivery['status']): BadgeTone => {
  if (status === 'RECEIVED') return 'success';
  if (status === 'AWAITING') return 'warning';
  return 'neutral';
};

/**
 * Declaring a parcel, and the one moment its code exists.
 *
 * The sheet holds the code on screen after the declaration instead of closing
 * with a toast: the reply is the only time it is ever returned, and a toast would
 * take it away before the household could give it to the courier.
 */
function DeclareDeliverySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [courier, setCourier] = useState('');
  const [description, setDescription] = useState('');
  const [issued, setIssued] = useState<IssuedExpectedDelivery | null>(null);

  const declare = useMutation({
    mutationFn: () =>
      residentApi.declareExpectedDelivery({
        courier: courier.trim(),
        description: description.trim() || undefined,
      }),
    onSuccess: (row) => {
      void haptics.success();
      setIssued(row);
      void qc.invalidateQueries({ queryKey: qk.resident.expectedDeliveries });
    },
    onError: (error) =>
      toast.show(error instanceof Error ? error.message : 'Could not get a code.', 'error'),
  });

  const reset = () => {
    setCourier('');
    setDescription('');
    setIssued(null);
  };

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={issued ? 'Code for your courier' : 'What are you expecting?'}
    >
      {issued ? (
        <View style={{ gap: spacing.lg }}>
          <View
            style={{
              alignItems: 'center',
              gap: spacing.xs,
              paddingVertical: spacing.md,
              borderRadius: 16,
              backgroundColor: colors.secondary,
            }}
          >
            <Text variant="label" color="mutedForeground">
              GIVE THIS TO THE COURIER
            </Text>
            {/* Selectable, so the household can long-press to copy through the
                platform's own gesture rather than a dependency. */}
            <Text variant="display" selectable>
              {issued.code}
            </Text>
          </View>

          <Text variant="caption" color="mutedForeground">
            {issued.guidance}
          </Text>
          <Text variant="caption" color="mutedForeground">
            This is the only time the code is shown. If you lose it, withdraw this parcel and get a
            new one.
          </Text>

          <Button
            label="Done"
            fullWidth
            onPress={() => {
              reset();
              onClose();
            }}
          />
        </View>
      ) : (
        <View style={{ gap: spacing.lg }}>
          <TextField
            label="Who is bringing it?"
            value={courier}
            onChangeText={setCourier}
            placeholder="e.g. Amazon, DHL"
          />
          <TextField
            label="What is coming?"
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. a phone case"
            hint="Optional"
          />
          <Text variant="caption" color="mutedForeground">
            The code works for 2 days, or until you withdraw it, and it only works once.
          </Text>
          <Button
            label={declare.isPending ? 'Getting code…' : 'Get code'}
            loading={declare.isPending}
            fullWidth
            disabled={courier.trim().length === 0}
            onPress={() => declare.mutate()}
          />
        </View>
      )}
    </Sheet>
  );
}
