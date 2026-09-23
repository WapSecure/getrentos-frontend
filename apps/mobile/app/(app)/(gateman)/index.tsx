import { useState } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock,
  CloudOff,
  KeyRound,
  MapPin,
  ScanLine,
  UserPlus,
  XCircle,
} from 'lucide-react-native';
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
import { PostSwitcherSheet } from '@/components/gateman/PostSwitcherSheet';
import { WalkInSheet } from '@/components/gateman/WalkInSheet';
import { ApiError } from '@/lib/api/client';
import { useGatemanPost } from '@/lib/gateman/GatemanPostProvider';
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
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    pass?: VisitorPass;
    error?: string;
    /** Set when a write was recorded on the device instead of the estate. */
    queued?: string;
    /** Set when a walk-in request has just been sent to the household. */
    requested?: string;
  } | null>(null);

  const queue = useGateQueue();

  const { estate, gate, gates, needsGateChoice, isLoading: isPostLoading } = useGatemanPost();
  const [postSheetOpen, setPostSheetOpen] = useState(false);

  const checkInsQuery = useQuery({
    queryKey: qk.gateman.visitorsInside(estate?.id ?? ''),
    queryFn: () => gatemanApi.listVisitorPasses(estate!.id, 'checked_in', 1, 100),
    enabled: !!estate,
  });

  /**
   * Every gate-raised walk-in, in one read. Polled rather than pushed: the
   * household decides on their own phone whenever they look, and the guard is
   * standing at a barrier waiting for exactly that, so the panel has to update
   * without them touching anything.
   *
   * Deliberately NOT filtered to the states that still need action. A request
   * that is refused or that lapses must not simply vanish from the screen of the
   * guard holding the visitor — deciding what to show is the panel's job, and it
   * needs the answer to do it.
   */
  const walkInsQuery = useQuery({
    queryKey: qk.gateman.walkIns(estate?.id ?? ''),
    queryFn: () => gatemanApi.listWalkIns(estate!.id, 1, 50),
    enabled: !!estate,
    refetchInterval: 15_000,
  });

  const verify = useMutation({
    mutationFn: (code: string) =>
      gatemanApi.verifyVisitorPass(estate!.id, code, { gateId: gate?.id }),
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
          gateId: gate?.id,
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

  /** Opens the barrier for a walk-in the household has already approved. */
  const admit = useMutation({
    mutationFn: (pass: VisitorPass) =>
      gatemanApi.admitWalkIn(estate!.id, pass.id, { gateId: gate?.id }),
    onSuccess: (pass) => {
      void haptics.success();
      setResult({ pass });
      toast.show(`${pass.visitorName} admitted.`, 'success');
      if (estate) {
        void qc.invalidateQueries({ queryKey: qk.gateman.visitorsInside(estate.id) });
        void qc.invalidateQueries({ queryKey: qk.gateman.walkIns(estate.id) });
      }
    },
    onError: async (error, pass) => {
      // The household already consented, so this is still the guard's decision to
      // record. Only the network is missing, so queue it rather than make the
      // visitor wait for a signal.
      if (error instanceof ApiError && error.isNetwork && estate) {
        await gateOfflineQueue.enqueue('admit', {
          estateId: estate.id,
          passId: pass.id,
          occurredAt: new Date().toISOString(),
          gateId: gate?.id,
          label: `${pass.visitorName} (${pass.unitLabel})`,
        });
        void haptics.success();
        toast.show(`${pass.visitorName} admitted — saved, will send when back online.`, 'info');
        return;
      }
      void haptics.error();
      toast.show(error instanceof Error ? error.message : 'Could not admit that visitor.', 'error');
    },
  });

  const cancelWalkIn = useMutation({
    mutationFn: (pass: VisitorPass) => gatemanApi.cancelWalkIn(estate!.id, pass.id),
    onSuccess: () => {
      if (estate) void qc.invalidateQueries({ queryKey: qk.gateman.walkIns(estate.id) });
    },
    onError: (error) => {
      toast.show(
        error instanceof Error ? error.message : 'Could not cancel that request.',
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

  // Admits waiting in the queue are hidden from the walk-in panel for the same
  // reason departures are hidden from "inside now": at the gate the barrier is
  // already up. Without this a guard could admit the same visitor repeatedly
  // while offline, and every extra tap would replay into a conflict.
  const admitting = new Set(
    queue
      .filter((write): write is Extract<typeof write, { type: 'admit' }> => write.type === 'admit')
      .map((write) => write.payload.passId)
  );

  // How long a decided request stays on screen. The guard needs to read the
  // answer and turn the visitor away; after the visitor has gone it is just
  // clutter on a screen that has to stay scannable at a barrier.
  const DECISION_VISIBLE_MS = 30 * 60 * 1000;

  const walkIns = walkInsQuery.data?.items ?? [];
  const stillOpen = (pass: VisitorPass) => !admitting.has(pass.id) && !leaving.has(pass.id);

  const awaiting = walkIns.filter((pass) => pass.status === 'awaiting_approval' && stillOpen(pass));
  const readyToAdmit = walkIns.filter((pass) => pass.status === 'approved' && stillOpen(pass));
  /**
   * Answered while the guard was standing here: refused by the household, or
   * lapsed because nobody replied. Both mean "turn this visitor away", which is
   * exactly the instruction that used to disappear.
   *
   * Measured from the moment the list was fetched rather than from the clock: a
   * query response carries its own timestamp, and reading `Date.now()` during
   * render is impure — React may render twice, and the two passes would then
   * disagree about what is on screen. The list polls, so the window still moves.
   */
  const asOf = walkInsQuery.dataUpdatedAt;
  const decided = asOf
    ? walkIns.filter(
        (pass) =>
          (pass.status === 'denied' || pass.status === 'expired') &&
          asOf - new Date(pass.respondedAt ?? pass.expiresAt).getTime() < DECISION_VISIBLE_MS
      )
    : [];

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

          {/* Where this guard is, as a fact they can correct. A guard on two
              estates was previously shown the oldest one with nothing on screen
              to suggest the other existed. */}
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
                  : `${gates.length} gates — tap to say which`}
            </Text>
          </Pressable>

          <Text variant="callout" color="mutedForeground" center>
            Scan the visitor&apos;s QR code, or enter their 6-digit PIN.
          </Text>
        </View>

        {/* Entries are recorded against the gate, so an estate can answer which
            barrier a visitor came through. Left unpicked rather than guessed:
            a confident wrong gate is worse than a missing one, and only the
            guard knows which barrier they are standing at. */}
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

          {/* The visitor who has nothing arranged. Raising a request is not the
              same as letting them in — the household is asked first. */}
          <Button
            label="Visitor with no pass"
            variant="outline"
            fullWidth
            icon={<UserPlus size={16} color={colors.foreground} />}
            disabled={verify.isPending}
            onPress={() => {
              setResult(null);
              setWalkInOpen(true);
            }}
            style={{ marginTop: spacing.sm }}
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

        {/* Walk-ins live above "inside now": an approved visitor is standing at
            the barrier right now, and that is the most urgent thing on screen. */}
        {awaiting.length > 0 || readyToAdmit.length > 0 || decided.length > 0 ? (
          <View style={{ gap: spacing.md }}>
            <Text variant="bodyStrong">At the gate</Text>

            {/* Answered requests come first: the guard is holding the visitor and
                needs to know whether to open the barrier or turn them away. */}
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
                        {refused
                          ? 'Refused — do not admit them.'
                          : 'No answer — do not admit them.'}
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
                        {pass.respondedAt ? ` at ${formatTime(pass.respondedAt)}` : ''} — let them
                        in
                      </Text>
                    </View>
                  </View>
                  <Button
                    label="Admit"
                    fullWidth
                    loading={admit.isPending}
                    onPress={() => admit.mutate(pass)}
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
                    loading={cancelWalkIn.isPending}
                    onPress={() => cancelWalkIn.mutate(pass)}
                  />
                </View>
              </Card>
            ))}
          </View>
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
        key={`scanner-${scannerOpen ? 'open' : 'closed'}`}
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />

      {estate ? (
        <PostSwitcherSheet open={postSheetOpen} onClose={() => setPostSheetOpen(false)} />
      ) : null}

      {/* Remount on open so the form starts clean each time — resetting it from
          an effect would trip react-hooks/set-state-in-effect.

          Prefixed key: both sheets are siblings, so a bare "open"/"closed"
          collided between them and React warned about duplicate keys — which can
          silently drop or duplicate a sibling. */}
      {estate ? (
        <WalkInSheet
          key={`walk-in-${walkInOpen ? 'open' : 'closed'}`}
          open={walkInOpen}
          onClose={() => setWalkInOpen(false)}
          estateId={estate.id}
          gateId={gate?.id}
          onRaised={(pass) =>
            // Phrased without promising an approval: this card stays until the
            // guard leaves the screen, and a refusal must not leave it claiming
            // "admit them once they approve" — which is what it used to say.
            setResult({
              requested: `${pass.visitorName} is waiting on ${pass.unitLabel}. ${pass.residentName}'s answer appears under "At the gate".`,
            })
          }
        />
      ) : null}
    </>
  );
}
