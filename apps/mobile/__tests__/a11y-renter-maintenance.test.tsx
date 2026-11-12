import type { ReactElement, ReactNode } from 'react';
import { Alert } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen } from '@testing-library/react-native';
import RenterMaintenance from '@/app/(app)/renter-maintenance';
import { maintenanceApi, type MaintenanceRequest } from '@/lib/api/maintenance';
import { qk } from '@/lib/query/keys';
import {
  MIN_TOUCH_TARGET,
  expectAccessiblePressables,
  renderWithTheme,
  touchTarget,
  type HostElement,
} from './helpers/a11y';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
}));
// FlashList needs a measured layout to render rows; a plain map renders every card.
jest.mock('@shopify/flash-list', () => ({
  FlashList: ({
    data,
    renderItem,
    keyExtractor,
  }: {
    data: unknown[];
    renderItem: (info: { item: unknown; index: number }) => ReactElement;
    keyExtractor: (item: unknown) => string;
  }) => {
    const { createElement, Fragment } = jest.requireActual<typeof import('react')>('react');
    return data.map((item, index) =>
      createElement(Fragment, { key: keyExtractor(item) }, renderItem({ item, index }))
    );
  },
}));

const request = (over: Partial<MaintenanceRequest>): MaintenanceRequest => ({
  id: 'm1',
  propertyId: 'p1',
  propertyName: 'Lekki flat',
  title: 'Leaking kitchen tap',
  category: 'plumbing',
  description: 'Drips all night',
  priority: 'medium',
  status: 'submitted',
  isEmergency: false,
  images: [],
  createdAt: '2026-11-01T09:00:00.000Z',
  updatedAt: '2026-11-01T09:00:00.000Z',
  ...over,
});

const ITEMS = [
  request({ id: 'm1', title: 'Leaking kitchen tap', status: 'submitted' }),
  request({
    id: 'm2',
    title: 'Faulty socket',
    status: 'resolved',
    assignedVendorName: 'Ade Electric',
  }),
  request({ id: 'm3', title: 'Broken gate lock', status: 'resolved', vendorRating: 4 }),
];

async function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(qk.renter.maintenance, { items: ITEMS, total: ITEMS.length, page: 1 });
  jest.spyOn(maintenanceApi, 'list').mockResolvedValue({ items: ITEMS } as never);
  return renderWithTheme(<RenterMaintenance />, (children: ReactNode) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  ));
}

const root = () => screen.container as HostElement;

describe('renter maintenance cards', () => {
  afterEach(() => jest.restoreAllMocks());

  it('every card action has a role, a name and a 44pt target', async () => {
    await renderScreen();
    const pressables = expectAccessiblePressables(root());
    // Back, report, cancel on the open request, rate on the unrated repair.
    expect(pressables).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Report an issue' })).toBeTruthy();
    for (const name of [
      'Cancel request: Leaking kitchen tap',
      'Rate the vendor for Faulty socket',
    ]) {
      expect(touchTarget(screen.getByRole('button', { name })).height).toBeGreaterThanOrEqual(
        MIN_TOUCH_TARGET
      );
    }
  });

  it('cancelling asks for confirmation with clearly named choices', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await renderScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Cancel request: Leaking kitchen tap' })
    );
    expect(alert).toHaveBeenCalledWith(
      'Cancel this request?',
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Keep it', style: 'cancel' }),
        expect.objectContaining({ text: 'Cancel request', style: 'destructive' }),
      ])
    );
  });

  it('the star rating is a named radio group with 44pt stars', async () => {
    await renderScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Rate the vendor for Faulty socket' })
    );
    const pressables = expectAccessiblePressables(root());
    expect(pressables).toHaveLength(9);
    expect(screen.getByLabelText('Vendor rating').props.accessibilityRole).toBe('radiogroup');
    for (const name of ['1 star', '2 stars', '3 stars', '4 stars', '5 stars']) {
      const star = screen.getByRole('radio', { name });
      expect(star).not.toBeChecked();
      expect(touchTarget(star)).toEqual({ height: MIN_TOUCH_TARGET, width: MIN_TOUCH_TARGET });
    }
  });
});
