'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TriangleAlert } from '@sureground/icons';

/** How long the guard must hold the button. Long enough to rule out a stray tap, short enough for an emergency. */
export const PANIC_HOLD_MS = 1000;

interface PanicHoldButtonProps {
  onConfirm: () => void;
  isPending: boolean;
}

/**
 * The panic alert fires only after a deliberate one-second press and hold (pointer, touch, or Space/Enter held down).
 * Letting go early cancels it, so a pocket tap or a slip of the finger never sends a critical alert.
 */
export const PanicHoldButton = ({ onConfirm, isPending }: PanicHoldButtonProps) => {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | null>(null);

  const cancel = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  }, []);

  const start = useCallback(() => {
    if (isPending || timer.current !== null) return;
    setHolding(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setHolding(false);
      onConfirm();
    }, PANIC_HOLD_MS);
  }, [isPending, onConfirm]);

  useEffect(() => cancel, [cancel]);

  return (
    <button
      type="button"
      disabled={isPending}
      aria-busy={isPending || undefined}
      aria-describedby="panic-hold-hint"
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        start();
      }}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onPointerLeave={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') cancel();
      }}
      onBlur={cancel}
      className="group relative flex w-full touch-none select-none flex-col items-center gap-2 overflow-hidden rounded-2xl bg-destructive px-4 py-7 text-destructive-foreground shadow-md shadow-destructive/25 transition hover:brightness-95 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-destructive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
    >
      {/* Fills left to right while held; resets instantly on release. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 bg-black/20 ease-linear motion-reduce:transition-none"
        style={{
          width: holding ? '100%' : '0%',
          transitionProperty: 'width',
          transitionDuration: holding ? `${PANIC_HOLD_MS}ms` : '0ms',
        }}
      />
      <span
        aria-hidden="true"
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-destructive-foreground/15 ring-1 ring-destructive-foreground/30"
      >
        <TriangleAlert className="h-6 w-6" />
      </span>
      <span className="relative text-lg font-bold tracking-[0.18em]">
        {isPending ? 'Sending…' : 'PANIC ALERT'}
      </span>
      <span id="panic-hold-hint" className="relative text-xs text-destructive-foreground/85">
        {holding ? 'Keep holding…' : 'Press and hold for 1 second to notify the estate manager'}
      </span>
    </button>
  );
};
