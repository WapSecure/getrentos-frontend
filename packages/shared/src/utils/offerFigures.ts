interface AmountMessage {
  senderId: string;
  type: string;
  amount?: number;
}

export interface OfferFigures {
  buyerAmount: number;
  sellerCounter?: number;
}

/** The offer's own amount can move to the seller's counter on some paths, so the thread decides. */
export function offerFigures<M extends AmountMessage>(
  messages: readonly M[],
  offerAmount: number,
  fromBuyer: (message: M) => boolean = (m) => m.senderId === 'buyer'
): OfferFigures {
  const priced = messages.filter(
    (m) => (m.type === 'offer' || m.type === 'counter') && typeof m.amount === 'number'
  );
  const latest = priced[priced.length - 1];
  const buyerLatest = [...priced].reverse().find(fromBuyer)?.amount;
  if (latest && !fromBuyer(latest)) {
    return { buyerAmount: buyerLatest ?? offerAmount, sellerCounter: latest.amount };
  }
  return { buyerAmount: buyerLatest ?? offerAmount };
}
