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
