import { useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Inbox, ShieldCheck } from 'lucide-react-native';
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
  type BadgeTone,
} from '@getrentos/ui-native';
import {
  LAND_CONSENT_LABELS,
  LAND_SELLER_CAPACITY_LABELS,
  LAND_SIGNATORY_ROLE_LABELS,
  type LandConsentRequest,
  type LandSignatoryConsent,
} from '@getrentos/shared';
import { qk } from '@/lib/query/keys';
import { landConsentsApi, MIN_OBJECTION } from '@/lib/api/landConsents';
import { ApiError } from '@/lib/api/client';
import { Sheet } from '@/components/Sheet';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

const TONE: Record<LandSignatoryConsent, BadgeTone> = {
  PENDING: 'warning',
  CONSENTED: 'success',
  OBJECTED: 'danger',
  WAIVED: 'neutral',
};

/** Land sales whose seller named you as someone whose consent the sale needs. */
export default function LandConsents() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [objecting, setObjecting] = useState<LandConsentRequest | null>(null);
  const query = useQuery({ queryKey: qk.landConsents, queryFn: landConsentsApi.mine });
  const items = query.data ?? [];

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
          eyebrow="Land"
          title="Sale consents"
          subtitle="Land sales that need your consent"
          onBack={() => router.back()}
        />
        <Card style={{ flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.secondary }}>
          <ShieldCheck size={18} color={colors.primary} />
          <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
            Consent only if you agree to the sale. If you object, the sale is paused and GetRentos
            looks into it.
          </Text>
        </Card>

        {query.isError && !query.data ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : query.isPending ? (
          <Skeleton height={160} radius={radius.lg} />
        ) : !items.length ? (
          <EmptyState
            icon={<Inbox size={34} color={colors.mutedForeground} />}
            title="No consent requests"
            description="When a seller names you on their land sale, it appears here."
          />
        ) : (
          items.map((item) => (
            <ConsentCard key={item.signatoryId} item={item} onObject={() => setObjecting(item)} />
          ))
        )}
      </ScrollView>

      <Sheet open={!!objecting} onClose={() => setObjecting(null)} title="Object to the sale">
        {objecting ? (
          <ObjectionForm
            key={objecting.signatoryId}
            item={objecting}
            onDone={() => setObjecting(null)}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function ConsentCard({ item, onObject }: { item: LandConsentRequest; onObject: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const consent = useMutation({
    mutationFn: () => landConsentsApi.respond(item.signatoryId, 'CONSENT'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.landConsents });
      toast.show('Thank you. Your consent is recorded.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not record that.', 'error'),
  });

  return (
    <Card elevated style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{item.property.title}</Text>
          <Text variant="caption" color="mutedForeground">
            {item.property.city}
          </Text>
        </View>
        <Badge label={LAND_CONSENT_LABELS[item.consent]} tone={TONE[item.consent]} />
      </View>
      <Text variant="callout">
        {item.seller}: “{LAND_SELLER_CAPACITY_LABELS[item.capacity]}”
        {item.principalName ? ` (${item.principalName})` : ''}
      </Text>
      <Text variant="caption" color="mutedForeground">
        You are listed as {LAND_SIGNATORY_ROLE_LABELS[item.role].toLowerCase()}
      </Text>
      {item.consent !== 'WAIVED' ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {item.consent !== 'CONSENTED' ? (
            <Button
              label="I consent"
              style={{ flex: 1 }}
              loading={consent.isPending}
              onPress={() => consent.mutate()}
            />
          ) : null}
          {item.consent !== 'OBJECTED' ? (
            <Button label="I object" variant="secondary" style={{ flex: 1 }} onPress={onObject} />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

function ObjectionForm({ item, onDone }: { item: LandConsentRequest; onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [reason, setReason] = useState('');
  const short = reason.trim().length < MIN_OBJECTION;
  const submit = useMutation({
    mutationFn: () => landConsentsApi.respond(item.signatoryId, 'OBJECT', reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.landConsents });
      toast.show(
        'Objection recorded. The sale is paused while GetRentos looks into it.',
        'success'
      );
      onDone();
    },
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ gap: spacing.md }}>
        <Text variant="callout" color="mutedForeground">
          {item.seller} and GetRentos will see your reason. The sale of {item.property.title} is
          paused until GetRentos resolves it.
        </Text>
        <TextField
          label="Why you object"
          value={reason}
          onChangeText={setReason}
          multiline
          required
          error={
            submit.error
              ? submit.error instanceof ApiError
                ? submit.error.message
                : 'That didn’t go through. Try again.'
              : null
          }
          hint={short ? `At least ${MIN_OBJECTION} characters` : undefined}
        />
        <Button
          label="Object to the sale"
          variant="destructive"
          disabled={short}
          loading={submit.isPending}
          onPress={() => submit.mutate()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
