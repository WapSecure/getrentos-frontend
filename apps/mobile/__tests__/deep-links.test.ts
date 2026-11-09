import { resolveIncomingLink } from '@/lib/deepLinks';

const WEB = 'https://getsureground.io';
const go = (url: string) => resolveIncomingLink(url, WEB);

describe('links into the app', () => {
  it('opens a public listing and remembers it for after sign-in', () => {
    expect(go('https://getsureground.io/rent/abc-123')).toEqual({
      route: '/(market)/listing/rent/abc-123',
      listing: { kind: 'rent', id: 'abc-123' },
    });
    expect(go('https://getsureground.io/buy/9?ref=share')).toMatchObject({
      route: '/(market)/listing/sale/9',
    });
    expect(go('https://getsureground.io/shortlets/s1/')).toMatchObject({
      route: '/(market)/listing/shortlet/s1',
    });
    expect(go('https://getsureground.io/land/p1')).toMatchObject({
      route: '/(market)/listing/land/p1',
    });
  });

  it('opens the browse tabs', () => {
    expect(go('https://getsureground.io/rent')).toEqual({ route: '/(market)?kind=rent' });
    expect(go('https://getsureground.io/buy')).toEqual({ route: '/(market)?kind=sale' });
    expect(go('https://getsureground.io/estates')).toEqual({ route: '/(market)?kind=estates' });
  });

  it('reuses the dashboard mapping, with or without /dashboard', () => {
    expect(go('https://getsureground.io/landlord/payments')).toEqual({
      route: '/(app)/landlord-payments',
    });
    expect(go('https://getsureground.io/dashboard/renter/lease')).toEqual({
      route: '/(app)/lease',
    });
    expect(go('https://getsureground.io/land/consents')).toEqual({ route: '/(app)/land-consents' });
  });

  it('maps the land buyer pages', () => {
    expect(go('https://getsureground.io/land/layouts/L1')).toEqual({
      route: '/(app)/land-estate/L1',
    });
    expect(go('https://getsureground.io/land/representing/purchases/P9')).toEqual({
      route: '/(app)/land-represented?kind=purchase&id=P9',
    });
  });

  it('opens landlord and estate public pages', () => {
    expect(go('https://getsureground.io/l/ada-homes')).toEqual({
      route: '/(public)/landlord/ada-homes',
    });
    expect(go('https://getsureground.io/e/palm-court-estate')).toEqual({
      route: '/(public)/estate/palm-court-estate',
    });
    expect(go('https://getsureground.io/l/ada-homes/extra')).toEqual({
      web: 'https://getsureground.io/l/ada-homes/extra',
    });
    expect(go('https://getsureground.io/login')).toBeNull();
  });

  it('sends a dashboard page the app lacks to the home screen', () => {
    expect(go('https://getsureground.io/landlord/some-new-page')).toEqual({ route: '/' });
  });

  it('hands pages the app lacks back to the website', () => {
    expect(go('https://getsureground.io/land/market?area=lekki')).toEqual({
      web: 'https://getsureground.io/land/market?area=lekki',
    });
    expect(go('https://getsureground.io/rent/abc/photos')).toEqual({
      web: 'https://getsureground.io/rent/abc/photos',
    });
  });

  it('lets a sign-in link through to the root', () => {
    expect(go('https://getsureground.io/magic-link/verify?token=t')).toEqual({ route: '/' });
    expect(go('sureground://magic-link?token=t')).toEqual({ route: '/' });
  });

  it('leaves the app’s own routes and unrelated paths alone', () => {
    expect(go('/(app)/lease')).toBeNull();
    expect(go('https://getsureground.io/pricing')).toBeNull();
    expect(go('https://getsureground.io/landing')).toBeNull();
  });

  it('survives a malformed id', () => {
    expect(go('https://getsureground.io/rent/%E0%A4%A')).toMatchObject({
      listing: { kind: 'rent', id: '%E0%A4%A' },
    });
  });
});
