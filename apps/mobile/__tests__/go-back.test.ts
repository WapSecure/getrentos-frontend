import { router } from 'expo-router';
import { goBack } from '../lib/goBack';

jest.mock('expo-router', () => ({
  router: { canGoBack: jest.fn(), back: jest.fn(), replace: jest.fn() },
}));

const mockRouter = router as unknown as Record<'canGoBack' | 'back' | 'replace', jest.Mock>;

describe('goBack', () => {
  beforeEach(() => jest.clearAllMocks());

  it('goes back when there is history', () => {
    mockRouter.canGoBack.mockReturnValue(true);
    goBack();
    expect(mockRouter.back).toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('goes home when the screen was opened directly (a link or a reload)', () => {
    mockRouter.canGoBack.mockReturnValue(false);
    goBack();
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
  });
});
