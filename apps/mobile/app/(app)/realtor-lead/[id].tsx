import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarClock, Check, RotateCcw } from 'lucide-react-native';
import { Button, Card, ErrorState, Skeleton, Text, useTheme, useToast } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  LEAD_STAGES,
  isLeadOpen,
  leadNextStep,
  leadStage,
  realtorApi,
  type LeadStatus,
} from '@/lib/api/realtor';
import { ApiError } from '@/lib/api/client';
import { formatDate, relativeTime } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { StatusPill } from '@/components/host/HostUI';
import { ContactActions, ScheduleViewingSheet, ViewingRow } from '@/components/realtor/RealtorUI';

/** The open stages in order; won and lost are endings, shown separately. */
const TRACK = LEAD_STAGES.filter((s) => s.value !== 'LOST');

export default function RealtorLead() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [booking, setBooking] = useState(false);

  const lead = useQuery({ queryKey: qk.realtor.lead(id), queryFn: () => realtorApi.lead(id) });
  const viewings = useQuery({
    queryKey: qk.realtor.viewings,
    queryFn: () => realtorApi.viewings(),
  });
  const theirs = viewings.data?.items.filter((v) => v.lead?.id === id) ?? [];

  const move = useMutation({
    mutationFn: (status: LeadStatus) => realtorApi.updateLead(id, status),
    onSuccess: (_l, status) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['realtor'] });
      toast.show(
        status === 'CLOSED'
          ? 'Marked as won. Nice work.'
          : status === 'LOST'
            ? 'Marked as lost.'
            : `Moved to ${leadStage(status).label.toLowerCase()}.`,
        'success'
      );
    },
    onError: (e) => toast.show(e instanceof ApiError ? e.message : 'Could not update.', 'error'),
  });

  const l = lead.data;
  const next = l ? leadNextStep(l.status) : null;
  const open = l ? isLeadOpen(l.status) : false;
  const stageIndex = l ? TRACK.findIndex((s) => s.value === l.status) : -1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={lead.isRefetching}
            onRefresh={() => {
              lead.refetch();
              viewings.refetch();
            }}
            tintColor={colors.mutedForeground}
          />
        }
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow="Lead"
          title={l?.fullName ?? 'Lead'}
          subtitle={l ? `Came in ${relativeTime(l.createdAt)}` : undefined}
          onBack={() => router.back()}
        />

        {lead.isError && !l ? (
          <ErrorState onRetry={() => lead.refetch()} />
        ) : !l ? (
          <Skeleton height={220} radius={radius.lg} />
        ) : (
          <>
            <Card elevated style={{ gap: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <StatusPill label={leadStage(l.status).label} tone={leadStage(l.status).tone} />
                <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
                  {l.listing?.listingTitle ?? 'Not linked to a listing'}
                </Text>
              </View>
              <ContactActions phone={l.phone} email={l.email} name={l.fullName} />
              {l.phone || l.email ? (
                <Text variant="caption" color="mutedForeground" selectable>
                  {[l.phone, l.email].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
            </Card>

            {l.status !== 'LOST' ? (
              <View
                accessible
                accessibilityLabel={`Stage ${stageIndex + 1} of ${TRACK.length}: ${leadStage(l.status).label}`}
                style={{ flexDirection: 'row', gap: spacing.xs }}
              >
                {TRACK.map((s, i) => {
                  const done = i <= stageIndex;
                  return (
                    <View key={s.value} style={{ flex: 1, gap: 6 }}>
                      <View
                        style={{
                          height: 6,
                          borderRadius: radius.full,
                          backgroundColor: done ? colors.primary : colors.secondary,
                        }}
                      />
                      <Text
                        variant="caption"
                        color={done ? 'foreground' : 'mutedForeground'}
                        style={{ fontWeight: i === stageIndex ? '700' : '400' }}
                      >
                        {s.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {l.notes ? (
              <Card style={{ gap: spacing.xs }}>
                <Text variant="label" uppercase color="mutedForeground">
                  Notes
                </Text>
                <Text variant="callout">{l.notes}</Text>
              </Card>
            ) : null}

            {open ? (
              <View style={{ gap: spacing.sm }}>
                {next ? (
                  <Button
                    label={next.label}
                    icon={<Check size={16} color={colors.primaryForeground} />}
                    loading={move.isPending && move.variables === next.to}
                    onPress={() => move.mutate(next.to)}
                  />
                ) : null}
                <Button
                  label="Book a viewing"
                  variant="secondary"
                  icon={<CalendarClock size={16} color={colors.foreground} />}
                  onPress={() => setBooking(true)}
                />
                <Button
                  label="Mark as lost"
                  variant="ghost"
                  onPress={() =>
                    Alert.alert(`Mark ${l.fullName} as lost?`, 'You can reopen the lead later.', [
                      { text: 'Keep open', style: 'cancel' },
                      {
                        text: 'Mark as lost',
                        style: 'destructive',
                        onPress: () => move.mutate('LOST'),
                      },
                    ])
                  }
                />
              </View>
            ) : (
              <Button
                label="Reopen lead"
                variant="secondary"
                icon={<RotateCcw size={16} color={colors.foreground} />}
                loading={move.isPending}
                onPress={() => move.mutate('CONTACTED')}
              />
            )}

            <View style={{ gap: spacing.sm }}>
              <Text variant="heading" accessibilityRole="header">
                Viewings
              </Text>
              {viewings.isPending ? (
                <Skeleton height={84} radius={radius.lg} />
              ) : theirs.length ? (
                theirs.map((v) => <ViewingRow key={v.id} v={v} />)
              ) : (
                <Text variant="callout" color="mutedForeground">
                  None booked yet.
                </Text>
              )}
            </View>

            <Text variant="caption" color="mutedForeground" center>
              Added {formatDate(l.createdAt, 'medium')}
              {l.source ? ` · via ${l.source}` : ''}
            </Text>
          </>
        )}
      </ScrollView>
      <ScheduleViewingSheet open={booking} onClose={() => setBooking(false)} lead={l} />
    </View>
  );
}
