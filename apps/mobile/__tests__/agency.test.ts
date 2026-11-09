import {
  availableActions,
  grantsNothing,
  groupByOwner,
  hasEnded,
  isLive,
  noticeSummary,
  resolveSelection,
  type Mandate,
} from '@/lib/api/agency';
import { switchablePortals, usablePortal } from '@/lib/roles';

const NOW = Date.parse('2026-11-04T12:00:00Z');
const none = {
  canSubmit: false,
  canSign: false,
  canSuspend: false,
  canResume: false,
  canServeNotice: false,
  canTerminate: false,
  canRequestTermination: false,
  canConfirmHandover: false,
};
const mandate = (over: Partial<Mandate> = {}): Mandate => ({
  id: 'm1',
  propertyId: 'p1',
  propertyTitle: 'Flat 1',
  ownerId: 'o1',
  ownerName: 'Ada',
  managerIsSureground: false,
  managerOrganizationName: 'Acme',
  scope: ['RENT'],
  capabilities: { canList: true, canManage: true, canTransact: false },
  permissions: none,
  startAt: null,
  endAt: null,
  noticePeriodDays: 30,
  status: 'ACTIVE',
  agreementDocumentId: null,
  poaDocumentId: null,
  signedByOwnerAt: null,
  signedByManagerAt: null,
  submittedById: null,
  decidedAt: null,
  decisionNote: null,
  activatedAt: null,
  noticeServedAt: null,
  terminatedAt: null,
  terminationReason: null,
  handoverAt: null,
  createdAt: '2026-10-01T00:00:00Z',
  ...over,
});

describe('mandate state', () => {
  it('is live only while active and before any end date', () => {
    expect(isLive(mandate(), NOW)).toBe(true);
    expect(isLive(mandate({ endAt: '2026-11-01T00:00:00Z' }), NOW)).toBe(false);
    expect(hasEnded(mandate({ endAt: '2026-11-01T00:00:00Z' }), NOW)).toBe(true);
    expect(isLive(mandate({ status: 'SUSPENDED' }), NOW)).toBe(false);
    expect(hasEnded(mandate({ status: 'TERMINATED' }), NOW)).toBe(true);
  });

  it('says when an engagement grants nothing', () => {
    expect(grantsNothing(mandate())).toBe(false);
    expect(
      grantsNothing(
        mandate({ capabilities: { canList: false, canManage: false, canTransact: false } })
      )
    ).toBe(true);
  });

  it('describes how it ends', () => {
    expect(noticeSummary(mandate())).toBe("Rolling, 30 days' notice");
    expect(noticeSummary(mandate({ noticePeriodDays: 0 }))).toBe(
      'Rolling, no notice period agreed'
    );
    expect(noticeSummary(mandate({ noticeServedAt: '2026-11-01T10:00:00Z' }))).toMatch(
      /^Notice served, ends 1 Dec 2026$/
    );
    expect(
      noticeSummary(mandate({ status: 'TERMINATED', terminatedAt: '2026-10-20T10:00:00Z' }))
    ).toBe('Ended 20 Oct 2026');
  });

  it('offers only what the API permits, and notice only once', () => {
    expect(availableActions(mandate())).toEqual([]);
    const p = { ...none, canServeNotice: true, canSuspend: true, canTerminate: true };
    expect(availableActions(mandate({ permissions: p }))).toEqual([
      'notice',
      'suspend',
      'terminate',
    ]);
    expect(
      availableActions(mandate({ permissions: p, noticeServedAt: '2026-11-01T00:00:00Z' }))
    ).toEqual(['suspend', 'terminate']);
  });
});

describe('client selection', () => {
  const live = mandate({ id: 'a' });
  const other = mandate({ id: 'b', ownerId: 'o2', ownerName: 'Bola' });
  const draft = mandate({ id: 'c', status: 'DRAFT' });

  it('keeps a stored client only while the manager still holds it', () => {
    expect(resolveSelection('c', [live, draft], NOW)).toBe('c');
    expect(resolveSelection('gone', [live, other], NOW)).toBeNull();
  });

  it('chooses the only live engagement, and none when the choice is real', () => {
    expect(resolveSelection(null, [live, draft], NOW)).toBe('a');
    expect(resolveSelection(null, [live, other], NOW)).toBeNull();
  });

  it('groups engagements into clients by owner, sorted by name', () => {
    const groups = groupByOwner([other, live, draft], NOW);
    expect(groups.map((g) => [g.ownerName, g.mandates.length, g.live])).toEqual([
      ['Ada', 2, 1],
      ['Bola', 1, 1],
    ]);
  });
});

describe('manager workspace routing', () => {
  it('opens the agency workspace for a manager, after landlord and owner', () => {
    expect(usablePortal(['PROPERTY_MANAGER'])).toBe('manager');
    expect(usablePortal(['PROPERTY_MANAGER', 'RENTER'])).toBe('manager');
    expect(usablePortal(['LANDLORD', 'PROPERTY_MANAGER'])).toBe('landlord');
    expect(switchablePortals(['LANDLORD', 'PROPERTY_MANAGER'])).toEqual(['landlord', 'manager']);
  });
});
