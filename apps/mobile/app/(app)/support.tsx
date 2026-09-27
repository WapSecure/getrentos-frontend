import { useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LifeBuoy, Plus } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  IconButton,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { supportApi, SUPPORT_CATEGORIES, type SupportThread } from '@/lib/api/support';
import { ApiError } from '@/lib/api/client';
import { relativeTime } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

export default function Support() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [composeOpen, setComposeOpen] = useState(false);

  const query = useQuery({ queryKey: qk.renter.supportThreads, queryFn: supportApi.listThreads });
  const items = [...(query.data ?? [])].sort(
    (a, b) =>
      new Date(b.lastMessageAt ?? b.createdAt).getTime() -
      new Date(a.lastMessageAt ?? a.createdAt).getTime()
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="GetRentos care"
        title="Support"
        subtitle="Track conversations with our support team"
        onBack={() => router.back()}
        accessory={
          <IconButton
            onPress={() => setComposeOpen(true)}
            accessibilityLabel="Contact support"
            icon={<Plus size={20} color={colors.primary} />}
          />
        }
      />

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={78} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<LifeBuoy size={34} color={colors.mutedForeground} />}
          title="No support requests yet"
          description="Reach out and our team will get back to you."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: SupportThread }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <Pressable onPress={() => router.push(`/(app)/support-thread/${item.id}`)}>
                <Card elevated>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: spacing.sm,
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong" numberOfLines={1}>
                        {SUPPORT_CATEGORIES.find((c) => c.value === item.category)?.label ??
                          'Support request'}
                      </Text>
                      <Text variant="caption" color="mutedForeground" numberOfLines={2}>
                        {item.lastMessage}
                      </Text>
                    </View>
                    <Badge
                      label={item.status === 'OPEN' ? 'Open' : 'Resolved'}
                      tone={item.status === 'OPEN' ? 'warning' : 'success'}
                    />
                  </View>
                  <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.sm }}>
                    {relativeTime(item.lastMessageAt ?? item.createdAt)}
                  </Text>
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

      <ComposeSheet open={composeOpen} onClose={() => setComposeOpen(false)} />
    </View>
  );
}

function ComposeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Contact support">
      {/* Remount on each open so the form always starts blank. */}
      <ComposeForm key={open ? 'open' : 'closed'} onClose={onClose} />
    </Sheet>
  );
}

function ComposeForm({ onClose }: { onClose: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [category, setCategory] = useState<string | null>(null);
  const [subject, setSubject] = useState('');

  const mutation = useMutation({
    mutationFn: () => supportApi.createThread(subject.trim(), category ?? undefined),
    onSuccess: (thread) => {
      qc.invalidateQueries({ queryKey: qk.renter.supportThreads });
      onClose();
      router.push(`/(app)/support-thread/${thread.id}`);
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not send this message.', 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">What&apos;s this about?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {SUPPORT_CATEGORIES.map((c) => (
            <Chip
              key={c.value}
              label={c.label}
              selected={category === c.value}
              onPress={() => setCategory(c.value)}
              size="sm"
            />
          ))}
        </View>
      </View>
      <TextField
        label="Message"
        placeholder="Tell us what's going on"
        multiline
        numberOfLines={4}
        value={subject}
        onChangeText={setSubject}
      />
      <Button
        label="Send"
        loading={mutation.isPending}
        disabled={subject.trim().length < 3}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
