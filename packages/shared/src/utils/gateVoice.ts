// Number words count anywhere. Sound-alikes ("for", "to") count only between digits: recognisers
// often hear "four" as "for", but "the PIN for them is" must not gain a 4.
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

const SOUND_ALIKES: Record<string, string> = {
  won: '1',
  to: '2',
  too: '2',
  for: '4',
  fore: '4',
  ate: '8',
};

export function digitsFromSpeech(text: string): string {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const plain = (t: string | undefined) =>
    t !== undefined && (/^\d+$/.test(t) || t in DIGIT_WORDS || t === 'double' || t === 'triple');
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const repeat = t === 'double' ? 2 : t === 'triple' ? 3 : 1;
    const at = repeat > 1 ? i + 1 : i;
    const word = tokens[at];
    if (!word) break;
    if (repeat > 1) i++;
    const alike = SOUND_ALIKES[word];
    const betweenDigits =
      alike !== undefined && (plain(tokens[at - (repeat > 1 ? 2 : 1)]) || plain(tokens[at + 1]));
    const digits = /^\d+$/.test(word)
      ? word
      : (DIGIT_WORDS[word] ?? (betweenDigits ? alike : undefined));
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
