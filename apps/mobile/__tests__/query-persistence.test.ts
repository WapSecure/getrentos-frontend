import { shouldPersistQuery } from '@/lib/query/persistencePolicy';

const query = (key: readonly unknown[], status = 'success') => ({
  queryKey: key,
  state: { status },
});

describe('offline query persistence policy', () => {
  it('keeps safe discovery data available for warm starts', () => {
    expect(shouldPersistQuery(query(['properties', 'recommended']))).toBe(true);
  });

  it.each<{ key: readonly string[] }>([
    { key: ['messages'] },
    { key: ['payment-methods'] },
    { key: ['kyc-status'] },
    { key: ['lease', 'current'] },
    { key: ['visitor-passes'] },
  ])('never writes sensitive query $key to AsyncStorage', ({ key }) => {
    expect(shouldPersistQuery(query(key))).toBe(false);
  });

  it('does not persist failed requests or explicit opt-outs', () => {
    expect(shouldPersistQuery(query(['properties'], 'error'))).toBe(false);
    expect(
      shouldPersistQuery({
        ...query(['properties']),
        meta: { persist: false },
      })
    ).toBe(false);
  });
});
