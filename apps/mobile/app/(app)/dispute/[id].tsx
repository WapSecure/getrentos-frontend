import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Clock, ExternalLink, Send, Upload } from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  DetailSkeleton,
  Divider,
  FormAlert,
  IconButton,
  QueryState,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { formatDualTime } from '@sureground/shared';
import { qk } from '@/lib/query/keys';
import {
  DEPOSIT_DISPUTE_STATUS,
  depositDisputesApi,
  type DepositDispute,
} from '@/lib/api/depositDisputes';
import type { PickedFile } from '@/lib/api/documents';
import { deviceTimeZone } from '@/lib/api/landBuyerExtras';
import { errorMessage } from '@/lib/api/client';
import { pickDocument } from '@/lib/filePicker';
import { formatDate } from '@/lib/format';
import { goBack } from '@/lib/goBack';
import { useAuth } from '@/lib/auth/AuthProvider';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { FilePickRow } from '@/components/forms/FilePickRow';

const MAX_MESSAGE = 2000;
const MAX_NOTE = 1000;

/** Lagos time next to the viewer's: "12 Nov 2026 · 23:59 Lagos · 22:59 London". */
const dualMoment = (iso: string, timeZone: string) =>
  `${formatDate(iso, 'short')} · ${formatDualTime(iso, timeZone)}`;

/**
 * A deposit dispute's thread for either party (buyer or seller): what was raised, Sureground's
 * deadline, both parties' files, the messages and the decision. Files and messages can be added
 * while it is open. There is no appeal: decisions on deposit disputes are final within Sureground.
 */
export default function DepositDisputeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [viewerTimeZone] = useState(deviceTimeZone);
  const [reply, setReply] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [fileNote, setFileNote] = useState('');

  const key = qk.depositDisputes.detail(id);
  const messagesKey = qk.depositDisputes.messages(id);
  const dispute = useQuery({
    queryKey: key,
    queryFn: () => depositDisputesApi.get(id),
    enabled: Boolean(id),
  });
  const messages = useQuery({
    queryKey: messagesKey,
    queryFn: () => depositDisputesApi.messages(id),
    enabled: dispute.isSuccess,
    refetchInterval: 15_000,
  });
  const send = useMutation({
    mutationFn: () => depositDisputesApi.send(id, reply),
    onSuccess: () => {
      setReply('');
      void qc.invalidateQueries({ queryKey: messagesKey });
    },
    onError: (e) => toast.show(errorMessage(e, 'Your message was not sent.'), 'error'),
  });
  const upload = useMutation({
    mutationFn: () => depositDisputesApi.addFile(id, file!, fileNote),
    onSuccess: (updated: DepositDispute) => {
      setFile(null);
      setFileNote('');
      qc.setQueryData(key, updated);
      toast.show('File added. It is kept with the dispute permanently.', 'success');
    },
  });

  const d = dispute.data;
  const myId = profile?.id;
  const resolved = d?.status === 'RESOLVED';
  const otherSide = d ? (d.raisedBy.id === myId ? d.against.legalName : d.raisedBy.legalName) : '';
  const author = (senderId: string, senderName: string) => {
    if (senderId === myId) return 'You';
    if (d && (senderId === d.raisedBy.id || senderId === d.against.id)) return senderName;
    return 'Sureground';
  };
  const files = d?.attachments ?? [];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <DetailScreenHeader
        eyebrow="Deposit dispute"
        title={d?.title ?? 'Dispute'}
        subtitle={d?.propertyTitle}
        onBack={() => goBack()}
      />
      <QueryState
        query={dispute}
        skeleton={<DetailSkeleton />}
        errorTitle="This dispute is not available to you"
        errorDescription={
          dispute.error
            ? errorMessage(dispute.error, 'Check your connection, then try again.')
            : undefined
        }
      >
        {d ? (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingBottom: spacing['2xl'],
              gap: spacing.lg,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <Card style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
                  Raised by {d.raisedBy.id === myId ? 'you' : d.raisedBy.legalName} · opened{' '}
                  {formatDate(d.createdAt, 'short')}
                </Text>
                <Badge
                  label={DEPOSIT_DISPUTE_STATUS[d.status] ?? d.status}
                  tone={resolved ? 'neutral' : 'warning'}
                />
              </View>
              {d.description ? <Text variant="body">{d.description}</Text> : null}
              <Text variant="caption" color="mutedForeground">
                The deposit stays held until Sureground decides.
              </Text>
              {d.respondBy ? (
                <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }}>
                  <Clock size={14} color={colors.mutedForeground} style={{ marginTop: 3 }} />
                  <Text
                    variant="callout"
                    color="mutedForeground"
                    style={{ flex: 1, fontVariant: ['tabular-nums'] }}
                  >
                    Sureground replies by {dualMoment(d.respondBy, viewerTimeZone)}
                  </Text>
                </View>
              ) : null}
            </Card>

            {resolved ? (
              <FormAlert
                tone="success"
                title={`Decision${d.resolvedAt ? `, ${formatDate(d.resolvedAt, 'short')}` : ''}`}
                message={`${d.resolution ?? 'Sureground has decided this dispute.'} Decisions on deposit disputes are final within Sureground.`}
              />
            ) : null}

            <Card style={{ gap: spacing.md }}>
              <View style={{ gap: 2 }}>
                <Text variant="subheading" accessibilityRole="header">
                  Evidence
                </Text>
                <Text variant="caption" color="mutedForeground">
                  Files from you and {otherSide}. Files cannot be removed once added.
                </Text>
              </View>
              {files.length === 0 ? (
                <Text variant="callout" color="mutedForeground">
                  {resolved
                    ? 'Nobody added a file to this dispute.'
                    : 'Photos, documents or receipts that support what you have said.'}
                </Text>
              ) : (
                files.map((f, index) => (
                  <View key={f.id} style={{ gap: spacing.sm }}>
                    {index > 0 ? <Divider /> : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text variant="callout" style={{ fontWeight: '600' }} numberOfLines={1}>
                          {f.name}
                        </Text>
                        <Text variant="caption" color="mutedForeground">
                          {f.uploadedBy?.id === myId
                            ? 'You'
                            : (f.uploadedBy?.legalName ?? otherSide)}{' '}
                          · {formatDate(f.uploadedAt, 'short')}
                          {f.note ? ` · “${f.note}”` : ''}
                        </Text>
                      </View>
                      <Button
                        label="Open"
                        size="sm"
                        variant="ghost"
                        icon={<ExternalLink size={16} color={colors.foreground} />}
                        onPress={() => void WebBrowser.openBrowserAsync(f.url)}
                        accessibilityLabel={`Open ${f.name}`}
                      />
                    </View>
                  </View>
                ))
              )}
              {!resolved ? (
                <View style={{ gap: spacing.md }}>
                  <Divider />
                  {upload.isError ? (
                    <FormAlert message={errorMessage(upload.error, 'The file was not added.')} />
                  ) : null}
                  <FilePickRow
                    label="Add a file"
                    file={file}
                    emptyText="PDF or photo"
                    onPick={async () => setFile(await pickDocument())}
                    onClear={() => setFile(null)}
                  />
                  {file ? (
                    <>
                      <TextField
                        label="What this shows (optional)"
                        value={fileNote}
                        onChangeText={setFileNote}
                        maxLength={MAX_NOTE}
                      />
                      <Button
                        label="Add file"
                        variant="outline"
                        icon={<Upload size={16} color={colors.foreground} />}
                        loading={upload.isPending}
                        loadingLabel="Adding…"
                        onPress={() => upload.mutate()}
                      />
                    </>
                  ) : null}
                </View>
              ) : null}
            </Card>

            <View style={{ gap: spacing.md }}>
              <View style={{ gap: 2 }}>
                <Text variant="subheading" accessibilityRole="header">
                  Messages
                </Text>
                <Text variant="caption" color="mutedForeground">
                  Between you, {otherSide} and Sureground. Everything here stays on record.
                </Text>
              </View>
              {messages.isPending ? (
                <Skeleton height={60} radius={radius.md} />
              ) : !messages.data?.length ? (
                <Text variant="callout" color="mutedForeground">
                  {resolved ? 'Nobody wrote on this dispute.' : 'No messages yet.'}
                </Text>
              ) : (
                messages.data.map((m) => {
                  const mine = m.senderId === myId;
                  const who = author(m.senderId, m.senderName);
                  return (
                    <View
                      key={m.id}
                      style={{ maxWidth: '85%', alignSelf: mine ? 'flex-end' : 'flex-start' }}
                      accessible
                      accessibilityLabel={`${who}, ${m.text}, ${formatDate(m.timestamp, 'short')}`}
                    >
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
                        {who} · {dualMoment(m.timestamp, viewerTimeZone)}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        ) : null}
      </QueryState>
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
              placeholder="Reply"
              accessibilityLabel="Reply"
              value={reply}
              onChangeText={setReply}
              maxLength={MAX_MESSAGE}
              multiline
              containerStyle={{ maxHeight: 120 }}
            />
          </View>
          <IconButton
            onPress={() => send.mutate()}
            disabled={!reply.trim()}
            loading={send.isPending}
            accessibilityLabel="Send reply"
            icon={
              <Send
                size={18}
                color={reply.trim() ? colors.primaryForeground : colors.mutedForeground}
              />
            }
            style={{
              marginBottom: 5,
              borderWidth: 0,
              backgroundColor: reply.trim() ? colors.primary : colors.secondary,
            }}
          />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
