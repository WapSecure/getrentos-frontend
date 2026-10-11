import { ApiError } from '@/lib/api/client';
import {
  agreementOrder,
  buildListing,
  bulkPublishMessage,
  candidateState,
  isLeadClosed,
  leadStageLabel,
  listingMoves,
  listingName,
  listingPricePeriod,
  listingStatus,
  marketable,
  marketplaceKeys,
  parseNaira,
  photoRoom,
  planGate,
  unpublishedIds,
  type MarketingAgreement,
} from '@/lib/api/estateMarketplace';

const agreement = (over: Partial<MarketingAgreement>): MarketingAgreement => ({
  id: 'a',
  estateId: 'e',
  estateName: 'Lekki Gardens',
  propertyId: 'p',
  propertyTitle: 'House',
  propertyAddress: '1 Road',
  propertyCity: 'Lagos',
  propertyState: 'Lagos',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00Z',
  effective: true,
  estateListingCount: 0,
  ...over,
});

describe('listing moves', () => {
  it('lets a live listing pause or come down, and a paused or draft one go live', () => {
    expect(listingMoves('PUBLISHED')).toEqual(['PAUSED', 'CLOSED']);
    expect(listingMoves('PAUSED')).toEqual(['PUBLISHED', 'CLOSED']);
    expect(listingMoves('DRAFT')).toEqual(['PUBLISHED', 'CLOSED']);
    expect(listingMoves('PENDING_VERIFICATION')).toEqual(['PUBLISHED', 'CLOSED']);
  });
  it('treats closed as final', () => {
    expect(listingMoves('CLOSED')).toEqual([]);
  });
  it('labels an unknown status rather than crashing', () => {
    expect(listingStatus('PUBLISHED')).toEqual({ label: 'Live', tone: 'success' });
    expect(listingStatus('ARCHIVED')).toEqual({ label: 'archived', tone: 'neutral' });
  });
});

describe('listings', () => {
  it('prefers the listing’s own headline', () => {
    expect(listingName({ listingTitle: ' Garden flat ', propertyTitle: 'House' })).toBe(
      'Garden flat'
    );
    expect(listingName({ listingTitle: '  ', propertyTitle: 'House' })).toBe('House');
    expect(listingName({ listingTitle: null, propertyTitle: 'House' })).toBe('House');
  });
  it('only claims a period it knows', () => {
    expect(listingPricePeriod('SHORTLET')).toBe('night');
    expect(listingPricePeriod('RENT')).toBeNull();
    expect(listingPricePeriod('SALE')).toBeNull();
  });
  it('collects drafts and listings being checked for bulk publishing', () => {
    expect(
      unpublishedIds([
        { id: '1', status: 'DRAFT' },
        { id: '2', status: 'PUBLISHED' },
        { id: '3', status: 'PENDING_VERIFICATION' },
        { id: '4', status: 'CLOSED' },
      ])
    ).toEqual(['1', '3']);
  });
  it('says what bulk publishing did, with the first reason for a skip', () => {
    expect(bulkPublishMessage({ published: 3, skipped: [] })).toBe('3 listings published.');
    expect(bulkPublishMessage({ published: 1, skipped: [] })).toBe('1 listing published.');
    expect(
      bulkPublishMessage({
        published: 2,
        skipped: [{ listingId: 'x', reason: 'Owner permission ended' }],
      })
    ).toBe('2 listings published, 1 skipped: Owner permission ended');
  });
  it('counts the photo room left', () => {
    expect(photoRoom({})).toBe(12);
    expect(
      photoRoom({ media: Array.from({ length: 5 }, (_, i) => ({ key: `${i}`, url: '' })) })
    ).toBe(7);
    expect(
      photoRoom({ media: Array.from({ length: 14 }, (_, i) => ({ key: `${i}`, url: '' })) })
    ).toBe(0);
  });
});

describe('creating a listing', () => {
  it('reads naira as typed', () => {
    expect(parseNaira('2500000')).toBe(2_500_000);
    expect(parseNaira('₦1,500,000')).toBe(1_500_000);
    expect(parseNaira(' 85 000 000 ')).toBe(85_000_000);
    expect(parseNaira('1200.6')).toBe(1201);
  });
  it('refuses what isn’t a positive amount', () => {
    expect(parseNaira('')).toBeNull();
    expect(parseNaira('0')).toBeNull();
    expect(parseNaira('-5')).toBeNull();
    expect(parseNaira('12abc')).toBeNull();
  });
  it('sends short-let terms for a short let, using the price as the nightly rate', () => {
    expect(
      buildListing({
        propertyId: 'p',
        listingType: 'SHORTLET',
        price: 45000,
        availableFrom: '2026-11-01',
        publish: true,
      })
    ).toEqual({
      propertyId: 'p',
      listingType: 'SHORTLET',
      price: 45000,
      availableFrom: '2026-11-01',
      publish: true,
      shortlet: { pricingMode: 'PER_NIGHT', nightlyRate: 45000 },
    });
  });
  it('leaves short-let terms and a blank headline off other listings', () => {
    const body = buildListing({
      propertyId: 'p',
      listingType: 'RENT',
      price: 3_000_000,
      availableFrom: '2026-11-01',
      title: '   ',
      publish: false,
    });
    expect(body).not.toHaveProperty('shortlet');
    expect(body).not.toHaveProperty('listingTitle');
    expect(
      buildListing({
        propertyId: 'p',
        listingType: 'SALE',
        price: 1,
        availableFrom: '2026-11-01',
        title: ' Corner plot ',
        publish: false,
      }).listingTitle
    ).toBe('Corner plot');
  });
});

describe('properties', () => {
  it('offers only what the estate may market now', () => {
    const list = [
      agreement({ id: '1' }),
      agreement({ id: '2', status: 'PENDING', effective: false }),
      agreement({ id: '3', status: 'ACTIVE', effective: false }),
    ];
    expect(marketable(list).map((a) => a.id)).toEqual(['1']);
  });
  it('puts properties waiting on an owner first', () => {
    const ordered = agreementOrder([
      agreement({ id: 'r', status: 'REVOKED', propertyTitle: 'A' }),
      agreement({ id: 'b', status: 'ACTIVE', propertyTitle: 'B' }),
      agreement({ id: 'p', status: 'PENDING', propertyTitle: 'Z' }),
      agreement({ id: 'a', status: 'ACTIVE', propertyTitle: 'A' }),
    ]);
    expect(ordered.map((a) => a.id)).toEqual(['p', 'a', 'b', 'r']);
  });
  it('knows what the search can do with a property', () => {
    expect(candidateState({ agreementStatus: 'ACTIVE', inThisEstate: true })).toBe('can-market');
    expect(candidateState({ agreementStatus: 'PENDING', inThisEstate: true })).toBe('awaiting');
    expect(candidateState({ agreementStatus: 'DECLINED', inThisEstate: true })).toBe('ask');
    expect(candidateState({ agreementStatus: null, inThisEstate: false })).toBe('add');
  });
});

describe('plan gates', () => {
  it('tells a Free cap from a feature the plan lacks', () => {
    expect(planGate(new ApiError('Free plan is limited', 403, 'PLAN_LIMIT_REACHED'))).toBe('limit');
    expect(planGate(new ApiError('Enterprise only', 403, 'PLAN_UPGRADE_REQUIRED'))).toBe('feature');
    expect(planGate(new ApiError('Pay up', 402))).toBe('feature');
  });
  it('ignores everything else', () => {
    expect(
      planGate(new ApiError('Not allowed', 403, 'ESTATE_LISTING_AGREEMENT_REQUIRED'))
    ).toBeNull();
    expect(planGate(new Error('boom'))).toBeNull();
  });
});

describe('enquiries', () => {
  it('says source stages the way a person would', () => {
    expect(leadStageLabel('viewing_scheduled')).toBe('Viewing booked');
    expect(leadStageLabel('OFFER_MADE')).toBe('Offer made');
    expect(leadStageLabel('awaiting_docs')).toBe('Awaiting docs');
    expect(leadStageLabel('')).toBe('Enquiry');
  });
  it('knows when an enquiry has run its course', () => {
    expect(isLeadClosed('withdrawn')).toBe(true);
    expect(isLeadClosed('Completed')).toBe(true);
    expect(isLeadClosed('offer_made')).toBe(false);
  });
});

describe('query keys', () => {
  it('sit under the estate so an estate-wide refresh reaches them', () => {
    expect(marketplaceKeys.listings('e1').slice(0, 2)).toEqual(['estate-manager', 'e1']);
    expect(marketplaceKeys.leads('e1').slice(0, 3)).toEqual(marketplaceKeys.all('e1').slice(0, 3));
  });
});
