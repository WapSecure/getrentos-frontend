import { apiFetch, apiUpload } from '@/lib/api/client';
import { fxApi } from '@/lib/api/fx';
import { homeCareApi } from '@/lib/api/homeCare';
import { landBuyerExtrasApi } from '@/lib/api/landBuyerExtras';
import { ownerLandApi } from '@/lib/api/ownerLand';
import { purchaseWorkspaceApi } from '@/lib/api/purchaseWorkspace';
import { purchaseWorkspaceHref } from '@/components/purchases/purchaseHref';

jest.mock('@/lib/api/client', () => ({ apiFetch: jest.fn(), apiUpload: jest.fn() }));

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;
const uploadMock = apiUpload as jest.MockedFunction<typeof apiUpload>;
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

  it('records consent to recording and joins tours on the land routes', async () => {
    await landBuyerExtrasApi.tourRecordingConsent('t 1', true);
    expect(lastPath()).toBe('/buyer/land/tours/t%201/recording-consent');
    expect(fetchMock.mock.calls.at(-1)?.[1]).toEqual({ method: 'POST', body: { consent: true } });
    await landBuyerExtrasApi.joinTour('t1');
    expect(lastPath()).toBe('/buyer/land/tours/t1/join');
    await ownerLandApi.tourRecordingConsent('t1', false);
    expect(lastPath()).toBe('/owner/land/tours/t1/recording-consent');
    expect(fetchMock.mock.calls.at(-1)?.[1]).toEqual({ method: 'POST', body: { consent: false } });
    await ownerLandApi.joinTour('t1');
    expect(lastPath()).toBe('/owner/land/tours/t1/join');
  });

  it('attaches a document to a quote or an invoice on the job', async () => {
    uploadMock.mockReset().mockResolvedValue({} as never);
    const file = { uri: 'file:///q.pdf', name: 'q.pdf', mimeType: 'application/pdf' };
    await homeCareApi.addDocument('w1', { quoteId: 'q1' }, file);
    expect(uploadMock.mock.calls.at(-1)?.[0]).toBe(
      '/home-management/work-orders/w1/quotes/q1/documents'
    );
    await homeCareApi.addDocument('w1', { invoiceId: 'i1' }, file, ' Signed copy ');
    expect(uploadMock.mock.calls.at(-1)?.[0]).toBe(
      '/home-management/work-orders/w1/invoices/i1/documents'
    );
  });

  it('reads the indicative rates', async () => {
    await fxApi.indicative();
    expect(lastPath()).toBe('/fx/indicative');
  });
});
