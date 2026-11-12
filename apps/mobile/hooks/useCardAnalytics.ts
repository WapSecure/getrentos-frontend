import { useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import type { ShowroomEventMarket } from '@sureground/shared/showroom';
import { trackShowroom } from '@/lib/showroomAnalytics';
import {
  CARD_VIEWABILITY,
  CardImpressionTracker,
  visibleCards,
  type VisibleCard,
} from '@/lib/cardImpressions';

type ViewableInfo = Parameters<typeof visibleCards>[0];

/**
 * `property_impression` and `property_card_click` for one list of listing cards, named as on the web
 * (surface `rent_list`, `discover`, `sale_similar`…). Spread `listProps` on the FlashList or FlatList,
 * call `click(id, index)` on tap. Events go through the batched showroom sender: anonymous, no user id.
 */
export function useCardAnalytics(
  market: ShowroomEventMarket,
  surface: string,
  { inView = true }: { inView?: boolean } = {}
) {
  // One tracker per list and surface. `inView` is the starting state (a constant per list); later
  // changes go through setInView.
  const tracker = useMemo(
    () =>
      new CardImpressionTracker(
        ({ listingId, position }: VisibleCard) =>
          trackShowroom({
            name: 'property_impression',
            listingId,
            market,
            surface,
            props: { position },
          }),
        { inView }
      ),
    [market, surface, inView]
  );

  useFocusEffect(
    useCallback(() => {
      tracker.focus();
      return () => tracker.blur();
    }, [tracker])
  );

  // Both must stay the same object while the list is mounted: FlatList throws if they change.
  const listProps = useMemo(
    () => ({
      viewabilityConfig: CARD_VIEWABILITY,
      onViewableItemsChanged: ({ viewableItems }: { viewableItems: ViewableInfo }) =>
        tracker.setVisible(visibleCards(viewableItems)),
    }),
    [tracker]
  );

  const click = useCallback(
    (listingId: string, position: number) =>
      trackShowroom({
        name: 'property_card_click',
        listingId,
        market,
        surface,
        props: { position },
      }),
    [market, surface]
  );

  const setInView = useCallback((value: boolean) => tracker.setInView(value), [tracker]);

  return useMemo(() => ({ listProps, click, setInView }), [listProps, click, setInView]);
}
