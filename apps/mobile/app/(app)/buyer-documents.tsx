import { useState } from 'react';
import { Alert, Linking, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, FileStack, FileText, Plus, Trash2 } from 'lucide-react-native';
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
import {
  buyerDocumentsApi,
  BUYER_DOCUMENT_CATEGORY_LABEL,
  type BuyerDocument,
} from '@/lib/api/buyerDocuments';
import { UploadBuyerDocumentSheet } from '@/components/buyer/UploadBuyerDocumentSheet';
import { formatDate } from '@/lib/format';

export default function BuyerDocuments() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const qc = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);

  const query = useQuery({
    queryKey: qk.buyer.documents(1, 50),
    queryFn: () => buyerDocumentsApi.list(1, 50),
  });
  const items = query.data?.items ?? [];

  const removeMutation = useMutation({
    mutationFn: (id: string) => buyerDocumentsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['buyer', 'documents'] });
      toast.show('Document removed.', 'success');
    },
    onError: () => toast.show('Could not remove this document.', 'error'),
  });

  const openDocument = (item: BuyerDocument) => {
    if (item.downloadUrl) Linking.openURL(item.downloadUrl);
    else toast.show('This document has no preview available.', 'error');
  };

  const confirmRemove = (item: BuyerDocument) => {
    Alert.alert('Remove document', `Remove "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeMutation.mutate(item.id) },
    ]);
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

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={70} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FileStack size={34} color={colors.mutedForeground} />}
          title="No documents yet"
          description="Proof of funds, preapprovals and title documents you upload will appear here."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: BuyerDocument }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <Pressable onPress={() => openDocument(item)}>
                <Card elevated>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
                    <FileText size={18} color={colors.mutedForeground} style={{ marginTop: 2 }} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong" numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text variant="caption" color="mutedForeground">
                        {BUYER_DOCUMENT_CATEGORY_LABEL[item.category]} · {item.sizeLabel} ·{' '}
                        {formatDate(item.uploadedAt, 'short')}
                      </Text>
                      {item.propertyTitle ? (
                        <Text variant="caption" color="mutedForeground">
                          {item.propertyTitle}
                        </Text>
                      ) : null}
                    </View>
                    <Pressable
                      onPress={() => confirmRemove(item)}
                      hitSlop={8}
                      style={{ padding: 4 }}
                    >
                      <Trash2 size={16} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                </Card>
              </Pressable>
            </View>
          )}
          contentContainerStyle={{
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      )}

      <UploadBuyerDocumentSheet open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </View>
  );
}
