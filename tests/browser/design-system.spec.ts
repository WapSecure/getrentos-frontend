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
  roles: ['LANDLORD', 'RENTER', 'SUPER_ADMIN'],
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

async function usePersona(page: Page, roles: string[]) {
  const persona = { ...user, roles };

  await page.route('**/__qa_api/users/me', (route) => route.fulfill({ json: persona }));
  await page.addInitScript((personaUser) => {
    localStorage.setItem('getrentos_user', JSON.stringify(personaUser));
  }, persona);
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
      '/renter/applications/notes': [],
      '/renter/applications': {
        ...empty,
        total: 2,
        totalPages: 1,
        items: [
          {
            id: 'application-1',
            propertyId: 'rental-1',
            title: 'Three-bedroom apartment in Ikoyi',
            address: '12 Alexander Road, Ikoyi, Lagos',
            status: 'under_review',
            date: '2026-10-26',
            price: 7200000,
            period: 'year',
            bedrooms: 3,
            bathrooms: 3,
            size: 185,
            image: '',
            applicationDate: '2026-10-26',
            moveInDate: '2026-12-01',
            leaseTerm: '12 months',
            documents: [],
            landlord: {
              name: 'Ada Okafor',
              email: 'ada@example.test',
              phone: '+2348000000000',
              responseRate: 94,
              rating: 4.8,
            },
            timeline: [],
          },
          {
            id: 'application-2',
            propertyId: 'rental-2',
            title: 'Quiet terrace home in Lekki',
            address: 'Fola Osibo Street, Lekki, Lagos',
            status: 'approved',
            date: '2026-10-20',
            price: 9500000,
            period: 'year',
            bedrooms: 4,
            bathrooms: 4,
            size: 240,
            image: '',
            applicationDate: '2026-10-20',
            moveInDate: '2026-12-15',
            leaseTerm: '12 months',
            documents: [],
            landlord: {
              name: 'Tunde Bakare',
              email: 'tunde@example.test',
              phone: '+2348111111111',
              responseRate: 88,
              rating: 4.6,
            },
            timeline: [],
          },
        ],
      },
      '/owner/dashboard': {
        totalProperties: 6,
        verifiedProperties: 5,
        activeListings: 3,
        pendingOffers: 2,
        activeTransactions: 1,
        completedSales: 4,
        portfolioValue: 480000000,
        recentActivity: [
          {
            id: 'owner-activity-1',
            type: 'offer',
            message: 'A buyer submitted an offer for Parkview Court.',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'owner-activity-2',
            type: 'document',
            message: 'The title document for The Meridian was verified.',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
      },
      '/owner/analytics/portfolio-trend': ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map(
        (label, index) => ({ label, value: [420, 431, 438, 451, 466, 480][index] * 1000000 })
      ),
      '/buyer/dashboard': {
        savedListings: 8,
        activeOffers: 2,
        upcomingViewings: 3,
        activeTransactions: 1,
        documentsUploaded: 6,
        completedPurchases: 1,
        recentActivity: [
          {
            id: 'buyer-activity-1',
            type: 'offer',
            message: 'Your offer for The Meridian is being reviewed.',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'buyer-activity-2',
            type: 'viewing',
            message: 'Your Parkview Court viewing is confirmed for Friday.',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
      },
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

test('renter application status and actions', async ({ page }, testInfo) => {
  await reviewPage(page, `${webURL}/renter/applications`, testInfo);
  await expect(page.getByRole('heading', { name: 'My applications' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Three-bedroom apartment in Ikoyi' })
  ).toBeVisible();
  await expect(page.getByText('Status summary', { exact: true })).toBeVisible();
  await expect(page.getByText('Applications shown on this page', { exact: true })).toBeVisible();
  await expect(page.getByText(/success rate/i)).toHaveCount(0);
  await expect(page.getByText('Recommendations', { exact: true })).toHaveCount(0);
});

test('owner portfolio workspace', async ({ page }, testInfo) => {
  await usePersona(page, ['PROPERTY_OWNER']);
  await reviewPage(page, `${webURL}/owner/dashboard`, testInfo);
  await expect(
    page.getByRole('heading', { name: /Good (morning|afternoon|evening), Joseph/ })
  ).toBeVisible();
  await expect(page.getByText('Portfolio value', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Add property', exact: true })).toBeVisible();
  await expect(page.getByText('Owner dashboard', { exact: true })).toHaveCount(0);
});

test('buyer purchase workspace', async ({ page }, testInfo) => {
  await usePersona(page, ['PROPERTY_BUYER']);
  await reviewPage(page, `${webURL}/buyer/dashboard`, testInfo);
  await expect(
    page.getByRole('heading', { name: /Good (morning|afternoon|evening), Joseph/ })
  ).toBeVisible();
  await expect(page.getByText('Active purchases', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Discover properties', exact: true })).toBeVisible();
  await expect(page.getByText('Buyer dashboard', { exact: true })).toHaveCount(0);
});
