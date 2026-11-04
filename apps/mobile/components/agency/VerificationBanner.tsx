import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';
import { Button, FormAlert, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { agencyFirmApi } from '@/lib/api/agencyFirm';

/**
 * Until GetRentos verifies the firm it can set up but not be paid. Says where
 * verification stands, and links to finish it unless it is out of the firm's
 * hands (submitted, or suspended).
 */
export function VerificationBanner() {
  const { spacing } = useTheme();
  const q = useQuery({
    queryKey: qk.agency.onboarding,
    queryFn: agencyFirmApi.onboarding,
    staleTime: 60_000,
    retry: false,
  });
  const f = q.data;
  if (!f || f.status === 'ACTIVE') return null;
  const kyb = f.profile.kybStatus;
  const message =
    f.status === 'SUSPENDED'
      ? 'Your firm is suspended. Contact GetRentos support.'
      : kyb === 'SUBMITTED'
        ? 'Your firm’s verification is with GetRentos. Payouts start once it is approved.'
        : kyb === 'REJECTED'
          ? `Verification was not approved${f.profile.kybDecisionNote ? `: ${f.profile.kybDecisionNote}` : ''}. Fix the details and submit again.`
          : 'Your firm is not verified yet. Complete verification to receive payouts.';
  const showLink = f.status !== 'SUSPENDED' && kyb !== 'SUBMITTED';
  return (
    <View style={{ gap: spacing.sm }}>
      <FormAlert
        tone={f.status === 'SUSPENDED' || kyb === 'REJECTED' ? 'error' : 'warning'}
        message={message}
      />
      {showLink ? (
        <Button
          label="Complete verification"
          size="sm"
          variant="secondary"
          onPress={() => router.push('/(app)/agency-setup')}
          style={{ alignSelf: 'flex-start' }}
        />
      ) : null}
    </View>
  );
}
