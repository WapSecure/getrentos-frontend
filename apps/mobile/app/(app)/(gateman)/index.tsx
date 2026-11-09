import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock,
  CloudOff,
  IdCard,
  KeyRound,
  MapPin,
  Mic,
  ScanLine,
  UserPlus,
  XCircle,
} from '@sureground/icons/native';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  OtpInput,
  Screen,
  SectionHeader,
  Skeleton,
  Text,
  useTheme,
  useToast,
  SwitchRow,
} from '@sureground/ui-native';
import { QrScannerSheet } from '@/components/gateman/QrScannerSheet';
import { PostSwitcherSheet } from '@/components/gateman/PostSwitcherSheet';
import { WalkInSheet } from '@/components/gateman/WalkInSheet';
import { useGateVoice } from '@/components/gateman/useGateVoice';
import { digitsFromSpeech } from '@sureground/shared';
import { useVoiceInput } from '@/lib/voice';
import { IdDocumentSheet } from '@/components/gateman/IdDocumentSheet';
import { WatchlistBlockedSheet } from '@/components/gateman/WatchlistBlockedSheet';
import { WatchlistWarning } from '@/components/gateman/WatchlistWarning';
import { ApiError, errorMessage } from '@/lib/api/client';
import { readWatchlistRefusal, type WatchlistRefusal } from '@/lib/gateman/watchlistRefusal';
import { describeStandingPass } from '@/lib/gateman/standingPass';
import { useGatemanPost } from '@/lib/gateman/GatemanPostProvider';
import { gatemanApi, type VisitorPass } from '@/lib/api/gateman';
import { gateOfflineQueue, replayGateQueue, useGateQueue } from '@/lib/gateOfflineQueue';
import { qk } from '@/lib/query/keys';
import { formatTime } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export default function GatemanCheckIn() {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const [pin, setPin] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [idSheetFor, setIdSheetFor] = useState<{
    passId: string;
    visitorName: string;
  } | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    pass?: VisitorPass;
    error?: string;
    queued?: string;
    requested?: string;
    /** Not a failure: the visitor was admitted, so don't present it as one. */
    warning?: string;
  } | null>(null);

  const queue = useGateQueue();

  /** Kept whole so an override resends exactly what was refused, never a re-derived write that could hit a different visitor. */
  const [blocked, setBlocked] = useState<{
    refusal: WatchlistRefusal;
    write: { kind: 'check-in'; code: string } | { kind: 'admit'; pass: VisitorPass };
  } | null>(null);
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const gateVoice = useGateVoice(result, blocked?.refusal.message ?? null);
  const checkInRef = useRef<((code: string) => void) | null>(null);
  const voicePin = useVoiceInput('en', (heard) => {
    const digits = digitsFromSpeech(heard).slice(0, 6);
    setResult(null);
    setPin(digits);
    if (digits.length === 6) checkInRef.current?.(digits);
  });

  const {
    estate,
    gate,
    gates,
    needsGateChoice,
    isLoading: isPostLoading,
    isError,
    refetch,
    isRefetching,
  } = useGatemanPost();
  const [postSheetOpen, setPostSheetOpen] = useState(false);

  const checkInsQuery = useQuery({
    queryKey: qk.gateman.visitorsInside(estate?.id ?? ''),
    queryFn: () => gatemanApi.listVisitorPasses(estate!.id, 'checked_in', 1, 100),
    enabled: !!estate,
  });

  // Polled: the household answers on their own phone. Not filtered, so a refused or lapsed request doesn't vanish from the guard's screen.
  const walkInsQuery = useQuery({
    queryKey: qk.gateman.walkIns(estate?.id ?? ''),
    queryFn: () => gatemanApi.listWalkIns(estate!.id, 1, 50),
    enabled: !!estate,
    refetchInterval: 15_000,
  });

  const verify = useMutation({
    mutationFn: ({ code, overrideReason }: { code: string; overrideReason?: string }) =>
      gatemanApi.verifyVisitorPass(estate!.id, code, { gateId: gate?.id, overrideReason }),
    onSuccess: (pass) => {
      setResult({ pass, warning: pass.watchlistWarning });
      setBlocked(null);
      setOverrideError(null);
      setPin('');
      void haptics.success();
      if (estate) void qc.invalidateQueries({ queryKey: qk.gateman.visitorsInside(estate.id) });
    },
    onError: async (error, input) => {
      // A watch-list refusal is neither a fault nor a connection problem: resending gives the same answer; only an override with a reason changes it.
      const refusal = readWatchlistRefusal(error);
      if (refusal) {
        setResult(null);
        setOverrideError(null);
        setBlocked({ refusal, write: { kind: 'check-in', code: input.code } });
        void haptics.error();
        return;
      }

      // No signal: the resident already approved, so record the arrival on the device and send it later.
      // Never queue an override: the queue carries no reason, so a replay would refuse someone the guard admitted.
      if (!input.overrideReason && error instanceof ApiError && error.isNetwork && estate) {
        await gateOfflineQueue.enqueue('check-in', {
          estateId: estate.id,
          pin: input.code,
          occurredAt: new Date().toISOString(),
          gateId: gate?.id,
          label: `PIN ${input.code}`,
        });
        setResult({ queued: `PIN ${input.code}` });
        setPin('');
        void haptics.success();
        return;
      }

      const message = errorMessage(error, 'Could not verify that code.');
      if (input.overrideReason) {
        setOverrideError(message);
        return;
      }
      setResult({ error: message });
      void haptics.error();
    },
  });

  useEffect(() => {
    checkInRef.current = (code) => {
      if (verify.isPending) return;
      setBlocked(null);
      verify.mutate({ code });
    };
  }, [verify]);

  const checkOut = useMutation({
    mutationFn: (pass: VisitorPass) =>
      gatemanApi.checkOutVisitorPass(estate!.id, pass.id, { gateId: gate?.id }),
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
          gateId: gate?.id,
          label: `${pass.visitorName} (${pass.unitLabel})`,
        });
        void haptics.success();
        toast.show(`${pass.visitorName} checked out: saved, will send when back online.`, 'info');
        return;
      }
      void haptics.error();
      toast.show(errorMessage(error, 'Could not check that visitor out.'), 'error');
    },
  });

  const admit = useMutation({
    mutationFn: ({ pass, overrideReason }: { pass: VisitorPass; overrideReason?: string }) =>
      gatemanApi.admitWalkIn(estate!.id, pass.id, { gateId: gate?.id, overrideReason }),
    onSuccess: (pass) => {
      void haptics.success();
      setResult({ pass, warning: pass.watchlistWarning });
      setBlocked(null);
      setOverrideError(null);
      toast.show(`${pass.visitorName} admitted.`, 'success');
      if (estate) {
        void qc.invalidateQueries({ queryKey: qk.gateman.visitorsInside(estate.id) });
        void qc.invalidateQueries({ queryKey: qk.gateman.walkIns(estate.id) });
      }
    },
    onError: async (error, input) => {
      const refusal = readWatchlistRefusal(error);
      if (refusal) {
        setResult(null);
        setOverrideError(null);
        setBlocked({ refusal, write: { kind: 'admit', pass: input.pass } });
        void haptics.error();
        return;
      }

      // Offline: queue the admit rather than make the visitor wait, but never an override (see check-in above).
      if (!input.overrideReason && error instanceof ApiError && error.isNetwork && estate) {
        await gateOfflineQueue.enqueue('admit', {
          estateId: estate.id,
          passId: input.pass.id,
          occurredAt: new Date().toISOString(),
          gateId: gate?.id,
          label: `${input.pass.visitorName} (${input.pass.unitLabel})`,
        });
        void haptics.success();
        toast.show(
          `${input.pass.visitorName} admitted: saved, will send when back online.`,
          'info'
        );
        return;
      }

      const message = errorMessage(error, 'Could not admit that visitor.');
      if (input.overrideReason) {
        setOverrideError(message);
        return;
      }
      void haptics.error();
      toast.show(message, 'error');
    },
  });

  const cancelWalkIn = useMutation({
    mutationFn: (pass: VisitorPass) => gatemanApi.cancelWalkIn(estate!.id, pass.id),
    onSuccess: () => {
      if (estate) void qc.invalidateQueries({ queryKey: qk.gateman.walkIns(estate.id) });
    },
    onError: (error) => {
      toast.show(errorMessage(error, 'Could not cancel that request.'), 'error');
    },
  });

  // Everyone on the estate, not just today's arrivals: a visitor from yesterday who never checked out must show.
  // Queued departures are hidden by deriving from the queue, not patching the cache, so a refresh can't bring them back.
  const leaving = new Set(
    queue
      .filter(
        (write): write is Extract<typeof write, { type: 'check-out' }> => write.type === 'check-out'
      )
      .map((write) => write.payload.passId)
  );
  const inside = (checkInsQuery.data?.items ?? []).filter((pass) => !leaving.has(pass.id));

  // Queued admits are hidden so a guard offline can't admit the same visitor twice and replay into a conflict.
  const admitting = new Set(
    queue
      .filter((write): write is Extract<typeof write, { type: 'admit' }> => write.type === 'admit')
      .map((write) => write.payload.passId)
  );

  const DECISION_VISIBLE_MS = 30 * 60 * 1000;

  const walkIns = walkInsQuery.data?.items ?? [];
  const stillOpen = (pass: VisitorPass) => !admitting.has(pass.id) && !leaving.has(pass.id);

  const awaiting = walkIns.filter((pass) => pass.status === 'awaiting_approval' && stillOpen(pass));
  const readyToAdmit = walkIns.filter((pass) => pass.status === 'approved' && stillOpen(pass));
  // Measured from the fetch time, not `Date.now()`: reading the clock in render is impure and two passes could disagree.
  const asOf = walkInsQuery.dataUpdatedAt;
  const decided = asOf
    ? walkIns.filter(
        (pass) =>
          (pass.status === 'denied' || pass.status === 'expired') &&
          asOf - new Date(pass.respondedAt ?? pass.expiresAt).getTime() < DECISION_VISIBLE_MS
      )
    : [];

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

  const handleScan = (scanned: string) => {
    setScannerOpen(false);
    setResult(null);
    setBlocked(null);
    setPin(scanned);
    verify.mutate({ code: scanned });
  };

  const standingPassNote = result?.pass ? describeStandingPass(result.pass) : null;
  // A local, because TypeScript won't carry a narrowing of `result` state into the onPress closure.
  const checkedInPass = result?.pass ?? null;

  if (isPostLoading) {
    return (
      <Screen>
        <View style={{ gap: spacing.md, marginTop: spacing['6xl'] }}>
          <Skeleton height={120} radius={16} />
          <Skeleton height={64} radius={16} />
        </View>
      </Screen>
    );
  }

  // A failed refresh with a posting already known leaves the console working.
  if (isError && !estate) {
    return (
      <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
        <ErrorState
          title="We couldn't load your gate assignment"
          description="Check your connection and try again. Offline check-ins already stored on this device remain safe."
          onRetry={refetch}
        />
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
    setBlocked(null);
    verify.mutate({ code: pin });
  };

  const overrideWatchlist = (reason: string) => {
    if (!blocked) return;
    setOverrideError(null);
    if (blocked.write.kind === 'check-in') {
      verify.mutate({ code: blocked.write.code, overrideReason: reason });
      return;
    }
    admit.mutate({ pass: blocked.write.pass, overrideReason: reason });
  };

  return (
    <>
      <Screen
        refreshing={checkInsQuery.isRefetching}
        onRefresh={() => void checkInsQuery.refetch()}
      >
        <DashboardHeader
          eyebrow="Gate operations"
          title={estate.name}
          subtitle="Scan the visitor's QR code, or enter their 6-digit PIN."
          accessory={
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.accent,
              }}
            >
              <KeyRound size={22} color={colors.primary} />
            </View>
          }
        />

        <View style={{ alignItems: 'center' }}>
          <Pressable
            onPress={() => setPostSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Change your estate or gate"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: 999,
              backgroundColor: colors.accent,
            }}
          >
            <MapPin size={14} color={colors.primary} />
            <Text variant="caption" style={{ color: colors.primary }}>
              {gate
                ? gate.name
                : gates.length === 0
                  ? 'No gates named'
                  : `${gates.length} gates: tap to say which`}
            </Text>
          </Pressable>
        </View>

        {/* Left unpicked rather than guessed: a confident wrong gate is worse than a missing one. */}
        {needsGateChoice ? (
          <Card elevated>
            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <MapPin size={20} color={colors.destructive} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">Which gate are you at?</Text>
                  <Text variant="caption" color="mutedForeground">
                    This estate has {gates.length} gates. Entries you record will not be attributed
                    to one until you pick, so the estate cannot tell where someone came through.
                  </Text>
                </View>
              </View>
              <Button label="Choose my gate" fullWidth onPress={() => setPostSheetOpen(true)} />
            </View>
          </Card>
        ) : null}

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
            {voicePin.available ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={voicePin.listening ? 'Stop listening' : 'Say the PIN'}
                onPress={() => (voicePin.listening ? voicePin.stop() : void voicePin.start())}
                hitSlop={8}
              >
                <Mic size={18} color={voicePin.listening ? colors.destructive : colors.primary} />
              </Pressable>
            ) : null}
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
            label="Check in"
            loadingLabel="Checking…"
            loading={verify.isPending}
            fullWidth
            disabled={pin.length !== 6}
            onPress={submit}
            style={{ marginTop: spacing.lg }}
          />

          {voicePin.error ? (
            <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.xs }}>
              {voicePin.error}
            </Text>
          ) : null}
          <SwitchRow
            label="Speak results"
            description="Hear who is checked in, or why not, while you watch the visitor."
            value={gateVoice.enabled}
            onValueChange={gateVoice.toggle}
          />

          <Button
            label="Visitor with no pass"
            variant="outline"
            fullWidth
            icon={<UserPlus size={16} color={colors.foreground} />}
            disabled={verify.isPending}
            onPress={() => {
              setResult(null);
              setBlocked(null);
              setWalkInOpen(true);
            }}
            style={{ marginTop: spacing.sm }}
          />
        </Card>

        {checkedInPass ? (
          <Card elevated>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <CheckCircle2 size={22} color={colors.success} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong" style={{ color: colors.success }}>
                  Checked in
                </Text>
                <Text variant="body">
                  {checkedInPass.visitorName} → {checkedInPass.unitLabel}
                </Text>
                <Text variant="caption" color="mutedForeground">
                  Hosted by {checkedInPass.residentName}
                </Text>
                {standingPassNote ? (
                  <Text variant="caption" color="mutedForeground">
                    {standingPassNote}
                  </Text>
                ) : null}
                <View style={{ marginTop: spacing.sm }}>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<IdCard size={16} />}
                    label="Identity document"
                    onPress={() =>
                      setIdSheetFor({
                        passId: checkedInPass.id,
                        visitorName: checkedInPass.visitorName,
                      })
                    }
                  />
                </View>
              </View>
            </View>
          </Card>
        ) : null}

        {result?.requested ? (
          <Card elevated>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Clock size={22} color={colors.mutedForeground} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">Asked the household</Text>
                <Text variant="caption" color="mutedForeground">
                  {result.requested}
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        {result?.warning ? <WatchlistWarning warning={result.warning} /> : null}

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
                  label="Send now"
                  loadingLabel="Sending…"
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

        {awaiting.length > 0 || readyToAdmit.length > 0 || decided.length > 0 ? (
          <View style={{ gap: spacing.md }}>
            <SectionHeader
              title="At the gate"
              description="Requests that need a clear decision now"
            />

            {decided.map((pass) => {
              const refused = pass.status === 'denied';
              return (
                <Card key={pass.id} elevated>
                  <View style={{ flexDirection: 'row', gap: spacing.md }}>
                    <XCircle size={20} color={colors.destructive} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong">{pass.visitorName}</Text>
                      <Text variant="caption" color="mutedForeground">
                        {pass.unitLabel} · {pass.residentName}
                      </Text>
                      <Text variant="caption" style={{ color: colors.destructive }}>
                        {refused ? 'Refused: do not admit them.' : 'No answer: do not admit them.'}
                      </Text>
                      {refused && pass.denialReason ? (
                        <Text variant="caption" color="mutedForeground">
                          Reason: {pass.denialReason}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </Card>
              );
            })}

            {readyToAdmit.map((pass) => (
              <Card key={pass.id} elevated>
                <View style={{ gap: spacing.sm }}>
                  <View style={{ flexDirection: 'row', gap: spacing.md }}>
                    <CheckCircle2 size={20} color={colors.success} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong">{pass.visitorName}</Text>
                      <Text variant="caption" color="mutedForeground">
                        {pass.unitLabel} · {pass.residentName}
                      </Text>
                      <Text variant="caption" style={{ color: colors.success }}>
                        Approved
                        {pass.respondedAt ? ` at ${formatTime(pass.respondedAt)}` : ''}: let them in
                      </Text>
                    </View>
                  </View>
                  <Button
                    label="Admit"
                    fullWidth
                    loading={admit.isPending && admit.variables?.pass.id === pass.id}
                    onPress={() => admit.mutate({ pass })}
                  />
                </View>
              </Card>
            ))}

            {awaiting.map((pass) => (
              <Card key={pass.id}>
                <View style={{ gap: spacing.sm }}>
                  <View style={{ flexDirection: 'row', gap: spacing.md }}>
                    <Clock size={20} color={colors.mutedForeground} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong">{pass.visitorName}</Text>
                      <Text variant="caption" color="mutedForeground">
                        {pass.unitLabel} · asked {formatTime(pass.createdAt)}
                      </Text>
                      <Text variant="caption" color="mutedForeground">
                        Waiting for {pass.residentName} to answer. If nobody does by{' '}
                        {formatTime(pass.expiresAt)}, they cannot be admitted.
                      </Text>
                    </View>
                  </View>
                  <Button
                    label="Cancel request"
                    variant="outline"
                    size="sm"
                    fullWidth={false}
                    loading={cancelWalkIn.isPending && cancelWalkIn.variables?.id === pass.id}
                    onPress={() => cancelWalkIn.mutate(pass)}
                  />
                </View>
              </Card>
            ))}
          </View>
        ) : null}

        <View style={{ gap: spacing.md }}>
          <SectionHeader
            title={`Inside now${inside.length > 0 ? ` (${inside.length})` : ''}`}
            description="Visitors currently recorded on the estate"
          />
          {checkInsQuery.isLoading ? (
            <Skeleton height={64} radius={16} />
          ) : inside.length === 0 ? (
            <EmptyState
              icon={<KeyRound size={28} color={colors.mutedForeground} />}
              title="The estate is clear"
              description="Checked-in visitors will appear here."
            />
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
                    loading={checkOut.isPending && checkOut.variables?.id === pass.id}
                    onPress={() => checkOut.mutate(pass)}
                  />
                </View>
              </Card>
            ))
          )}
        </View>
      </Screen>

      {/* Remount on open: the scanner latches after one read, and resetting it in an effect trips react-hooks/set-state-in-effect. */}
      <QrScannerSheet
        key={`scanner-${scannerOpen ? 'open' : 'closed'}`}
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />

      {estate ? (
        <PostSwitcherSheet open={postSheetOpen} onClose={() => setPostSheetOpen(false)} />
      ) : null}

      {blocked ? (
        <WatchlistBlockedSheet
          open
          onClose={() => {
            setBlocked(null);
            setOverrideError(null);
            setPin('');
          }}
          message={blocked.refusal.message}
          matches={blocked.refusal.matches}
          onOverride={overrideWatchlist}
          isOverriding={verify.isPending || admit.isPending}
          error={overrideError}
        />
      ) : null}

      {/* Remount on open rather than reset in an effect (react-hooks/set-state-in-effect); the prefixed key stops the two sibling sheets colliding. */}
      {estate ? (
        <WalkInSheet
          key={`walk-in-${walkInOpen ? 'open' : 'closed'}`}
          open={walkInOpen}
          onClose={() => setWalkInOpen(false)}
          estateId={estate.id}
          gateId={gate?.id}
          onRaised={(pass) =>
            // Worded without promising approval: the card stays up even after a refusal.
            setResult({
              requested: `${pass.visitorName} is waiting on ${pass.unitLabel}. ${pass.residentName}'s answer appears under "At the gate".`,
              warning: pass.watchlistWarning,
            })
          }
        />
      ) : null}

      {/* A sibling of the pass card so a result re-render can't tear it down mid-capture; keyed on the pass so it remounts per visitor. */}
      {estate && idSheetFor ? (
        <IdDocumentSheet
          key={`id-check-${idSheetFor.passId}`}
          open
          onClose={() => setIdSheetFor(null)}
          estateId={estate.id}
          passId={idSheetFor.passId}
          visitorName={idSheetFor.visitorName}
        />
      ) : null}
    </>
  );
}
