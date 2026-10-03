import { apiFetch } from '@/lib/api/client';
import { activeFilterCount, marketWebPath, publicMarketApi } from '@/lib/api/publicMarket';
import { landApi } from '@/lib/api/land';
import { shouldPersistQuery } from '@/lib/query/persistencePolicy';
import { qk } from '@/lib/query/keys';
import { forgetListing, rememberListing, takeListingHref } from '@/lib/pendingListing';

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
  // each market must send exactly the names its route declares. Filters a
  // market does not take are passed in on purpose, to prove they are dropped.
  const everything = {
    search: 'Lekki',
    estate: 'palm-grove',
    minPrice: 1,
    maxPrice: 9,
    sort: 'price_asc',
    bedrooms: 2,
    bathrooms: 1,
    propertyType: 'APARTMENT',
    verifiedOnly: true,
    furnished: true,
    petsAllowed: true,
    monthlyPayment: true,
    guests: 3,
    instantBooking: true,
    titleType: 'CERTIFICATE_OF_OCCUPANCY',
    minAreaSqm: 450,
    roadAccess: true,
  } as const;
  const paging = { page: '1', pageSize: '20' };
  const common = { ...paging, search: 'Lekki', minPrice: '1', maxPrice: '9', estate: 'palm-grove' };
  const rooms = { bedrooms: '2', bathrooms: '1', propertyType: 'APARTMENT', verifiedOnly: 'true' };

  it('rentals send rooms, rental extras and the renter sort vocabulary', async () => {
    await publicMarketApi.list('rent', everything);
    expect(lastQuery()).toEqual({
      route: '/rentals',
      params: {
        ...common,
        ...rooms,
        furnished: 'true',
        petsAllowed: 'true',
        monthlyPayment: 'true',
        sortBy: 'price-low',
      },
    });
  });

  it('sales search full text and send rooms, but no rental extras', async () => {
    await publicMarketApi.list('sale', everything);
    expect(lastQuery()).toEqual({
      route: '/marketplace/listings',
      params: { ...common, ...rooms, sort: 'price_asc' },
    });
  });

  it('shortlets sort and price on the server, with guests and instant booking', async () => {
    await publicMarketApi.list('shortlet', everything);
    expect(lastQuery()).toEqual({
      route: '/shortlets',
      params: { ...common, ...rooms, guests: '3', instantBooking: 'true', sort: 'price_asc' },
    });
  });

  it('land searches full text with parcel filters, and no room filters', async () => {
    await publicMarketApi.list('land', everything);
    expect(lastQuery()).toEqual({
      route: '/land',
      params: {
        ...common,
        titleType: 'CERTIFICATE_OF_OCCUPANCY',
        minAreaSqm: '450',
        roadAccess: 'true',
        sort: 'price_asc',
      },
    });
  });

  it('leaves unticked toggles off the wire: false means "don’t filter"', async () => {
    await publicMarketApi.list('rent', { verifiedOnly: false, furnished: false });
    expect(lastQuery().params).toEqual(paging);
  });

  it('the signed-in land screen searches full text too', async () => {
    await landApi.list({ search: 'Ibeju', sort: 'newest' });
    expect(lastQuery().params).toEqual({
      search: 'Ibeju',
      sort: 'newest',
      page: '1',
      pageSize: '20',
    });
  });

  it('never attaches the session token', async () => {
    await publicMarketApi.list('rent', {});
    expect(fetchMock.mock.calls.at(-1)![1]).toEqual({ anonymous: true });
  });
});

describe('public marketplace helpers', () => {
  it('counts only the refinements a market accepts', () => {
    const f = { bedrooms: 2, titleType: 'SURVEY_PLAN', verifiedOnly: false, minPrice: 5 };
    expect(activeFilterCount('rent', f)).toBe(2); // bedrooms, minPrice
    expect(activeFilterCount('land', f)).toBe(2); // titleType, minPrice
  });

  it('shares the public web page for every market', () => {
    expect(marketWebPath('rent', 'a')).toBe('/rent/a');
    expect(marketWebPath('sale', 'b')).toBe('/buy/b');
    expect(marketWebPath('shortlet', 'c')).toBe('/shortlets/c');
    expect(marketWebPath('land', 'd')).toBe('/land/d');
  });
});

describe('returning to a listing after sign-in', () => {
  afterEach(forgetListing);

  it('opens the listing in a portal that can load it, once', () => {
    rememberListing('rent', 'r1');
    expect(takeListingHref('renter')).toEqual({
      pathname: '/(app)/property/[id]',
      params: { id: 'r1' },
    });
    expect(takeListingHref('renter')).toBeNull();
  });

  it('falls back to the portal home when the role cannot open that market', () => {
    rememberListing('sale', 's1');
    expect(takeListingHref('landlord')).toBeNull();
  });

  it('opens public markets from any portal', () => {
    rememberListing('shortlet', 'x');
    expect(takeListingHref('landlord')).toEqual({
      pathname: '/(app)/shortlet/[id]',
      params: { id: 'x' },
    });
  });

  it('ignores an intent from an abandoned sign-in', () => {
    rememberListing('land', 'l1');
    expect(takeListingHref('buyer', Date.now() + 31 * 60 * 1000)).toBeNull();
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

  it('keeps the server’s shortlet order: sorting is the API’s job now', async () => {
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
    fetchMock.mockResolvedValueOnce(page([stay('a', 50000), stay('b', 20000)]));
    const { items } = await publicMarketApi.list('shortlet', { sort: 'price_asc' });
    expect(items.map((i) => i.id)).toEqual(['a', 'b']);
    expect(items[0]).toMatchObject({ period: 'night', highlight: 'Up to 2 guests' });
  });

  describe('shortlets with dates', () => {
    const stay = (over: Record<string, unknown> = {}) => ({
      id: 's1',
      listingId: 's1',
      title: 'Ikoyi flat',
      city: 'Lagos',
      state: 'Lagos',
      nightlyRate: 100000,
      maxGuests: 4,
      instantBooking: true,
      isVerified: true,
      ...over,
    });

    it('sends the dates only as a pair', async () => {
      await publicMarketApi.list('shortlet', { checkIn: '2026-12-20', checkOut: '2026-12-27' });
      expect(lastQuery().params).toMatchObject({ checkIn: '2026-12-20', checkOut: '2026-12-27' });
      await publicMarketApi.list('shortlet', { checkIn: '2026-12-20' });
      expect(lastQuery().params).not.toHaveProperty('checkIn');
    });

    it('never sends dates to the other markets', async () => {
      await publicMarketApi.list('rent', { checkIn: '2026-12-20', checkOut: '2026-12-27' });
      expect(lastQuery().params).not.toHaveProperty('checkIn');
    });

    it('shows the total for the dates, with what it includes', async () => {
      fetchMock.mockResolvedValueOnce(
        page([
          stay({
            stayQuote: {
              bookable: true,
              quote: {
                nights: 7,
                nightsTotal: 630000,
                cleaningFee: 20000,
                tax: 48750,
                taxName: 'VAT',
                total: 698750,
                perNight: 90000,
              },
            },
          }),
        ])
      );
      const { items } = await publicMarketApi.list('shortlet', {
        checkIn: '2026-11-10',
        checkOut: '2026-11-17',
      });
      expect(items[0]).toMatchObject({
        price: 698750,
        period: 'total',
        highlight: 'Total for 7 nights · incl. cleaning & VAT',
      });
    });

    it('says why the dates don’t work, and keeps the nightly price', async () => {
      fetchMock.mockResolvedValueOnce(
        page([stay({ stayQuote: { bookable: false, reason: 'Minimum stay is 5 night(s).' } })])
      );
      const { items } = await publicMarketApi.list('shortlet', {
        checkIn: '2026-12-20',
        checkOut: '2026-12-22',
      });
      expect(items[0]).toMatchObject({
        price: 100000,
        period: 'night',
        highlight: 'Minimum stay is 5 night(s).',
      });
    });

    it('carries the trust signals a stay has earned', async () => {
      fetchMock.mockResolvedValueOnce(
        page([
          stay({
            inspection: { inspectedAt: '2026-08-01' },
            fairPrice: { typicalNightly: 110000 },
          }),
          stay({ id: 's2', listingId: 's2' }),
        ])
      );
      const { items } = await publicMarketApi.list('shortlet', {});
      expect(items[0].badges).toEqual(['Inspected', 'Fair price']);
      expect(items[1].badges).toEqual([]);
    });

    it('quotes one stay without an account', async () => {
      await publicMarketApi.stayQuote('s1', '2026-11-10', '2026-11-17');
      const [path, opts] = fetchMock.mock.calls.at(-1)!;
      expect(path).toBe('/shortlets/s1/availability?checkIn=2026-11-10&checkOut=2026-11-17');
      expect(opts).toMatchObject({ anonymous: true });
    });
  });

  it('keeps public market data in the offline cache', () => {
    expect(
      shouldPersistQuery({ queryKey: qk.market.list('rent', {}), state: { status: 'success' } })
    ).toBe(true);
  });
});
