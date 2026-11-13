import { useState } from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { DurationChoice, PassTicket, visitorInitials } from '@/components/resident/VisitorParts';
import ResidentCommunity from '@/app/(app)/(resident)/community';
import { expectAccessiblePressables, renderWithTheme, type HostElement } from './helpers/a11y';

const root = () => screen.container as HostElement;

const OPTIONS = [
  { label: '2 hours', hours: 2 },
  { label: '4 hours', hours: 4 },
  { label: '24 hours', hours: 24 },
  { label: '3 days', hours: 72 },
] as const;

describe('visitorInitials', () => {
  it('takes the first and last names', () => {
    expect(visitorInitials('Tunde Adekunle')).toBe('TA');
    expect(visitorInitials('  ada   ngozi  okafor ')).toBe('AO');
  });

  it('copes with a single name or none', () => {
    expect(visitorInitials('Chidi')).toBe('C');
    expect(visitorInitials('   ')).toBe('?');
  });
});

describe('DurationChoice', () => {
  function Harness() {
    const [hours, setHours] = useState(24);
    return (
      <DurationChoice label="Pass lasts for" options={OPTIONS} value={hours} onChange={setHours} />
    );
  }

  it('offers each option as a labelled radio at least 44pt tall', async () => {
    await renderWithTheme(<Harness />);
    expect(expectAccessiblePressables(root())).toHaveLength(OPTIONS.length);
    expect(screen.getAllByRole('radio')).toHaveLength(OPTIONS.length);
  });

  it('marks the chosen option as selected', async () => {
    await renderWithTheme(<Harness />);
    expect(screen.getByRole('radio', { name: '24 hours' })).toBeSelected();
    await fireEvent.press(screen.getByRole('radio', { name: '3 days' }));
    expect(screen.getByRole('radio', { name: '3 days' })).toBeSelected();
    expect(screen.getByRole('radio', { name: '24 hours' })).not.toBeSelected();
  });
});

describe('PassTicket', () => {
  it('reads the PIN digit by digit and shows who it is for', async () => {
    await renderWithTheme(
      <PassTicket
        pass={{
          visitorName: 'Tunde Adekunle',
          unitLabel: 'Block C, Flat 4',
          pin: '482913',
          qrDataUrl: 'data:image/png;base64,AAAA',
          expiresAt: '2026-11-13T18:00:00.000Z',
        }}
      />
    );
    expect(screen.getByLabelText('PIN 4 8 2 9 1 3')).toBeTruthy();
    expect(screen.getByText('Tunde Adekunle')).toBeTruthy();
    expect(screen.getByText('Visiting Block C, Flat 4')).toBeTruthy();
    expect(screen.getByLabelText("QR code for Tunde Adekunle's pass")).toBeTruthy();
  });
});

describe('resident services screen', () => {
  it('lists every service once, grouped, as reachable 44pt rows', async () => {
    await renderWithTheme(<ResidentCommunity />);
    const rows = expectAccessiblePressables(root());
    expect(rows).toHaveLength(10);
    for (const title of ['Your home', 'At the gate', 'Community life', 'Running the estate']) {
      expect(screen.getByRole('header', { name: title })).toBeTruthy();
    }
    expect(screen.getByRole('button', { name: 'Visitor passes' })).toBeTruthy();
  });
});
