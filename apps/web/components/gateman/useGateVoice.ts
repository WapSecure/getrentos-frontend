'use client';

import { useEffect, useState } from 'react';
import { spokenGateOutcome, type GateOutcome } from '@getrentos/shared';
import { speakNow } from '@/lib/voice';

const KEY = 'gate.speakResults';

/**
 * "Speak results" at the gate desk: when on, each outcome is read aloud so
 * the guard can keep their eyes on the visitor. The choice is kept in this
 * browser. Same wording as the gate phone (@getrentos/shared).
 */
export function useGateVoice(result: GateOutcome | null, refusal: string | null) {
  const [enabled, setEnabled] = useState(() => {
    try {
      return typeof window !== 'undefined' && window.localStorage.getItem(KEY) === 'on';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (!enabled) return;
    const line = spokenGateOutcome(result, refusal);
    if (line) speakNow(line);
  }, [enabled, result, refusal]);
  const toggle = (next: boolean) => {
    setEnabled(next);
    try {
      window.localStorage.setItem(KEY, next ? 'on' : 'off');
    } catch {
      // Private mode: the switch still works for this visit.
    }
  };
  return { enabled, toggle };
}
