'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import jsQR from 'jsqr';
import { CheckCircle2, CloudOff, KeyRound, LogOut, QrCode, UserPlus, XCircle } from 'lucide-react';
import { Alert, Button, Card, CardSkeleton, ListSkeleton, NumberInput } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { WalkInDialog } from '@/components/gateman/WalkInDialog';
import { WatchlistBlockedNotice } from '@/components/gateman/WatchlistBlockedNotice';
import { WatchlistWarning } from '@/components/gateman/WatchlistWarning';
import { readWatchlistRefusal, type WatchlistRefusal } from '@/lib/gateman/watchlistRefusal';
import { describeStandingPass } from '@/lib/gateman/standingPass';
import { useGatemanPost } from '@/lib/gateman/GatemanPostProvider';
import {
  clearGateReplaySummary,
  gateOfflineQueue,
  isOfflineFailure,
  replayGateQueue,
  useGateQueue,
  useGateReplaySummary,
} from '@/lib/gateOfflineQueue';
import { estateKeys } from '@/lib/queryKeys';
import type { VisitorPass } from '@/types/estate';

/** Decodes a QR code from a captured photo: draws it to an off-screen canvas so jsQR can read the pixel data. */
async function decodeQrFromFile(file: File): Promise<string | null> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read that photo'));
    img.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  return code?.data ?? null;
}

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));

/**
 * The write an estate's watch list refused.
 *
 * Kept whole so an override resends exactly what was refused, rather than
 * making the guard retype a PIN or re-pick a visitor. The visitor is standing
 * at the barrier while this happens, so every second of re-entry is one they
 * spend waiting.
 */
type BlockedWrite = { kind: 'check-in'; code: string } | { kind: 'admit'; pass: VisitorPass };

export default function GatemanVerifyPage() {
  const queryClient = useQueryClient();
  const [pin, setPin] = useState('');
  const [result, setResult] = useState<{
    pass?: VisitorPass;
    error?: string;
    /** Set when a write was recorded on the device instead of the estate. */
    queued?: string;
    /** Set when a walk-in request has just been sent to the household. */
    requested?: string;
    /**
     * The estate's note about somebody it matched but did not refuse.
     *
     * Carried beside the outcome rather than inside it: the visitor was let in,
     * and a guard who reads this as a failure would start second-guessing an
     * admission the estate already decided to allow.
     */
    warning?: string;
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [walkInOpen, setWalkInOpen] = useState(false);
  /**
   * Set when the estate's watch list refused something, with the write to resend
   * if a guard overrides it. Held outside `result` because it is not a failure
   * to report: it is a decision to act on.
   */
  const [blocked, setBlocked] = useState<{
    refusal: WatchlistRefusal;
    write: BlockedWrite;
  } | null>(null);
  /** A failed override attempt, kept separate so the guard's typed reason survives it. */
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const queue = useGateQueue();
  const replaySummary = useGateReplaySummary();

  // The estate comes from the console's post rather than `/estate/me`, which
  // answers with the guard's oldest estate and no way to ask for another. The
  // gate rides along so every write below is attributed to the barrier the guard
  // is standing at, not merely to the estate.
  const { estate, gate, needsGateChoice, isLoading: isPostLoading } = useGatemanPost();
  const gateId = gate?.id;

  // Every gate-raised walk-in, in one read. Polled rather than pushed: the
  // household decides on their own phone whenever they look, and the guard is
  // standing at a barrier waiting for exactly that.
  //
  // Deliberately NOT filtered to the states that still need action. A request
  // that is refused or that lapses must not simply vanish from the screen of the
  // guard holding the visitor.
  const { data: walkInsData, dataUpdatedAt: walkInsAsOf } = useQuery({
    queryKey: ['estate', estate?.id ?? '', 'walk-ins'],
    queryFn: () =>
      unwrap(estateService.listWalkInVisitorPasses(estate!.id, { page: 1, pageSize: 50 })),
    enabled: !!estate,
    refetchInterval: 15_000,
  });

  const { data: checkInsData, isLoading: isInsideLoading } = useQuery({
    queryKey: [
      ...estateKeys.visitorPasses(estate?.id ?? '', 'checked_in'),
      { page: 1, pageSize: 100, purpose: 'today-check-ins' },
    ],
    queryFn: () =>
      unwrap(
        estateService.listVisitorPasses(estate!.id, {
          status: 'checked_in',
          page: 1,
          pageSize: 100,
        })
      ),
    enabled: !!estate,
  });
  // Everyone currently on the estate, not just today's arrivals: a visitor who
  // arrived yesterday and never checked out is exactly the case this list exists
  // to surface.
  //
  // Departures waiting in the queue are hidden, because at the gate they have
  // left. Deriving that from the queue rather than patching the query cache means
  // the list stays right even after a refetch, and the visitor reappears on its
  // own only if the write is one the estate never accepted.
  const leaving = new Set(
    queue
      .filter(
        (write): write is Extract<typeof write, { type: 'check-out' }> => write.type === 'check-out'
      )
      .map((write) => write.payload.passId)
  );
  const inside = (checkInsData?.items ?? []).filter((pass) => !leaving.has(pass.id));

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
  // answer and turn the visitor away; after that it is clutter on a screen that
  // has to stay scannable at a barrier.
  const DECISION_VISIBLE_MS = 30 * 60 * 1000;

  const walkIns = walkInsData?.items ?? [];
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
   * render is impure: React may render twice, and the two passes would then
   * disagree about what is on screen. The list polls, so the window still moves.
   */
  const asOf = walkInsAsOf;
  const decided = asOf
    ? walkIns.filter(
        (pass) =>
          (pass.status === 'denied' || pass.status === 'expired') &&
          asOf - new Date(pass.respondedAt ?? pass.expiresAt).getTime() < DECISION_VISIBLE_MS
      )
    : [];

  const verify = useMutation({
    mutationFn: ({ code, overrideReason }: { code: string; overrideReason?: string }) =>
      unwrap(estateService.verifyVisitorPass(estate!.id, code, { gateId, overrideReason })),
    onSuccess: (pass) => {
      setResult({ pass, warning: pass.watchlistWarning });
      setBlocked(null);
      setOverrideError(null);
      setPin('');
      if (estate) {
        queryClient.invalidateQueries({ queryKey: ['estate', estate.id, 'visitorPasses'] });
      }
    },
    onError: (error, input) => {
      // The estate's watch list refused them. Not a fault and not a connection
      // problem, so it must not fall into either of the branches below: resending
      // gives the same answer, and the guard is offered the one thing that does
      // change it: a stated reason to admit them anyway.
      const refusal = readWatchlistRefusal(error);
      if (refusal) {
        setResult(null);
        setOverrideError(null);
        setBlocked({ refusal, write: { kind: 'check-in', code: input.code } });
        return;
      }

      // No connection at the barrier. The visitor is standing there and the
      // resident has already approved them, so refusing the entry would be the
      // wrong answer: record the arrival here and send it later.
      //
      // An override is deliberately NOT queued. The queue carries no reason, so
      // replaying it would refuse somebody the guard had deliberately admitted,
      // and the estate's record would then say the visitor never entered at all.
      // Saying "not sent" is honest; a silently rewritten refusal is not.
      if (!input.overrideReason && isOfflineFailure(error) && estate) {
        gateOfflineQueue.enqueue('check-in', {
          estateId: estate.id,
          pin: input.code,
          occurredAt: new Date().toISOString(),
          gateId,
          label: `PIN ${input.code}`,
        });
        setResult({ queued: `PIN ${input.code}` });
        setPin('');
        return;
      }

      const message = error instanceof Error ? error.message : 'Verification failed';
      if (input.overrideReason) {
        setOverrideError(message);
        return;
      }
      setResult({ error: message });
    },
  });

  const checkOut = useMutation({
    mutationFn: (pass: VisitorPass) =>
      unwrap(estateService.checkOutVisitorPass(estate!.id, pass.id, { gateId })),
    onSuccess: () => {
      if (estate) {
        queryClient.invalidateQueries({ queryKey: ['estate', estate.id, 'visitorPasses'] });
      }
    },
    onError: (error, pass) => {
      if (isOfflineFailure(error) && estate) {
        gateOfflineQueue.enqueue('check-out', {
          estateId: estate.id,
          passId: pass.id,
          occurredAt: new Date().toISOString(),
          gateId,
          label: `${pass.visitorName} (${pass.unitLabel})`,
        });
        setResult({ queued: `${pass.visitorName} checked out` });
        return;
      }
      setResult({
        error: error instanceof Error ? error.message : 'Could not check that visitor out.',
      });
    },
  });

  /** Opens the barrier for a walk-in the household has already approved. */
  const admit = useMutation({
    mutationFn: ({ pass, overrideReason }: { pass: VisitorPass; overrideReason?: string }) =>
      unwrap(estateService.admitWalkInVisitorPass(estate!.id, pass.id, { gateId, overrideReason })),
    onSuccess: (pass) => {
      setResult({ pass, warning: pass.watchlistWarning });
      setBlocked(null);
      setOverrideError(null);
      queryClient.invalidateQueries({ queryKey: ['estate', estate!.id] });
    },
    onError: async (error, input) => {
      const refusal = readWatchlistRefusal(error);
      if (refusal) {
        setResult(null);
        setOverrideError(null);
        setBlocked({ refusal, write: { kind: 'admit', pass: input.pass } });
        return;
      }

      // The household already consented, so this is still the guard's decision to
      // record. Only the network is missing, so queue rather than leave the
      // visitor waiting for a signal: but never an override, for the same reason
      // as a queued check-in above.
      if (!input.overrideReason && isOfflineFailure(error)) {
        gateOfflineQueue.enqueue('admit', {
          estateId: estate!.id,
          passId: input.pass.id,
          occurredAt: new Date().toISOString(),
          gateId,
          label: `${input.pass.visitorName} (${input.pass.unitLabel})`,
        });
        setResult({ queued: `${input.pass.visitorName} admitted` });
        return;
      }

      const message = error instanceof Error ? error.message : 'Could not admit that visitor.';
      if (input.overrideReason) {
        setOverrideError(message);
        return;
      }
      setResult({ error: message });
    },
  });

  const cancelWalkIn = useMutation({
    mutationFn: (pass: VisitorPass) =>
      unwrap(estateService.cancelWalkInVisitorPass(estate!.id, pass.id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estate', estate!.id, 'walk-ins'] });
    },
    onError: (error) => {
      setResult({
        error: error instanceof Error ? error.message : 'Could not cancel that request.',
      });
    },
  });

  /** Manual drain, for a guard who can see a connection the browser hasn't noticed. */
  const sendNow = async () => {
    setIsSending(true);
    try {
      const summary = await replayGateQueue();
      if (estate) {
        queryClient.invalidateQueries({ queryKey: ['estate', estate.id, 'visitorPasses'] });
      }
      if (summary && summary.sent === 0 && summary.remaining > 0) {
        setResult({ error: 'Still no connection. Your entries are safe on this device.' });
      }
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Admits somebody the estate listed, on a guard's stated reason.
   *
   * Resends the refused write rather than a fresh one, so the override cannot
   * land on a different visitor than the one who was refused: with two people
   * at a barrier and a queue of writes, that is not a theoretical risk.
   */
  const overrideWatchlist = (reason: string) => {
    if (!blocked) return;
    setOverrideError(null);
    if (blocked.write.kind === 'check-in') {
      verify.mutate({ code: blocked.write.code, overrideReason: reason });
      return;
    }
    admit.mutate({ pass: blocked.write.pass, overrideReason: reason });
  };

  const handleScanFile = async (file: File) => {
    setResult(null);
    setIsScanning(true);
    try {
      const decoded = await decodeQrFromFile(file);
      if (!decoded) {
        setResult({
          error: "Couldn't read a QR code in that photo: try again or enter the PIN manually.",
        });
        return;
      }
      const scannedPin = decoded.replace(/\D/g, '').slice(0, 6);
      setPin(scannedPin);
      verify.mutate({ code: scannedPin });
    } catch {
      setResult({ error: 'Could not read that photo. Please try again.' });
    } finally {
      setIsScanning(false);
    }
  };

  if (isPostLoading) {
    return <CardSkeleton />;
  }

  if (!estate) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">You&apos;re not assigned to an estate yet.</p>
      </div>
    );
  }

  // Null for every ordinary arrival, so the card below is untouched for them.
  const standingPassNote = result?.pass ? describeStandingPass(result.pass) : null;

  return (
    <div className="space-y-8 lg:grid lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start lg:gap-8 lg:space-y-0">
      {/* On a gatehouse screen the check-in card stays in view on the left while
          the queue at the barrier and the people inside fill the right. */}
      <div className="space-y-6 lg:sticky lg:top-24">
        <div className="text-center lg:flex lg:items-center lg:gap-4 lg:text-left">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 shrink-0 lg:mx-0 lg:mb-0">
            <KeyRound className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{estate.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {gate ? `${gate.name} · ` : ''}
              Scan the visitor&apos;s QR code, or enter their 6-digit PIN to check them in.
            </p>
          </div>
        </div>

        {/* The barrier is part of the record, so a guard who has not said which one
            they are at is told plainly: but is never blocked from recording an
            arrival, because a real person is standing in front of them. */}
        {needsGateChoice && (
          <Alert variant="warning">
            This estate has more than one gate. Use the gate picker above to say which one
            you&apos;re at, so arrivals are recorded against it. You can still check people in
            without choosing.
          </Alert>
        )}

        <Card className="p-6 space-y-4">
          <input
            ref={scanInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) handleScanFile(file);
            }}
          />
          <Button
            variant="outline"
            fullWidth
            icon={<QrCode className="w-4 h-4" />}
            disabled={verify.isPending}
            isLoading={isScanning}
            loadingText="Reading photo…"
            onClick={() => scanInputRef.current?.click()}
          >
            Scan QR
          </Button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" />
            or enter the PIN
            <div className="flex-1 h-px bg-border" />
          </div>

          <NumberInput
            value={pin}
            onValueChange={(value) => setPin(value.slice(0, 6))}
            maxLength={6}
            placeholder="000000"
            aria-label="Visitor PIN"
            inputClassName="text-center text-3xl tracking-[0.3em] font-bold"
          />
          <Button
            variant="primary"
            fullWidth
            disabled={pin.length !== 6}
            isLoading={verify.isPending}
            loadingText="Verifying…"
            onClick={() => {
              setResult(null);
              setBlocked(null);
              verify.mutate({ code: pin });
            }}
          >
            Check In
          </Button>

          {/* The visitor who has nothing arranged. Raising a request is not the
              same as letting them in: the household is asked first. */}
          <Button
            variant="outline"
            fullWidth
            className="gap-2"
            disabled={verify.isPending}
            onClick={() => {
              setResult(null);
              setBlocked(null);
              setWalkInOpen(true);
            }}
          >
            <UserPlus className="w-4 h-4" />
            Visitor with no pass
          </Button>

          {blocked && (
            <WatchlistBlockedNotice
              message={blocked.refusal.message}
              matches={blocked.refusal.matches}
              onOverride={overrideWatchlist}
              onDefer={() => {
                setBlocked(null);
                setOverrideError(null);
                setPin('');
              }}
              isOverriding={verify.isPending || admit.isPending}
              error={overrideError}
            />
          )}

          {result?.pass && (
            <Alert
              variant="success"
              icon={CheckCircle2}
              title={`${result.pass.visitorName} checked in for ${result.pass.unitLabel}`}
            >
              <p className="text-xs">{result.pass.residentName}</p>
              {standingPassNote && <p className="text-xs mt-0.5">{standingPassNote}</p>}
            </Alert>
          )}
          {result?.queued && (
            <Alert variant="warning" icon={CloudOff} title="Saved on this device">
              <p className="text-xs">
                {result.queued} could not reach the estate, so it is stored here and will be sent
                automatically once there is a connection. The visitor can go through.
              </p>
            </Alert>
          )}
          {result?.requested && (
            <Alert variant="info" icon={UserPlus} title="Asked the household">
              <p className="text-xs">{result.requested}</p>
            </Alert>
          )}
          {result?.warning && <WatchlistWarning warning={result.warning} />}
          {result?.error && <Alert variant="danger" icon={XCircle} title={result.error} />}
        </Card>

        {/* The queue is shown here, where a guard acts, rather than as a banner over
            the whole app. Each line is a real arrival or departure the estate has
            not been told about yet. */}
        {queue.length > 0 && (
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <CloudOff className="w-5 h-5 shrink-0 mt-0.5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Waiting to send ({queue.length})
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Saved in this browser. They go to the estate as soon as there is a connection.
                </p>
                <ul className="mt-2 space-y-1">
                  {queue.map((write) => (
                    <li key={write.id} className="text-xs text-muted-foreground">
                      {write.type === 'check-in' ? 'Arrival' : 'Departure'} · {write.payload.label}{' '}
                      · {formatTime(write.createdAt)}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  isLoading={isSending}
                  loadingText="Sending…"
                  onClick={() => void sendNow()}
                >
                  Send now
                </Button>
              </div>
            </div>
          </Card>
        )}

        {replaySummary &&
          (replaySummary.unconfirmed.length > 0 || replaySummary.rejected.length > 0) && (
            <Alert variant="warning" icon={CloudOff} onDismiss={() => clearGateReplaySummary()}>
              {replaySummary.unconfirmed.length > 0 && (
                <p className="font-medium">
                  Couldn&apos;t confirm {replaySummary.unconfirmed.length} saved entr
                  {replaySummary.unconfirmed.length === 1 ? 'y' : 'ies'} (
                  {replaySummary.unconfirmed.join(', ')}). Check the pass.
                </p>
              )}
              {replaySummary.rejected.length > 0 && (
                <p className="font-medium mt-1">
                  {replaySummary.rejected.length} saved entr
                  {replaySummary.rejected.length === 1 ? 'y was' : 'ies were'} refused by the estate
                  ({replaySummary.rejected.join(', ')}).
                </p>
              )}
            </Alert>
          )}
      </div>

      <div className="space-y-8">
        {/* Walk-ins sit above "inside now": an approved visitor is standing at the
            barrier right now, which is the most urgent thing on the screen. */}
        {(awaiting.length > 0 || readyToAdmit.length > 0 || decided.length > 0) && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">At the gate</h2>

            {/* Answered requests come first: the guard is holding the visitor and
                needs to know whether to open the barrier or turn them away. */}
            {decided.map((pass) => (
              <Card key={pass.id} className="border-destructive/30 p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-destructive" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{pass.visitorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {pass.unitLabel} · {pass.residentName}
                    </p>
                    <p className="text-xs text-destructive mt-0.5">
                      {pass.status === 'denied'
                        ? 'Refused: do not admit them.'
                        : 'No answer: do not admit them.'}
                    </p>
                    {pass.status === 'denied' && pass.denialReason && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Reason: {pass.denialReason}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {readyToAdmit.map((pass) => (
              <Card key={pass.id} className="border-success/30 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-success" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{pass.visitorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {pass.unitLabel} · {pass.residentName}
                    </p>
                    <p className="text-xs text-success mt-0.5">
                      Approved
                      {pass.respondedAt ? ` at ${formatTime(pass.respondedAt)}` : ''}: let them in
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  fullWidth
                  disabled={admit.isPending}
                  isLoading={admit.isPending && admit.variables?.pass.id === pass.id}
                  loadingText="Admitting…"
                  onClick={() => admit.mutate({ pass })}
                >
                  Admit
                </Button>
              </Card>
            ))}

            {awaiting.map((pass) => (
              <Card key={pass.id} className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CloudOff className="w-5 h-5 shrink-0 mt-0.5 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{pass.visitorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {pass.unitLabel} · asked {formatTime(pass.createdAt)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Waiting for {pass.residentName} to answer. If nobody does by{' '}
                      {formatTime(pass.expiresAt)}, they cannot be admitted.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={cancelWalkIn.isPending}
                  isLoading={cancelWalkIn.isPending && cancelWalkIn.variables?.id === pass.id}
                  onClick={() => cancelWalkIn.mutate(pass)}
                >
                  Cancel request
                </Button>
              </Card>
            ))}
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Inside now{inside.length > 0 ? ` (${inside.length})` : ''}
          </h2>
          {isInsideLoading ? (
            <ListSkeleton rows={2} />
          ) : inside.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No visitors are on the estate right now.
            </p>
          ) : (
            <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
              {inside.map((pass) => (
                <div key={pass.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {pass.visitorName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pass.unitLabel}
                      {pass.checkedInAt ? ` · in since ${formatTime(pass.checkedInAt)}` : ''}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    icon={<LogOut className="w-3.5 h-3.5" />}
                    disabled={checkOut.isPending}
                    isLoading={checkOut.isPending && checkOut.variables?.id === pass.id}
                    aria-label={`Check out ${pass.visitorName}`}
                    onClick={() => {
                      setResult(null);
                      checkOut.mutate(pass);
                    }}
                  >
                    Check out
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <WalkInDialog
        isOpen={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        estateId={estate.id}
        gateId={gateId}
        onRaised={(pass) =>
          // Phrased without promising an approval: this card stays until the
          // guard leaves the screen, and a refusal must not leave it claiming
          // "admit them once they approve": which is what it used to say.
          setResult({
            requested: `${pass.visitorName} is waiting on ${pass.unitLabel}. ${pass.residentName}'s answer appears under "At the gate".`,
            warning: pass.watchlistWarning,
          })
        }
      />
    </div>
  );
}
