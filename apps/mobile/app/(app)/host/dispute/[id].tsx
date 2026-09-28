import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import {
  Card,
  EmptyState,
  FormAlert,
  IconButton,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { DISPUTE_CATEGORIES, hostShortletsApi } from '@/lib/api/hostShortlets';
import { ApiError } from '@/lib/api/client';
import { formatDate, relativeTime } from '@/lib/format';
import { useAuth } from '@/lib/auth/AuthProvider';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

/** One dispute: what was raised, where it stands, and the thread with support and the guest. */
export default function HostDisputeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [text, setText] = useState('');
  const disputes = useQuery({
    queryKey: qk.host.disputes,
    queryFn: () => hostShortletsApi.disputes(),
  });
  const d = disputes.data?.items.find((x) => x.id === id);
  const messages = useQuery({
    queryKey: qk.host.disputeMessages(id),
    queryFn: () => hostShortletsApi.disputeMessages(id),
    refetchInterval: 15_000,
  });
  const send = useMutation({
    mutationFn: () => hostShortletsApi.sendDisputeMessage(id, text.trim()),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: qk.host.disputeMessages(id) });
    },
    onError: (e) => toast.show(e instanceof ApiError ? e.message : 'Not sent.', 'error'),
  });
  const resolved = d?.status === 'RESOLVED';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing['2xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow="Dispute"
          title={d?.guestPromise ? 'Guest Promise report' : (d?.title ?? 'Dispute')}
          subtitle={d?.listingTitle}
          onBack={() => router.back()}
        />
        {disputes.isPending ? (
          <Skeleton height={140} radius={radius.lg} />
        ) : !d ? (
          <EmptyState title="Dispute not found" />
        ) : (
          <>
            <Card elevated style={{ gap: spacing.sm }}>
              <Text variant="caption" color="mutedForeground">
                {DISPUTE_CATEGORIES.find((c) => c.value === d.category)?.label ?? d.category} ·
                opened {formatDate(d.createdAt, 'medium')}
              </Text>
              <Text variant="body">{d.description}</Text>
            </Card>
            {resolved ? (
              <FormAlert
                tone="success"
                title="Resolved"
                message={`${d.resolution ?? 'Support closed this dispute.'}${d.refundAmount ? ` ₦${d.refundAmount.toLocaleString('en-NG')} was refunded to the guest.` : ''}`}
              />
            ) : (
              <FormAlert
                tone="info"
                message="Support reads every message here. Add photos or details by replying."
              />
            )}
            <Text variant="heading" accessibilityRole="header">
              Messages
            </Text>
            {messages.isPending ? (
              <Skeleton height={60} radius={radius.md} />
            ) : !messages.data?.length ? (
              <Text variant="callout" color="mutedForeground">
                No messages yet.
              </Text>
            ) : (
              messages.data.map((m) => {
                const mine = m.senderId === profile?.id;
                return (
                  <View
                    key={m.id}
                    style={{ maxWidth: '85%', alignSelf: mine ? 'flex-end' : 'flex-start' }}
                    accessible
                    accessibilityLabel={`${mine ? 'You' : m.senderName}, ${m.text}, ${relativeTime(m.timestamp)}`}
                  >
                    {!mine ? (
                      <Text variant="caption" color="mutedForeground" style={{ marginBottom: 2 }}>
                        {m.senderName}
                      </Text>
                    ) : null}
                    <View
                      style={{
                        paddingVertical: 9,
                        paddingHorizontal: 13,
                        borderRadius: radius.lg,
                        backgroundColor: mine ? colors.primary : colors.secondary,
                      }}
                    >
                      <Text
                        variant="callout"
                        style={{ color: mine ? colors.primaryForeground : colors.foreground }}
                      >
                        {m.text}
                      </Text>
                    </View>
                    <Text
                      variant="caption"
                      color="mutedForeground"
                      style={{ marginTop: 2, alignSelf: mine ? 'flex-end' : 'flex-start' }}
                    >
                      {relativeTime(m.timestamp)}
                    </Text>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
      {d && !resolved ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: spacing.xs,
            paddingHorizontal: spacing.md,
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing.sm,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <View style={{ flex: 1 }}>
            <TextField
              placeholder="Reply to support"
              accessibilityLabel="Reply"
              value={text}
              onChangeText={setText}
              multiline
              containerStyle={{ maxHeight: 120 }}
            />
          </View>
          <IconButton
            onPress={() => send.mutate()}
            disabled={!text.trim() || send.isPending}
            accessibilityLabel="Send reply"
            icon={
              <Send
                size={18}
                color={text.trim() ? colors.primaryForeground : colors.mutedForeground}
              />
            }
            style={{
              marginBottom: 5,
              borderWidth: 0,
              backgroundColor: text.trim() ? colors.primary : colors.secondary,
            }}
          />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
