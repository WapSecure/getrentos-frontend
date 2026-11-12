import { act, renderHook } from '@testing-library/react-native';
import { trackShowroom } from '@/lib/showroomAnalytics';
import { useCardAnalytics } from '@/hooks/useCardAnalytics';

jest.mock('@/lib/showroomAnalytics', () => ({ trackShowroom: jest.fn() }));
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));

const sent = trackShowroom as jest.MockedFunction<typeof trackShowroom>;

beforeEach(() => sent.mockClear());

describe('useCardAnalytics', () => {
  it('sends impressions and clicks in the web payload shape, with no user data', async () => {
    const { result } = await renderHook(() => useCardAnalytics('rent', 'rent_list'));
    await act(async () => {
      result.current.listProps.onViewableItemsChanged({
        viewableItems: [{ item: { id: 'lst_1', title: 'Flat' }, index: 3, isViewable: true }],
      });
    });
    result.current.click('lst_1', 3);
    expect(sent.mock.calls.map(([event]) => event)).toEqual([
      {
        name: 'property_impression',
        listingId: 'lst_1',
        market: 'rent',
        surface: 'rent_list',
        props: { position: 3 },
      },
      {
        name: 'property_card_click',
        listingId: 'lst_1',
        market: 'rent',
        surface: 'rent_list',
        props: { position: 3 },
      },
    ]);
  });

  it('keeps the list props stable across renders (FlatList throws if they change)', async () => {
    const { result, rerender } = await renderHook(() => useCardAnalytics('sale', 'discover'));
    const first = result.current;
    await rerender({});
    expect(result.current).toBe(first);
    expect(result.current.listProps.viewabilityConfig.itemVisiblePercentThreshold).toBe(50);
  });
});
