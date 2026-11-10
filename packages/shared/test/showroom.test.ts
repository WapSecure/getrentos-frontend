import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromLand, fromRental, fromSale, showroomMedia } from '../src/showroom/map.ts';
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
  assert.deepEqual(l.costs.notStated, ['Agency fee', 'Legal fee', 'Service charge']);
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
    },
    diligence: { status: 'CONDITIONAL' },
  });
  const get = (label: string) => l.facts.find((f) => f.label === label)?.value;
  assert.equal(get('Area'), '648 sqm');
  assert.equal(get('Road access'), 'No');
  assert.equal(get('Title'), 'Certificate of Occupancy');
  assert.equal(get('Due diligence'), 'Verified with conditions');
  assert.equal(
    fromLand({ id: 'l', title: 'x', price: 1 }).facts.find((f) => f.label === 'Area'),
    undefined
  );
});
