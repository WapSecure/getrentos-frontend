import { fireEvent, screen } from '@testing-library/react-native';
import SignIn from '@/app/(auth)/sign-in';
import {
  expectAccessiblePressables,
  expectLabelledTextInputs,
  renderWithTheme,
  type HostElement,
} from './helpers/a11y';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false },
}));
jest.mock('@/lib/auth/AuthProvider', () => ({
  useAuth: () => ({
    signIn: jest.fn(),
    signInWithProvider: jest.fn(),
    signInWithApple: jest.fn(),
  }),
}));
jest.mock('@/lib/api/auth', () => ({ authApi: { sendMagicLink: jest.fn() } }));
jest.mock('@/lib/auth/oauth', () => ({ OAuthCancelled: class OAuthCancelled extends Error {} }));
jest.mock('@/lib/auth/apple', () => ({
  AppleSignInCancelled: class AppleSignInCancelled extends Error {},
  appleSignInAvailable: () => Promise.resolve(false),
}));
jest.mock('expo-apple-authentication', () => ({
  AppleAuthenticationButton: () => null,
  AppleAuthenticationButtonType: { CONTINUE: 1 },
  AppleAuthenticationButtonStyle: { WHITE: 0, BLACK: 2 },
}));
jest.mock('@/lib/auth/sessionExpiry', () => ({ consumeSessionExpired: () => null }));
jest.mock('@/lib/auth/rememberedIdentifier', () => ({
  getRememberedIdentifier: () => Promise.resolve(null),
  rememberIdentifier: jest.fn(),
  forgetIdentifier: jest.fn(),
}));
jest.mock('@/lib/links', () => ({ openLegal: jest.fn() }));

const root = () => screen.container as HostElement;

describe('sign-in form', () => {
  it('every field is labelled and every control has a role, a name and a 44pt target', async () => {
    await renderWithTheme(<SignIn />);
    await screen.findByRole('button', { name: 'Sign in' });

    const inputs = expectLabelledTextInputs(root());
    expect(inputs.map((i) => i.props.accessibilityLabel)).toEqual(['Email or phone', 'Password']);

    expectAccessiblePressables(root());
    for (const [role, name] of [
      ['button', 'Go back'],
      ['tab', 'Password, 1 of 2'],
      ['tab', 'Magic link, 2 of 2'],
      ['button', 'Show password'],
      ['checkbox', 'Remember me'],
      ['button', 'Forgot password?'],
      ['button', 'Continue with Google'],
      ['link', 'Terms'],
      ['link', 'Privacy Policy'],
      ['button', 'Sign in'],
      ['button', 'Create an account'],
    ] as const) {
      expect(screen.getByRole(role, { name })).toBeTruthy();
    }
  });

  it('the magic-link form is labelled and its controls are accessible', async () => {
    await renderWithTheme(<SignIn />);
    await fireEvent.press(await screen.findByRole('tab', { name: 'Magic link, 2 of 2' }));

    expect(screen.getByRole('tab', { name: 'Magic link, 2 of 2' })).toBeSelected();
    const inputs = expectLabelledTextInputs(root());
    expect(inputs.map((i) => i.props.accessibilityLabel)).toEqual(['Email']);
    expectAccessiblePressables(root());
    expect(screen.getByRole('button', { name: 'Email me a link' })).toBeTruthy();
  });
});
