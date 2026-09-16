import { useState } from 'react';
import { Alert, Linking, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, FileStack, FileText, Plus, Share2, Star, Trash2 } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { documentsApi, type RenterDocument } from '@/lib/api/documents';
import { UploadDocumentSheet } from '@/components/documents/UploadDocumentSheet';
import { Sheet } from '@/components/Sheet';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';

const STATUS_TONE = { active: 'success', expiring: 'warning', expired: 'danger' } as const;

export default function Documents() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [shareEmail, setShareEmail] = useState('');

  const listQuery = useQuery({
    queryKey: qk.renter.documents,
    queryFn: () => documentsApi.list(1, 50),
  });
  const summaryQuery = useQuery({
    queryKey: qk.renter.documentSummary,
    queryFn: documentsApi.getSummary,
  });
  const items = listQuery.data?.items ?? [];

  const favoriteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.toggleFavorite(id),
    onSuccess: (updated) => {
      qc.setQueryData<typeof listQuery.data>(qk.renter.documents, (old) =>
        old ? { ...old, items: old.items.map((d) => (d.id === updated.id ? updated : d)) } : old
      );
      qc.invalidateQueries({ queryKey: qk.renter.documentSummary });
    },
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'Could not update this document.',
        'error'
      ),
  });

  const shareMutation = useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) => documentsApi.share(id, email),
    onSuccess: (updated) => {
      qc.setQueryData<typeof listQuery.data>(qk.renter.documents, (old) =>
        old ? { ...old, items: old.items.map((d) => (d.id === updated.id ? updated : d)) } : old
      );
      qc.invalidateQueries({ queryKey: qk.renter.documentSummary });
      setSharingId(null);
      setShareEmail('');
      toast.show('Document shared.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not share this document.', 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => documentsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.renter.documents });
      qc.invalidateQueries({ queryKey: qk.renter.documentSummary });
    },
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'Could not delete this document.',
        'error'
      ),
  });

  const confirmDelete = (id: string) => {
    Alert.alert('Delete document?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeMutation.mutate(id) },
    ]);
  };

  const refetchAll = () => {
    listQuery.refetch();
    summaryQuery.refetch();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
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
        <Text variant="title" style={{ flex: 1 }}>
          Documents
        </Text>
        <Pressable
          onPress={() => setUploadOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Upload a document"
          hitSlop={10}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={18} color={colors.primaryForeground} />
        </Pressable>
      </View>

      {summaryQuery.data ? (
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: spacing.xl,
            gap: spacing.sm,
            paddingBottom: spacing.md,
          }}
        >
          <SummaryTile label="Total" value={summaryQuery.data.total} />
          <SummaryTile label="Favorites" value={summaryQuery.data.favorites} />
          {summaryQuery.data.expiring > 0 ? (
            <SummaryTile label="Expiring" value={summaryQuery.data.expiring} tone="warning" />
          ) : null}
          {summaryQuery.data.expired > 0 ? (
            <SummaryTile label="Expired" value={summaryQuery.data.expired} tone="danger" />
          ) : null}
        </View>
      ) : null}

      {listQuery.isError ? (
        <ErrorState onRetry={() => listQuery.refetch()} />
      ) : listQuery.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={80} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FileStack size={34} color={colors.mutedForeground} />}
          title="No documents yet"
          description="Upload leases, receipts and other paperwork to keep them all in one place."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: RenterDocument }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <Card elevated>
                <Pressable
                  onPress={async () => {
                    try {
                      const { url } = await documentsApi.getDownloadUrl(item.id);
                      Linking.openURL(url);
                    } catch {
                      toast.show('Could not open this document.', 'error');
                    }
                  }}
                  style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}
                >
                  <FileText size={18} color={colors.mutedForeground} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text variant="caption" color="mutedForeground">
                      {item.category} · {item.size} · {formatDate(item.uploadedAt, 'short')}
                    </Text>
                  </View>
                  <Badge
                    label={item.status[0].toUpperCase() + item.status.slice(1)}
                    tone={STATUS_TONE[item.status]}
                  />
                </Pressable>

                <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md }}>
                  <Pressable
                    onPress={() => favoriteMutation.mutate(item.id)}
                    hitSlop={8}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Star
                      size={14}
                      color={item.isFavorite ? colors.warning : colors.mutedForeground}
                      fill={item.isFavorite ? colors.warning : 'transparent'}
                    />
                    <Text variant="caption" color="mutedForeground">
                      {item.isFavorite ? 'Favorited' : 'Favorite'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setSharingId(item.id)}
                    hitSlop={8}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Share2 size={14} color={colors.mutedForeground} />
                    <Text variant="caption" color="mutedForeground">
                      Share{item.sharedWith?.length ? ` (${item.sharedWith.length})` : ''}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => confirmDelete(item.id)}
                    hitSlop={8}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                  >
                    <Trash2 size={14} color={colors.destructive} />
                    <Text variant="caption" color="destructive">
                      Delete
                    </Text>
                  </Pressable>
                </View>
              </Card>
            </View>
          )}
          contentContainerStyle={{
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={listQuery.isRefetching}
              onRefresh={refetchAll}
              tintColor={colors.mutedForeground}
            />
          }
        />
      )}

      <UploadDocumentSheet open={uploadOpen} onClose={() => setUploadOpen(false)} />

      <Sheet
        open={!!sharingId}
        onClose={() => {
          setSharingId(null);
          setShareEmail('');
        }}
        title="Share document"
      >
        <View style={{ gap: spacing.lg }}>
          <TextField
            label="Email address"
            placeholder="landlord@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={shareEmail}
            onChangeText={setShareEmail}
          />
          <Button
            label="Share"
            loading={shareMutation.isPending}
            disabled={!shareEmail.trim()}
            onPress={() =>
              sharingId && shareMutation.mutate({ id: sharingId, email: shareEmail.trim() })
            }
          />
        </View>
      </Sheet>
    </View>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'warning' | 'danger';
}) {
  const { colors, spacing, radius } = useTheme();
  const color =
    tone === 'warning'
      ? colors.warning
      : tone === 'danger'
        ? colors.destructive
        : colors.foreground;
  return (
    <View
      style={{
        flex: 1,
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
      }}
    >
      <Text variant="title" style={{ fontSize: 20, color }}>
        {value}
      </Text>
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
    </View>
  );
}
