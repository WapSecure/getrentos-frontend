import { deadlineIso, importSummary } from '@/lib/api/estateManager';

describe('estate CSV imports', () => {
  it('summarises created and failed rows', () => {
    expect(importSummary({ created: 1, failed: 0, errors: [] }, ['household', 'households'])).toBe(
      '1 household imported'
    );
    expect(importSummary({ created: 3, failed: 2, errors: [] }, ['household', 'households'])).toBe(
      '3 households imported, 2 failed'
    );
  });

  it('builds the deadline from a local day and time, and refuses partial input', () => {
    expect(deadlineIso('2026-11-06', '18:30')).toBe(new Date('2026-11-06T18:30:00').toISOString());
    expect(deadlineIso('2026-11-06', '')).toBeNull();
    expect(deadlineIso('', '18:30')).toBeNull();
  });
});
