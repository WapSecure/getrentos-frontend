import { Linking, Pressable, RefreshControl, ScrollView, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileStack, FileText } from 'lucide-react-native';
import {
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { ownerApi, type OwnerDocument } from '@/lib/api/owner';
import type { Paginated } from '@/lib/api/properties';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

export default function OwnerDocuments() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const query = useQuery({ queryKey: qk.owner.documents, queryFn: () => ownerApi.documents() });

  // Optimistic: the switch moves at once, and snaps back if the API refuses.
  const share = useMutation({
    mutationFn: ({ id, shared }: { id: string; shared: boolean }) =>
      ownerApi.setDocumentShared(id, shared),
    onMutate: async ({ id, shared }) => {
      await qc.cancelQueries({ queryKey: qk.owner.documents });
      const previous = qc.getQueryData<Paginated<OwnerDocument>>(qk.owner.documents);
      qc.setQueryData<Paginated<OwnerDocument>>(qk.owner.documents, (old) =>
        old
          ? {
              ...old,
              items: old.items.map((d) => (d.id === id ? { ...d, sharedWithBuyer: shared } : d)),
            }
          : old
      );
      return { previous };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.owner.documents, ctx.previous);
      toast.show(
        err instanceof ApiError ? err.message : 'Could not change who can see this.',
        'error'
      );
    },
  });

  const refresh = (
    <RefreshControl
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      tintColor={colors.mutedForeground}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <DetailHeader
          eyebrow="Selling"
          title="Documents"
          subtitle="Share transfer papers with your buyer"
          onBack={() => router.back()}
        />
      </View>
      {query.isError && !query.data ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => query.refetch()} />
        </ScrollView>
      ) : query.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Skeleton height={72} radius={radius.lg} />
          <Skeleton height={72} radius={radius.lg} />
        </View>
      ) : (
        <FlashList
          data={query.data?.items ?? []}
          keyExtractor={(d) => d.id}
          refreshControl={refresh}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            <EmptyState
              icon={<FileStack size={34} color={colors.mutedForeground} />}
              title="No documents yet"
              description="Upload transfer documents from the web dashboard; you can manage sharing here."
            />
          }
          renderItem={({ item: d }: { item: OwnerDocument }) => (
            <Card elevated style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Pressable
                onPress={() => d.downloadUrl && Linking.openURL(d.downloadUrl)}
                disabled={!d.downloadUrl}
                accessibilityRole="link"
                accessibilityLabel={`Open ${d.name}, ${d.propertyName}`}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  minHeight: 44,
                }}
              >
                <FileText size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {d.name}
                  </Text>
                  <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                    {d.propertyName} · {d.sizeLabel} · {formatDate(d.uploadedAt, 'short')}
                  </Text>
                </View>
              </Pressable>
              <View style={{ alignItems: 'center' }}>
                <Switch
                  value={d.sharedWithBuyer}
                  onValueChange={(v) => share.mutate({ id: d.id, shared: v })}
                  accessibilityLabel={`Share ${d.name} with the buyer`}
                  trackColor={{ true: colors.primary, false: colors.border }}
                />
                <Text variant="caption" color="mutedForeground">
                  {d.sharedWithBuyer ? 'Shared' : 'Private'}
                </Text>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}
