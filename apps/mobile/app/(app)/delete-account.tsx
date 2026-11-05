import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trash2 } from 'lucide-react-native';
import { Button, FormAlert, Text, TextField, useTheme } from '@getrentos/ui-native';
import { DELETE_PHRASE, deletePhraseOk, renterHomeApi } from '@/lib/api/renterHome';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

/** Permanently deletes a renter account (web: renter settings, AccountDeletion). */
export default function DeleteAccount() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const [phrase, setPhrase] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const remove = useMutation({
    mutationFn: () => renterHomeApi.deleteAccount(password),
    onSuccess: () => {
      Alert.alert('Account deleted', 'Your account has been deleted. We’re sorry to see you go.', [
        { text: 'OK', onPress: () => signOut() },
      ]);
    },
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : 'Could not delete your account. Try again.'),
  });
  const ready = deletePhraseOk(phrase) && password.length > 0;
  const confirm = () =>
    Alert.alert(
      'Delete your account for good?',
      'This cannot be undone. Your applications, payments, messages and leases will be deleted.',
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
        subtitle="Permanently remove your account and data"
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
          title="This is permanent"
          message="All your data, including applications, payments, messages and lease agreements, is deleted and cannot be recovered."
        />
        <Text variant="callout" color="mutedForeground">
          If you only want a break, sign out instead. If you owe rent or have an active lease, talk
          to your landlord first.
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
