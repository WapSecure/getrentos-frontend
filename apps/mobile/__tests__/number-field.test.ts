import { group, sanitizeNumber } from '../../../packages/ui-native/src/primitives/numberFormat';

describe('sanitizeNumber', () => {
  it('keeps only digits for whole numbers', () => {
    expect(sanitizeNumber('1a2b3', 0)).toBe('123');
    expect(sanitizeNumber('1,250,000', 0)).toBe('1250000');
    expect(sanitizeNumber(' 0123 ', 0)).toBe('0123'); // codes keep leading zeros
    expect(sanitizeNumber('12.5', 0)).toBe('125');
  });

  it('allows one decimal point and caps the places', () => {
    expect(sanitizeNumber('12.345', 2)).toBe('12.34');
    expect(sanitizeNumber('1.2.3', 2)).toBe('1.23');
    expect(sanitizeNumber('abc.5x', 1)).toBe('.5');
    expect(sanitizeNumber('648', 2)).toBe('648');
  });
});

describe('group', () => {
  it('adds thousand separators', () => {
    expect(group('1250000')).toBe('1,250,000');
    expect(group('999')).toBe('999');
  });
});
