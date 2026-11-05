/**
 * Voice at the estate gate, shared by web and mobile: reading a PIN someone
 * says, and the line the gate device speaks for an outcome.
 */

// Number words only: homophones such as "to" and "for" would turn ordinary words into digits.
const DIGIT_WORDS: Record<string, string> = {
  zero: '0',
  oh: '0',
  nought: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
};

/**
 * The digits in what someone said, for a PIN read out at the gate:
 * "four oh nine, double two one" → "409221". Words and figures both count.
 */
export function digitsFromSpeech(text: string): string {
  const out: string[] = [];
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const repeat = t === 'double' ? 2 : t === 'triple' ? 3 : 1;
    const word = repeat > 1 ? tokens[++i] : t;
    if (!word) break;
    const digits = /^\d+$/.test(word) ? word : DIGIT_WORDS[word];
    if (digits) out.push(digits.repeat(repeat));
  }
  return out.join('');
}

export interface GateOutcome {
  pass?: { visitorName: string; unitLabel: string };
  warning?: string;
  error?: string;
  queued?: string;
  requested?: string;
}

/** What the gate device says for an outcome: a refusal or warning first, then who and where. */
export function spokenGateOutcome(
  result: GateOutcome | null,
  refusal: string | null
): string | null {
  if (refusal) return `Stop. ${refusal}`;
  if (!result) return null;
  if (result.pass) {
    const p = result.pass;
    return `${result.warning ? `Note: ${result.warning}. ` : ''}${p.visitorName}, visiting ${p.unitLabel}. Checked in.`;
  }
  if (result.error) return result.error;
  if (result.queued) return 'Saved on this device. It will be sent when the connection is back.';
  if (result.requested) return 'Asked the household. Wait for their answer.';
  return null;
}
