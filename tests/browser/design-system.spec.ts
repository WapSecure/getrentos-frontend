import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { auditVisualPage } from './helpers/visualQa';
import { fulfillSessionRefresh, isSessionRefresh } from './helpers/session';

// Browser-only fixtures: never contact a payment provider or a live backend.
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
const estate = {
  id: 'estate-1',
  name: 'Parkview Estate',
  address: '18 Admiralty Way',
  city: 'Lekki',
  state: 'Lagos',
  gateCount: 2,
  lateFeeAmount: 25000,
  graceDays: 5,
  householdCount: 84,
  createdAt: '2026-08-01',
  planTier: 'PRO',
  capacity: 'MANAGER',
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
    localStorage.setItem('sureground_user', JSON.stringify(personaUser));
  }, persona);
}

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    ({ user, theme }) => {
      localStorage.setItem('theme', theme);
      localStorage.setItem('sureground_user', JSON.stringify(user));
    },
    { user, theme: testInfo.project.name.endsWith('dark') ? 'dark' : 'light' }
  );
  await page.route('**/__qa_api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace('/__qa_api', '');
    // Restoring the session on load is not a save.
    if (isSessionRefresh(route)) return fulfillSessionRefresh(route, user.id);
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
      '/agent/dashboard': {
        assignedProperties: 6,
        assignedTasks: 4,
        inProgressTasks: 2,
        completedTasks: 11,
        overdueTasks: 1,
        upcomingTasks: [
          {
            id: 'task-1',
            type: 'INSPECTION',
            title: 'Move-in inspection',
            notes: null,
            priority: 'HIGH',
            status: 'ASSIGNED',
            dueAt: '2026-11-05T10:00:00.000Z',
            property: {
              title: 'The Meridian',
              address: '12 Alexander Road',
              city: 'Ikoyi',
              state: 'Lagos',
            },
            assignedBy: { legalName: 'Joseph Orji', roles: [{ role: 'LANDLORD' }] },
          },
        ],
      },
      '/estate/mine': [estate],
      '/estate/estate-1/dashboard/stats': {
        totalHouseholds: 84,
        duesCollectedThisMonth: 12600000,
        duesOutstanding: 1850000,
        openIncidents: 2,
        openMaintenanceTickets: 5,
        pendingViolations: 3,
      },
      '/estate/estate-1/dashboard/dues-trend': [
        { label: 'May', value: 8100000 },
        { label: 'Jun', value: 9200000 },
        { label: 'Jul', value: 8800000 },
        { label: 'Aug', value: 10400000 },
        { label: 'Sep', value: 11700000 },
        { label: 'Oct', value: 12600000 },
      ],
      '/estate/estate-1/gates': [
        { id: 'gate-1', name: 'Main gate', location: 'Admiralty Way entrance' },
        { id: 'gate-2', name: 'Service gate', location: 'Northern entrance' },
      ],
      '/estate/estate-1/visitor-passes': empty,
      '/estate/resident/household': {
        id: 'household-1',
        unitLabel: 'Maple Close · House 12',
        residentName: 'Joseph Orji',
        status: 'active',
        directoryOptIn: true,
        estate: {
          id: estate.id,
          name: estate.name,
          address: estate.address,
          city: estate.city,
          state: estate.state,
        },
      },
      '/estate/resident/dues': {
        ...empty,
        total: 1,
        totalPages: 1,
        items: [
          {
            id: 'due-1',
            householdId: 'household-1',
            unitLabel: 'Maple Close · House 12',
            residentName: 'Joseph Orji',
            amount: 185000,
            dueDate: '2026-11-01',
            status: 'overdue',
            lateFeeApplied: 0,
            category: 'service_charge',
            billingCycle: 'monthly',
            isRecurring: true,
            createdAt: '2026-10-01',
          },
        ],
      },
      '/estate/resident/announcements': {
        ...empty,
        total: 2,
        totalPages: 1,
        items: [
          {
            id: 'announcement-1',
            title: 'Water maintenance on Saturday',
            body: 'Supply will pause between 9:00 and 11:00 while the main pump is serviced.',
            createdAt: '2026-11-03',
          },
          {
            id: 'announcement-2',
            title: 'November community meeting',
            body: 'The monthly meeting starts at 6:00 PM in the residents hall.',
            createdAt: '2026-11-02',
          },
        ],
      },
      '/estate/resident/emergency': null,
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
      '/admin/dashboard/stats': {
        totalUsers: 18420,
        pendingVerifications: 27,
        openDisputes: 8,
        fraudAlerts: 5,
        activeEscrowTransactions: 43,
        platformGmv: 2860000000,
      },
      '/admin/dashboard/user-growth': ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map(
        (label, index) => ({ label, value: [620, 710, 680, 840, 910, 1040][index] })
      ),
      '/admin/dashboard/activity': [],
      '/admin/reports/stats': {
        gmvYtd: 1760000000,
        activeUsers: 12840,
        avgTrustScore: 78,
        momGrowthPct: 8.4,
      },
      '/admin/reports/revenue-series': ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map(
        (month, index) => ({ month, gmv: [180, 224, 218, 265, 291, 318][index] * 1000000 })
      ),
      '/admin/reports/gmv-breakdown': [
        { category: 'Property sales', amount: 910000000, share: 52 },
        { category: 'Rent payments', amount: 560000000, share: 32 },
        { category: 'Short stays', amount: 290000000, share: 16 },
      ],
      '/admin/verifications': empty,
      '/admin/disputes': empty,
      '/admin/fraud-alerts': empty,
      '/admin/ai/reviews/listing-warnings': [],
      '/admin/client-money/reconciliation': {
        rows: [],
        attestation: null,
      },
      '/admin/client-money/releases': [],
      '/admin/client-money/disputes': [],
      '/admin/maintenance/overview': {
        totalWorkOrders: 146,
        openWorkOrders: 28,
        inProgressWorkOrders: 14,
        resolvedWorkOrders: 97,
        cancelledWorkOrders: 7,
        urgentOpenWorkOrders: 3,
        pendingApprovalWorkOrders: 6,
        slaAtRiskWorkOrders: 5,
      },
      '/admin/maintenance/work-orders': empty,
      '/admin/rentals/overview': {
        totalListings: 428,
        publishedListings: 361,
        pendingVerification: 19,
        pausedListings: 24,
        closedListings: 24,
        openApplications: 87,
        activeLeases: 216,
      },
      '/admin/rentals/listings': empty,
      '/admin/land/diligence': empty,
      // Staff without two-factor see the set-up screen instead of admin pages.
      '/users/me/security/2fa': { enrolled: true, enabled: true, requiredForAdminTools: true },
      '/agent/route': {
        date: new Date().toISOString().slice(0, 10),
        stops: [],
        unplaced: [],
        totalKm: 0,
      },
    };
    const response = Object.prototype.hasOwnProperty.call(data, path)
      ? data[path]
      : path.includes('notifications')
        ? []
        : empty;
    return route.fulfill({ json: response });
  });
});

test('portfolio overview and navigation', async ({ page }, testInfo) => {
  await reviewPage(page, `${webURL}/landlord/dashboard`, testInfo);
  await expect(
    page.getByRole('heading', { name: /Good (morning|afternoon|evening), Joseph/ })
  ).toBeVisible();
  await expect(page.getByText('Annual rent roll', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Manage properties' })).toHaveAttribute(
    'href',
    '/landlord/properties'
  );
  if (testInfo.project.name.startsWith('desktop')) {
    await expect(page.locator('aside [aria-current=page]')).toHaveCount(1);
  }
});

test('role-aware navigation progressively reveals landlord workflows', async ({
  page,
}, testInfo) => {
  await page.goto(`${webURL}/landlord/dashboard`);
  if (testInfo.project.name.startsWith('phone')) {
    const primaryNavigation = page.getByRole('navigation', {
      name: 'Landlord navigation primary',
    });
    await expect(primaryNavigation.getByRole('link')).toHaveCount(5);
    await expect(primaryNavigation.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    await page.getByRole('button', { name: 'Open menu' }).click();
  }

  const navigation = page.getByRole('navigation', {
    name: testInfo.project.name.startsWith('phone')
      ? 'Landlord navigation mobile'
      : 'Landlord navigation',
  });
  await expect(navigation.getByText('Property management', { exact: true })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Properties' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Listings' })).toBeHidden();

  const portfolio = navigation.getByRole('button', { name: 'Lettings' });
  await expect(portfolio).toHaveAttribute('aria-expanded', 'false');
  await portfolio.click();
  await expect(portfolio).toHaveAttribute('aria-expanded', 'true');
  await expect(navigation.getByRole('link', { name: 'Listings' })).toBeVisible();

  await page.reload();
  if (testInfo.project.name.startsWith('phone')) {
    await page.getByRole('button', { name: 'Open menu' }).click();
  }
  const restoredNavigation = page.getByRole('navigation', {
    name: testInfo.project.name.startsWith('phone')
      ? 'Landlord navigation mobile'
      : 'Landlord navigation',
  });
  await expect(restoredNavigation.getByRole('button', { name: 'Lettings' })).toHaveAttribute(
    'aria-expanded',
    'true'
  );
});

test('backoffice navigation keeps operations focused and permissions intact', async ({
  page,
}, testInfo) => {
  await page.goto(`${adminURL}/admin/dashboard`);
  if (testInfo.project.name.startsWith('phone')) {
    const primaryNavigation = page.getByRole('navigation', {
      name: 'Administration primary navigation',
    });
    await expect(primaryNavigation.getByRole('link')).toHaveCount(5);
    await expect(primaryNavigation.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
  }
  const navigation = page.getByRole('navigation', {
    name: testInfo.project.name.startsWith('phone')
      ? 'Administration mobile navigation'
      : 'Administration navigation',
  });
  await expect(navigation.getByText('Operations', { exact: true })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Users' })).toBeVisible();
  const marketplace = navigation.getByRole('button', { name: 'Properties and listings' });
  await expect(marketplace).toHaveAttribute('aria-expanded', 'false');
  await marketplace.click();
  await expect(navigation.getByRole('link', { name: 'Property authorities' })).toBeVisible();
});

test('property card, menu and add-property sheet', async ({ page }, testInfo) => {
  await reviewPage(page, `${webURL}/landlord/properties`, testInfo);
  const propertyButton = page.getByRole('button', { name: property.name, exact: true });
  await expect(propertyButton).toBeVisible();
  await propertyButton.focus();
  await expect(propertyButton).toBeFocused();
  await page.getByRole('button', { name: `More actions for ${property.name}` }).click();
  await expect(page.getByRole('menuitem', { name: 'Edit property', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('property-menu.png'), animations: 'disabled' });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Add property', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('property-sheet.png'),
    animations: 'disabled',
  });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('contextual hub tabs support keyboard navigation', async ({ page }) => {
  await page.goto(`${webURL}/landlord/maintenance`);
  const tabs = page.getByRole('tablist', { name: 'Section tabs' });
  const requests = tabs.getByRole('tab', { name: 'Requests' });
  const homeManagement = tabs.getByRole('tab', { name: 'Home Management' });

  await expect(requests).toHaveAttribute('aria-selected', 'true');
  await requests.focus();
  await page.keyboard.press('ArrowRight');
  await expect(homeManagement).toBeFocused();
  await expect(homeManagement).toHaveAttribute('aria-selected', 'true');
  await expect(page).toHaveURL(/\?tab=home-management$/);
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

test('backoffice operations dashboard', async ({ page }, testInfo) => {
  await reviewPage(page, `${adminURL}/admin/dashboard`, testInfo);
  await expect(
    page.getByRole('heading', { name: /Good (morning|afternoon|evening), Joseph/ })
  ).toBeVisible();
  await expect(page.getByText('Pending verifications', { exact: true })).toBeVisible();
  await expect(page.getByText('Platform growth', { exact: true })).toBeVisible();
  await expect(page.getByText('Quick actions', { exact: true })).toBeVisible();
});

test('backoffice verification queue', async ({ page }, testInfo) => {
  await reviewPage(page, `${adminURL}/admin/verifications`, testInfo);
  await expect(page.getByRole('heading', { name: 'Verification queue' })).toBeVisible();
  await expect(page.getByLabel('Search verification requests')).toBeVisible();
  await expect(page.getByText('No requests match your filters', { exact: true })).toBeVisible();
});

test('backoffice dispute queue', async ({ page }, testInfo) => {
  await reviewPage(page, `${adminURL}/admin/disputes`, testInfo);
  await expect(page.getByRole('heading', { name: 'Disputes and arbitration' })).toBeVisible();
  await expect(page.getByLabel('Search disputes')).toBeVisible();
  await expect(page.getByText('No disputes match your filters', { exact: true })).toBeVisible();
});

test('backoffice fraud queue', async ({ page }, testInfo) => {
  await reviewPage(page, `${adminURL}/admin/fraud`, testInfo);
  await expect(page.getByRole('heading', { name: 'Fraud and risk review' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New alert' })).toBeVisible();
  await expect(page.getByText('No alerts match your filters', { exact: true })).toBeVisible();
});

test('backoffice reporting workspace', async ({ page }, testInfo) => {
  await reviewPage(page, `${adminURL}/admin/reports`, testInfo);
  await expect(page.getByRole('heading', { name: 'Reports and analytics' })).toBeVisible();
  await expect(page.getByText('Platform GMV', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('GMV breakdown by category', { exact: true })).toBeVisible();
});

test('backoffice client-money workspace', async ({ page }, testInfo) => {
  await reviewPage(page, `${adminURL}/admin/client-money`, testInfo);
  await expect(page.getByRole('heading', { name: 'Client money' })).toBeVisible();
  await expect(page.getByText('Nothing has been reconciled yet', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Record bank balance' })).toBeVisible();
});

test('backoffice maintenance operations', async ({ page }, testInfo) => {
  await reviewPage(page, `${adminURL}/admin/maintenance`, testInfo);
  await expect(page.getByRole('heading', { name: 'Maintenance operations' })).toBeVisible();
  await expect(page.getByText('SLA at risk', { exact: true })).toBeVisible();
  await expect(page.getByText('Maintenance queues', { exact: true })).toBeVisible();
});

test('backoffice maintenance queue', async ({ page }, testInfo) => {
  await reviewPage(page, `${adminURL}/admin/maintenance/work-orders`, testInfo);
  await expect(page.getByRole('heading', { name: 'Maintenance work orders' })).toBeVisible();
  await expect(page.getByLabel('Search work orders')).toBeVisible();
  await expect(page.getByText('No work orders found', { exact: true })).toBeVisible();
});

test('backoffice rental operations', async ({ page }, testInfo) => {
  await reviewPage(page, `${adminURL}/admin/rentals`, testInfo);
  await expect(page.getByRole('heading', { name: 'Long-term rental operations' })).toBeVisible();
  await expect(page.getByText('Open applications', { exact: true })).toBeVisible();
  await expect(page.getByText('Management queues', { exact: true })).toBeVisible();
});

test('backoffice rental listings queue', async ({ page }, testInfo) => {
  await reviewPage(page, `${adminURL}/admin/rentals/listings`, testInfo);
  await expect(page.getByRole('heading', { name: 'Long-term listings' })).toBeVisible();
  await expect(page.getByLabel('Search rental listings')).toBeVisible();
  await expect(page.getByText('No rental listings found', { exact: true })).toBeVisible();
});

test('backoffice land diligence queue', async ({ page }, testInfo) => {
  await reviewPage(page, `${adminURL}/admin/land/diligence`, testInfo);
  await expect(page.getByRole('heading', { name: 'Land diligence' })).toBeVisible();
  await expect(page.getByLabel('Search land diligence records')).toBeVisible();
  await expect(
    page.getByText('No land diligence cases match these filters', { exact: true })
  ).toBeVisible();
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
  await expect(page.getByRole('link', { name: 'Add property', exact: true }).first()).toBeVisible();
  await expect(page.getByText('Owner dashboard', { exact: true })).toHaveCount(0);
});

test('buyer purchase workspace', async ({ page }, testInfo) => {
  await usePersona(page, ['PROPERTY_BUYER']);
  await reviewPage(page, `${webURL}/buyer/dashboard`, testInfo);
  await expect(
    page.getByRole('heading', { name: /Good (morning|afternoon|evening), Joseph/ })
  ).toBeVisible();
  await expect(page.getByText('Active purchases', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Discover properties', exact: true }).first()
  ).toBeVisible();
  await expect(page.getByText('Buyer dashboard', { exact: true })).toHaveCount(0);
});

test('field agent operations workspace', async ({ page }, testInfo) => {
  await usePersona(page, ['AGENT']);
  await reviewPage(page, `${webURL}/agent/dashboard`, testInfo);
  await expect(
    page.getByRole('heading', { name: /Good (morning|afternoon|evening), Joseph/ })
  ).toBeVisible();
  await expect(page.getByText('In progress', { exact: true })).toBeVisible();
  await expect(page.getByText('Pending Sync', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Avg. Rating', { exact: true })).toHaveCount(0);
});

test('estate manager operations workspace', async ({ page }, testInfo) => {
  await usePersona(page, ['ESTATE_MANAGER']);
  await reviewPage(page, `${webURL}/estate/dashboard`, testInfo);
  await expect(page.getByRole('heading', { name: estate.name })).toBeVisible();
  await expect(page.getByText('84 households · 2 active gates', { exact: true })).toBeVisible();
  await expect(page.getByText('Dues collection trend', { exact: true })).toBeVisible();
  await expect(page.getByText('Estate dashboard', { exact: true })).toHaveCount(0);
});

test('resident household workspace', async ({ page }, testInfo) => {
  await usePersona(page, ['RESIDENT']);
  await reviewPage(page, `${webURL}/resident/dashboard`, testInfo);
  await expect(page.getByRole('heading', { name: 'Maple Close · House 12' })).toBeVisible();
  await expect(page.getByText('Outstanding dues', { exact: true })).toBeVisible();
  await expect(page.getByText('Water maintenance on Saturday', { exact: true })).toBeVisible();
  await expect(page.getByText('Resident dashboard', { exact: true })).toHaveCount(0);
});

test('gateman check-in workspace', async ({ page }, testInfo) => {
  await usePersona(page, ['GATEMAN']);
  await reviewPage(page, `${webURL}/gateman/verify`, testInfo);
  await expect(page.getByRole('heading', { name: estate.name })).toBeVisible();
  await expect(page.getByLabel('Visitor PIN')).toBeVisible();
  await expect(page.getByText('No gate selected', { exact: true })).toBeVisible();
});
