import { useState } from 'react';
import { View } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { AlertTriangle, Banknote, FileText, Plus, Wrench } from '@sureground/icons/native';
import {
  ActivityFeed,
  AttentionCard,
  PortfolioCard,
  QuickActions,
} from '@/components/dashboard/DashboardParts';
import {
  MIN_TOUCH_TARGET,
  expectAccessiblePressables,
  renderWithTheme,
  touchTarget,
  type HostElement,
} from './helpers/a11y';

const noop = () => undefined;
const root = () => screen.container as HostElement;

// The landlord home's building blocks, with the landlord's own quick actions.
function LandlordHome() {
  const [showMoney, setShowMoney] = useState(true);
  return (
    <View>
      <PortfolioCard
        label="Annual rent roll"
        amount={12_500_000}
        hint="A year of rent from your signed leases"
        loading={false}
        visible={showMoney}
        onToggle={() => setShowMoney((v) => !v)}
      />
      <AttentionCard
        Icon={AlertTriangle}
        title="2 rent payments overdue"
        detail="Follow up with your tenants"
        tone="warning"
        onPress={noop}
      />
      <QuickActions
        actions={[
          { label: 'Add property', Icon: Plus, onPress: noop },
          { label: 'Applications', Icon: FileText, onPress: noop },
          { label: 'Rent payments', Icon: Banknote, onPress: noop, badge: 2 },
          { label: 'Maintenance', Icon: Wrench, onPress: noop, badge: 1 },
        ]}
      />
      <ActivityFeed
        emptyText="No activity yet"
        items={Array.from({ length: 7 }, (_, i) => ({
          id: `a${i}`,
          Icon: FileText,
          title: `Lease signed ${i + 1}`,
          timestamp: new Date(2026, 10, 1 + i).toISOString(),
        }))}
      />
    </View>
  );
}

describe('landlord home', () => {
  it('every quick action, card and toggle has a role, a name and a 44pt target', async () => {
    await renderWithTheme(<LandlordHome />);
    const pressables = expectAccessiblePressables(root());
    // Money toggle, attention card, four quick actions, "Show 2 more".
    expect(pressables).toHaveLength(7);

    for (const name of [
      'Add property',
      'Applications',
      'Rent payments, 2 open',
      'Maintenance, 1 open',
    ]) {
      const action = screen.getByRole('button', { name });
      expect(touchTarget(action).height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    }
    expect(screen.getByRole('button', { name: '2 rent payments overdue' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Show 2 more' })).toBeTruthy();
  });

  it('the money toggle stays reachable beside the figure it hides', async () => {
    await renderWithTheme(<LandlordHome />);
    const hide = screen.getByRole('button', { name: 'Hide monetary values' });
    expect(hide).toBeExpanded();
    expect(screen.getByLabelText(/^Annual rent roll, 12,500,000 naira/)).toBeTruthy();

    await fireEvent.press(hide);
    expect(screen.getByRole('button', { name: 'Show monetary values' })).toBeCollapsed();
    expect(screen.getByLabelText('Annual rent roll hidden')).toBeTruthy();
    expectAccessiblePressables(root());
  });
});
