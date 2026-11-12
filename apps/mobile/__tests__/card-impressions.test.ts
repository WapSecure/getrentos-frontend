import {
  CARD_VIEWABILITY,
  CardImpressionTracker,
  visibleCards,
  visibleFraction,
  type VisibleCard,
} from '@/lib/cardImpressions';

const setup = (options?: { inView?: boolean }) => {
  const sent: VisibleCard[] = [];
  const tracker = new CardImpressionTracker((card) => sent.push(card), options);
  return { sent, tracker, ids: () => sent.map((c) => c.listingId) };
};

describe('CARD_VIEWABILITY', () => {
  it('counts a card once half of it is on screen, as the web does', () => {
    expect(CARD_VIEWABILITY.itemVisiblePercentThreshold).toBe(50);
  });
});

describe('visibleCards', () => {
  it('keeps the listing id and list index of viewable tokens', () => {
    expect(
      visibleCards([
        { item: { id: 'a', title: 'x' }, index: 0, isViewable: true },
        { item: { id: 'b' }, index: 1, isViewable: true },
      ])
    ).toEqual([
      { listingId: 'a', position: 0 },
      { listingId: 'b', position: 1 },
    ]);
  });

  it('drops tokens that are not viewable, have no index or no string id', () => {
    expect(
      visibleCards([
        { item: { id: 'a' }, index: 0, isViewable: false },
        { item: { id: 'b' }, index: null, isViewable: true },
        { item: { id: 7 }, index: 2, isViewable: true },
        { item: null, index: 3, isViewable: true },
        { index: 4, isViewable: true },
      ])
    ).toEqual([]);
  });
});

describe('visibleFraction', () => {
  it('measures how much of a box sits inside the viewport', () => {
    expect(visibleFraction(0, 100, 800)).toBe(1);
    expect(visibleFraction(750, 100, 800)).toBe(0.5);
    expect(visibleFraction(-60, 100, 800)).toBeCloseTo(0.4);
    expect(visibleFraction(900, 100, 800)).toBe(0);
    expect(visibleFraction(-200, 100, 800)).toBe(0);
  });

  it('is zero for an unmeasured box or viewport', () => {
    expect(visibleFraction(0, 0, 800)).toBe(0);
    expect(visibleFraction(0, 100, 0)).toBe(0);
    expect(visibleFraction(Number.NaN, Number.NaN, 800)).toBe(0);
  });
});

describe('CardImpressionTracker', () => {
  it('sends each card once per visit, however often it scrolls in and out', () => {
    const { tracker, sent } = setup();
    tracker.setVisible([
      { listingId: 'a', position: 0 },
      { listingId: 'b', position: 1 },
    ]);
    tracker.setVisible([{ listingId: 'b', position: 1 }]);
    tracker.setVisible([]);
    tracker.setVisible([
      { listingId: 'a', position: 0 },
      { listingId: 'c', position: 2 },
    ]);
    expect(sent).toEqual([
      { listingId: 'a', position: 0 },
      { listingId: 'b', position: 1 },
      { listingId: 'c', position: 2 },
    ]);
  });

  it('keeps the first position when a refreshed list moves a card it already counted', () => {
    const { tracker, sent } = setup();
    tracker.setVisible([{ listingId: 'a', position: 0 }]);
    tracker.setVisible([{ listingId: 'a', position: 5 }]);
    expect(sent).toEqual([{ listingId: 'a', position: 0 }]);
  });

  it('holds cards while the screen is out of focus', () => {
    const { tracker, ids } = setup();
    tracker.blur();
    tracker.setVisible([{ listingId: 'a', position: 0 }]);
    expect(ids()).toEqual([]);
  });

  it('starts a new visit on return, counting what is on screen again', () => {
    const { tracker, ids } = setup();
    tracker.setVisible([{ listingId: 'a', position: 0 }]);
    tracker.blur();
    tracker.focus();
    expect(ids()).toEqual(['a', 'a']);
    tracker.setVisible([{ listingId: 'a', position: 0 }]);
    expect(ids()).toEqual(['a', 'a']);
  });

  it('does not start a new visit on a focus while already focused (first mount)', () => {
    const { tracker, ids } = setup();
    tracker.setVisible([{ listingId: 'a', position: 0 }]);
    tracker.focus();
    expect(ids()).toEqual(['a']);
  });

  it('waits for the list itself to come into view, without restarting the visit', () => {
    const { tracker, ids } = setup({ inView: false });
    tracker.setVisible([{ listingId: 'a', position: 0 }]);
    expect(ids()).toEqual([]);
    tracker.setInView(true);
    expect(ids()).toEqual(['a']);
    tracker.setInView(false);
    tracker.setInView(true);
    expect(ids()).toEqual(['a']);
  });

  it('never throws when sending fails', () => {
    const tracker = new CardImpressionTracker(() => {
      throw new Error('offline');
    });
    expect(() => tracker.setVisible([{ listingId: 'a', position: 0 }])).not.toThrow();
  });
});
