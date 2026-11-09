import { digitsFromSpeech, spokenGateOutcome as spokenOutcome } from '@sureground/shared';

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  getAvailableVoicesAsync: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('a PIN said at the gate', () => {
  it('reads digits and number words, including double and oh', () => {
    expect(digitsFromSpeech('4 0 9 2 2 1')).toBe('409221');
    expect(digitsFromSpeech('four oh nine, double two one')).toBe('409221');
    expect(digitsFromSpeech('409 221')).toBe('409221');
  });

  it('ignores ordinary words around the number', () => {
    expect(digitsFromSpeech('the PIN for them is seven seven three, one zero five')).toBe('773105');
  });
});

describe('what the gate phone says', () => {
  const pass = { visitorName: 'Emeka', unitLabel: 'Block C, Flat 2' } as never;

  it('says who is in, with any watch-list note first', () => {
    expect(spokenOutcome({ pass }, null)).toBe('Emeka, visiting Block C, Flat 2. Checked in.');
    expect(spokenOutcome({ pass, warning: 'Seen on the watch list' }, null)).toBe(
      'Note: Seen on the watch list. Emeka, visiting Block C, Flat 2. Checked in.'
    );
  });

  it('leads with a refusal, and says when a check-in was saved offline', () => {
    expect(spokenOutcome({ pass }, 'This person is barred from the estate.')).toBe(
      'Stop. This person is barred from the estate.'
    );
    expect(spokenOutcome({ queued: 'PIN 409221' }, null)).toContain('Saved on this device');
    expect(spokenOutcome(null, null)).toBeNull();
  });
});
