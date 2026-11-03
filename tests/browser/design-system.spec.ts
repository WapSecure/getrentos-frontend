import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { auditVisualPage } from './helpers/visualQa';

// Browser-only fixtures exercise the real layouts and components. These tests
// never contact a payment provider or a live backend and cannot seed an account.
const webURL = 'http://localhost:43130';
const adminURL = 'http://localhost:43131';
const stats = {
  totalProperties: 8,
  occupiedUnits: 24,
  reservedUnits: 2,
  vacantUnits: 6,
  annualRentRoll: 86400000,
  outstandingPayments: 3,
  outstandingAmount: 5400000,
  activeMaintenanceRequests: 4,
};
const user = {
  id: 'design-review',
  fullName: 'Joseph Orji',
  email: 'review@example.test',
  roles: ['LANDLORD', 'SUPER_ADMIN'],
};
const property = {
  id: 'property-1',
  name: 'The Meridian, Ikoyi',
  type: 'apartment',
  address: '12 Alexander Road',
  city: 'Ikoyi',
  state: 'Lagos',
  country: 'Nigeria',
  coverImage: '',
  verificationStatus: 'verified',
  totalUnits: 8,
  occupiedUnits: 6,
  annualRentRoll: 24000000,
  referenceCode: 'PR-AB7K-9Q',
  createdAt: '2026-08-01',
};
const empty = { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };

async function reviewPage(page: Page, path: string, info: TestInfo) {
  await auditVisualPage(page, path, info);
  await page.screenshot({
    path: info.outputPath('screen.png'),
    fullPage: true,
    animations: 'disabled',
  });
}

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    ({ user, theme }) => {
      localStorage.setItem('theme', theme);
      localStorage.setItem(
        'getrentos_auth_token',
        `test.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.test`
      );
      localStorage.setItem('getrentos_user', JSON.stringify(user));
    },
    { user, theme: testInfo.project.name.endsWith('dark') ? 'dark' : 'light' }
  );
  await page.route('**/__qa_api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace('/__qa_api', '');
    // Unexpected writes must fail; visual review must never simulate a save.
    if (route.request().method() !== 'GET')
      return route.fulfill({ status: 405, json: { message: 'Read-only visual fixture' } });
    const data: Record<string, unknown> = {
      '/users/me': user,
      '/users/me/preferences': { hideMonetaryValues: false },
      '/geo/locations': [{ name: 'Nigeria', states: ['Lagos', 'Abuja'] }],
      '/landlord/dashboard/stats': stats,
      '/landlord/dashboard/revenue-trend': ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map(
        (label, i) => ({ label, value: [4200000, 5600000, 4800000, 6400000, 7200000, 8100000][i] })
      ),
      '/landlord/dashboard/activity': [
        {
          id: 'rent-1',
          type: 'payment',
          title: 'Rent received',
          description: 'The Meridian · Unit 4B · ₦3,600,000',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'repair-1',
          type: 'maintenance',
          title: 'Plumbing repair requested',
          description: 'Parkview Court · Unit 2A',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'lease-1',
          type: 'lease',
          title: 'Lease signed',
          description: 'The Meridian · Unit 3C',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
      ],
      '/landlord/properties': { ...empty, total: 1, totalPages: 1, items: [property] },
      '/marketplace/saved-listing-ids': [],
      '/rentals': {
        ...empty,
        total: 3,
        totalPages: 1,
        items: [
          {
            id: 'rental-1',
            title: 'Three-bedroom apartment in Ikoyi',
            location: 'Ikoyi, Lagos',
            price: 7200000,
            period: 'year',
            bedrooms: 3,
            bathrooms: 3,
            size: 185,
            rating: 4.8,
            verified: true,
            image: '',
            propertyType: 'APARTMENT',
          },
          {
            id: 'rental-2',
            title: 'Quiet terrace home in Lekki',
            location: 'Lekki Phase 1, Lagos',
            price: 9500000,
            period: 'year',
            bedrooms: 4,
            bathrooms: 4,
            size: 240,
            rating: 4.6,
            verified: true,
            image: '',
            propertyType: 'TERRACE',
          },
          {
            id: 'rental-3',
            title: 'Compact flat near Jabi Lake',
            location: 'Jabi, Abuja',
            price: 3600000,
            period: 'year',
            bedrooms: 2,
            bathrooms: 2,
            size: 110,
            rating: 4.4,
            verified: false,
            image: '',
            propertyType: 'FLAT',
          },
        ],
      },
      '/admin/users': {
        ...empty,
        total: 2,
        totalPages: 1,
        items: [
          {
            id: 'user-1',
            fullName: 'Ada Okafor',
            email: 'ada@example.test',
            roles: ['landlord'],
            status: 'active',
            planTier: 'PRO',
            trustScore: 92,
            joinedDate: '2026-08-01',
            lastActiveAt: '2026-11-01',
          },
          {
            id: 'user-2',
            fullName: 'Tunde Bakare',
            email: 'tunde@example.test',
            roles: ['renter'],
            status: 'pending',
            planTier: 'FREE',
            trustScore: 68,
            joinedDate: '2026-09-01',
            lastActiveAt: '2026-11-01',
          },
        ],
      },
    };
    return route.fulfill({ json: data[path] ?? (path.includes('notifications') ? [] : empty) });
  });
});

test('portfolio overview and navigation', async ({ page }, testInfo) => {
  await reviewPage(page, `${webURL}/landlord/dashboard`, testInfo);
  await expect(
    page.getByRole('heading', { name: /Good (morning|afternoon|evening), Joseph/ })
  ).toBeVisible();
  await expect(page.getByText('Annual Rent Roll', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Manage properties' })).toHaveAttribute(
    'href',
    '/landlord/properties'
  );
  if (testInfo.project.name.startsWith('desktop')) {
    await expect(page.locator('aside [aria-current=page]')).toHaveCount(1);
  }
});

test('property card, menu and add-property sheet', async ({ page }, testInfo) => {
  await reviewPage(page, `${webURL}/landlord/properties`, testInfo);
  const propertyButton = page.getByRole('button', { name: property.name, exact: true });
  await expect(propertyButton).toBeVisible();
  await propertyButton.focus();
  await expect(propertyButton).toBeFocused();
  await page.getByRole('button', { name: `More actions for ${property.name}` }).click();
  await expect(page.getByRole('menuitem', { name: 'Edit Property', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('property-menu.png'), animations: 'disabled' });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Add Property', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('property-sheet.png'),
    animations: 'disabled',
  });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('honest empty portfolio', async ({ page }, testInfo) => {
  await page.route('**/__qa_api/landlord/dashboard/stats', (route) =>
    route.fulfill({ json: { ...stats, totalProperties: 0 } })
  );
  await reviewPage(page, `${webURL}/landlord/dashboard`, testInfo);
  await expect(page.getByText('No properties yet', { exact: true })).toBeVisible();
  await expect(page.getByText('Annual Rent Roll', { exact: true })).toHaveCount(0);
});

test('backoffice user table and controls', async ({ page }, testInfo) => {
  await reviewPage(page, `${adminURL}/admin/users`, testInfo);
  await expect(page.getByText('Ada Okafor', { exact: true })).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
});

test('public rental search and refinements', async ({ page }, testInfo) => {
  await reviewPage(page, `${webURL}/rent`, testInfo);
  await expect(page.getByRole('heading', { name: 'Homes to rent' })).toBeVisible();
  await expect(page.getByText('3 rentals available', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Three-bedroom apartment in Ikoyi' })
  ).toBeVisible();

  const filters = page.getByRole('button', { name: 'Filters' });
  await filters.click();
  await expect(filters).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByLabel('Minimum price')).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('market-filters.png'),
    animations: 'disabled',
  });
});
