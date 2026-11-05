import { resolveIncomingLink } from '@/lib/deepLinks';

const WEB = 'https://getrentos.com';
const go = (url: string) => resolveIncomingLink(url, WEB);

describe('links into the app', () => {
  it('opens a public listing and remembers it for after sign-in', () => {
    expect(go('https://getrentos.com/rent/abc-123')).toEqual({
      route: '/(market)/listing/rent/abc-123',
      listing: { kind: 'rent', id: 'abc-123' },
    });
    expect(go('https://getrentos.com/buy/9?ref=share')).toMatchObject({
      route: '/(market)/listing/sale/9',
    });
    expect(go('https://getrentos.com/shortlets/s1/')).toMatchObject({
      route: '/(market)/listing/shortlet/s1',
    });
    expect(go('https://getrentos.com/land/p1')).toMatchObject({
      route: '/(market)/listing/land/p1',
    });
  });

  it('opens the browse tabs', () => {
    expect(go('https://getrentos.com/rent')).toEqual({ route: '/(market)?kind=rent' });
    expect(go('https://getrentos.com/buy')).toEqual({ route: '/(market)?kind=sale' });
    expect(go('https://getrentos.com/estates')).toEqual({ route: '/(market)?kind=estates' });
  });

  it('reuses the dashboard mapping, with or without /dashboard', () => {
    expect(go('https://getrentos.com/landlord/payments')).toEqual({
      route: '/(app)/landlord-payments',
    });
    expect(go('https://getrentos.com/dashboard/renter/lease')).toEqual({ route: '/(app)/lease' });
    expect(go('https://getrentos.com/land/consents')).toEqual({ route: '/(app)/land-consents' });
  });

  it('maps the land buyer pages', () => {
    expect(go('https://getrentos.com/land/layouts/L1')).toEqual({
      route: '/(app)/land-estate/L1',
    });
    expect(go('https://getrentos.com/land/representing/purchases/P9')).toEqual({
      route: '/(app)/land-represented?kind=purchase&id=P9',
    });
  });

  it('sends a dashboard page the app lacks to the home screen', () => {
    expect(go('https://getrentos.com/landlord/some-new-page')).toEqual({ route: '/' });
  });

  it('hands pages the app lacks back to the website', () => {
    expect(go('https://getrentos.com/land/market?area=lekki')).toEqual({
      web: 'https://getrentos.com/land/market?area=lekki',
    });
    expect(go('https://getrentos.com/rent/abc/photos')).toEqual({
      web: 'https://getrentos.com/rent/abc/photos',
    });
  });

  it('lets a sign-in link through to the root', () => {
    expect(go('https://getrentos.com/magic-link/verify?token=t')).toEqual({ route: '/' });
    expect(go('getrentos://magic-link?token=t')).toEqual({ route: '/' });
  });

  it('leaves the app’s own routes and unrelated paths alone', () => {
    expect(go('/(app)/lease')).toBeNull();
    expect(go('https://getrentos.com/pricing')).toBeNull();
    expect(go('https://getrentos.com/landing')).toBeNull();
  });

  it('survives a malformed id', () => {
    expect(go('https://getrentos.com/rent/%E0%A4%A')).toMatchObject({
      listing: { kind: 'rent', id: '%E0%A4%A' },
    });
  });
});
