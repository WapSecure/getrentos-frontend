import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, KeyRound, ScanLine, XCircle } from 'lucide-react-native';
import {
  Button,
  Card,
  EmptyState,
  OtpInput,
  Screen,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { QrScannerSheet } from '@/components/gateman/QrScannerSheet';
import { gatemanApi, type VisitorPass } from '@/lib/api/gateman';
import { qk } from '@/lib/query/keys';
import { formatTime } from '@/lib/format';
import { haptics } from '@/lib/haptics';

export default function GatemanCheckIn() {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const [pin, setPin] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [result, setResult] = useState<{ pass?: VisitorPass; error?: string } | null>(null);

  const estateQuery = useQuery({
    queryKey: qk.gateman.myEstate,
    queryFn: () => gatemanApi.getMyEstate(),
  });
  const estate = estateQuery.data ?? null;

  const checkInsQuery = useQuery({
    queryKey: qk.gateman.visitorsInside(estate?.id ?? ''),
    queryFn: () => gatemanApi.listVisitorPasses(estate!.id, 'checked_in', 1, 100),
    enabled: !!estate,
  });

  const verify = useMutation({
    mutationFn: (code: string) => gatemanApi.verifyVisitorPass(estate!.id, code),
    onSuccess: (pass) => {
      setResult({ pass });
      setPin('');
      void haptics.success();
      if (estate) void qc.invalidateQueries({ queryKey: qk.gateman.visitorsInside(estate.id) });
    },
    onError: (error) => {
      setResult({ error: error instanceof Error ? error.message : 'Could not verify that code.' });
      void haptics.error();
    },
  });

  const checkOut = useMutation({
    mutationFn: (passId: string) => gatemanApi.checkOutVisitorPass(estate!.id, passId),
    onSuccess: (pass) => {
      void haptics.success();
      toast.show(`${pass.visitorName} checked out.`, 'success');
      if (estate) void qc.invalidateQueries({ queryKey: qk.gateman.visitorsInside(estate.id) });
    },
    onError: (error) => {
      void haptics.error();
      toast.show(
        error instanceof Error ? error.message : 'Could not check that visitor out.',
        'error'
      );
    },
  });

  // Everyone currently on the estate, not just today's arrivals: a visitor who
  // arrived yesterday and never checked out is exactly the case this list exists
  // to surface.
  const inside = checkInsQuery.data?.items ?? [];

  /**
   * A scan hands back the same PIN the keypad would have collected, so check
   * the visitor straight in — no extra tap while a car waits at the barrier.
   */
  const handleScan = (scanned: string) => {
    setScannerOpen(false);
    setResult(null);
    setPin(scanned);
    verify.mutate(scanned);
  };

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
    <>
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
            Scan the visitor&apos;s QR code, or enter their 6-digit PIN.
          </Text>
        </View>

        <Card elevated>
          <Button
            label="Scan QR code"
            variant="outline"
            fullWidth
            icon={<ScanLine size={16} color={colors.foreground} />}
            disabled={verify.isPending}
            onPress={() => setScannerOpen(true)}
          />

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              marginVertical: spacing.lg,
            }}
          >
            <View
              style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border }}
            />
            <Text variant="caption" color="mutedForeground">
              or enter the PIN
            </Text>
            <View
              style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border }}
            />
          </View>

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
            Inside now{inside.length > 0 ? ` (${inside.length})` : ''}
          </Text>
          {checkInsQuery.isLoading ? (
            <Skeleton height={64} radius={16} />
          ) : inside.length === 0 ? (
            <Card>
              <Text variant="caption" color="mutedForeground">
                No visitors are on the estate right now.
              </Text>
            </Card>
          ) : (
            inside.map((pass) => (
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
                    <Text variant="caption" color="mutedForeground">
                      In since {pass.checkedInAt ? formatTime(pass.checkedInAt) : '—'}
                    </Text>
                  </View>
                  <Button
                    label="Check out"
                    variant="outline"
                    size="sm"
                    fullWidth={false}
                    loading={checkOut.isPending}
                    onPress={() => checkOut.mutate(pass.id)}
                  />
                </View>
              </Card>
            ))
          )}
        </View>
      </Screen>

      {/* Remount on open: the scanner latches after one read, and resetting that
          from an effect would trip react-hooks/set-state-in-effect. */}
      <QrScannerSheet
        key={scannerOpen ? 'open' : 'closed'}
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />
    </>
  );
}
