import { canImport } from '@/lib/api/portfolioImport';

// jest.mock is hoisted above the import, so the native module never loads.
jest.mock('expo-file-system', () => ({ File: jest.fn() }));

describe('agency spreadsheet import', () => {
  const ok = { fileError: null, errors: [] };
  it('imports only a readable, error-free file with rows', () => {
    expect(canImport(ok, 2)).toBe(true);
    expect(canImport(ok, 0)).toBe(false);
    expect(canImport({ fileError: 'Not a CSV', errors: [] }, 2)).toBe(false);
    expect(
      canImport({ fileError: null, errors: [{ line: 3, unitName: '', errors: ['x'] }] }, 2)
    ).toBe(false);
  });
});
