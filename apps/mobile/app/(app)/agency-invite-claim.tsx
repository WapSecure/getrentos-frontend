import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2 } from '@sureground/icons/native';
import { Button, Card, DetailSkeleton, FormAlert, Text, useTheme } from '@sureground/ui-native';
import { agencyApi } from '@/lib/api/agency';
import { ApiError, errorMessage } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

/**
 * An owner accepting a management firm's invitation in the app. A phone-only owner gets here from the
 * notification the firm's invite sent them; the server checks they are the account it names.
 */
export default function AgencyInviteClaim() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams<{ token?: string }>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Invitation"
        title="Work with a firm"
        subtitle="From your invitation"
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        {token ? (
          <Claim token={token} />
        ) : (
          <FormAlert
            tone="warning"
            message="Open this from your invitation notification or email."
          />
        )}
      </ScrollView>
    </View>
  );
}

function Claim({ token }: { token: string }) {
  const { colors, spacing } = useTheme();
  const { signOut } = useAuth();
  const info = useQuery({
    queryKey: ['agency', 'owner-invite', token],
    queryFn: () => agencyApi.ownerInviteClaimInfo(token),
    retry: false,
  });
  const claim = useMutation({ mutationFn: () => agencyApi.claimOwnerInvite(token) });

  if (info.isLoading) return <DetailSkeleton />;
  const p = info.data;
  if (!p) {
    return (
      <FormAlert
        tone="error"
        message={
          info.error instanceof ApiError
            ? info.error.message
            : 'This invitation could not be opened.'
        }
      />
    );
  }
  if (claim.isSuccess || p.status === 'CLAIMED') {
    return (
      <FormAlert
        tone="success"
        message={`You’ve accepted ${p.organizationName}’s invitation. They can now set up management of your property with you.`}
      />
    );
  }
  if (p.status === 'REVOKED' || p.status === 'EXPIRED' || p.expired) {
    return (
      <FormAlert
        tone="warning"
        message={
          p.status === 'REVOKED'
            ? 'This invitation was withdrawn by the firm.'
            : 'This invitation has expired. Ask the firm to send a new one.'
        }
      />
    );
  }
  const who = p.email || p.phoneMasked;
  const wrongAccount = claim.error instanceof ApiError && claim.error.status === 403;
  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
        <Building2 size={18} color={colors.primary} />
        <Text variant="heading">{p.organizationName}</Text>
      </View>
      <Text variant="callout" color="mutedForeground">
        {p.organizationName} is a property management firm on Sureground. If you accept, your
        account{who ? ` (${who})` : ''} is connected to them, and they can set up management of your
        property with you.
      </Text>
      {claim.error ? (
        <FormAlert message={errorMessage(claim.error, 'We could not accept this invitation.')} />
      ) : null}
      {wrongAccount ? (
        <Button label="Sign out and switch account" variant="secondary" onPress={() => signOut()} />
      ) : (
        <Button
          label="Accept invitation"
          loading={claim.isPending}
          disabled={claim.isPending}
          onPress={() => claim.mutate()}
        />
      )}
    </Card>
  );
}
