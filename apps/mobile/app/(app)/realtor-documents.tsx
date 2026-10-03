import { useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileStack, FileText, Plus } from 'lucide-react-native';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  FormAlert,
  IconButton,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  DOCUMENT_CATEGORIES,
  documentCategoryLabel,
  realtorApi,
  sizeLabel,
  type DocumentCategory,
  type RealtorDocument,
} from '@/lib/api/realtor';
import type { PickedFile } from '@/lib/api/documents';
import { ApiError } from '@/lib/api/client';
import { pickDocument } from '@/lib/filePicker';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { Sheet } from '@/components/Sheet';

/** Agency agreements, listing contracts, closing papers and the realtor's licence. */
export default function RealtorDocuments() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [filter, setFilter] = useState<DocumentCategory | 'all'>('all');
  const [uploading, setUploading] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);
  const query = useQuery({ queryKey: qk.realtor.documents, queryFn: () => realtorApi.documents() });
  const all = query.data?.items ?? [];
  const items = filter === 'all' ? all : all.filter((d) => d.category.toLowerCase() === filter);

  const open = async (d: RealtorDocument) => {
    setOpening(d.id);
    try {
      const { url } = await realtorApi.downloadDocument(d.id);
      await Linking.openURL(url);
    } catch {
      toast.show('Could not open this document.', 'error');
    } finally {
      setOpening(null);
    }
  };

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
          paddingBottom: spacing.md,
          gap: spacing.md,
        }}
      >
        <DetailHeader
          eyebrow="Paperwork"
          title="Documents"
          subtitle="Private to you; open any to share it"
          onBack={() => router.back()}
          accessory={
            <IconButton
              accessibilityLabel="Upload a document"
              icon={<Plus size={20} color={colors.primary} />}
              onPress={() => setUploading(true)}
            />
          }
        />
        {all.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
            {DOCUMENT_CATEGORIES.filter((c) =>
              all.some((d) => d.category.toLowerCase() === c.value)
            ).map((c) => (
              <Chip
                key={c.value}
                label={c.label}
                selected={filter === c.value}
                onPress={() => setFilter(c.value)}
              />
            ))}
          </ScrollView>
        ) : null}
      </View>

      {query.isError && !query.data ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => query.refetch()} />
        </ScrollView>
      ) : query.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={70} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(d) => d.id}
          refreshControl={refresh}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }: { item: RealtorDocument }) => (
            <Pressable
              onPress={() => open(item)}
              disabled={opening === item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${documentCategoryLabel(item.category)}, ${sizeLabel(item.sizeBytes)}. Open`}
            >
              {({ pressed }) => (
                <Card
                  elevated
                  style={{
                    flexDirection: 'row',
                    gap: spacing.md,
                    opacity: pressed || opening === item.id ? 0.7 : 1,
                  }}
                >
                  <FileText size={20} color={colors.primary} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text variant="caption" color="mutedForeground">
                      {documentCategoryLabel(item.category)} · {sizeLabel(item.sizeBytes)} ·{' '}
                      {formatDate(item.createdAt, 'short')}
                    </Text>
                    {item.client?.legalName || item.listing?.listingTitle ? (
                      <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                        {[item.client?.legalName, item.listing?.listingTitle]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    ) : null}
                  </View>
                </Card>
              )}
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<FileStack size={34} color={colors.mutedForeground} />}
              title="No documents yet"
              description="Keep agency agreements, listing contracts and your licence here, ready when a client asks."
              action={<Button label="Upload a document" onPress={() => setUploading(true)} />}
            />
          }
        />
      )}

      <Sheet open={uploading} onClose={() => setUploading(false)} title="Upload a document">
        {uploading ? <UploadForm onDone={() => setUploading(false)} /> : null}
      </Sheet>
    </View>
  );
}

function UploadForm({ onDone }: { onDone: () => void }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('agency_agreement');
  const upload = useMutation({
    mutationFn: () => realtorApi.uploadDocument(file!, name.trim(), category),
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.realtor.documents });
      toast.show('Document uploaded.', 'success');
      onDone();
    },
  });
  const pick = async () => {
    const picked = await pickDocument();
    if (picked) {
      setFile(picked);
      if (!name.trim()) setName(picked.name.replace(/\.[^/.]+$/, ''));
    }
  };
  return (
    <View style={{ gap: spacing.md }}>
      <Pressable
        onPress={pick}
        accessibilityRole="button"
        accessibilityLabel={file ? `Chosen file ${file.name}. Choose another` : 'Choose a file'}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          padding: spacing.lg,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: colors.border,
        }}
      >
        <FileText size={18} color={colors.mutedForeground} />
        <Text
          variant="callout"
          color={file ? 'foreground' : 'mutedForeground'}
          numberOfLines={1}
          style={{ flex: 1 }}
        >
          {file ? file.name : 'Choose a file (up to 20 MB)'}
        </Text>
      </Pressable>
      <TextField label="Name" value={name} onChangeText={setName} />
      <View style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">Type</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {DOCUMENT_CATEGORIES.map((c) => (
            <Chip
              key={c.value}
              label={c.label}
              size="sm"
              selected={category === c.value}
              onPress={() => setCategory(c.value)}
            />
          ))}
        </View>
      </View>
      {upload.error ? (
        <FormAlert
          message={upload.error instanceof ApiError ? upload.error.message : 'Could not upload it.'}
        />
      ) : null}
      <Button
        label="Upload"
        disabled={!file || !name.trim()}
        loading={upload.isPending}
        onPress={() => upload.mutate()}
      />
    </View>
  );
}
