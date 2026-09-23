import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, CloudOff, KeyRound, ScanLine, XCircle } from 'lucide-react-native';
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
import { ApiError } from '@/lib/api/client';
import { gatemanApi, type VisitorPass } from '@/lib/api/gateman';
import { gateOfflineQueue, replayGateQueue, useGateQueue } from '@/lib/gateOfflineQueue';
import { qk } from '@/lib/query/keys';
import { formatTime } from '@/lib/format';
import { haptics } from '@/lib/haptics';

export default function GatemanCheckIn() {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const [pin, setPin] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    pass?: VisitorPass;
    error?: string;
    /** Set when a write was recorded on the device instead of the estate. */
    queued?: string;
  } | null>(null);

  const queue = useGateQueue();

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
    onError: async (error, code) => {
      // No signal at the barrier. The visitor is standing there and the resident
      // has already approved them, so refusing the entry would be the wrong
      // answer — record the arrival on the device and send it later.
      if (error instanceof ApiError && error.isNetwork && estate) {
        await gateOfflineQueue.enqueue('check-in', {
          estateId: estate.id,
          pin: code,
          occurredAt: new Date().toISOString(),
          label: `PIN ${code}`,
        });
        setResult({ queued: `PIN ${code}` });
        setPin('');
        void haptics.success();
        return;
      }
      setResult({ error: error instanceof Error ? error.message : 'Could not verify that code.' });
      void haptics.error();
    },
  });

  const checkOut = useMutation({
    mutationFn: (pass: VisitorPass) => gatemanApi.checkOutVisitorPass(estate!.id, pass.id),
    onSuccess: (pass) => {
      void haptics.success();
      toast.show(`${pass.visitorName} checked out.`, 'success');
      if (estate) void qc.invalidateQueries({ queryKey: qk.gateman.visitorsInside(estate.id) });
    },
    onError: async (error, pass) => {
      if (error instanceof ApiError && error.isNetwork && estate) {
        await gateOfflineQueue.enqueue('check-out', {
          estateId: estate.id,
          passId: pass.id,
          occurredAt: new Date().toISOString(),
          label: `${pass.visitorName} (${pass.unitLabel})`,
        });
        void haptics.success();
        toast.show(`${pass.visitorName} checked out — saved, will send when back online.`, 'info');
        return;
      }
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
  //
  // Departures waiting in the queue are hidden, because at the gate they have
  // left. Deriving that from the queue rather than patching the query cache
  // means the list stays right even after a pull-to-refresh, and the visitor
  // reappears on its own only if the write is one the estate never accepted.
  const leaving = new Set(
    queue
      .filter(
        (write): write is Extract<typeof write, { type: 'check-out' }> => write.type === 'check-out'
      )
      .map((write) => write.payload.passId)
  );
  const inside = (checkInsQuery.data?.items ?? []).filter((pass) => !leaving.has(pass.id));

  /** Manual drain, for a guard who can see a signal the phone hasn't noticed. */
  const sendNow = async () => {
    setSending(true);
    try {
      const summary = await replayGateQueue();
      if (estate) void qc.invalidateQueries({ queryKey: qk.gateman.visitorsInside(estate.id) });
      if (!summary) return;
      if (summary.sent > 0) toast.show(`Sent ${summary.sent} to the estate.`, 'success');
      else if (summary.remaining > 0) toast.show('Still no connection.', 'error');
    } finally {
      setSending(false);
    }
  };

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

        {result?.queued ? (
          <Card elevated>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <CloudOff size={22} color={colors.mutedForeground} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">Saved on this phone</Text>
                <Text variant="caption" color="mutedForeground">
                  {result.queued} could not reach the estate, so it is stored here and will be sent
                  automatically once there is a signal. The visitor can go through.
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

        {/* The queue is shown here, where a guard acts, rather than as a banner
            over the whole app. It lists what is waiting so nothing is a mystery:
            each line is a real arrival or departure that the estate hasn't been
            told about yet. */}
        {queue.length > 0 ? (
          <Card elevated>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <CloudOff size={22} color={colors.mutedForeground} />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <Text variant="bodyStrong">Waiting to send ({queue.length})</Text>
                <Text variant="caption" color="mutedForeground">
                  Saved on this phone. They go to the estate as soon as there is a signal.
                </Text>
                {queue.map((write) => (
                  <Text key={write.id} variant="caption" color="mutedForeground">
                    {write.type === 'check-in' ? 'Arrival' : 'Departure'} · {write.payload.label} ·{' '}
                    {formatTime(write.createdAt)}
                  </Text>
                ))}
                <Button
                  label={sending ? 'Sending…' : 'Send now'}
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  loading={sending}
                  onPress={() => void sendNow()}
                  style={{ marginTop: spacing.xs }}
                />
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
                    onPress={() => checkOut.mutate(pass)}
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
