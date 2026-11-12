import type { ComponentType, ReactNode } from 'react';
import { screen } from '@testing-library/react-native';
import { getPalette } from '@sureground/tokens';
import { premiumTabBarOptions } from '@/lib/navigationStyles';
import AgentTabs from '@/app/(app)/(agent)/_layout';
import BuyerTabs from '@/app/(app)/(buyer)/_layout';
import EstateTabs from '@/app/(app)/(estate)/_layout';
import GatemanTabs from '@/app/(app)/(gateman)/_layout';
import LandlordTabs from '@/app/(app)/(landlord)/_layout';
import ManagerTabs from '@/app/(app)/(manager)/_layout';
import OwnerTabs from '@/app/(app)/(owner)/_layout';
import RealtorTabs from '@/app/(app)/(realtor)/_layout';
import RenterTabs from '@/app/(app)/(renter)/_layout';
import ResidentTabs from '@/app/(app)/(resident)/_layout';
import { MIN_TOUCH_TARGET, renderWithTheme, type HostElement } from './helpers/a11y';

// The real tab bar is React Navigation's: it names each tab from `title` and gives it the tab
// role. What the app controls is the options it passes, so the layouts render their screens'
// options into plain views here.
jest.mock('expo-router', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const Screen = ({ name, options }: { name: string; options: object }) =>
    createElement(View, { testID: 'tab-screen', tabName: name, tabOptions: options } as object);
  const Tabs = ({ children, screenOptions }: { children: ReactNode; screenOptions: object }) =>
    createElement(View, { testID: 'tabs', tabScreenOptions: screenOptions } as object, children);
  return { Tabs: Object.assign(Tabs, { Screen }) };
});
jest.mock('@/components/gateman/GateQueueSync', () => ({ GateQueueSync: () => null }));
jest.mock('@/lib/gateman/GatemanPostProvider', () => ({
  GatemanPostProvider: ({ children }: { children: ReactNode }) => children,
}));

type TabOptions = {
  title?: string;
  href?: null;
  tabBarIcon?: unknown;
  tabBarShowLabel?: boolean;
  tabBarAccessibilityLabel?: string;
};
type BarOptions = {
  tabBarShowLabel?: boolean;
  tabBarStyle: { height: number; paddingTop: number; paddingBottom: number };
};

const LAYOUTS: [string, ComponentType][] = [
  ['agent', AgentTabs],
  ['buyer', BuyerTabs],
  ['estate', EstateTabs],
  ['gateman', GatemanTabs],
  ['landlord', LandlordTabs],
  ['manager', ManagerTabs],
  ['owner', OwnerTabs],
  ['realtor', RealtorTabs],
  ['renter', RenterTabs],
  ['resident', ResidentTabs],
];

describe.each(LAYOUTS)('%s tab bar', (_role, Layout) => {
  it('names every visible tab and gives it an icon', async () => {
    await renderWithTheme(<Layout />);
    const bar = screen.getByTestId('tabs').props.tabScreenOptions as BarOptions;
    const tabs = (screen.getAllByTestId('tab-screen') as HostElement[])
      .map((el) => ({
        name: el.props.tabName as string,
        options: el.props.tabOptions as TabOptions,
      }))
      .filter(({ options }) => options.href !== null);

    expect(tabs.length).toBeGreaterThanOrEqual(3);
    for (const { name, options } of tabs) {
      const spoken = options.tabBarAccessibilityLabel ?? options.title;
      expect({ name, spoken: spoken?.trim() || undefined }).toEqual({
        name,
        spoken: expect.any(String),
      });
      expect({ name, icon: typeof options.tabBarIcon }).toEqual({ name, icon: 'function' });
      // A hidden label leaves the icon alone, so the tab then needs its own accessibility label.
      if ((options.tabBarShowLabel ?? bar.tabBarShowLabel) === false) {
        expect({ name, label: options.tabBarAccessibilityLabel }).toEqual({
          name,
          label: expect.any(String),
        });
      }
    }
  });
});

describe('tab bar size', () => {
  it.each([0, 34])('leaves every tab at least 44pt tall with a %ipt bottom inset', (inset) => {
    const { tabBarStyle } = premiumTabBarOptions(getPalette('light'), inset);
    const item = tabBarStyle.height - tabBarStyle.paddingTop - tabBarStyle.paddingBottom;
    expect(item).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  });
});
