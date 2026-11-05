import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { VisitorPass } from '@/lib/api/visitor-pass';
import { speakNow } from '@/lib/voice';

const KEY = 'gate.speakResults';

export interface GateOutcome {
  pass?: VisitorPass;
  warning?: string;
  error?: string;
  queued?: string;
  requested?: string;
}

/** What the phone says for a gate outcome: the warning or refusal first, then who and where. */
export function spokenOutcome(result: GateOutcome | null, refusal: string | null): string | null {
  if (refusal) return `Stop. ${refusal}`;
  if (!result) return null;
  if (result.pass) {
    const p = result.pass;
    return `${result.warning ? `Note: ${result.warning}. ` : ''}${p.visitorName}, visiting ${p.unitLabel}. Checked in.`;
  }
  if (result.error) return result.error;
  if (result.queued) return 'Saved on this phone. It will be sent when the connection is back.';
  if (result.requested) return 'Asked the household. Wait for their answer.';
  return null;
}

/**
 * "Speak results" at the gate: when on, each outcome is read aloud so the
 * guard can keep their eyes on the visitor. The choice is kept on the phone.
 */
export function useGateVoice(result: GateOutcome | null, refusal: string | null) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    void AsyncStorage.getItem(KEY)
      .then((v) => setEnabled(v === 'on'))
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!enabled) return;
    const line = spokenOutcome(result, refusal);
    if (line) speakNow(line);
  }, [enabled, result, refusal]);
  const toggle = (next: boolean) => {
    setEnabled(next);
    void AsyncStorage.setItem(KEY, next ? 'on' : 'off').catch(() => undefined);
  };
  return { enabled, toggle };
}
