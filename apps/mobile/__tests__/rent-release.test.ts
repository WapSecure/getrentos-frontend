import { rentReleaseActions, type RentReleasePayment } from '@sureground/shared';

const pay = (over: Partial<RentReleasePayment>): RentReleasePayment => ({
  id: 'p',
  propertyId: 'home-1',
  propertyName: 'Flat 4',
  status: 'paid',
  escrowStatus: 'held',
  dueDate: '2026-10-01',
  ...over,
});

describe('rentReleaseActions', () => {
  it('asks for move-in once per home, on the oldest held rent, before move-in', () => {
    const actions = rentReleaseActions([
      pay({ id: 'nov', dueDate: '2026-11-01', moveInConfirmed: false }),
      pay({ id: 'oct', dueDate: '2026-10-01', moveInConfirmed: false }),
      pay({ id: 'other-home', propertyId: 'home-2', moveInConfirmed: false }),
    ]);
    expect(actions.get('oct')).toBe('confirm-move-in');
    expect(actions.get('nov')).toBeUndefined();
    expect(actions.get('other-home')).toBe('confirm-move-in');
  });

  it('offers an early release on every held rent after move-in', () => {
    const actions = rentReleaseActions([
      pay({ id: 'oct', moveInConfirmed: true }),
      pay({ id: 'nov', dueDate: '2026-11-01', moveInConfirmed: true }),
    ]);
    expect([actions.get('oct'), actions.get('nov')]).toEqual(['release-now', 'release-now']);
  });

  it('treats a released rent as proof of move-in when the API does not say', () => {
    const actions = rentReleaseActions([
      pay({ id: 'sep', escrowStatus: 'released', dueDate: '2026-09-01' }),
      pay({ id: 'oct' }),
    ]);
    expect(actions.get('oct')).toBe('release-now');
    expect(actions.has('sep')).toBe(false);
  });

  it('asks nothing of rent that is not held', () => {
    const actions = rentReleaseActions([
      pay({ id: 'due', status: 'pending', escrowStatus: 'not_funded' }),
      pay({ id: 'review', escrowStatus: 'pending_review' }),
      pay({ id: 'frozen', escrowStatus: 'frozen' }),
    ]);
    expect(actions.size).toBe(0);
  });
});
