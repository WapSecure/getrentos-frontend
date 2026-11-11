import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  commercialDetailsOf,
  fromLand,
  fromRental,
  fromSale,
  floorPlanLevels,
  heroPhotos,
  imagePreviewOf,
  isFloorPlan,
  placeholderOf,
  shortletMedia,
  showroomMedia,
} from '../src/showroom/map.ts';
import type { MediaItem } from '../src/showroom/types.ts';

const rental = {
  id: 'r1',
  title: 'Two-bed flat, Lekki',
  location: 'Lekki, Lagos',
  price: '3500000',
  period: 'year' as const,
  bedrooms: 2,
  bathrooms: 0,
  image: 'https://cdn.test/a.jpg',
  images: ['https://cdn.test/a.jpg', 'https://cdn.test/b.jpg'],
};

test('rental: older image fields become ordered, de-duplicated media', () => {
  const l = fromRental(rental);
  assert.deepEqual(
    l.media.map((m) => [m.kind, m.url, m.order]),
    [
      ['image', 'https://cdn.test/a.jpg', 0],
      ['image', 'https://cdn.test/b.jpg', 1],
    ]
  );
  assert.equal(l.media[0]!.alt, 'Two-bed flat, Lekki, photo 1');
  assert.deepEqual(l.images, ['https://cdn.test/a.jpg', 'https://cdn.test/b.jpg']);
});

test('rental: zero counts are gaps, not facts', () => {
  const l = fromRental(rental);
  assert.equal(l.bedrooms, 2);
  assert.equal(l.bathrooms, undefined);
});

test('rental: stated costs add the deposit and never claim the fees', () => {
  const l = fromRental({ ...rental, securityDeposit: 500000 });
  assert.deepEqual(l.costs.lines, [
    { label: 'Rent for the first year', amount: 3500000 },
    { label: 'Security deposit', amount: 500000 },
  ]);
  assert.equal(l.costs.total?.amount, 4000000);
  assert.deepEqual(l.costs.notStated, ['Service charge', 'Agency fee', 'Legal fee']);
});

test('rental: without a deposit the deposit is listed as not stated', () => {
  const l = fromRental(rental);
  assert.equal(l.costs.total?.amount, 3500000);
  assert.ok(l.costs.notStated.includes('Security deposit'));
});

test('rental: new optional facts appear only when sent', () => {
  const bare = fromRental(rental).facts.map((f) => f.label);
  assert.ok(!bare.includes('Furnished'));
  assert.ok(!bare.includes('Pets allowed'));
  const full = fromRental({
    ...rental,
    furnished: false,
    petsAllowed: true,
    minimumLeaseMonths: 12,
    propertyType: 'SHARED_APARTMENT',
  }).facts;
  const get = (label: string) => full.find((f) => f.label === label)?.value;
  assert.equal(get('Furnished'), 'No');
  assert.equal(get('Pets allowed'), 'Yes');
  assert.equal(get('Minimum lease'), '12 months');
  assert.equal(get('Property type'), 'Shared apartment');
});

test('media list from the API wins, sorted by order, empty URLs dropped', () => {
  const media: MediaItem[] = [
    {
      id: 'v',
      kind: 'video',
      url: 'https://stream.test/v.m3u8',
      order: 2,
      posterUrl: 'https://cdn.test/p.jpg',
    },
    { id: 'b', kind: 'image', url: 'https://cdn.test/b.jpg', order: 1 },
    { id: 'x', kind: 'image', url: '', order: 0 },
  ];
  const out = showroomMedia('Flat', media, ['https://cdn.test/ignored.jpg']);
  assert.deepEqual(
    out.map((m) => m.id),
    ['b', 'v']
  );
  assert.equal(out[1]!.alt, 'Flat, video tour');
  assert.equal(fromRental({ ...rental, media }).images.length, 1);
});

test('no media at all gives an empty list, not a placeholder', () => {
  assert.deepEqual(fromSale({ id: 's', title: 'House', price: 1 }).media, []);
});

test('sale: price is the only stated cost; under offer is carried', () => {
  const s = fromSale({
    id: 's',
    title: 'House',
    price: 250000000,
    city: 'Ikoyi',
    state: 'Lagos',
    underOffer: true,
  });
  assert.equal(s.location, 'Ikoyi, Lagos');
  assert.equal(s.underOffer, true);
  assert.equal(s.costs.total, undefined);
  assert.deepEqual(s.costs.lines, [{ label: 'Asking price', amount: 250000000 }]);
});

test('land: parcel facts with units; missing parcel gives no area', () => {
  const l = fromLand({
    id: 'l',
    title: 'Plot 12',
    price: 18000000,
    parcel: {
      areaValue: 648,
      areaUnit: 'SQUARE_METERS',
      roadAccess: false,
      titleType: 'CERTIFICATE_OF_OCCUPANCY',
      block: 'C',
      frontage: 18,
      depth: 0,
    },
    diligence: { status: 'CONDITIONAL' },
  });
  const get = (label: string) => l.facts.find((f) => f.label === label)?.value;
  assert.equal(get('Area'), '648 sqm');
  assert.equal(get('Block'), 'C');
  assert.equal(get('Frontage'), '18 m');
  assert.equal(get('Depth'), undefined);
  assert.equal(get('Road access'), 'No');
  assert.equal(get('Title'), 'Certificate of Occupancy');
  assert.equal(get('Due diligence'), 'Verified with conditions');
  assert.equal(
    fromLand({ id: 'l', title: 'x', price: 1 }).facts.find((f) => f.label === 'Area'),
    undefined
  );
});

test('rental: stated fees join the move-in total; a zero is stated, not missing', () => {
  const l = fromRental({
    ...rental,
    serviceCharge: '600000',
    agencyFee: 350000,
    legalFee: 0,
    securityDeposit: 500000,
  });
  assert.deepEqual(
    l.costs.lines.map((c) => [c.label, c.amount]),
    [
      ['Rent for the first year', 3500000],
      ['Service charge', 600000],
      ['Agency fee', 350000],
      ['Security deposit', 500000],
    ]
  );
  assert.equal(l.costs.total?.amount, 4950000);
  assert.deepEqual(l.costs.notStated, []);
});

test('repeated place names collapse', () => {
  assert.equal(fromRental({ ...rental, location: 'Lagos, Lagos' }).location, 'Lagos');
  assert.equal(
    fromSale({ id: 's', title: 'x', price: 1, city: 'Abuja', state: 'abuja' }).location,
    'Abuja'
  );
  assert.equal(
    fromRental({ ...rental, location: 'Lekki Phase 1, Lagos' }).location,
    'Lekki Phase 1, Lagos'
  );
});

test('shortlet media: photos, then stream video, then an allowed 360 tour', () => {
  const items = shortletMedia({
    title: 'Studio',
    coverImageUrl: 'https://cdn.test/c.jpg',
    images: ['https://cdn.test/c.jpg', 'https://cdn.test/d.jpg'],
    videoUrl: 'https://cdn.test/v.mp4',
    videoStream: {
      hlsUrl: 'https://stream.mux.com/x.m3u8',
      posterUrl: 'https://image.mux.com/x.jpg',
    },
    tourUrl: 'https://kuula.co/share/collection/abc',
  });
  assert.deepEqual(
    items.map((m) => [m.kind, m.order]),
    [
      ['image', 0],
      ['image', 1],
      ['video', 2],
      ['tour', 3],
    ]
  );
  assert.equal(items[2]!.url, 'https://stream.mux.com/x.m3u8');
  assert.equal(items[3]!.tourHost, 'kuula.co');
});

test('shortlet media: a tour link on an unknown host is dropped, not framed', () => {
  const items = shortletMedia({
    title: 'Studio',
    images: ['https://cdn.test/a.jpg'],
    tourUrl: 'https://evil.test/tour',
  });
  assert.deepEqual(
    items.map((m) => m.kind),
    ['image']
  );
});

test('accepts only a small inline image as a photo placeholder', () => {
  const ok = 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAAA=';
  assert.equal(placeholderOf(ok), ok);
  assert.equal(placeholderOf(undefined), undefined);
  assert.equal(placeholderOf('https://example.com/a.webp'), undefined);
  assert.equal(placeholderOf('data:image/svg+xml;base64,PHN2Zz4='), undefined);
  assert.equal(placeholderOf('data:image/webp;base64,AA")};body{x:url("'), undefined);
  assert.equal(placeholderOf(`data:image/webp;base64,${'A'.repeat(4000)}`), undefined);
});

test('reads a card cover preview, and nothing from an older or malformed API', () => {
  const placeholder = 'data:image/webp;base64,UklGR';
  assert.deepEqual(imagePreviewOf({ width: 1600, height: 1067, placeholder }), {
    width: 1600,
    height: 1067,
    placeholder,
  });
  assert.deepEqual(imagePreviewOf({ width: 300, height: 200, placeholder: 'javascript:x' }), {
    width: 300,
    height: 200,
  });
  assert.equal(imagePreviewOf(undefined), undefined);
  assert.equal(imagePreviewOf({ width: 0, height: 10 }), undefined);
  assert.equal(imagePreviewOf({ placeholder }), undefined);
});

const photo = (id: string, order: number, extra: Partial<MediaItem> = {}): MediaItem => ({
  id,
  kind: 'image',
  url: `https://cdn.test/${id}.jpg`,
  order,
  ...extra,
});

test('floor plans: one level per tagged photo, named by the caption exactly as written', () => {
  const items: MediaItem[] = [
    photo('plan-g', 0, { room: 'floor_plan', caption: 'Ground floor' }),
    photo('living', 1, { room: 'living' }),
    photo('plan-1', 2, { room: 'floor_plan', caption: 'First floor, 120 sqm (approx.)' }),
    { id: 'v', kind: 'video', url: 'https://cdn.test/v.m3u8', order: 3, room: 'floor_plan' },
  ];
  assert.deepEqual(floorPlanLevels(items), [
    { index: 0, label: 'Ground floor' },
    // Numbers in a caption are the lister's words: shown as written, never parsed.
    { index: 2, label: 'First floor, 120 sqm (approx.)' },
  ]);
  assert.equal(isFloorPlan(items[3]!), false, 'only photos are plans');
});

test('floor plans: a missing or blank caption gets a plain name, numbered only when there are several', () => {
  assert.deepEqual(floorPlanLevels([photo('p', 0, { room: 'floor_plan' })]), [
    { index: 0, label: 'Floor plan' },
  ]);
  assert.deepEqual(
    floorPlanLevels([
      photo('a', 0, { room: 'floor_plan', caption: '  ' }),
      photo('b', 1, { room: 'floor_plan', caption: 'Roof' }),
    ]).map((l) => l.label),
    ['Floor plan 1', 'Roof']
  );
  assert.deepEqual(floorPlanLevels([photo('x', 0, { room: 'living' })]), []);
});

test('floor plans never become the cover, unless they are all there is', () => {
  const items: MediaItem[] = [
    photo('plan', 0, { room: 'floor_plan' }),
    { id: 't', kind: 'tour', url: 'https://tour.test/x', order: 1 },
    photo('front', 2, { room: 'exterior' }),
    photo('kitchen', 3, { room: 'kitchen' }),
  ];
  assert.deepEqual(
    heroPhotos(items).map((m) => m.id),
    ['front', 'kitchen', 'plan']
  );
  assert.deepEqual(
    heroPhotos([photo('only-plan', 0, { room: 'floor_plan' })]).map((m) => m.id),
    ['only-plan']
  );
  const l = fromRental({ ...rental, media: items });
  assert.equal(l.images[0], 'https://cdn.test/front.jpg', 'share image is a photo, not a plan');
  assert.equal(l.media[0]!.id, 'plan', 'the viewer keeps the lister order');
});

test('verification summary: sale and land carry it through, checked', () => {
  const summary = {
    status: 'INVESTMENT_ELIGIBLE',
    scope: ['Title documents match the registry'],
    checkedAt: '2026-10-01T00:00:00.000Z',
    checkedBy: ['Sureground verification team', 'Accredited surveyor'],
    documentsReviewed: [
      { kind: 'CERTIFICATE_OF_OCCUPANCY', label: 'Certificate of occupancy' },
      { kind: 'X' },
    ],
    openIssues: [],
    limits: ['It is not a guarantee of title.'],
    recheckBy: '2027-04-01T00:00:00.000Z',
  };
  const sale = fromSale({ id: 's', title: 'x', price: 1, verificationSummary: summary });
  assert.equal(sale.verificationSummary?.status, 'INVESTMENT_ELIGIBLE');
  assert.deepEqual(sale.verificationSummary?.documentsReviewed, [
    { kind: 'CERTIFICATE_OF_OCCUPANCY', label: 'Certificate of occupancy' },
  ]);
  const land = fromLand({ id: 'l', title: 'x', price: 1, verificationSummary: summary });
  assert.equal(land.verificationSummary?.recheckBy, '2027-04-01T00:00:00.000Z');
});

test('verification summary: missing or unknown status is left out; limits are never empty', () => {
  assert.equal(fromSale({ id: 's', title: 'x', price: 1 }).verificationSummary, undefined);
  assert.equal(
    fromSale({ id: 's', title: 'x', price: 1, verificationSummary: { status: 'VERIFIED' } })
      .verificationSummary,
    undefined
  );
  const s = fromLand({
    id: 'l',
    title: 'x',
    price: 1,
    verificationSummary: { status: 'NOT_STARTED', checkedAt: 'not a date', limits: [] },
  }).verificationSummary;
  assert.equal(s?.checkedAt, null);
  assert.ok(s && s.limits.length > 0);
  assert.ok(s?.limits.some((l) => l.includes('not a guarantee of title')));
});

test('commercial: a commercial rental carries only the stated details', () => {
  const l = fromRental({
    ...rental,
    propertyType: 'COMMERCIAL',
    commercial: {
      permittedUse: 'OFFICE',
      lettableAreaSqm: 250,
      parkingSpaces: 0,
      generator: false,
      leaseTermOptionsYears: [5, 3],
      rentReviewNote: '  Every two years  ',
      vatStatedPct: 7.5,
    },
  });
  assert.deepEqual(l.commercial, {
    permittedUse: 'OFFICE',
    lettableAreaSqm: 250,
    parkingSpaces: 0,
    generator: false,
    leaseTermOptionsYears: [3, 5],
    rentReviewNote: 'Every two years',
    vatStatedPct: 7.5,
  });
});

test('commercial: VAT is never added to the stated costs', () => {
  const l = fromRental({
    ...rental,
    propertyType: 'COMMERCIAL',
    serviceCharge: 400000,
    commercial: { vatStatedPct: 7.5, vatIncluded: false },
  });
  assert.deepEqual(
    l.costs.lines.map((c) => c.label),
    ['Rent for the first year', 'Service charge']
  );
  assert.equal(l.costs.total?.amount, 3900000);
});

test('commercial: ignored on a residential listing, and absent when nothing is stated', () => {
  assert.equal(fromRental({ ...rental, commercial: { solar: true } }).commercial, undefined);
  assert.equal(
    fromRental({ ...rental, propertyType: 'COMMERCIAL', commercial: {} }).commercial,
    undefined
  );
  assert.equal(fromRental({ ...rental, propertyType: 'COMMERCIAL' }).commercial, undefined);
});

test('commercial: a commercial sale carries the block too', () => {
  const l = fromSale({
    id: 's1',
    title: 'Warehouse, Apapa',
    price: 900000000,
    propertyType: 'COMMERCIAL',
    commercial: { permittedUse: 'WAREHOUSE', loadingAccess: true },
  });
  assert.deepEqual(l.commercial, { permittedUse: 'WAREHOUSE', loadingAccess: true });
});

test('commercial: malformed or out-of-range values are dropped, not shown', () => {
  assert.deepEqual(
    commercialDetailsOf({
      permittedUse: 'FACTORY',
      fitOutCondition: 'FITTED',
      lettableAreaSqm: -4,
      parkingSpaces: 2.5,
      publicSupplyHoursStated: 30,
      generator: 'yes',
      solar: true,
      leaseTermOptionsYears: [2, 2, 0, 'x', 120],
      vatStatedPct: 250,
      escalationNote: '',
    }),
    { fitOutCondition: 'FITTED', solar: true, leaseTermOptionsYears: [2] }
  );
  assert.equal(commercialDetailsOf(null), undefined);
  assert.equal(commercialDetailsOf([]), undefined);
  assert.equal(commercialDetailsOf('OFFICE'), undefined);
});
