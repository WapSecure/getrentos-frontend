import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck } from 'lucide-react-native';
import {
  Avatar,
  Button,
  Card,
  ErrorState,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { buyerApi, type BuyerProfile as BuyerProfileData } from '@/lib/api/buyer';
import { ApiError } from '@/lib/api/client';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

export default function BuyerProfileScreen() {
  const { colors, spacing } = useTheme();
  const query = useQuery({ queryKey: qk.buyer.profile, queryFn: buyerApi.profile });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Buyer account"
        title="Profile"
        subtitle="Identity and contact details"
        onBack={() => router.back()}
      />

      {query.isLoading ? (
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          <Skeleton height={220} radius={16} />
        </View>
      ) : query.isError || !query.data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <ProfileForm data={query.data} />
      )}
    </View>
  );
}

function ProfileForm({ data }: { data: BuyerProfileData }) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const [legalName, setLegalName] = useState(data.legalName ?? '');
  const [phone, setPhone] = useState(data.phone ?? '');

  const mutation = useMutation({
    mutationFn: () =>
      buyerApi.updateProfile({ legalName: legalName.trim(), phone: phone.trim() || undefined }),
    onSuccess: (updated) => {
      qc.setQueryData(qk.buyer.profile, updated);
      toast.show('Profile saved.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not save your profile.', 'error'),
  });

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.lg,
      }}
    >
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <Avatar name={data.legalName} size={72} />
        <Text variant="callout" color="mutedForeground">
          {data.email}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <ShieldCheck size={14} color={colors.success} />
          <Text variant="caption" style={{ color: colors.success }}>
            {data.verificationStatus} · Trust score {data.trustScore}
          </Text>
        </View>
      </View>

      <Card elevated style={{ gap: spacing.md }}>
        <TextField label="Full name" value={legalName} onChangeText={setLegalName} />
        <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      </Card>

      <Button
        label="Save"
        loading={mutation.isPending}
        disabled={!legalName.trim()}
        onPress={() => mutation.mutate()}
      />
    </ScrollView>
  );
}
