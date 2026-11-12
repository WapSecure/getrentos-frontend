import type { ReactNode } from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import DettyDecember from '@/app/(app)/detty-december';
import { expectAccessiblePressables, renderWithTheme, type HostElement } from './helpers/a11y';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
// The results list fetches stays; the screen's own content is the header it hands the list.
jest.mock('@/components/shortlet/StayResults', () => ({
  StayResults: ({ header }: { header: ReactNode }) => header,
}));
// Shown only once the support line is configured; configure it so its buttons are checked too.
jest.mock('@/lib/support', () => ({
  ...jest.requireActual<object>('@/lib/support'),
  SUPPORT: { phone: '+2348000000000', whatsapp: '2348000000000', hours: '', email: '' },
  hasSupportLine: () => true,
}));

describe('Detty December screen', () => {
  it('every control has a role and a name', async () => {
    await renderWithTheme(<DettyDecember />);
    const pressables = expectAccessiblePressables(screen.container as HostElement);
    // Back, two support links, three week chips.
    expect(pressables).toHaveLength(6);
    expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Call us' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Detty December, sorted.' })).toBeTruthy();
  });

  it('the week chips report which week is selected', async () => {
    await renderWithTheme(<DettyDecember />);
    const season = screen.getByRole('button', { name: 'The whole season' });
    expect(season).not.toBeSelected();
    await fireEvent.press(season);
    expect(screen.getByRole('button', { name: 'The whole season' })).toBeSelected();
    expectAccessiblePressables(screen.container as HostElement);
  });
});
