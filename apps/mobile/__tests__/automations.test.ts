import {
  broadcastBlocker,
  EMPTY_RULE,
  recipients,
  ruleBlocker,
  rulePayload,
  ruleToForm,
  type AutomationRule,
} from '@/lib/api/automations';

describe('rulePayload', () => {
  it('sends audience, cadence and first run for a scheduled rule', () => {
    expect(
      rulePayload({
        ...EMPTY_RULE,
        name: ' Monthly ',
        title: 'Rent',
        body: 'Hi {{tenant_name}}',
        firstRunAt: '2026-12-01',
      })
    ).toEqual({
      name: 'Monthly',
      title: 'Rent',
      body: 'Hi {{tenant_name}}',
      enabled: true,
      trigger: 'SCHEDULE',
      audience: 'ALL_TENANTS',
      cadence: 'MONTHLY',
      firstRunAt: '2026-12-01',
    });
  });

  it('names the property only for a one-property audience', () => {
    const base = { ...EMPTY_RULE, name: 'n', title: 't', body: 'b', firstRunAt: '2026-12-01' };
    expect(rulePayload({ ...base, propertyId: 'p1' })).not.toHaveProperty('propertyId');
    expect(rulePayload({ ...base, audience: 'PROPERTY', propertyId: 'p1' }).propertyId).toBe('p1');
  });

  it('drops schedule fields for an event rule, and keeps an optional property scope', () => {
    const payload = rulePayload({
      ...EMPTY_RULE,
      trigger: 'RENT_OVERDUE',
      name: 'Chase',
      title: 't',
      body: 'b',
      firstRunAt: '2026-12-01',
    });
    expect(payload).toEqual({
      name: 'Chase',
      title: 't',
      body: 'b',
      enabled: true,
      trigger: 'RENT_OVERDUE',
    });
    expect(
      rulePayload({ ...EMPTY_RULE, trigger: 'LEASE_EXPIRING', propertyId: 'p2' }).propertyId
    ).toBe('p2');
  });
});

describe('rulePayload when editing', () => {
  it('leaves the trigger out, which the API refuses on an edit', () => {
    const f = { ...EMPTY_RULE, name: 'n', title: 't', body: 'b', firstRunAt: '2026-12-01' };
    expect(rulePayload(f, true)).not.toHaveProperty('trigger');
    expect(rulePayload(f, true).cadence).toBe('MONTHLY');
    expect(rulePayload(f).trigger).toBe('SCHEDULE');
  });
});

describe('ruleBlocker', () => {
  const ready = { ...EMPTY_RULE, name: 'n', title: 't', body: 'b', firstRunAt: '2026-12-01' };

  it('passes a complete rule and asks for what is missing', () => {
    expect(ruleBlocker(ready)).toBeNull();
    expect(ruleBlocker({ ...ready, name: ' ' })).toMatch(/Name/);
    expect(ruleBlocker({ ...ready, firstRunAt: '' })).toMatch(/first sends/);
    expect(ruleBlocker({ ...ready, audience: 'PROPERTY' })).toMatch(/property/);
    expect(ruleBlocker({ ...ready, body: '' })).toMatch(/message/);
  });

  it('needs no date for an event rule', () => {
    expect(ruleBlocker({ ...ready, trigger: 'RENT_DUE_SOON', firstRunAt: '' })).toBeNull();
  });
});

describe('ruleToForm', () => {
  it('fills defaults for an event rule and takes the next run as the first run', () => {
    const rule = {
      id: 'r1',
      name: 'Chase',
      trigger: 'RENT_OVERDUE',
      audience: null,
      propertyId: null,
      title: 't',
      body: 'b',
      cadence: null,
      enabled: false,
      nextRunAt: '2026-12-01T09:00:00Z',
      lastRunAt: null,
      lastRecipientCount: null,
      createdAt: '',
      updatedAt: '',
    } satisfies AutomationRule;
    expect(ruleToForm(rule)).toMatchObject({
      audience: 'ALL_TENANTS',
      propertyId: '',
      cadence: 'MONTHLY',
      firstRunAt: '2026-12-01',
      enabled: false,
    });
  });
});

describe('broadcastBlocker and recipients', () => {
  it('needs a property for a one-property broadcast, and a title and message', () => {
    const b = { audience: 'ALL_TENANTS' as const, title: 'T', body: 'B' };
    expect(broadcastBlocker(b)).toBeNull();
    expect(broadcastBlocker({ ...b, audience: 'PROPERTY' })).toMatch(/property/);
    expect(broadcastBlocker({ ...b, title: ' ' })).toMatch(/title/);
  });

  it('pluralises', () => {
    expect(recipients(1)).toBe('1 tenant');
    expect(recipients(3)).toBe('3 tenants');
  });
});
