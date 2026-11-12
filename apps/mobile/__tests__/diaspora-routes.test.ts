import { apiFetch } from '@/lib/api/client';
import { landBuyerExtrasApi } from '@/lib/api/landBuyerExtras';
import { purchaseWorkspaceApi } from '@/lib/api/purchaseWorkspace';
import { purchaseWorkspaceHref } from '@/components/purchases/purchaseHref';

jest.mock('@/lib/api/client', () => ({ apiFetch: jest.fn() }));

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;
const lastPath = () => fetchMock.mock.calls.at(-1)?.[0];

describe('Diaspora Invest routes', () => {
  beforeEach(() => fetchMock.mockReset().mockResolvedValue({} as never));

  it('opens the buyer or the representative workspace', () => {
    expect(purchaseWorkspaceHref({ role: 'BUYER', transactionId: 'tx 1' })).toBe(
      '/(app)/purchase-workspace/tx%201'
    );
    expect(purchaseWorkspaceHref({ role: 'REPRESENTATIVE', transactionId: 'tx1' })).toBe(
      '/(app)/purchase-workspace/tx1?role=representative'
    );
  });

  it('reads the workspace and its documents on the neutral routes', async () => {
    await purchaseWorkspaceApi.get('BUYER', 'tx 1');
    expect(lastPath()).toBe('/buyer/transactions/tx%201/workspace');
    await purchaseWorkspaceApi.get('REPRESENTATIVE', 'tx1');
    expect(lastPath()).toBe('/representing/transactions/tx1/workspace');
    await purchaseWorkspaceApi.document('REPRESENTATIVE', 'tx1', 'doc 1');
    expect(lastPath()).toBe('/representing/transactions/tx1/documents/doc%201');
  });

  it('confirms and disputes a step with a trimmed reason', async () => {
    await purchaseWorkspaceApi.confirmMilestone('tx1', 'KEYS', 'Keys handed over');
    expect(lastPath()).toBe('/buyer/transactions/tx1/milestones/KEYS/confirm');
    await purchaseWorkspaceApi.disputeMilestone('tx1', 'KEYS', '  Wrong keys  ');
    expect(fetchMock.mock.calls.at(-1)?.[1]).toEqual({
      method: 'POST',
      body: { reason: 'Wrong keys' },
    });
  });

  it('keeps land deals on the land routes and sales on the neutral ones', async () => {
    await landBuyerExtrasApi.coApproval({ kind: 'transaction', id: 'tx1' });
    expect(lastPath()).toBe('/buyer/land/transactions/tx1/co-approval');
    await landBuyerExtrasApi.coApproval({ kind: 'sale', id: 'tx1' });
    expect(lastPath()).toBe('/buyer/transactions/tx1/co-approval');
    await landBuyerExtrasApi.representedCoApproval({ kind: 'sale', id: 'tx1' });
    expect(lastPath()).toBe('/representing/transactions/tx1/co-approval');
    await landBuyerExtrasApi.representativeApprove({ kind: 'purchase', id: 'p1' }, 'DEED');
    expect(lastPath()).toBe('/land/representing/purchases/p1/milestones/DEED/approve');
    await landBuyerExtrasApi.approveDepositRelease('tx1');
    expect(lastPath()).toBe('/representing/transactions/tx1/deposit-release/approve');
  });
});
