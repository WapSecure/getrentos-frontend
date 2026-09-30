import { useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck, Trees } from 'lucide-react-native';
import {
  Badge,
  Button,
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
import { estateAgreementsApi, MIN_REASON, type EstateAgreement } from '@/lib/api/estateAgreements';
import { ApiError } from '@/lib/api/client';
import { Sheet } from '@/components/Sheet';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

type Closing = { agreement: EstateAgreement; action: 'decline' | 'revoke' };

/** Estates asking to advertise your property, and the ones already doing so. */
export default function EstateAgreements() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [closing, setClosing] = useState<Closing | null>(null);
  const query = useQuery({ queryKey: qk.estateAgreements, queryFn: estateAgreementsApi.mine });
  const all = query.data ?? [];
  const requests = all.filter((a) => a.status === 'PENDING');
  const active = all.filter((a) => a.status === 'ACTIVE');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
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
          eyebrow="Marketing"
          title="Estate requests"
          subtitle="Estates that want to advertise your property"
          onBack={() => router.back()}
        />
        <Card style={{ flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.secondary }}>
          <ShieldCheck size={18} color={colors.primary} />
          <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
            You keep the property and every naira. Allowing an estate only lets it market the
            property to its residents and visitors.
          </Text>
        </Card>

        {query.isError && !query.data ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : query.isPending ? (
          <Skeleton height={140} radius={radius.lg} />
        ) : !requests.length && !active.length ? (
          <EmptyState
            icon={<Trees size={34} color={colors.mutedForeground} />}
            title="No requests"
            description="When an estate your property sits in asks to market it, you’ll decide here."
          />
        ) : (
          <>
            {requests.length ? (
              <Section title="Waiting for you">
                {requests.map((a) => (
                  <AgreementCard
                    key={a.id}
                    a={a}
                    onClose={(action) => setClosing({ agreement: a, action })}
                  />
                ))}
              </Section>
            ) : null}
            {active.length ? (
              <Section title="Marketing now">
                {active.map((a) => (
                  <AgreementCard
                    key={a.id}
                    a={a}
                    onClose={(action) => setClosing({ agreement: a, action })}
                  />
                ))}
              </Section>
            ) : null}
          </>
        )}
      </ScrollView>

      <Sheet
        open={!!closing}
        onClose={() => setClosing(null)}
        title={closing?.action === 'revoke' ? 'Withdraw permission' : 'Decline request'}
      >
        {closing ? (
          <ReasonForm
            key={closing.agreement.id + closing.action}
            closing={closing}
            onDone={() => setClosing(null)}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="heading" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function AgreementCard({
  a,
  onClose,
}: {
  a: EstateAgreement;
  onClose: (action: 'decline' | 'revoke') => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const pending = a.status === 'PENDING';
  const approve = useMutation({
    mutationFn: () => estateAgreementsApi.approve(a.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.estateAgreements });
      toast.show(`${a.estateName} can now market ${a.propertyTitle}.`, 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not approve this.', 'error'),
  });

  return (
    <Card elevated style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{a.estateName}</Text>
          <Text variant="caption" color="mutedForeground">
            {a.propertyTitle} · {a.propertyAddress}
          </Text>
        </View>
        {pending ? null : <Badge label="Marketing live" tone="success" />}
      </View>
      {a.note ? <Text variant="callout">“{a.note}”</Text> : null}
      {pending && a.requestedByEmail ? (
        <Text variant="caption" color="mutedForeground">
          Asked by {a.requestedByEmail}
        </Text>
      ) : null}
      {!pending && a.estateListingCount ? (
        <Text variant="caption" color="mutedForeground">
          {a.estateListingCount} listing{a.estateListingCount === 1 ? '' : 's'} by this estate
        </Text>
      ) : null}
      {pending ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button
            label="Allow"
            style={{ flex: 1 }}
            loading={approve.isPending}
            onPress={() => approve.mutate()}
          />
          <Button
            label="Decline"
            variant="secondary"
            style={{ flex: 1 }}
            onPress={() => onClose('decline')}
          />
        </View>
      ) : (
        <Button label="Withdraw permission" variant="ghost" onPress={() => onClose('revoke')} />
      )}
    </Card>
  );
}

function ReasonForm({ closing, onDone }: { closing: Closing; onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const { agreement: a, action } = closing;
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();
  const short = trimmed.length < MIN_REASON;

  const submit = useMutation({
    mutationFn: () =>
      action === 'decline'
        ? estateAgreementsApi.decline(a.id, trimmed)
        : estateAgreementsApi.revoke(a.id, trimmed),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.estateAgreements });
      toast.show(
        action === 'decline'
          ? 'Request declined.'
          : 'Withdrawn: their listings for this property are paused.',
        'success'
      );
      onDone();
    },
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ gap: spacing.md }}>
        <Text variant="callout" color="mutedForeground">
          {action === 'decline'
            ? `${a.estateName} will see your reason.`
            : `${a.estateName} will stop marketing ${a.propertyTitle}, and any listings they published for it are paused.`}
        </Text>
        <TextField
          label="Reason"
          value={reason}
          onChangeText={setReason}
          multiline
          error={
            submit.error
              ? submit.error instanceof ApiError
                ? submit.error.message
                : 'That didn’t go through. Try again.'
              : null
          }
          hint={short ? `At least ${MIN_REASON} characters` : undefined}
        />
        <Button
          label={action === 'decline' ? 'Decline request' : 'Withdraw permission'}
          variant="destructive"
          disabled={short}
          loading={submit.isPending}
          onPress={() => submit.mutate()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
