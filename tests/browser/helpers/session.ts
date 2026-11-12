import type { Route } from '@playwright/test';

// The web and back-office access token lives in memory only (AU-16): each page load restores it
// with POST /auth/refresh and the httpOnly cookie. Mocked APIs answer that call for the test user.

export function testAccessToken(sub: string): string {
  const payload = { sub, exp: Math.floor(Date.now() / 1000) + 3600 };
  return `test.${Buffer.from(JSON.stringify(payload)).toString('base64')}.test`;
}

export function isSessionRefresh(route: Route): boolean {
  const request = route.request();
  return request.method() === 'POST' && new URL(request.url()).pathname.endsWith('/auth/refresh');
}

export function fulfillSessionRefresh(route: Route, userId: string): Promise<void> {
  return route.fulfill({ json: { accessToken: testAccessToken(userId) } });
}
