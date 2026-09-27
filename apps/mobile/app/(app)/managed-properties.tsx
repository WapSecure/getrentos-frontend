import { useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, KeyRound, Minus } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  FormAlert,
  Skeleton,
  Text,
  TextField,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  AUTHORITY_RELATIONSHIPS,
  claimOutcome,
  propertyAuthorityApi,
  relationshipLabel,
  type AuthorityRelationship,
  type AuthorityStatus,
  type ManagedProperty,
} from '@/lib/api/propertyAuthority';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

const TONE: Record<AuthorityStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  REJECTED: 'danger',
  REVOKED: 'danger',
  EXPIRED: 'neutral',
};

/** Properties you act for on someone else's behalf, and claims awaiting an officer. */
export default function ManagedProperties() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const managed = useQuery({
    queryKey: qk.authority.managed,
    queryFn: propertyAuthorityApi.managed,
  });
  const claims = useQuery({ queryKey: qk.authority.mine, queryFn: propertyAuthorityApi.mine });
  const open = (claims.data ?? []).filter((c) => c.status !== 'ACTIVE');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={managed.isRefetching || claims.isRefetching}
            onRefresh={() => {
              managed.refetch();
              claims.refetch();
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
          eyebrow="Authority"
          title="Properties I manage"
          subtitle="What you can do for other owners’ properties"
          onBack={() => router.back()}
        />

        {managed.isError && !managed.data ? (
          <ErrorState onRetry={() => managed.refetch()} />
        ) : managed.isPending ? (
          <Skeleton height={140} radius={radius.lg} />
        ) : !managed.data.length ? (
          <EmptyState
            icon={<KeyRound size={34} color={colors.mutedForeground} />}
            title="Not managing anyone’s property"
            description="If an owner has asked you to manage one, file a claim below. An officer checks it first."
          />
        ) : (
          managed.data.map((p) => <ManagedCard key={p.mandateId} p={p} />)
        )}

        {open.length ? (
          <View style={{ gap: spacing.sm }}>
            <Text variant="heading" accessibilityRole="header">
              Claims in progress
            </Text>
            {open.map((c) => (
              <Card key={c.id} elevated style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Text variant="callout" style={{ flex: 1 }}>
                    {relationshipLabel(c.relationship)}
                  </Text>
                  <Badge label={c.status.toLowerCase()} tone={TONE[c.status]} />
                </View>
                <Text variant="caption" color="mutedForeground">
                  Filed {formatDate(c.createdAt, 'medium')}
                </Text>
                {c.decisionNote ? <Text variant="caption">{c.decisionNote}</Text> : null}
              </Card>
            ))}
          </View>
        ) : null}

        <ClaimForm />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Capability({ on, label, hint }: { on: boolean; label: string; hint: string }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${on ? 'allowed' : 'not allowed'}. ${hint}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.full,
        backgroundColor: on ? colors.successSubtle : colors.secondary,
      }}
    >
      {on ? (
        <Check size={12} color={colors.success} />
      ) : (
        <Minus size={12} color={colors.mutedForeground} />
      )}
      <Text variant="caption" style={{ color: on ? colors.success : colors.mutedForeground }}>
        {label}
      </Text>
    </View>
  );
}

function ManagedCard({ p }: { p: ManagedProperty }) {
  const { spacing } = useTheme();
  return (
    <Card elevated style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{p.title}</Text>
          <Text variant="caption" color="mutedForeground">
            {p.address}, {p.city}
          </Text>
        </View>
        <Badge label={p.status.toLowerCase()} tone={TONE[p.status]} />
      </View>
      <Text variant="caption" color="mutedForeground">
        {relationshipLabel(p.relationship)} for {p.ownerName}
      </Text>
      {/* Separate grants on purpose: advertising, running a tenancy and moving money differ. */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        <Capability on={p.canList} label="Listings" hint="Create, publish and pause listings" />
        <Capability on={p.canManage} label="Tenancy" hint="Units, tenants, leases, maintenance" />
        <Capability on={p.canTransact} label="Money" hint="Accept offers and act on money" />
      </View>
      <Text variant="caption" color="mutedForeground">
        {p.listingCount} listing{p.listingCount === 1 ? '' : 's'}
        {p.archived ? ' · archived' : ''} ·{' '}
        {p.expiresAt ? `expires ${formatDate(p.expiresAt, 'medium')}` : 'no expiry'}
      </Text>
    </Card>
  );
}

function ClaimForm() {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const [propertyId, setPropertyId] = useState('');
  const [relationship, setRelationship] = useState<AuthorityRelationship>('PROPERTY_MANAGER');
  const [note, setNote] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const file = useMutation({
    mutationFn: () =>
      propertyAuthorityApi.request({
        propertyId: propertyId.trim(),
        relationship,
        ...(note.trim() ? { note: note.trim() } : {}),
      }),
    onSuccess: (claim) => {
      setResult(claimOutcome(claim.status));
      setPropertyId('');
      setNote('');
      qc.invalidateQueries({ queryKey: qk.authority.mine });
    },
    onMutate: () => setResult(null),
  });

  return (
    <Card elevated style={{ gap: spacing.md }}>
      <Text variant="bodyStrong" accessibilityRole="header">
        File a claim
      </Text>
      <Text variant="caption" color="mutedForeground">
        Paste the property’s ID from the owner. An officer checks the mandate and grants listing,
        tenancy and money access separately.
      </Text>
      <TextField
        label="Property ID"
        value={propertyId}
        onChangeText={setPropertyId}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {AUTHORITY_RELATIONSHIPS.map((r) => (
          <Chip
            key={r.value}
            label={r.label}
            size="sm"
            selected={relationship === r.value}
            onPress={() => setRelationship(r.value)}
          />
        ))}
      </View>
      <TextField
        label="Note for the officer (optional)"
        value={note}
        onChangeText={setNote}
        multiline
      />
      {file.error ? (
        <FormAlert
          message={
            file.error instanceof ApiError ? file.error.message : 'Could not file the claim.'
          }
        />
      ) : result ? (
        <FormAlert tone="success" message={result} />
      ) : null}
      <Button
        label="File claim"
        disabled={!propertyId.trim()}
        loading={file.isPending}
        onPress={() => file.mutate()}
      />
    </Card>
  );
}
