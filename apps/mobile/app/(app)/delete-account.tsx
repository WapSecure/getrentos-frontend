import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trash2 } from '@sureground/icons/native';
import { Button, FormAlert, Text, TextField, useTheme } from '@sureground/ui-native';
import { DELETE_PHRASE, deletePhraseOk } from '@/lib/api/renterHome';
import { securityApi } from '@/lib/api/security';
import { errorMessage } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

export default function DeleteAccount() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const [phrase, setPhrase] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const remove = useMutation({
    mutationFn: () => securityApi.deactivate(password),
    onSuccess: () => {
      Alert.alert('Account closed', 'Your account has been closed. We’re sorry to see you go.', [
        { text: 'OK', onPress: () => signOut() },
      ]);
    },
    onError: (e) => setError(errorMessage(e, 'Could not delete your account. Try again.')),
  });
  const ready = deletePhraseOk(phrase) && password.length > 0;
  const confirm = () =>
    Alert.alert(
      'Close your account?',
      'You will be signed out and your account closed straight away.',
      [
        { text: 'Keep my account', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setError(null);
            remove.mutate();
          },
        },
      ]
    );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Account"
        title="Delete account"
        subtitle="Close your Sureground account"
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
        <FormAlert
          tone="error"
          title="What happens"
          message="We’ll close your account and remove your profile from Sureground. Some records are kept where the law requires, such as payments and identity checks."
        />
        <Text variant="callout" color="mutedForeground">
          If you only want a break, sign out instead. If money is still owed to you or by you, or a
          lease, sale or booking is in progress, settle it first.
        </Text>
        <TextField
          label={`Type “${DELETE_PHRASE}” to confirm`}
          value={phrase}
          onChangeText={setPhrase}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextField
          label="Your password"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setError(null);
          }}
          secure
          error={error}
        />
        <Button
          label="Delete my account"
          variant="destructive"
          icon={<Trash2 size={16} color={colors.destructiveForeground} />}
          loading={remove.isPending}
          disabled={!ready || remove.isPending}
          onPress={confirm}
        />
      </ScrollView>
    </View>
  );
}
