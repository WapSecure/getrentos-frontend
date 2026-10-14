import { trustChainLabel } from '@getrentos/shared';

const chain = (met: Record<string, boolean>) => ({
  steps: ['owner', 'authority', 'property', 'payment'].map((id) => ({
    id,
    met: id === 'payment' ? true : !!met[id],
  })),
});

describe('trust chain label', () => {
  it('says fully verified only when every check is done', () => {
    expect(trustChainLabel(chain({ owner: true, authority: true, property: true }))).toEqual({
      label: 'Fully verified',
      tone: 'verified',
    });
  });

  it('names the one check still outstanding', () => {
    expect(trustChainLabel(chain({ owner: true, property: true })).label).toBe(
      'Verified · ownership pending'
    );
    expect(trustChainLabel(chain({ authority: true, property: true })).label).toBe(
      'Verified · owner ID pending'
    );
    expect(trustChainLabel(chain({ owner: true, authority: true })).label).toBe(
      'Verified · property check pending'
    );
  });

  it('does not count payment protection, which always holds', () => {
    expect(trustChainLabel(chain({ owner: true })).tone).toBe('pending');
  });

  it('says verification is in progress when more than one check is left', () => {
    expect(trustChainLabel(chain({ owner: true })).label).toBe('Verification in progress');
    expect(trustChainLabel(chain({})).label).toBe('Verification in progress');
  });
});
