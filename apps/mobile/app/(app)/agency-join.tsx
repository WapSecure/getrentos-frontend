import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Briefcase } from 'lucide-react-native';
import {
  Button,
  Card,
  DetailSkeleton,
  FormAlert,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { agencyFirmApi, tokenFrom } from '@/lib/api/agencyFirm';
import { formatDay } from '@/lib/api/agency';
import { ApiError, errorMessage } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

/**
 * Joining a firm from an invitation. Opened with ?token= from the link, or the
 * link (or token) pasted here.
 */
export default function AgencyJoin() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ token?: string }>();
  const [pasted, setPasted] = useState('');
  const [token, setToken] = useState(params.token ?? '');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Agency"
        title="Join a firm"
        subtitle="From your invitation email"
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {token ? (
          <Invitation token={token} onReset={() => setToken('')} />
        ) : (
          <Card style={{ gap: spacing.md }}>
            <Text variant="callout" color="mutedForeground">
              Open the link from your invitation email, or paste it here.
            </Text>
            <TextField
              label="Invitation link"
              value={pasted}
              onChangeText={setPasted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Button
              label="Continue"
              disabled={!pasted.trim()}
              onPress={() => setToken(tokenFrom(pasted))}
            />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

function Invitation({ token, onReset }: { token: string; onReset: () => void }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const { refreshProfile, switchWorkspace, signOut } = useAuth();
  const preview = useQuery({
    queryKey: ['agency', 'join', token],
    queryFn: () => agencyFirmApi.joinPreview(token),
    retry: false,
  });
  const join = useMutation({
    mutationFn: () => agencyFirmApi.join(token),
    onSuccess: async () => {
      // Joining makes this account a property manager; open the workspace.
      await refreshProfile();
      qc.clear();
      switchWorkspace('manager');
      router.replace('/(app)/(manager)');
      toast.show(`Welcome to ${preview.data?.firmName ?? 'the firm'}.`, 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not join the firm.'), 'error'),
  });

  if (preview.isLoading) return <DetailSkeleton />;
  const p = preview.data;
  if (!p) {
    return (
      <View style={{ gap: spacing.md }}>
        <FormAlert
          tone="error"
          message={
            preview.error instanceof ApiError
              ? preview.error.message
              : 'This invitation could not be opened.'
          }
        />
        <Button label="Try another link" variant="secondary" onPress={onReset} />
      </View>
    );
  }
  if (p.status !== 'PENDING') {
    return (
      <FormAlert
        tone="warning"
        message={
          p.status === 'EXPIRED'
            ? 'This invitation has expired. Ask the firm for a new one.'
            : 'This invitation is no longer open.'
        }
      />
    );
  }
  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
        <Briefcase size={18} color={colors.primary} />
        <Text variant="heading">{p.firmName}</Text>
      </View>
      <Text variant="callout" color="mutedForeground">
        You’re invited as {p.roleLabel}
        {p.membershipExpiresAt ? `, until ${formatDay(p.membershipExpiresAt)}` : ''}.
      </Text>
      {p.emailMatches ? (
        <Button
          label={`Join ${p.firmName}`}
          loading={join.isPending}
          disabled={join.isPending}
          onPress={() => join.mutate()}
        />
      ) : (
        <>
          <FormAlert
            tone="warning"
            message={`It was sent to ${p.email}. Sign in with that account to accept it.`}
          />
          <Button
            label="Sign out and switch account"
            variant="secondary"
            onPress={() => signOut()}
          />
        </>
      )}
    </Card>
  );
}
