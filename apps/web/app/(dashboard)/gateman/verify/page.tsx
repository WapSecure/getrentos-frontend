'use client';

import { useEffect, useRef, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Ban,
  CheckCircle2,
  CloudOff,
  Hourglass,
  MapPin,
  Mic,
  QrCode,
  UserPlus,
  XCircle,
} from '@sureground/icons';
import { NotAssignedToEstate } from '@/components/gateman/NotAssignedToEstate';
import { Alert, Button, CardSkeleton, NumberInput, PageHeader, Switch } from '@sureground/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { WalkInDialog } from '@/components/gateman/WalkInDialog';
import { InsideNowPanel } from '@/components/gateman/InsideNowPanel';
import { GateRowIcon, GateSection, gateRowEdge } from '@/components/gateman/GateSection';
import { useGateVoice } from '@/components/gateman/useGateVoice';
import { digitsFromSpeech } from '@sureground/shared';
import { useVoiceInput } from '@/lib/voice';
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
  const { default: jsQR } = await import('jsqr');
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  return code?.data ?? null;
}

const INSIDE_PAGE_SIZE = 20;

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));

type BlockedWrite = { kind: 'check-in'; code: string } | { kind: 'admit'; pass: VisitorPass };

export default function GatemanVerifyPage() {
  const queryClient = useQueryClient();
  const [pin, setPin] = useState('');
  const [result, setResult] = useState<{
    pass?: VisitorPass;
    error?: string;
    queued?: string;
    requested?: string;
    warning?: string;
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [blocked, setBlocked] = useState<{
    refusal: WatchlistRefusal;
    write: BlockedWrite;
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
  const scanInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  const queue = useGateQueue();
  const replaySummary = useGateReplaySummary();

  // From the console's post, not `/estate/me` (the guard's oldest estate), so every write carries the guard's barrier.
  const { estate, gate, needsGateChoice, isLoading: isPostLoading } = useGatemanPost();
  const gateId = gate?.id;

  // Not filtered to actionable states: a refused or lapsed request must stay on the guard's screen.
  const { data: walkInsData, dataUpdatedAt: walkInsAsOf } = useQuery({
    queryKey: ['estate', estate?.id ?? '', 'walk-ins'],
    queryFn: () =>
      unwrap(estateService.listWalkInVisitorPasses(estate!.id, { page: 1, pageSize: 50 })),
    enabled: !!estate,
    refetchInterval: 15_000,
  });

  const [insidePage, setInsidePage] = useState(1);
  const [insideSearch, setInsideSearch] = useState('');
  const [insideQuery, setInsideQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setInsideQuery(insideSearch.trim());
      setInsidePage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [insideSearch]);
  const {
    data: checkInsData,
    isLoading: isInsideLoading,
    isFetching: isInsideFetching,
  } = useQuery({
    queryKey: [
      ...estateKeys.visitorPasses(estate?.id ?? '', 'checked_in'),
      {
        page: insidePage,
        pageSize: INSIDE_PAGE_SIZE,
        search: insideQuery,
        purpose: 'today-check-ins',
      },
    ],
    queryFn: () =>
      unwrap(
        estateService.listVisitorPasses(estate!.id, {
          status: 'checked_in',
          page: insidePage,
          pageSize: INSIDE_PAGE_SIZE,
          search: insideQuery || undefined,
        })
      ),
    enabled: !!estate,
    placeholderData: keepPreviousData,
  });
  // Queued departures are hidden, derived from the queue so a refetch can't bring them back.
  const leaving = new Set(
    queue
      .filter(
        (write): write is Extract<typeof write, { type: 'check-out' }> => write.type === 'check-out'
      )
      .map((write) => write.payload.passId)
  );
  const inside = (checkInsData?.items ?? []).filter((pass) => !leaving.has(pass.id));
  const insideTotal = Math.max(0, (checkInsData?.total ?? 0) - leaving.size);
  if (checkInsData && checkInsData.items.length === 0 && insidePage > 1) {
    setInsidePage(insidePage - 1);
  }

  // Hide queued admits, or an offline guard could admit the same visitor twice and replay into a conflict.
  const admitting = new Set(
    queue
      .filter((write): write is Extract<typeof write, { type: 'admit' }> => write.type === 'admit')
      .map((write) => write.payload.passId)
  );
  const DECISION_VISIBLE_MS = 30 * 60 * 1000;

  const walkIns = walkInsData?.items ?? [];
  const stillOpen = (pass: VisitorPass) => !admitting.has(pass.id) && !leaving.has(pass.id);
  const awaiting = walkIns.filter((pass) => pass.status === 'awaiting_approval' && stillOpen(pass));
  const readyToAdmit = walkIns.filter((pass) => pass.status === 'approved' && stillOpen(pass));
  // Measured from the query's fetch time, not `Date.now()`: reading the clock in render is impure.
  const asOf = walkInsAsOf;
  const decided = asOf
    ? walkIns.filter(
        (pass) =>
          (pass.status === 'denied' || pass.status === 'expired') &&
          asOf - new Date(pass.respondedAt ?? pass.expiresAt).getTime() < DECISION_VISIBLE_MS
      )
    : [];
  const atTheGate = awaiting.length + readyToAdmit.length + decided.length;

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
      // A watch-list refusal is neither a fault nor a connection problem: resending gives the same answer.
      const refusal = readWatchlistRefusal(error);
      if (refusal) {
        setResult(null);
        setOverrideError(null);
        setBlocked({ refusal, write: { kind: 'check-in', code: input.code } });
        return;
      }

      // Offline: queue the approved arrival. Never queue an override: the queue carries no reason, so replaying it would refuse the visitor.
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

  useEffect(() => {
    checkInRef.current = (code) => {
      if (verify.isPending) return;
      setBlocked(null);
      verify.mutate({ code }, { onSettled: () => pinInputRef.current?.focus() });
    };
  }, [verify]);

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

      // Queue offline, but never an override (same reason as check-in).
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

  // Resends the refused write, so the override cannot land on a different visitor.
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
    return <NotAssignedToEstate icon={QrCode} />;
  }

  const standingPassNote = result?.pass ? describeStandingPass(result.pass) : null;

  return (
    <div className="space-y-8 lg:grid lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start lg:gap-10 lg:space-y-0">
      <div className="space-y-6 lg:sticky lg:top-24">
        <PageHeader
          title={estate.name}
          description="Enter the visitor's six-digit PIN or scan their QR code."
          meta={<PostChip gateName={gate?.name} needsChoice={needsGateChoice} />}
        />

        {/* Warn when no barrier is chosen, but never block: a real person is waiting. */}
        {needsGateChoice && (
          <Alert variant="warning">
            This estate has more than one gate. Use the gate picker above to say which one
            you&apos;re at, so arrivals are recorded against it. You can still check people in
            without choosing.
          </Alert>
        )}

        <section
          aria-label="Check a visitor in"
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
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

          <div className="space-y-5 p-5 sm:p-6">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (pin.length !== 6 || verify.isPending) return;
                setResult(null);
                setBlocked(null);
                verify.mutate({ code: pin }, { onSettled: () => pinInputRef.current?.focus() });
              }}
            >
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <label htmlFor="visitor-pin" className="text-sm font-medium text-foreground">
                    Visitor PIN
                  </label>
                  <span className="text-xs tabular-nums text-muted-foreground" aria-hidden="true">
                    {pin.length}/6
                  </span>
                </div>
                <NumberInput
                  ref={pinInputRef}
                  id="visitor-pin"
                  value={pin}
                  onValueChange={(value) => setPin(value.slice(0, 6))}
                  maxLength={6}
                  placeholder="000000"
                  aria-label="Visitor PIN"
                  inputClassName="h-16 pl-[0.4em] text-center font-mono text-4xl font-semibold tracking-[0.4em] placeholder:text-muted-foreground/35 sm:h-[4.5rem]"
                />
                <div aria-hidden="true" className="grid grid-cols-6 gap-1.5 px-1">
                  {Array.from({ length: 6 }, (_, index) => (
                    <span
                      key={index}
                      className={`h-1 rounded-full transition-colors duration-150 ${
                        index < pin.length ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="xl"
                disabled={pin.length !== 6}
                isLoading={verify.isPending}
                loadingText="Verifying…"
              >
                Check in
              </Button>

              {voicePin.available && (
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  className="gap-2"
                  onClick={() => (voicePin.listening ? voicePin.stop() : voicePin.start())}
                >
                  <Mic className={`w-4 h-4 ${voicePin.listening ? 'text-destructive' : ''}`} />
                  {voicePin.listening ? 'Listening… say the PIN' : 'Say the PIN'}
                </Button>
              )}
              {voicePin.error && <p className="text-xs text-muted-foreground">{voicePin.error}</p>}
            </form>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              or
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid gap-2.5">
              <Button
                variant="outline"
                fullWidth
                size="lg"
                icon={<QrCode className="w-4 h-4" />}
                disabled={verify.isPending}
                isLoading={isScanning}
                loadingText="Reading photo…"
                onClick={() => scanInputRef.current?.click()}
              >
                Scan QR
              </Button>
              <Button
                variant="outline"
                fullWidth
                size="lg"
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
            </div>

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

            <div role="status" aria-live="polite" className="contents">
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
                    {result.queued} could not reach the estate, so it is stored here and will be
                    sent automatically once there is a connection. The visitor can go through.
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
            </div>
          </div>

          <div className="border-t border-border bg-secondary/40 px-5 py-4 sm:px-6">
            <Switch
              checked={gateVoice.enabled}
              onCheckedChange={gateVoice.toggle}
              label="Speak results"
              description="Hear who is checked in, or why not, while you watch the visitor."
            />
          </div>
        </section>

        {queue.length > 0 && (
          <GateSection
            id="waiting-to-send"
            title="Waiting to send"
            count={queue.length}
            countLabel={`${queue.length} waiting to send`}
            description="Saved in this browser. They go to the estate as soon as there is a connection."
          >
            <ul className="divide-y divide-border">
              {queue.map((write) => (
                <li key={write.id} className="flex items-center gap-3 px-5 py-3">
                  <GateRowIcon tone="warning">
                    <CloudOff />
                  </GateRowIcon>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {write.payload.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {write.type === 'check-in' ? 'Arrival' : 'Departure'} ·{' '}
                      {formatTime(write.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-border px-5 py-3">
              <Button
                variant="outline"
                size="lg"
                isLoading={isSending}
                loadingText="Sending…"
                onClick={() => void sendNow()}
              >
                Send now
              </Button>
            </div>
          </GateSection>
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
        {atTheGate > 0 && (
          <GateSection
            id="at-the-gate"
            title="At the gate"
            count={atTheGate}
            countLabel={`${atTheGate} at the gate`}
            description="Visitors with no pass, and what the household said."
          >
            <ul className="divide-y divide-border">
              {decided.map((pass) => (
                <li key={pass.id} className={`flex gap-3 px-5 py-4 ${gateRowEdge('danger')}`}>
                  <GateRowIcon tone="danger">
                    <Ban />
                  </GateRowIcon>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {pass.visitorName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {pass.unitLabel} · {pass.residentName}
                    </p>
                    <p className="mt-1 text-xs font-medium text-destructive">
                      {pass.status === 'denied'
                        ? 'Refused: do not admit them.'
                        : 'No answer: do not admit them.'}
                    </p>
                    {pass.status === 'denied' && pass.denialReason && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Reason: {pass.denialReason}
                      </p>
                    )}
                  </div>
                </li>
              ))}

              {readyToAdmit.map((pass) => (
                <li
                  key={pass.id}
                  className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${gateRowEdge('success')}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <GateRowIcon tone="success">
                      <CheckCircle2 />
                    </GateRowIcon>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {pass.visitorName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {pass.unitLabel} · {pass.residentName}
                      </p>
                      <p className="mt-1 text-xs font-medium text-success">
                        Approved
                        {pass.respondedAt ? ` at ${formatTime(pass.respondedAt)}` : ''}: let them in
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full shrink-0 sm:w-auto sm:min-w-28"
                    disabled={admit.isPending}
                    isLoading={admit.isPending && admit.variables?.pass.id === pass.id}
                    loadingText="Admitting…"
                    onClick={() => admit.mutate({ pass })}
                  >
                    Admit
                  </Button>
                </li>
              ))}

              {awaiting.map((pass) => (
                <li
                  key={pass.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <GateRowIcon>
                      <Hourglass />
                    </GateRowIcon>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {pass.visitorName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {pass.unitLabel} · asked {formatTime(pass.createdAt)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Waiting for {pass.residentName} to answer. If nobody does by{' '}
                        {formatTime(pass.expiresAt)}, they cannot be admitted.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full shrink-0 sm:w-auto"
                    disabled={cancelWalkIn.isPending}
                    isLoading={cancelWalkIn.isPending && cancelWalkIn.variables?.id === pass.id}
                    onClick={() => cancelWalkIn.mutate(pass)}
                  >
                    Cancel request
                  </Button>
                </li>
              ))}
            </ul>
          </GateSection>
        )}

        <InsideNowPanel
          visitors={inside}
          total={insideTotal}
          pagedTotal={checkInsData?.total ?? 0}
          page={insidePage}
          pageSize={INSIDE_PAGE_SIZE}
          onPageChange={setInsidePage}
          search={insideSearch}
          query={insideQuery}
          onSearchChange={setInsideSearch}
          isLoading={isInsideLoading}
          isFetching={isInsideFetching}
          checkingOutId={checkOut.variables?.id}
          isCheckingOut={checkOut.isPending}
          onCheckOut={(pass) => {
            setResult(null);
            checkOut.mutate(pass);
          }}
        />
      </div>

      <WalkInDialog
        isOpen={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        estateId={estate.id}
        gateId={gateId}
        onRaised={(pass) =>
          // Must not promise an approval: the card stays up after a refusal.
          setResult({
            requested: `${pass.visitorName} is waiting on ${pass.unitLabel}. ${pass.residentName}'s answer appears under "At the gate".`,
            warning: pass.watchlistWarning,
          })
        }
      />
    </div>
  );
}

/** The guard's post as a chip, so it reads as state rather than a sentence. */
function PostChip({ gateName, needsChoice }: { gateName?: string; needsChoice: boolean }) {
  if (gateName) {
    return (
      <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs">
        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
        <span className="text-muted-foreground">Current post</span>
        <span className="truncate font-medium text-foreground">{gateName}</span>
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
        needsChoice
          ? 'border-warning/40 bg-warning-subtle text-warning'
          : 'border-border bg-secondary text-muted-foreground'
      }`}
    >
      <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      <span>No gate selected</span>
    </span>
  );
}
