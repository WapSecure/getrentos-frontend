import { useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  DetailSkeleton,
  QueryState,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  managementApi,
  QUERY_CATEGORY_LABEL,
  queryStatusBadge,
  querySlaText,
} from '@/lib/api/management';
import { errorMessage } from '@/lib/api/client';
import { formatDateTime } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

/** One owner–manager question: the thread, a reply box, resolve and reopen. */
export default function ManagerQueryThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [reply, setReply] = useState('');

  const thread = useQuery({
    queryKey: qk.management.query(id),
    queryFn: () => managementApi.query(id),
    enabled: !!id,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['management', 'queries'] });
  const fail = (e: unknown) => toast.show(errorMessage(e, 'That did not go through.'), 'error');

  const send = useMutation({
    mutationFn: () => managementApi.replyQuery(id, reply.trim()),
    onSuccess: () => {
      setReply('');
      refresh();
    },
    onError: fail,
  });
  const resolve = useMutation({
    mutationFn: () => managementApi.resolveQuery(id),
    onSuccess: () => {
      refresh();
      toast.show('Marked resolved.', 'success');
    },
    onError: fail,
  });
  const reopen = useMutation({
    mutationFn: () => managementApi.reopenQuery(id),
    onSuccess: refresh,
    onError: fail,
  });

  const q = thread.data;
  const isOwner = q?.viewerSide === 'OWNER';
  const resolved = q?.status === 'RESOLVED';
  const busy = send.isPending || resolve.isPending || reopen.isPending;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <DetailScreenHeader
        eyebrow="Question"
        title={q?.subject ?? 'Question'}
        subtitle={
          q
            ? `${q.propertyTitle} · ${QUERY_CATEGORY_LABEL[q.category]} · ${
                isOwner ? `Managed by ${q.manager}` : `From ${q.ownerName ?? 'the owner'}`
              }`
            : undefined
        }
        onBack={() => goBack()}
      />

      <QueryState
        query={thread}
        skeleton={
          <View style={{ paddingHorizontal: spacing.xl }}>
            <DetailSkeleton />
          </View>
        }
        errorTitle="This question did not load"
      >
        {q ? (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingBottom: insets.bottom + spacing['3xl'],
              gap: spacing.md,
            }}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={thread.isRefetching}
                onRefresh={() => thread.refetch()}
                tintColor={colors.mutedForeground}
              />
            }
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Badge label={queryStatusBadge(q).label} tone={queryStatusBadge(q).tone} />
              <Clock size={14} color={q.late ? colors.destructive : colors.mutedForeground} />
              <Text
                variant="caption"
                style={{ flex: 1, color: q.late ? colors.destructive : colors.mutedForeground }}
              >
                {querySlaText(q, (iso) => formatDateTime(iso))}
              </Text>
            </View>

            {q.messages.map((m) => {
              const mine = m.side === q.viewerSide;
              return (
                <View
                  key={m.id}
                  style={{
                    alignSelf: mine ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    backgroundColor: mine ? colors.infoSubtle : colors.secondary,
                    borderRadius: radius.lg,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                    gap: 4,
                  }}
                >
                  <Text variant="body">{m.body}</Text>
                  <Text variant="caption" color="mutedForeground">
                    {m.author}
                    {m.onBehalfOf ? ` for ${m.onBehalfOf}` : ''} · {formatDateTime(m.at)}
                  </Text>
                </View>
              );
            })}

            {!resolved || isOwner ? (
              <Card padding={spacing.lg} style={{ gap: spacing.md }}>
                <TextField
                  label="Reply"
                  placeholder={resolved ? 'Write to reopen this question' : 'Write a reply'}
                  value={reply}
                  onChangeText={setReply}
                  multiline
                  numberOfLines={3}
                  editable={!busy}
                />
                <Button
                  label="Send"
                  loading={send.isPending}
                  disabled={reply.trim().length < 2 || busy}
                  onPress={() => send.mutate()}
                />
                {!resolved ? (
                  <Button
                    label="Mark resolved"
                    variant="outline"
                    loading={resolve.isPending}
                    disabled={busy}
                    onPress={() => resolve.mutate()}
                  />
                ) : (
                  <Button
                    label="Reopen"
                    variant="outline"
                    loading={reopen.isPending}
                    disabled={busy}
                    onPress={() => reopen.mutate()}
                  />
                )}
              </Card>
            ) : null}
          </ScrollView>
        ) : null}
      </QueryState>
    </KeyboardAvoidingView>
  );
}
