import { useState } from 'react';
import { Alert, Linking, Pressable, RefreshControl, View } from 'react-native';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileStack, FileText, Plus, Trash2 } from 'lucide-react-native';
import {
  Button,
  Card,
  IconButton,
  QueryState,
  Skeleton,
  SwitchRow,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { ownerApi, type OwnerDocument } from '@/lib/api/owner';
import type { Paginated } from '@/lib/api/properties';
import { errorMessage } from '@/lib/api/client';
import { useOptimisticMutation } from '@/lib/query/optimistic';
import { formatDate } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { UploadOwnerDocumentSheet } from '@/components/owner/UploadOwnerDocumentSheet';
import { goBack } from '@/lib/goBack';

export default function OwnerDocuments() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const query = useQuery({ queryKey: qk.owner.documents, queryFn: () => ownerApi.documents() });
  const [uploading, setUploading] = useState(false);

  const remove = useMutation({
    mutationFn: (id: string) => ownerApi.deleteDocument(id),
    onSuccess: (_r, id) => {
      qc.setQueryData<Paginated<OwnerDocument>>(qk.owner.documents, (old) =>
        old ? { ...old, items: old.items.filter((d) => d.id !== id) } : old
      );
      toast.show('Document deleted.', 'success');
    },
    onError: (err) => toast.show(errorMessage(err, 'Could not delete this document.'), 'error'),
  });

  const confirmRemove = (d: OwnerDocument) =>
    Alert.alert(
      'Delete document?',
      d.sharedWithBuyer
        ? `${d.name} is shared with your buyer. They will lose access to it.`
        : `${d.name} will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(d.id) },
      ]
    );

  // Optimistic: the switch moves at once, and snaps back if the API refuses.
  const share = useOptimisticMutation({
    mutationFn: ({ id, shared }: { id: string; shared: boolean }) =>
      ownerApi.setDocumentShared(id, shared),
    patches: ({ id, shared }) => [
      {
        queryKey: qk.owner.documents,
        update: (old) => {
          const o = old as Paginated<OwnerDocument>;
          return {
            ...o,
            items: o.items.map((d) => (d.id === id ? { ...d, sharedWithBuyer: shared } : d)),
          };
        },
      },
    ],
    errorMessage: 'Could not change who can see this.',
  });

  const refresh = (
    <RefreshControl
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
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
          onBack={() => goBack()}
          accessory={
            <IconButton
              accessibilityLabel="Upload a document"
              icon={<Plus size={20} color={colors.primary} />}
              onPress={() => setUploading(true)}
            />
          }
        />
      </View>
      <QueryState
        query={query}
        style={{ paddingHorizontal: spacing.xl }}
        skeleton={
          <View style={{ gap: spacing.md }}>
            <Skeleton height={72} radius={radius.lg} />
            <Skeleton height={72} radius={radius.lg} />
          </View>
        }
        isEmpty={!query.data?.items.length}
        empty={{
          icon: <FileStack size={34} color={colors.mutedForeground} />,
          title: 'No documents yet',
          description:
            'Upload transfer agreements, receipts and filings, then share them with your buyer when you’re ready.',
          action: <Button label="Upload a document" onPress={() => setUploading(true)} />,
        }}
      >
        <FlashList
          data={query.data?.items ?? []}
          keyExtractor={(d) => d.id}
          refreshControl={refresh}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item: d }: { item: OwnerDocument }) => {
            const sharingThis = share.isPending && share.variables?.id === d.id;
            return (
              <Card elevated style={{ gap: spacing.xs }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <Pressable
                    onPress={() => d.downloadUrl && Linking.openURL(d.downloadUrl)}
                    disabled={!d.downloadUrl}
                    accessibilityRole="link"
                    accessibilityLabel={
                      d.downloadUrl
                        ? `Open ${d.name}, ${d.propertyName}`
                        : `${d.name}, ${d.propertyName}, download unavailable`
                    }
                    accessibilityState={{ disabled: !d.downloadUrl }}
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
                  <IconButton
                    accessibilityLabel={`Delete ${d.name}`}
                    icon={<Trash2 size={18} color={colors.mutedForeground} />}
                    onPress={() => confirmRemove(d)}
                  />
                </View>
                <SwitchRow
                  label="Share with buyer"
                  description={
                    d.sharedWithBuyer
                      ? 'Your buyer can open this document'
                      : 'Private — only you can see it'
                  }
                  accessibilityLabel={`Share ${d.name} with the buyer`}
                  value={d.sharedWithBuyer}
                  onValueChange={(v) => share.mutate({ id: d.id, shared: v })}
                  disabled={sharingThis}
                />
              </Card>
            );
          }}
        />
      </QueryState>
      <UploadOwnerDocumentSheet open={uploading} onClose={() => setUploading(false)} />
    </View>
  );
}
