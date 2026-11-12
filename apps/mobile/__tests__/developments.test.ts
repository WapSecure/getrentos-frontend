import { ApiError, apiFetch } from '@/lib/api/client';
import { developmentsApi } from '@/lib/api/developments';
import {
  approvalCheckedLine,
  developerLine,
  developmentsPageOf,
  instalmentContext,
  isDevelopmentId,
  lowestUnitPrice,
  mailLink,
  telLink,
} from '@/lib/developments';
import { DEVELOPMENT_NOT_CHECKED, DEVELOPMENT_PAYMENT_COPY } from '@sureground/shared/showroom';

jest.mock('@/lib/api/client', () => {
  class MockApiError extends Error {
    constructor(
      message: string,
      public status: number
    ) {
      super(message);
    }
  }
  return { apiFetch: jest.fn(), ApiError: MockApiError };
});

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;
const ID = '3f1c2a7e-8b4d-4c1a-9e2f-1a2b3c4d5e6f';
const day = '2026-11-01T10:00:00.000Z';

const live = (overrides: Record<string, unknown> = {}) => ({
  id: ID,
  name: 'Palm Court Residences',
  stage: 'UNDER_CONSTRUCTION',
  expectedCompletion: '2027-06',
  location: { addressLine: '1 Palm Road', city: 'Lekki', state: 'Lagos' },
  developer: { name: 'Palm Developers', registeredName: 'Palm Developers Ltd' },
  liveAt: day,
  paymentPlan: { paidTo: 'DEVELOPER', instalments: [] },
  checks: ['DEVELOPER_CAC', 'DIRECTOR_IDENTITY', 'SITE_TITLE', 'BUILDING_APPROVAL'].map((kind) => ({
    kind,
    checkedAt: day,
  })),
  unitTypes: [
    { id: 'u1', name: '3-bed terrace', priceFromNaira: 90_000_000 },
    { id: 'u2', name: '2-bed flat', priceFromNaira: 60_000_000 },
  ],
  ...overrides,
});

beforeEach(() => fetchMock.mockReset());

describe('developments list', () => {
  it('keeps only summaries the shared mapper accepts', () => {
    const page = developmentsPageOf({
      items: [
        {
          id: ID,
          name: 'Palm Court',
          city: 'Lekki',
          state: 'Lagos',
          stage: 'PLANNED',
          developerName: 'Palm Developers',
        },
        { id: 'x', name: 'No stage', city: 'Lekki', state: 'Lagos', developerName: 'A' },
        'nonsense',
      ],
      total: 3,
      page: 1,
      totalPages: 1,
    });
    expect(page.items.map((d) => d.name)).toEqual(['Palm Court']);
    expect(page.items[0].unitTypeCount).toBe(0);
    expect(page.totalPages).toBe(1);
  });

  it('reads an empty or broken response as no developments', () => {
    expect(developmentsPageOf(null)).toEqual({ items: [], total: 0, page: 1, totalPages: 1 });
  });

  it('calls the public route without a token', async () => {
    fetchMock.mockResolvedValueOnce({ items: [], total: 0, page: 2, totalPages: 2 });
    await developmentsApi.list(2);
    expect(fetchMock).toHaveBeenCalledWith('/developments?page=2&pageSize=12', {
      anonymous: true,
    });
  });
});

describe('development detail', () => {
  it('never fetches an id that is not a UUID', async () => {
    expect(isDevelopmentId('../admin')).toBe(false);
    expect(await developmentsApi.detail('../admin')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('is not shown unless the developer takes the payment and all four checks passed', async () => {
    fetchMock.mockResolvedValueOnce(live({ paymentPlan: { paidTo: 'SUREGROUND' } }));
    expect(await developmentsApi.detail(ID)).toBeNull();
    fetchMock.mockResolvedValueOnce(live({ checks: [{ kind: 'DEVELOPER_CAC', checkedAt: day }] }));
    expect(await developmentsApi.detail(ID)).toBeNull();
    fetchMock.mockResolvedValueOnce(live());
    expect((await developmentsApi.detail(ID))?.checks).toHaveLength(4);
  });

  it('reads a taken-down development as gone, not as an error', async () => {
    fetchMock.mockRejectedValueOnce(
      new (ApiError as unknown as new (m: string, s: number) => Error)('Not found', 404)
    );
    expect(await developmentsApi.detail(ID)).toBeNull();
    fetchMock.mockRejectedValueOnce(
      new (ApiError as unknown as new (m: string, s: number) => Error)('Down', 503)
    );
    await expect(developmentsApi.detail(ID)).rejects.toThrow('Down');
  });
});

describe('development page lines', () => {
  it('names the registered company only when it differs', () => {
    expect(developerLine({ developerName: 'Palm', registeredName: 'Palm Ltd' })).toBe(
      'By Palm (registered as Palm Ltd)'
    );
    expect(developerLine({ developerName: 'Palm Ltd', registeredName: 'palm ltd' })).toBe(
      'By Palm Ltd'
    );
  });

  it('takes the lowest stated price and never invents one', () => {
    expect(lowestUnitPrice({ unitTypes: [{ id: 'a', name: 'A' }] })).toBeUndefined();
    expect(
      lowestUnitPrice({
        unitTypes: [
          { id: 'a', name: 'A', priceFromNaira: 9 },
          { id: 'b', name: 'B', priceFromNaira: 4 },
        ],
      })
    ).toBe(4);
  });

  it('says which unit type an instalment is for', () => {
    const units = [{ id: 'u1', name: '3-bed terrace' }];
    expect(instalmentContext({ dueWhen: 'On signing', unitTypeId: 'u1' }, units)).toBe(
      'On signing · 3-bed terrace'
    );
    expect(instalmentContext({ dueWhen: 'On signing' }, units)).toBe('On signing · All unit types');
  });

  it('dates an approval as checked by Sureground and keeps the documents private', () => {
    expect(approvalCheckedLine(day)).toMatch(
      /^Checked by Sureground on .*2026\. The documents stay private\.$/
    );
    expect(approvalCheckedLine()).toBe('Checked by Sureground. The documents stay private.');
  });

  it('builds tap-to-call and tap-to-email links', () => {
    expect(telLink('+234 801 234 5678')).toBe('tel:+2348012345678');
    expect(mailLink('sales@palm.ng')).toBe('mailto:sales@palm.ng');
  });

  it('uses the shared wording, which never says Sureground holds the money', () => {
    expect(DEVELOPMENT_PAYMENT_COPY.lead).toBe(
      'You pay the developer directly. Sureground does not take, hold or pass on any money for this development.'
    );
    expect(DEVELOPMENT_NOT_CHECKED.length).toBeGreaterThan(0);
    const all = [DEVELOPMENT_PAYMENT_COPY.lead, ...DEVELOPMENT_PAYMENT_COPY.points].join(' ');
    expect(all).not.toMatch(/escrow|—/i);
  });
});
