import { CARD_IMPRESSION_RULE } from '@sureground/shared';

/** Half the card on screen for one continuous second, once per screen visit, as on the web. */
export const CARD_VIEWABILITY = {
  itemVisiblePercentThreshold: CARD_IMPRESSION_RULE.visiblePercent,
  minimumViewTime: CARD_IMPRESSION_RULE.minimumMs,
} as const;

export interface VisibleCard {
  listingId: string;
  position: number;
}

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

export function visibleFraction(top: number, height: number, viewport: number): number {
  if (!(height > 0) || !(viewport > 0)) return 0;
  const shown = Math.min(top + height, viewport) - Math.max(top, 0);
  return Math.max(0, Math.min(1, shown / height));
}

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
