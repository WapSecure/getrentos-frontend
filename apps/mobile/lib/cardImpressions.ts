// Listing-card impressions, the app's side of the web's ListingCard `onVisible` (apps/web, threshold 0.5).
// Pure, so the de-duplication and visibility rules can be unit tested without a list on screen.

/** Half the card on screen, as on the web. 250ms is FlashList's default and stops a fling counting every card. */
export const CARD_VIEWABILITY = { itemVisiblePercentThreshold: 50, minimumViewTime: 250 } as const;

export interface VisibleCard {
  listingId: string;
  position: number;
}

/** The `viewableItems` FlashList and FlatList hand to `onViewableItemsChanged`, reduced to what we send. */
export function visibleCards(
  tokens: readonly { item?: unknown; index?: number | null; isViewable?: boolean }[]
): VisibleCard[] {
  const out: VisibleCard[] = [];
  for (const token of tokens) {
    const id = (token.item as { id?: unknown } | null | undefined)?.id;
    if (token.isViewable === false || typeof id !== 'string' || typeof token.index !== 'number')
      continue;
    out.push({ listingId: id, position: token.index });
  }
  return out;
}

/** Share of a box (top and height in window points) inside a viewport of `viewport` points from 0. */
export function visibleFraction(top: number, height: number, viewport: number): number {
  if (!(height > 0) || !(viewport > 0)) return 0;
  const shown = Math.min(top + height, viewport) - Math.max(top, 0);
  return Math.max(0, Math.min(1, shown / height));
}

/**
 * One per list on a screen. A card counts once per screen visit: leaving the screen (blur) ends the
 * visit, and coming back starts a new one that counts whatever is on screen again, as a web page
 * revisit does. Cards seen while the screen is out of focus, or while the list itself is scrolled
 * out of view (`setInView`), wait until both are true.
 */
export class CardImpressionTracker {
  private seen = new Set<string>();
  private visible: VisibleCard[] = [];
  private focused = true;
  private inView: boolean;

  constructor(
    private readonly send: (card: VisibleCard) => void,
    { inView = true }: { inView?: boolean } = {}
  ) {
    this.inView = inView;
  }

  setVisible(cards: VisibleCard[]) {
    this.visible = cards;
    this.flush();
  }

  setInView(inView: boolean) {
    if (inView === this.inView) return;
    this.inView = inView;
    this.flush();
  }

  focus() {
    if (this.focused) return;
    this.focused = true;
    this.seen.clear();
    this.flush();
  }

  blur() {
    this.focused = false;
  }

  private flush() {
    if (!this.focused || !this.inView) return;
    for (const card of this.visible) {
      if (this.seen.has(card.listingId)) continue;
      this.seen.add(card.listingId);
      try {
        this.send(card);
      } catch {
        // Measurement must never break the list.
      }
    }
  }
}
