import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, KeyRound, XCircle } from 'lucide-react-native';
import {
  Button,
  Card,
  EmptyState,
  OtpInput,
  Screen,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { gatemanApi, type VisitorPass } from '@/lib/api/gateman';
import { qk } from '@/lib/query/keys';
import { formatTime } from '@/lib/format';
import { haptics } from '@/lib/haptics';

const isToday = (value?: string) =>
  !!value && new Date(value).toDateString() === new Date().toDateString();

export default function GatemanCheckIn() {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();

  const [pin, setPin] = useState('');
  const [result, setResult] = useState<{ pass?: VisitorPass; error?: string } | null>(null);

  const estateQuery = useQuery({
    queryKey: qk.gateman.myEstate,
    queryFn: () => gatemanApi.getMyEstate(),
  });
  const estate = estateQuery.data ?? null;

  const checkInsQuery = useQuery({
    queryKey: qk.gateman.todaysCheckIns(estate?.id ?? ''),
    queryFn: () => gatemanApi.listVisitorPasses(estate!.id, 'checked_in', 1, 100),
    enabled: !!estate,
  });

  const verify = useMutation({
    mutationFn: (code: string) => gatemanApi.verifyVisitorPass(estate!.id, code),
    onSuccess: (pass) => {
      setResult({ pass });
      setPin('');
      void haptics.success();
      if (estate) void qc.invalidateQueries({ queryKey: qk.gateman.todaysCheckIns(estate.id) });
    },
    onError: (error) => {
      setResult({ error: error instanceof Error ? error.message : 'Could not verify that code.' });
      void haptics.error();
    },
  });

  const todaysCheckIns = (checkInsQuery.data?.items ?? []).filter((p) => isToday(p.checkedInAt));

  if (estateQuery.isLoading) {
    return (
      <Screen>
        <View style={{ gap: spacing.md, marginTop: spacing['6xl'] }}>
          <Skeleton height={120} radius={16} />
          <Skeleton height={64} radius={16} />
        </View>
      </Screen>
    );
  }

  if (!estate) {
    return (
      <Screen>
        <EmptyState
          icon={<KeyRound size={34} color={colors.mutedForeground} />}
          title="No gate assigned yet"
          description="Your estate manager hasn't posted you to a gate. Ask them to invite you, then pull down to refresh."
        />
      </Screen>
    );
  }

  const submit = () => {
    if (pin.length !== 6 || verify.isPending) return;
    setResult(null);
    verify.mutate(pin);
  };

  return (
    <Screen refreshing={checkInsQuery.isRefetching} onRefresh={checkInsQuery.refetch}>
      <View style={{ alignItems: 'center', gap: spacing.xs, marginTop: spacing.md }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.accent,
            marginBottom: spacing.xs,
          }}
        >
          <KeyRound size={26} color={colors.primary} />
        </View>
        <Text variant="title" center>
          {estate.name}
        </Text>
        <Text variant="callout" color="mutedForeground" center>
          Enter the visitor&apos;s 6-digit PIN to check them in.
        </Text>
      </View>

      <Card elevated>
        <OtpInput
          value={pin}
          onChange={(next) => {
            setResult(null);
            setPin(next);
          }}
          length={6}
          disabled={verify.isPending}
          onComplete={submit}
        />
        <Button
          label={verify.isPending ? 'Checking…' : 'Check In'}
          loading={verify.isPending}
          fullWidth
          disabled={pin.length !== 6}
          onPress={submit}
          style={{ marginTop: spacing.lg }}
        />
      </Card>

      {result?.pass ? (
        <Card elevated>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <CheckCircle2 size={22} color={colors.success} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong" style={{ color: colors.success }}>
                Checked in
              </Text>
              <Text variant="body">
                {result.pass.visitorName} → {result.pass.unitLabel}
              </Text>
              <Text variant="caption" color="mutedForeground">
                Hosted by {result.pass.residentName}
              </Text>
            </View>
          </View>
        </Card>
      ) : null}

      {result?.error ? (
        <Card elevated>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <XCircle size={22} color={colors.destructive} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong" style={{ color: colors.destructive }}>
                Not checked in
              </Text>
              <Text variant="caption" color="mutedForeground">
                {result.error}
              </Text>
            </View>
          </View>
        </Card>
      ) : null}

      <View style={{ gap: spacing.md }}>
        <Text variant="bodyStrong">
          Today&apos;s check-ins{todaysCheckIns.length > 0 ? ` (${todaysCheckIns.length})` : ''}
        </Text>
        {checkInsQuery.isLoading ? (
          <Skeleton height={64} radius={16} />
        ) : todaysCheckIns.length === 0 ? (
          <Card>
            <Text variant="caption" color="mutedForeground">
              No visitors checked in yet today.
            </Text>
          </Card>
        ) : (
          todaysCheckIns.map((pass) => (
            <Card key={pass.id} elevated>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: spacing.md,
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{pass.visitorName}</Text>
                  <Text variant="caption" color="mutedForeground">
                    {pass.unitLabel} · {pass.residentName}
                  </Text>
                </View>
                <Text variant="caption" color="mutedForeground">
                  {pass.checkedInAt ? formatTime(pass.checkedInAt) : '—'}
                </Text>
              </View>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}
