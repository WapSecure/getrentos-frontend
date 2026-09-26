import { useState } from 'react';
import { Linking, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileStack, FileText, Plus } from 'lucide-react-native';
import {
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  agentDocumentsApi,
  AGENT_DOCUMENT_CATEGORY_LABEL,
  type AgentDocument,
} from '@/lib/api/agentDocuments';
import { UploadAgentDocumentSheet } from '@/components/agent/UploadAgentDocumentSheet';
import { formatDate } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AgentDocuments() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [uploadOpen, setUploadOpen] = useState(false);

  const query = useQuery({
    queryKey: qk.agent.documents(1, 50),
    queryFn: () => agentDocumentsApi.list(1, 50),
  });
  const items = query.data?.items ?? [];

  const openDocument = async (id: string) => {
    try {
      const { url } = await agentDocumentsApi.download(id);
      Linking.openURL(url);
    } catch {
      toast.show('Could not open this document.', 'error');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Field operations"
        title="Documents"
        subtitle="Inspection, verification and identity files"
        onBack={() => router.back()}
        accessory={
          <IconButton
            onPress={() => setUploadOpen(true)}
            accessibilityLabel="Upload a document"
            icon={<Plus size={20} color={colors.primary} />}
          />
        }
      />

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
          description="Inspection reports, verification forms and IDs you upload will appear here."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: AgentDocument }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <Pressable onPress={() => openDocument(item.id)}>
                <Card elevated>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
                    <FileText size={18} color={colors.mutedForeground} style={{ marginTop: 2 }} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong" numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text variant="caption" color="mutedForeground">
                        {AGENT_DOCUMENT_CATEGORY_LABEL[item.category]} ·{' '}
                        {formatSize(item.sizeBytes)} · {formatDate(item.createdAt, 'short')}
                      </Text>
                      {item.property?.title ? (
                        <Text variant="caption" color="mutedForeground">
                          {item.property.title}
                        </Text>
                      ) : null}
                    </View>
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

      <UploadAgentDocumentSheet open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </View>
  );
}
