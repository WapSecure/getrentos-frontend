'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import jsQR from 'jsqr';
import { CheckCircle2, CloudOff, KeyRound, LogOut, QrCode, XCircle } from 'lucide-react';
import { Button, LegacyInput } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { ApiError, unwrap } from '@/lib/apiHelpers';
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

/** Decodes a QR code from a captured photo — draws it to an off-screen canvas so jsQR can read the pixel data. */
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

export default function GatemanVerifyPage() {
  const queryClient = useQueryClient();
  const [pin, setPin] = useState('');
  const [result, setResult] = useState<{
    pass?: VisitorPass;
    error?: string;
    /** Set when a write was recorded on the device instead of the estate. */
    queued?: string;
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const queue = useGateQueue();
  const replaySummary = useGateReplaySummary();

  const { data: estate, isLoading: isEstateLoading } = useQuery({
    queryKey: estateKeys.myEstate,
    queryFn: () => unwrap(estateService.getMyEstate()),
  });

  const { data: checkInsData } = useQuery({
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

  const verify = useMutation({
    mutationFn: (code: string) => unwrap(estateService.verifyVisitorPass(estate!.id, code)),
    onSuccess: (pass) => {
      setResult({ pass });
      setPin('');
      if (estate) {
        queryClient.invalidateQueries({ queryKey: ['estate', estate.id, 'visitorPasses'] });
      }
    },
    onError: (error, code) => {
      // No connection at the barrier. The visitor is standing there and the
      // resident has already approved them, so refusing the entry would be the
      // wrong answer — record the arrival here and send it later.
      if (isOfflineFailure(error) && estate) {
        gateOfflineQueue.enqueue('check-in', {
          estateId: estate.id,
          pin: code,
          occurredAt: new Date().toISOString(),
          label: `PIN ${code}`,
        });
        setResult({ queued: `PIN ${code}` });
        setPin('');
        return;
      }
      if (error instanceof ApiError) {
        setResult({ error: error.message });
        return;
      }
      setResult({ error: error instanceof Error ? error.message : 'Verification failed' });
    },
  });

  const checkOut = useMutation({
    mutationFn: (pass: VisitorPass) =>
      unwrap(estateService.checkOutVisitorPass(estate!.id, pass.id)),
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

  const handleScanFile = async (file: File) => {
    setResult(null);
    setIsScanning(true);
    try {
      const decoded = await decodeQrFromFile(file);
      if (!decoded) {
        setResult({
          error: "Couldn't read a QR code in that photo — try again or enter the PIN manually.",
        });
        return;
      }
      const scannedPin = decoded.replace(/\D/g, '').slice(0, 6);
      setPin(scannedPin);
      verify.mutate(scannedPin);
    } catch {
      setResult({ error: 'Could not read that photo. Please try again.' });
    } finally {
      setIsScanning(false);
    }
  };

  if (isEstateLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  }

  if (!estate) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">You&apos;re not assigned to an estate yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
          <KeyRound className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-foreground">{estate.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Scan the visitor&apos;s QR code, or enter their 6-digit PIN to check them in.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
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
          className="gap-2"
          disabled={isScanning || verify.isPending}
          onClick={() => scanInputRef.current?.click()}
        >
          <QrCode className="w-4 h-4" />
          {isScanning ? 'Reading photo…' : 'Scan QR'}
        </Button>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex-1 h-px bg-border" />
          or enter the PIN
          <div className="flex-1 h-px bg-border" />
        </div>

        <LegacyInput
          type="text"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          className="text-center text-3xl tracking-[0.3em] font-bold"
        />
        <Button
          variant="primary"
          fullWidth
          disabled={pin.length !== 6 || verify.isPending}
          onClick={() => {
            setResult(null);
            verify.mutate(pin);
          }}
        >
          {verify.isPending ? 'Verifying…' : 'Check In'}
        </Button>

        {result?.pass && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">
                {result.pass.visitorName} checked in for {result.pass.unitLabel}
              </p>
              <p className="text-xs opacity-80 mt-0.5">{result.pass.residentName}</p>
            </div>
          </div>
        )}
        {result?.queued && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
            <CloudOff className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Saved on this device</p>
              <p className="text-xs opacity-80 mt-0.5">
                {result.queued} could not reach the estate, so it is stored here and will be sent
                automatically once there is a connection. The visitor can go through.
              </p>
            </div>
          </div>
        )}
        {result?.error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
            <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{result.error}</p>
          </div>
        )}
      </div>

      {/* The queue is shown here, where a guard acts, rather than as a banner over
          the whole app. Each line is a real arrival or departure the estate has
          not been told about yet. */}
      {queue.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4">
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
                    {write.type === 'check-in' ? 'Arrival' : 'Departure'} · {write.payload.label} ·{' '}
                    {formatTime(write.createdAt)}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                disabled={isSending}
                onClick={() => void sendNow()}
              >
                {isSending ? 'Sending…' : 'Send now'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {replaySummary &&
        (replaySummary.unconfirmed.length > 0 || replaySummary.rejected.length > 0) && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
            <CloudOff className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              {replaySummary.unconfirmed.length > 0 && (
                <p className="text-sm font-medium">
                  Couldn&apos;t confirm {replaySummary.unconfirmed.length} saved entr
                  {replaySummary.unconfirmed.length === 1 ? 'y' : 'ies'} (
                  {replaySummary.unconfirmed.join(', ')}). Check the pass.
                </p>
              )}
              {replaySummary.rejected.length > 0 && (
                <p className="text-sm font-medium mt-1">
                  {replaySummary.rejected.length} saved entr
                  {replaySummary.rejected.length === 1 ? 'y was' : 'ies were'} refused by the estate
                  ({replaySummary.rejected.join(', ')}).
                </p>
              )}
              <button
                type="button"
                className="text-xs underline mt-2"
                onClick={() => clearGateReplaySummary()}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Inside now{inside.length > 0 ? ` (${inside.length})` : ''}
        </h2>
        {inside.length === 0 ? (
          <p className="text-sm text-muted-foreground">No visitors are on the estate right now.</p>
        ) : (
          <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {inside.map((pass) => (
              <div key={pass.id} className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{pass.visitorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {pass.unitLabel}
                    {pass.checkedInAt ? ` · in since ${formatTime(pass.checkedInAt)}` : ''}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  disabled={checkOut.isPending}
                  onClick={() => {
                    setResult(null);
                    checkOut.mutate(pass);
                  }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Check out
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
