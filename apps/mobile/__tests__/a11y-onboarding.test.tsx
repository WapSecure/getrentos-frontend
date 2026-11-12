import type { ReactNode } from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import Onboarding from '@/app/(auth)/onboarding';
import { expectAccessiblePressables, renderWithTheme, type HostElement } from './helpers/a11y';

jest.mock('expo-router', () => ({ router: { replace: jest.fn(), push: jest.fn() } }));
// The illustrations are decorative and hidden from screen readers; stub them out.
jest.mock('@/components/onboarding/OnboardingScenes', () => ({
  FindPropertiesScene: () => null,
  EscrowScene: () => null,
  VerifiedPeopleScene: () => null,
  SceneMotionProvider: ({ children }: { children: ReactNode }) => children,
}));
// Without animation the slides change on press, so the last slide can be reached in a test.
jest.mock('@sureground/ui-native', () => ({
  ...jest.requireActual<object>('@sureground/ui-native'),
  useReducedMotion: () => true,
}));

const root = () => screen.container as HostElement;

describe('onboarding slides', () => {
  it('every control on the first slide has a role and a name', async () => {
    await renderWithTheme(<Onboarding />);
    expectAccessiblePressables(root());
    expect(screen.getByRole('button', { name: 'Skip' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Browse homes' })).toBeTruthy();
    expect(
      screen.getByRole('header', { name: /^Discover\. Find properties without the guesswork\./ })
    ).toBeTruthy();
  });

  it('the last slide offers named sign-up and sign-in buttons', async () => {
    await renderWithTheme(<Onboarding />);
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));

    expectAccessiblePressables(root());
    expect(screen.getByRole('button', { name: 'Create your account' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'I already have an account' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull();
  });
});
