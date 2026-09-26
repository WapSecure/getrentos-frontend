import { apiFetch } from '@/lib/api/client';
import { publicMarketApi } from '@/lib/api/publicMarket';
import { landApi } from '@/lib/api/land';
import { shouldPersistQuery } from '@/lib/query/persistencePolicy';
import { qk } from '@/lib/query/keys';

jest.mock('@/lib/api/client', () => ({ apiFetch: jest.fn() }));

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;
const page = <T>(items: T[]) => ({
  items,
  total: items.length,
  page: 1,
  pageSize: 20,
  totalPages: 1,
});

/** The query string of the most recent request, as a plain object. */
const lastQuery = () => {
  const [path] = fetchMock.mock.calls.at(-1)!;
  const [route, qs = ''] = String(path).split('?');
  return { route, params: Object.fromEntries(new URLSearchParams(qs)) };
};

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(page([]));
});

describe('public marketplace requests', () => {
  // The API runs with forbidNonWhitelisted: one undeclared param is a 400, so
  // each market must send exactly the names its route declares.
  const filters = {
    search: 'Lekki',
    estate: 'palm-grove',
    minPrice: 1,
    maxPrice: 9,
    sort: 'price_asc',
  } as const;

  it('rentals use `search` and the renter sort vocabulary', async () => {
    await publicMarketApi.list('rent', filters);
    expect(lastQuery()).toEqual({
      route: '/rentals',
      params: {
        page: '1',
        pageSize: '20',
        minPrice: '1',
        maxPrice: '9',
        search: 'Lekki',
        estate: 'palm-grove',
        sortBy: 'price-low',
      },
    });
  });

  it('sales filter by `city` and keep `sort`', async () => {
    await publicMarketApi.list('sale', filters);
    expect(lastQuery()).toEqual({
      route: '/marketplace/listings',
      params: {
        page: '1',
        pageSize: '20',
        minPrice: '1',
        maxPrice: '9',
        city: 'Lekki',
        estate: 'palm-grove',
        sort: 'price_asc',
      },
    });
  });

  it('shortlets send no price or sort params', async () => {
    await publicMarketApi.list('shortlet', filters);
    expect(lastQuery()).toEqual({
      route: '/shortlets',
      params: { page: '1', pageSize: '20', search: 'Lekki', estate: 'palm-grove' },
    });
  });

  it('land searches by `city` and never sends `search` or `estate`', async () => {
    await publicMarketApi.list('land', filters);
    expect(lastQuery()).toEqual({
      route: '/land',
      params: {
        page: '1',
        pageSize: '20',
        minPrice: '1',
        maxPrice: '9',
        city: 'Lekki',
        sort: 'price_asc',
      },
    });
  });

  it('the signed-in land screen also maps its search box to `city`', async () => {
    await landApi.list({ search: 'Ibeju', sort: 'newest' });
    expect(lastQuery().params).toEqual({
      sort: 'newest',
      city: 'Ibeju',
      page: '1',
      pageSize: '20',
    });
  });

  it('never attaches the session token', async () => {
    await publicMarketApi.list('rent', {});
    expect(fetchMock.mock.calls.at(-1)![1]).toEqual({ anonymous: true });
  });
});

describe('public marketplace normalisation', () => {
  it('hides zero bedroom counts instead of claiming "0 bed"', async () => {
    fetchMock.mockResolvedValueOnce(
      page([
        {
          id: 'r1',
          title: 'Flat',
          location: 'Yaba, Lagos',
          price: '1200000',
          period: 'year',
          bedrooms: 0,
          bathrooms: 2,
          size: 0,
          rating: 0,
          verified: true,
          image: '',
        },
      ])
    );
    const { items } = await publicMarketApi.list('rent', {});
    expect(items[0]).toMatchObject({
      kind: 'rent',
      price: 1200000,
      period: 'year',
      bedrooms: undefined,
      bathrooms: 2,
      image: undefined,
      verified: true,
    });
  });

  it('orders a shortlet page by price when asked, since the API cannot', async () => {
    const stay = (id: string, nightlyRate: number) => ({
      id,
      listingId: id,
      title: id,
      city: 'Lagos',
      state: 'Lagos',
      nightlyRate,
      maxGuests: 2,
      instantBooking: false,
      isVerified: false,
    });
    fetchMock.mockResolvedValueOnce(page([stay('a', 50000), stay('b', 20000), stay('c', 35000)]));
    const { items } = await publicMarketApi.list('shortlet', { sort: 'price_asc' });
    expect(items.map((i) => i.id)).toEqual(['b', 'c', 'a']);
    expect(items[0]).toMatchObject({ period: 'night', highlight: 'Up to 2 guests' });
  });

  it('keeps public market data in the offline cache', () => {
    expect(
      shouldPersistQuery({ queryKey: qk.market.list('rent', {}), state: { status: 'success' } })
    ).toBe(true);
  });
});
