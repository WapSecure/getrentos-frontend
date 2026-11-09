import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { spokenGateOutcome, type GateOutcome } from '@sureground/shared';
import { speakNow } from '@/lib/voice';

const KEY = 'gate.speakResults';

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
    const line = spokenGateOutcome(result, refusal);
    if (line) speakNow(line);
  }, [enabled, result, refusal]);
  const toggle = (next: boolean) => {
    setEnabled(next);
    void AsyncStorage.setItem(KEY, next ? 'on' : 'off').catch(() => undefined);
  };
  return { enabled, toggle };
}
