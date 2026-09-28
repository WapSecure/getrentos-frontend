import { minutesLabel, nextStep, slaState, sumLines, type WorkOrder } from '@/lib/api/homeCare';
import { routeForActionUrl } from '@/lib/notificationRoutes';

const NOW = Date.parse('2026-09-28T12:00:00Z');
const base = {
  id: 'w1',
  issueTitle: 'Leak',
  category: 'PLUMBING',
  description: '',
  priority: 'HIGH',
  status: 'ASSIGNED',
  approvalRequired: false,
  createdAt: '2026-09-28T08:00:00Z',
  unit: {},
  assignedVendor: { id: 'v1', name: 'Tunde' },
} as unknown as WorkOrder;

describe('work order clock', () => {
  it('counts down to the response until someone acknowledges', () => {
    expect(slaState({ ...base, responseDueAt: '2026-09-28T12:45:00Z' }, NOW)).toMatchObject({
      label: 'Respond within 45 min',
      overdue: false,
    });
  });

  it('switches to the fix deadline once acknowledged, and says when it’s broken', () => {
    expect(
      slaState(
        {
          ...base,
          acknowledgedAt: '2026-09-28T09:00:00Z',
          responseDueAt: '2026-09-28T10:00:00Z',
          resolutionDueAt: '2026-09-28T06:00:00Z',
        },
        NOW
      )
    ).toMatchObject({ label: 'Resolve overdue by 6 h', overdue: true });
  });

  it('has no clock once closed', () => {
    expect(
      slaState({ ...base, status: 'RESOLVED', resolutionDueAt: '2026-09-27T00:00:00Z' }, NOW)
    ).toBeNull();
  });
});

describe('next step', () => {
  it('won’t tell the person who logged it to approve their own spend', () => {
    const w = { ...base, approvalRequired: true, createdById: 'me' } as WorkOrder;
    expect(nextStep(w, 'me')).toMatch(/another manager/);
    expect(nextStep(w, 'someone-else')).toMatch(/Approve the spend/);
  });

  it('asks for a vendor first, then the start, then the fix', () => {
    expect(nextStep({ ...base, assignedVendor: null } as WorkOrder)).toBe('Assign a vendor.');
    expect(nextStep(base)).toMatch(/Start the job/);
    expect(nextStep({ ...base, status: 'IN_PROGRESS' } as WorkOrder)).toMatch(/Resolve/);
  });
});

describe('money and time', () => {
  it('totals invoice lines', () => {
    expect(
      sumLines([
        { description: 'a', quantity: 2, unitAmount: 5000 },
        { description: 'b', quantity: 1, unitAmount: 2500 },
      ])
    ).toBe(12500);
  });

  it('speaks durations the way people do', () => {
    expect(minutesLabel(30)).toBe('30 min');
    expect(minutesLabel(90)).toBe('1.5 h');
    expect(minutesLabel(72 * 60)).toBe('3 d');
  });

  it('opens Home care from the web’s links', () => {
    expect(routeForActionUrl('/landlord/home-management')).toBe('/(app)/home-care');
  });
});
