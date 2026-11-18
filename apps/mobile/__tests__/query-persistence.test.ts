import { shouldPersistQuery } from '@/lib/query/persistencePolicy';
import { qk } from '@/lib/query/keys';

const query = (key: readonly unknown[], status = 'success', meta?: Record<string, unknown>) => ({
  queryKey: key,
  state: { status },
  meta,
});

describe('offline query persistence policy', () => {
  it('keeps public marketplace data available for warm starts', () => {
    expect(shouldPersistQuery(query(qk.market.list('rent', {})))).toBe(true);
    expect(shouldPersistQuery(query(qk.market.detail('rent', 'r1')))).toBe(true);
  });

  it.each<{ key: readonly unknown[] }>([
    { key: ['messages'] },
    { key: ['landlord', 'tenants'] },
    { key: ['agency', 'owner-invite', 'tok'] },
    { key: ['properties', 'recommended'] },
    { key: ['visitor-passes'] },
    { key: qk.market.saved },
  ])('does not write unlisted query $key to AsyncStorage', ({ key }) => {
    expect(shouldPersistQuery(query(key))).toBe(false);
  });

  it('persists a query only when it opts in, and honours an explicit opt-out', () => {
    expect(shouldPersistQuery(query(['reference', 'banks'], 'success', { persist: true }))).toBe(
      true
    );
    expect(
      shouldPersistQuery(query(qk.market.list('rent', {}), 'success', { persist: false }))
    ).toBe(false);
  });

  it('does not persist failed requests', () => {
    expect(shouldPersistQuery(query(qk.market.list('rent', {}), 'error'))).toBe(false);
  });
});
