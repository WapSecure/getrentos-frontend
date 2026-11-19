import type { ErrorEvent } from '@sentry/react-native';
import { FILTERED, scrubBreadcrumb, scrubEvent, scrubText, scrubUrl } from '@/lib/sentryScrub';

describe('scrubUrl', () => {
  it('strips the query string and fragment', () => {
    expect(scrubUrl('https://api.getsureground.io/listings?page=2#top')).toBe(
      'https://api.getsureground.io/listings'
    );
    expect(scrubUrl('sureground://oauth?code=abc&state=xyz')).toBe('sureground://oauth');
  });

  it('redacts the segment after a token-like path segment', () => {
    expect(scrubUrl('https://api.x.io/agency/owner-invites/claim/abc123')).toBe(
      `https://api.x.io/agency/owner-invites/claim/${FILTERED}`
    );
    expect(scrubUrl('/auth/reset-password/s3cr3t')).toBe(`/auth/reset-password/${FILTERED}`);
  });

  it('redacts opaque ids and long numbers anywhere in the path', () => {
    expect(scrubUrl('/payouts/0123456789')).toBe(`/payouts/${FILTERED}`);
    expect(scrubUrl('/leases/7c9e6679-7425-40de-944b-e07fc1f90ae7/sign')).toBe(
      `/leases/${FILTERED}/sign`
    );
  });

  it('keeps ordinary paths readable', () => {
    expect(scrubUrl('/landlord/properties/12')).toBe('/landlord/properties/12');
  });
});

describe('scrubText', () => {
  it('redacts token-like key=value pairs and URLs inside free text', () => {
    const text = 'GET https://api.x.io/agency/join?token=abc failed; pin=1234 otpCode=999 page=3';
    const out = scrubText(text);
    expect(out).not.toMatch(/abc|1234|999/);
    expect(out).toContain('https://api.x.io/agency/join');
    expect(out).toContain('page=3');
  });

  it.each([
    'token',
    'code',
    'invite',
    'magic',
    'reset',
    'otp',
    'password',
    'pin',
    'nin',
    'bvn',
    'account',
  ])('redacts %s', (name) => {
    expect(scrubText(`${name}=topsecret`)).toBe(`${name}=${FILTERED}`);
  });
});

describe('scrubBreadcrumb', () => {
  it('scrubs fetch breadcrumbs and drops bodies', () => {
    const crumb = scrubBreadcrumb({
      category: 'fetch',
      data: {
        url: 'https://api.x.io/auth/magic-link/verify?token=abc',
        method: 'POST',
        status_code: 200,
        body: '{"password":"hunter2"}',
      },
    });
    expect(crumb.data).toEqual({
      url: `https://api.x.io/auth/magic-link/${FILTERED}`,
      method: 'POST',
      status_code: 200,
    });
  });

  it('scrubs navigation breadcrumbs and route params', () => {
    const crumb = scrubBreadcrumb({
      category: 'navigation',
      message: 'Navigated to /agency/join?token=abc',
      data: { from: '/home', to: '/reset-password/xyz?code=1', params: { token: 'abc', id: '12' } },
    });
    expect(crumb.message).toBe('Navigated to /agency/join');
    expect(crumb.data).toEqual({
      from: '/home',
      to: `/reset-password/${FILTERED}`,
      params: { token: FILTERED, id: '12' },
    });
  });
});

describe('scrubEvent', () => {
  it('drops request bodies and scrubs the url, message, route name and exception text', () => {
    const event = scrubEvent({
      type: undefined,
      message: 'failed at /agency/owner-invites/claim/tok123',
      transaction: '/agency/join?invite=abc',
      request: {
        url: 'https://api.x.io/auth/reset?token=abc',
        data: '{"pin":"1234"}',
        query_string: 'token=abc',
        method: 'POST',
      },
      exception: { values: [{ type: 'ApiError', value: 'Bad code=5555 for /claim/tok' }] },
      breadcrumbs: [{ category: 'xhr', data: { url: '/auth/otp?otp=1' } }],
    } as ErrorEvent);
    expect(event.request).toEqual({ url: 'https://api.x.io/auth/reset', method: 'POST' });
    expect(event.message).toBe(`failed at /agency/owner-invites/claim/${FILTERED}`);
    expect(event.transaction).toBe('/agency/join');
    expect(event.exception?.values?.[0].value).toBe(`Bad code=${FILTERED} for /claim/${FILTERED}`);
    expect(event.breadcrumbs?.[0].data).toEqual({ url: '/auth/otp' });
  });
});
