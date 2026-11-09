import {
  effectiveAtFor,
  handoverActions,
  lagosToday,
  transferBlocker,
  type Handover,
  type TransferPreview,
} from '@/lib/api/managementTransfers';

const preview = (over: Partial<TransferPreview> = {}): TransferPreview => ({
  propertyId: 'p1',
  propertyName: 'Flat 2',
  running: [],
  openItems: [],
  openTransferId: null,
  ...over,
});

const running = {
  mandateId: 'm1',
  manager: 'Acme Lettings',
  managerIsSureground: false,
  scope: ['RENT'],
  noticePeriodDays: 30,
  noticeServedAt: null,
  noticeEndsAt: '2026-12-04T00:00:00.000Z',
};

describe('transferBlocker', () => {
  const ok = {
    fromMandateId: '',
    incoming: { kind: 'SUREGROUND' } as const,
    effectiveAt: '2026-12-01T00:00:00+01:00',
    acknowledged: false,
  };

  it('lets a self-managed property move to Sureground', () => {
    expect(transferBlocker({ ...ok, preview: preview() })).toBeNull();
  });

  it('needs a property, a date and a firm when a firm takes over', () => {
    expect(transferBlocker({ ...ok, preview: undefined })).toMatch(/property/);
    expect(transferBlocker({ ...ok, preview: preview(), effectiveAt: '' })).toMatch(/when/);
    expect(
      transferBlocker({ ...ok, preview: preview(), incoming: { kind: 'FIRM', id: '' } })
    ).toMatch(/firm/);
  });

  it('asks which engagement ends when the property is already managed', () => {
    expect(transferBlocker({ ...ok, preview: preview({ running: [running] }) })).toMatch(
      /engagement/
    );
    expect(
      transferBlocker({ ...ok, preview: preview({ running: [running] }), fromMandateId: 'm1' })
    ).toBeNull();
  });

  it('refuses taking back a property you already manage', () => {
    expect(transferBlocker({ ...ok, preview: preview(), incoming: { kind: 'SELF' } })).toMatch(
      /already manage/
    );
  });

  it('holds until open matters are acknowledged, and while another change is scheduled', () => {
    const items = preview({ openItems: [{ kind: 'LEGAL_CASE', id: 'c1', label: 'Case' }] });
    expect(transferBlocker({ ...ok, preview: items })).toMatch(/open matters/);
    expect(transferBlocker({ ...ok, preview: items, acknowledged: true })).toBeNull();
    expect(transferBlocker({ ...ok, preview: preview({ openTransferId: 't1' }) })).toMatch(
      /already scheduled/
    );
  });
});

describe('dates', () => {
  it('reads today in Lagos (UTC+1)', () => {
    expect(lagosToday(Date.parse('2026-11-04T23:30:00Z'))).toBe('2026-11-05');
  });

  it('starts a dated change at Lagos midnight, and "straight away" now', () => {
    expect(effectiveAtFor('DATE', '2026-12-01')).toBe('2026-12-01T00:00:00+01:00');
    expect(effectiveAtFor('DATE', '')).toBe('');
    const now = new Date('2026-11-04T10:00:00Z');
    expect(effectiveAtFor('ASAP', '', now)).toBe(now.toISOString());
  });
});

describe('handoverActions', () => {
  const pack = {
    hash: 'abc',
    generatedAt: '',
    snapshot: {} as never,
    depositAttestations: null,
    keysDeclaration: null,
    outgoingSignedAt: null,
    ownerSignedAt: null,
    incomingSignedAt: null,
    disputeReason: null,
    disputedAt: null,
    disputeResolution: null,
    resolvedAt: null,
  };
  const handover = (over: Partial<Handover> = {}): Handover => ({
    transferId: 't1',
    status: 'SWITCHED',
    required: { outgoing: true, incoming: true },
    viewer: { isOwner: true, isOutgoing: false, isIncoming: false },
    pack,
    ...over,
  });

  it('makes the owner wait for the outgoing manager to sign first', () => {
    expect(handoverActions(handover()).canOwner).toBe(false);
    expect(
      handoverActions(handover({ pack: { ...pack, outgoingSignedAt: '2026-11-01' } })).canOwner
    ).toBe(true);
  });

  it('lets the outgoing manager sign and anyone involved dispute while open', () => {
    const out = handoverActions(
      handover({ viewer: { isOwner: false, isOutgoing: true, isIncoming: false } })
    );
    expect(out.canOutgoing).toBe(true);
    expect(out.canDispute).toBe(true);
  });

  it('allows nothing once the handover is completed or disputed', () => {
    for (const status of ['COMPLETED', 'DISPUTED'] as const) {
      const a = handoverActions(
        handover({ status, required: { outgoing: false, incoming: false } })
      );
      expect(a).toEqual({
        canOutgoing: false,
        canOwner: false,
        canIncoming: false,
        canDispute: false,
      });
    }
  });
});
