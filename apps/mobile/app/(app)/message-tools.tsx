import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BellRing, ChevronLeft, MessageSquareText, Plus, Trash2, Zap } from 'lucide-react-native';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  SegmentedControl,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { messagesApi } from '@/lib/api/messages';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { MessageTemplateSheet } from '@/components/messages/MessageTemplateSheet';
import { QuickReplySheet } from '@/components/messages/QuickReplySheet';
import { MessageReminderSheet } from '@/components/messages/MessageReminderSheet';

type Tab = 'templates' | 'quick-replies' | 'reminders';

const TABS: { value: Tab; label: string }[] = [
  { value: 'templates', label: 'Templates' },
  { value: 'quick-replies', label: 'Shortcuts' },
  { value: 'reminders', label: 'Reminders' },
];

export default function MessageTools() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('templates');
  const [sheet, setSheet] = useState<Tab | null>(null);

  const templates = useQuery({
    queryKey: qk.renter.messageTemplates,
    queryFn: messagesApi.listTemplates,
    enabled: tab === 'templates',
  });

  const quickReplies = useQuery({
    queryKey: qk.renter.messageQuickReplies,
    queryFn: messagesApi.listQuickReplies,
    enabled: tab === 'quick-replies',
  });

  const reminders = useQuery({
    queryKey: qk.renter.messageReminders,
    queryFn: messagesApi.listReminders,
    enabled: tab === 'reminders',
  });

  const active =
    tab === 'templates' ? templates : tab === 'quick-replies' ? quickReplies : reminders;

  const fail = (e: unknown, fallback: string) =>
    toast.show(e instanceof ApiError ? e.message : fallback, 'error');

  const deleteTemplate = useMutation({
    mutationFn: messagesApi.deleteTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.renter.messageTemplates }),
    onError: (e) => fail(e, 'Could not delete that template.'),
  });

  const deleteQuickReply = useMutation({
    mutationFn: messagesApi.deleteQuickReply,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.renter.messageQuickReplies }),
    onError: (e) => fail(e, 'Could not delete that shortcut.'),
  });

  const toggleReminder = useMutation({
    mutationFn: messagesApi.toggleReminder,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.renter.messageReminders }),
    onError: (e) => fail(e, 'Could not update that reminder.'),
  });

  const deleteReminder = useMutation({
    mutationFn: messagesApi.deleteReminder,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.renter.messageReminders }),
    onError: (e) => fail(e, 'Could not delete that reminder.'),
  });

  const confirmDelete = (label: string, onConfirm: () => void) =>
    Alert.alert(`Delete ${label}?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onConfirm },
    ]);

  const addLabel =
    tab === 'templates'
      ? 'New template'
      : tab === 'quick-replies'
        ? 'New shortcut'
        : 'New reminder';

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
          Message tools
        </Text>
      </View>

      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.sm,
        }}
        refreshControl={
          <RefreshControl
            refreshing={active.isRefetching}
            onRefresh={() => active.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
      >
        {active.isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} height={84} radius={radius.lg} />)
        ) : active.isError ? (
          <ErrorState onRetry={() => active.refetch()} />
        ) : tab === 'templates' ? (
          (templates.data ?? []).length === 0 ? (
            <EmptyState
              icon={<MessageSquareText size={30} color={colors.mutedForeground} />}
              title="No templates yet"
              description="Save replies you send often — viewing requests, document follow-ups — and reuse them in one tap."
            />
          ) : (
            (templates.data ?? []).map((t) => (
              <Card key={t.id} padding={spacing.lg}>
                <View style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Text variant="bodyStrong" style={{ flex: 1 }}>
                      {t.title}
                    </Text>
                    {t.category ? <Badge label={t.category} tone="neutral" /> : null}
                    <Pressable
                      onPress={() => confirmDelete('template', () => deleteTemplate.mutate(t.id))}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${t.title}`}
                      hitSlop={10}
                    >
                      <Trash2 size={16} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                  <Text variant="callout" color="mutedForeground" numberOfLines={3}>
                    {t.content}
                  </Text>
                  <Text variant="caption" color="mutedForeground">
                    Used {t.useCount} time{t.useCount === 1 ? '' : 's'}
                  </Text>
                </View>
              </Card>
            ))
          )
        ) : tab === 'quick-replies' ? (
          (quickReplies.data ?? []).length === 0 ? (
            <EmptyState
              icon={<Zap size={30} color={colors.mutedForeground} />}
              title="No shortcuts yet"
              description="Map a short trigger to a longer reply, so a common answer is a few keystrokes."
            />
          ) : (
            (quickReplies.data ?? []).map((q) => (
              <Card key={q.id} padding={spacing.lg}>
                <View style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: radius.sm,
                        backgroundColor: colors.secondary,
                      }}
                    >
                      <Text variant="caption" style={{ fontWeight: '700' }}>
                        /{q.shortcut}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <Pressable
                      onPress={() => confirmDelete('shortcut', () => deleteQuickReply.mutate(q.id))}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${q.shortcut}`}
                      hitSlop={10}
                    >
                      <Trash2 size={16} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                  <Text variant="callout" color="mutedForeground" numberOfLines={3}>
                    {q.response}
                  </Text>
                </View>
              </Card>
            ))
          )
        ) : (reminders.data ?? []).length === 0 ? (
          <EmptyState
            icon={<BellRing size={30} color={colors.mutedForeground} />}
            title="No reminders"
            description="Set a nudge to follow up on a conversation, so a reply never slips."
          />
        ) : (
          (reminders.data ?? []).map((r) => (
            <Card key={r.id} padding={spacing.lg}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{r.message}</Text>
                  <Text variant="caption" color="mutedForeground">
                    {formatDate(r.date)} at {r.time}
                  </Text>
                </View>
                <Pressable
                  onPress={() => toggleReminder.mutate(r.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${r.active ? 'Pause' : 'Resume'} ${r.message}`}
                >
                  <Badge label={r.active ? 'On' : 'Off'} tone={r.active ? 'success' : 'neutral'} />
                </Pressable>
                <Pressable
                  onPress={() => confirmDelete('reminder', () => deleteReminder.mutate(r.id))}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${r.message}`}
                  hitSlop={10}
                >
                  <Trash2 size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </Card>
          ))
        )}

        <Pressable
          onPress={() => setSheet(tab)}
          accessibilityRole="button"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            paddingVertical: spacing.lg,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: colors.border,
            marginTop: spacing.sm,
          }}
        >
          <Plus size={17} color={colors.primary} />
          <Text variant="callout" color="primary" style={{ fontWeight: '600' }}>
            {addLabel}
          </Text>
        </Pressable>
      </ScrollView>

      <MessageTemplateSheet open={sheet === 'templates'} onClose={() => setSheet(null)} />
      <QuickReplySheet open={sheet === 'quick-replies'} onClose={() => setSheet(null)} />
      <MessageReminderSheet open={sheet === 'reminders'} onClose={() => setSheet(null)} />
    </View>
  );
}
