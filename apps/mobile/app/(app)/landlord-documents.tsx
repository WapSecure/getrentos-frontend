import { useState } from 'react';
import { Linking, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Download, FileText, Plus } from 'lucide-react-native';
import {
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
import { UploadDocumentSheet } from '@/components/landlord/SmallFormSheets';
import {
  landlordApi,
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABEL,
  type DocumentCategory,
  type LandlordDocument,
} from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';

export default function LandlordDocuments() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<DocumentCategory | undefined>();

  const query = useQuery({
    queryKey: qk.landlord.documents(1, 20, search || undefined, category),
    queryFn: () => landlordApi.documents(1, 20, search || undefined, category),
  });

  const open = async (doc: LandlordDocument) => {
    try {
      const { url } = await landlordApi.documentDownloadUrl(doc.id);
      await Linking.openURL(url);
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : 'Could not open that document.', 'error');
    }
  };

  const items = query.data?.items ?? [];

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
          accessibilityLabel="Go back"
          hitSlop={10}
        >
          <ChevronLeft size={26} color={colors.foreground} />
        </Pressable>
        <Text variant="title" style={{ flex: 1 }}>
          Documents
        </Text>
        <Pressable
          onPress={() => setCreating(true)}
          accessibilityRole="button"
          accessibilityLabel="Upload a document"
          hitSlop={10}
        >
          <Plus size={22} color={colors.primary} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing.md }}>
        <TextField
          placeholder="Search documents"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {DOCUMENT_CATEGORIES.map((c) => {
            const selected = c === category;
            return (
              <Pressable
                key={c}
                // Tapping the active chip clears it, so there is always a way back to all.
                onPress={() => setCategory(selected ? undefined : c)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: 7,
                  borderRadius: radius.full,
                  borderWidth: 1.5,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary + '14' : 'transparent',
                }}
              >
                <Text
                  variant="caption"
                  style={{ color: selected ? colors.primary : colors.mutedForeground }}
                >
                  {DOCUMENT_CATEGORY_LABEL[c]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(d) => d.id}
          renderItem={({ item }: { item: LandlordDocument }) => (
            <DocumentRow document={item} onOpen={() => open(item)} />
          )}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
          ListEmptyComponent={
            query.isLoading ? (
              <View style={{ gap: spacing.sm }}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} height={74} radius={radius.lg} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon={<FileText size={32} color={colors.mutedForeground} />}
                title={search || category ? 'Nothing matches' : 'No documents yet'}
                description={
                  search || category
                    ? 'Try a different search or category.'
                    : 'Leases, ownership papers and inspection reports are kept here.'
                }
              />
            )
          }
        />
      )}

      <UploadDocumentSheet open={creating} onClose={() => setCreating(false)} />
    </View>
  );
}

function DocumentRow({ document: d, onOpen }: { document: LandlordDocument; onOpen: () => void }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Open ${d.name}`}>
      <Card padding={spacing.lg} style={{ marginBottom: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: radius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.secondary,
            }}
          >
            <FileText size={17} color={colors.foreground} />
          </View>

          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {d.name}
            </Text>
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {d.propertyName} · {d.sizeLabel} · {formatDate(d.uploadedAt, 'short')}
            </Text>
          </View>

          <Download size={17} color={colors.mutedForeground} />
        </View>
      </Card>
    </Pressable>
  );
}
