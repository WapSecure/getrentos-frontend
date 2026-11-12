import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LISTING_QUESTION_TOPICS,
  LISTING_QUESTION_TOPIC_INFO,
  NOT_STATED_BY_LISTER,
  answerFor,
  answerQuestion,
  matchTopics,
  normaliseQuestion,
  suggestedTopics,
  topicsToAnswer,
  type ListingQuestionTopic,
} from '../src/showroom/listingQuestions.ts';
import { fromLand, fromRental, fromSale } from '../src/showroom/map.ts';
import type { MediaItem, ShowroomListing } from '../src/showroom/types.ts';

const photo = (id: string, order: number, extra: Partial<MediaItem> = {}): MediaItem => ({
  id,
  kind: 'image',
  url: `https://cdn.test/${id}.jpg`,
  order,
  ...extra,
});

const richRental = fromRental({
  id: 'r1',
  title: 'Three-bed flat, Surulere',
  location: 'Surulere, Lagos',
  address: '12 Bode Thomas Street',
  price: '3500000',
  period: 'year',
  allowsMonthlyPayment: true,
  bedrooms: 3,
  bathrooms: 2,
  size: 120,
  serviceCharge: 500000,
  agencyFee: 0,
  securityDeposit: '350000',
  minimumLeaseMonths: 12,
  furnished: false,
  petsAllowed: true,
  availableFrom: '2026-12-01T09:00:00.000Z',
  amenities: ['Parking for 2 cars', '24/7 power', 'Borehole', 'CCTV', 'Swimming pool'],
  description:
    'Quiet close off Bode Thomas. Prepaid meter and inverter installed. Inspection by appointment only. Comes with a BQ.',
  media: [photo('img_living', 0, { room: 'living' }), photo('img_plan', 1, { room: 'floor_plan' })],
  floorPlans: [
    {
      id: 'plan-1',
      levelName: 'Ground floor',
      imageMediaId: 'img_plan',
      measurementStatus: 'CHECKED',
      checkedAt: '2026-11-03T10:00:00.000Z',
      rooms: [
        { id: 'r-1', name: 'Master bedroom', widthM: 4.2, lengthM: 3.8 },
        { id: 'r-2', name: 'Kitchen', widthM: 3, lengthM: 2.5 },
        { id: 'r-3', name: 'Store' },
      ],
    },
  ],
  trustChain: {
    steps: [
      { id: 'owner', label: 'Verified owner', met: true, detail: '' },
      { id: 'authority', label: 'Ownership confirmed', met: false, detail: '' },
      { id: 'property', label: 'Property verified', met: true, detail: '' },
      { id: 'payment', label: 'Payment protected', met: true, detail: '' },
    ],
  },
});

const bareRentalDto = {
  id: 'r3',
  title: 'Room',
  location: 'Yaba, Lagos',
  price: 900000,
  period: 'year' as const,
};

const bareRental = fromRental({
  id: 'r2',
  title: 'Room, Yaba',
  location: 'Yaba, Lagos',
  price: 900000,
  period: 'year',
});

const commercialRent = fromRental({
  id: 'c1',
  title: 'Office floor, Ikeja',
  location: 'Ikeja, Lagos',
  price: 12000000,
  period: 'year',
  propertyType: 'COMMERCIAL',
  commercial: {
    permittedUse: 'OFFICE',
    permittedUseNote: 'No food preparation',
    lettableAreaSqm: 250,
    fitOutCondition: 'SEMI_FITTED',
    parkingSpaces: 4,
    publicSupplyHoursStated: 12,
    generator: true,
    generatorNote: 'Shared 100 kVA',
    solar: false,
    loadingAccess: true,
    leaseTermOptionsYears: [2, 3],
    rentReviewNote: 'Reviewed every two years',
    escalationNote: '10% at each review',
    vatStatedPct: 7.5,
    vatIncluded: false,
  },
});

const checkedSale = fromSale({
  id: 's1',
  title: 'Four-bed duplex, Lekki',
  price: 150000000,
  city: 'Lekki',
  state: 'Lagos',
  bedrooms: 4,
  verificationSummary: {
    status: 'EVIDENCE_VERIFIED',
    scope: ['Title document matches the land registry', 'Seller identity confirmed'],
    checkedAt: '2026-10-20T12:00:00.000Z',
    checkedBy: ['Accredited surveyor'],
    documentsReviewed: [],
    openIssues: [],
    limits: ['It is not a guarantee of title.'],
    recheckBy: null,
  },
});

const unCheckedSale = fromSale({
  id: 's2',
  title: 'Terrace, Ajah',
  price: 60000000,
  verificationSummary: { status: 'NOT_STARTED', scope: [], checkedAt: null, limits: [] },
});

const land = fromLand({
  id: 'l1',
  title: 'Plot, Epe',
  price: 8000000,
  city: 'Epe',
  state: 'Lagos',
  parcel: {
    areaValue: 648,
    areaUnit: 'SQUARE_METERS',
    titleType: 'CERTIFICATE_OF_OCCUPANCY',
    utilities: ['Electricity', 'Water'],
    zoning: 'Residential',
    tenure: '99-year lease',
  },
});

const empty: ShowroomListing = {
  id: 'e1',
  market: 'rent',
  title: '',
  location: '',
  price: 0,
  verified: false,
  media: [],
  images: [],
  amenities: [],
  facts: [],
  costs: { lines: [], notStated: [] },
};

const FORBIDDEN = /\b(ai|assistant|smart|escrow)\b/i;

// ---------------------------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------------------------

const top = (q: string) => matchTopics(q)[0]?.topic;

test('normalises punctuation and case, so C of O is found however it is written', () => {
  assert.equal(normaliseQuestion('Is there a C-of-O?'), ' is there a c of o ');
  assert.equal(normaliseQuestion('C.of.O'), ' c of o ');
  assert.equal(normaliseQuestion('   '), '');
  assert.equal(top('Does it have C of O?'), 'title');
  assert.equal(top('is the cofo genuine'), 'title');
  assert.equal(top("Governor's consent?"), 'title');
});

test('matches the brief questions to the right topic', () => {
  const cases: [string, ListingQuestionTopic][] = [
    ['Is there parking?', 'parking'],
    ['Is there packing space for 2 cars?', 'parking'],
    ['Is the power steady?', 'power'],
    ['How is light there?', 'power'],
    ['Do they have NEPA?', 'power'],
    ['Is PHCN regular?', 'power'],
    ['How much is service charge?', 'service_charge'],
    ['Can I keep a dog?', 'pets'],
    ['How big is the main bedroom?', 'floor_plans'],
    ['When can I move in?', 'move_in'],
    ['Is the title checked?', 'title'],
    ['Is there a borehole?', 'water'],
    ['Is the estate gated?', 'security'],
    ['What is the agency fee and caution deposit?', 'fees'],
    ['Is the price negotiable?', 'price'],
    ['How long is the lease?', 'lease'],
    ['Is it furnished?', 'furnished'],
    ['Can I inspect it this weekend?', 'viewing'],
    ['Can I use it as a shop?', 'commercial_use'],
    ['Is VAT included?', 'vat'],
    ['What is the exact address?', 'location'],
    ['Is there a swimming pool?', 'amenities'],
    ['How many bedrooms?', 'size'],
    ['Is there a BQ?', 'amenities'],
  ];
  for (const [q, topic] of cases) assert.equal(top(q), topic, q);
});

test("each topic's own example question finds that topic first", () => {
  for (const topic of LISTING_QUESTION_TOPICS) {
    assert.equal(top(LISTING_QUESTION_TOPIC_INFO[topic].question), topic, topic);
  }
});

test('a question about nothing in the catalogue matches nothing', () => {
  assert.deepEqual(matchTopics('Hello there'), []);
  assert.deepEqual(matchTopics(''), []);
  assert.deepEqual(answerQuestion(richRental, 'What is your favourite colour?'), []);
});

test('ranking is deterministic and answers at most two topics', () => {
  assert.deepEqual(matchTopics('Is there parking?'), matchTopics('Is there parking?'));
  const both = topicsToAnswer('Is there light and water?');
  assert.deepEqual([...both].sort(), ['power', 'water']);
  assert.ok(topicsToAnswer('parking light water security pets').length <= 2);
  // "How much" alone must not drag the price into a service charge question.
  assert.deepEqual(topicsToAnswer('How much is service charge?'), ['service_charge']);
});

// ---------------------------------------------------------------------------------------------
// Answers: stated and not stated, topic by topic
// ---------------------------------------------------------------------------------------------

test('parking: amenities and commercial spaces are stated; nothing otherwise', () => {
  const a = answerFor(richRental, 'parking');
  assert.equal(a.source, 'stated');
  assert.match(a.text, /^The lister includes parking for 2 cars in the amenities\./);
  const c = answerFor(commercialRent, 'parking');
  assert.match(c.text, /4 parking spaces/);
  assert.equal(answerFor(bareRental, 'parking').source, 'not_stated');
});

test('power: the lister figure only, with the hours a gap when not stated', () => {
  const c = answerFor(commercialRent, 'power');
  assert.equal(c.source, 'stated');
  assert.match(c.text, /about 12 hours of public power a day/);
  assert.match(c.text, /generator: Shared 100 kVA/);
  assert.match(c.text, /no solar/);
  assert.deepEqual(c.gaps, []);
  const r = answerFor(richRental, 'power');
  assert.match(r.text, /24\/7 power/);
  assert.match(r.text, /"Prepaid meter and inverter installed\."/);
  assert.deepEqual(r.gaps, ['Hours of public power a day']);
  assert.equal(answerFor(land, 'power').source, 'stated');
  const none = answerFor(bareRental, 'power');
  assert.equal(none.source, 'not_stated');
  assert.equal(none.text, NOT_STATED_BY_LISTER);
});

test('water and security come from amenities and the description', () => {
  assert.match(answerFor(richRental, 'water').text, /borehole/);
  assert.match(answerFor(land, 'water').text, /Electricity, Water/);
  assert.match(answerFor(richRental, 'security').text, /CCTV/);
  assert.equal(answerFor(bareRental, 'water').source, 'not_stated');
  assert.equal(answerFor(bareRental, 'security').source, 'not_stated');
});

test('service charge: the stated amount, a stated none, or not stated', () => {
  const a = answerFor(richRental, 'service_charge');
  assert.equal(a.text, 'The lister states a service charge of ₦500,000.');
  assert.deepEqual(a.facts, [{ label: 'Service charge', value: '₦500,000' }]);
  const zero = fromRental({ ...bareRentalDto, serviceCharge: 0 });
  assert.equal(
    answerFor(zero, 'service_charge').text,
    'The lister states there is no service charge.'
  );
  const none = answerFor(bareRental, 'service_charge');
  assert.equal(none.source, 'not_stated');
  assert.deepEqual(none.gaps, ['Service charge']);
  assert.equal(answerFor(checkedSale, 'service_charge').source, 'not_stated');
});

test('fees: the stated lines and their stated total; missing fees are gaps', () => {
  const a = answerFor(richRental, 'fees');
  assert.equal(a.source, 'stated');
  assert.match(
    a.text,
    /rent for the first year ₦3,500,000, service charge ₦500,000, security deposit ₦350,000/
  );
  assert.match(a.text, /Stated costs to move in: ₦4,350,000\./);
  assert.match(a.text, /no agency fee/);
  assert.deepEqual(a.gaps, ['Legal fee']);
  const sale = answerFor(checkedSale, 'fees');
  assert.deepEqual(sale.gaps, ['Legal fee', 'Agency fee', 'Survey and registration costs']);
  assert.equal(answerFor(empty, 'fees').source, 'not_stated');
});

test('price: rent with its unit, or the asking price; never a monthly sum worked out', () => {
  assert.match(answerFor(richRental, 'price').text, /the rent is ₦3,500,000 a year\./);
  assert.match(answerFor(richRental, 'price').text, /monthly payments are available/);
  assert.doesNotMatch(answerFor(richRental, 'price').text, /291,667/);
  assert.match(answerFor(checkedSale, 'price').text, /asking price of ₦150,000,000/);
  assert.equal(answerFor(empty, 'price').source, 'not_stated');
});

test('lease: minimum lease, commercial terms and notes as written', () => {
  assert.match(answerFor(richRental, 'lease').text, /minimum lease of 12 months/);
  const c = answerFor(commercialRent, 'lease');
  assert.match(c.text, /lease terms of 2 or 3 years/);
  assert.match(c.text, /"Reviewed every two years"/);
  assert.match(c.text, /"10% at each review"/);
  assert.match(answerFor(land, 'lease').text, /99-year lease/);
  assert.equal(answerFor(bareRental, 'lease').source, 'not_stated');
});

test('furnished and pets: yes and no are both statements', () => {
  assert.equal(
    answerFor(richRental, 'furnished').text.split('.')[0],
    'The lister states it is not furnished'
  );
  assert.match(answerFor(commercialRent, 'furnished').text, /fit-out is: Semi-fitted/);
  assert.equal(answerFor(bareRental, 'furnished').source, 'not_stated');
  assert.equal(answerFor(richRental, 'pets').text, 'The lister states pets are allowed.');
  const noPets = fromRental({ ...bareRentalDto, petsAllowed: false });
  assert.equal(answerFor(noPets, 'pets').text, 'The lister states pets are not allowed.');
  assert.equal(answerFor(bareRental, 'pets').source, 'not_stated');
});

test('move in: the stated date only', () => {
  const a = answerFor(richRental, 'move_in');
  assert.equal(a.source, 'stated');
  assert.match(a.text, /available from 1 Dec 2026/);
  assert.equal(answerFor(bareRental, 'move_in').source, 'not_stated');
  assert.equal(answerFor(checkedSale, 'move_in').source, 'not_stated');
});

test('size: beds, baths, floor area, lettable area and land area as stated', () => {
  assert.match(answerFor(richRental, 'size').text, /3 bedrooms, 2 bathrooms and 120 m²/);
  assert.match(answerFor(commercialRent, 'size').text, /lettable area of 250 m²/);
  assert.match(answerFor(land, 'size').text, /area is 648 sqm/);
  assert.equal(answerFor(bareRental, 'size').source, 'not_stated');
});

test('room sizes: checked plans say so with the date; the question picks the room', () => {
  const a = answerFor(richRental, 'floor_plans', 'How big is the main bedroom?');
  assert.equal(a.source, 'checked');
  assert.match(
    a.text,
    /^Checked by Sureground on 3 Nov 2026, Ground floor: Master bedroom 4\.2 × 3\.8 m/
  );
  assert.doesNotMatch(a.text, /Kitchen/);
  // No area is ever worked out from the sides.
  assert.doesNotMatch(a.text, /15\.96/);
  const all = answerFor(richRental, 'floor_plans');
  assert.match(all.text, /Kitchen 3 × 2\.5 m/);
  assert.doesNotMatch(all.text, /Store/);

  const estimated = fromRental({
    ...bareRentalDto,
    media: [photo('p', 0, { room: 'floor_plan' })],
    floorPlans: [
      {
        id: 'x',
        levelName: 'First floor',
        imageMediaId: 'p',
        measurementStatus: 'ESTIMATED',
        rooms: [{ id: 'a', name: 'Bedroom 2', widthM: 3, lengthM: 3 }],
      },
    ],
  });
  const e = answerFor(estimated, 'floor_plans');
  assert.equal(e.source, 'stated');
  assert.match(
    e.text,
    /^The lister states these sizes for First floor: Bedroom 2 about 3 × 3 m \(estimated\)\./
  );

  const noSizes = fromRental({
    ...bareRentalDto,
    media: [photo('p', 0, { room: 'floor_plan' })],
    floorPlans: [
      {
        id: 'x',
        levelName: 'Ground floor',
        imageMediaId: 'p',
        measurementStatus: 'ESTIMATED',
        rooms: [],
      },
    ],
  });
  const n = answerFor(noSizes, 'floor_plans');
  assert.match(n.text, /floor plan \(Ground floor\) but no room sizes/);
  assert.deepEqual(n.gaps, ['Room sizes']);
  assert.equal(answerFor(bareRental, 'floor_plans').source, 'not_stated');
});

test('title: checked evidence with its date; unchecked says so; lister title is stated', () => {
  const a = answerFor(checkedSale, 'title');
  assert.equal(a.source, 'checked');
  assert.match(
    a.text,
    /^Checked by Sureground on 20 Oct 2026: Evidence checked\. Checks passed: title document matches/
  );
  assert.match(a.text, /not a guarantee of title/);
  // Sureground's "not checked yet" is context, never a claim by the lister.
  const u = answerFor(unCheckedSale, 'title');
  assert.equal(u.source, 'not_stated');
  assert.match(u.text, /^Not stated by the lister\. Sureground has not reviewed any documents/);
  const l = answerFor(land, 'title');
  assert.equal(l.source, 'stated');
  assert.match(l.text, /title is: Certificate of Occupancy/);
  const r = answerFor(richRental, 'title');
  assert.equal(r.source, 'checked');
  assert.match(r.text, /Checked by Sureground: Verified owner and Property verified\./);
  assert.doesNotMatch(r.text, /Payment protected/);
  assert.deepEqual(r.gaps, ['Ownership confirmed']);
  assert.equal(answerFor(bareRental, 'title').source, 'not_stated');
});

test('viewing: only the description, and the arrangements are always a gap', () => {
  const a = answerFor(richRental, 'viewing');
  assert.match(a.text, /"Inspection by appointment only\."/);
  assert.deepEqual(a.gaps, ['Viewing arrangements']);
  assert.equal(answerFor(bareRental, 'viewing').source, 'not_stated');
});

test('commercial use and VAT: as stated, VAT never applied to an amount', () => {
  const u = answerFor(commercialRent, 'commercial_use');
  assert.match(u.text, /permitted use is: Office \(No food preparation\)/);
  assert.match(u.text, /loading access/);
  assert.match(answerFor(land, 'commercial_use').text, /zoning is: Residential/);
  assert.equal(answerFor(bareRental, 'commercial_use').source, 'not_stated');

  const v = answerFor(commercialRent, 'vat');
  assert.equal(v.source, 'stated');
  assert.match(v.text, /VAT of 7\.5%/);
  assert.match(v.text, /rent does not include VAT/);
  assert.doesNotMatch(v.text, /₦/);
  assert.equal(answerFor(richRental, 'vat').source, 'not_stated');
});

test('location: the address when stated, else the area with the address a gap; no distances', () => {
  const a = answerFor(richRental, 'location');
  assert.equal(a.text, 'The lister gives the address as 12 Bode Thomas Street, Surulere, Lagos.');
  const b = answerFor(bareRental, 'location');
  assert.match(b.text, /area as Yaba, Lagos/);
  assert.deepEqual(b.gaps, ['Exact address']);
  assert.doesNotMatch(
    answerQuestion(bareRental, 'How far is it from Ikeja?')[0]!.text,
    /\bkm\b|minutes/
  );
  assert.equal(answerFor(empty, 'location').source, 'not_stated');
});

test('amenities: the list as written', () => {
  assert.match(answerFor(richRental, 'amenities').text, /swimming pool/);
  assert.match(answerFor(richRental, 'amenities').text, /"Comes with a BQ\."/);
  assert.equal(answerFor(bareRental, 'amenities').source, 'not_stated');
});

// ---------------------------------------------------------------------------------------------
// Guarantees across every topic
// ---------------------------------------------------------------------------------------------

test('nothing is answered without data: an empty listing is not stated on every topic', () => {
  for (const topic of LISTING_QUESTION_TOPICS) {
    const a = answerFor(empty, topic);
    assert.equal(a.source, 'not_stated', topic);
    assert.equal(a.text, NOT_STATED_BY_LISTER, topic);
    assert.deepEqual(a.facts, [], topic);
  }
});

test('every answer is attributed, plain and naira only', () => {
  const listings = [
    richRental,
    bareRental,
    commercialRent,
    checkedSale,
    unCheckedSale,
    land,
    empty,
  ];
  for (const listing of listings) {
    for (const topic of LISTING_QUESTION_TOPICS) {
      const a = answerFor(listing, topic);
      assert.doesNotMatch(a.text, FORBIDDEN, `${listing.id} ${topic}`);
      assert.ok(!a.text.includes('—'), `${listing.id} ${topic}: no em dash`);
      assert.ok(!a.text.includes('$'), `${listing.id} ${topic}: naira only`);
      if (a.source === 'not_stated') assert.ok(a.text.startsWith(NOT_STATED_BY_LISTER));
      else
        assert.match(
          a.text,
          /The lister|Checked by Sureground|The landlord|The seller|Sureground|The listing/
        );
      if (a.source === 'checked') assert.match(a.text, /Checked by Sureground/);
    }
  }
});

test('every naira amount in an answer is one the listing states', () => {
  const amounts = (l: ShowroomListing) =>
    new Set([l.price, ...l.costs.lines.map((x) => x.amount), l.costs.total?.amount ?? -1]);
  for (const listing of [richRental, commercialRent, checkedSale, land]) {
    const allowed = amounts(listing);
    for (const topic of LISTING_QUESTION_TOPICS) {
      for (const m of answerFor(listing, topic).text.matchAll(/₦([\d,]+)/g)) {
        assert.ok(allowed.has(Number(m[1]!.replace(/,/g, ''))), `${listing.id} ${topic}: ${m[0]}`);
      }
    }
  }
});

test('suggestions: topics with data first, then common questions, at most six', () => {
  const s = suggestedTopics(richRental);
  assert.ok(s.length <= 6);
  assert.equal(s[0], 'fees');
  assert.ok(s.includes('power') && s.includes('parking'));
  for (const t of s.slice(0, -2)) assert.notEqual(answerFor(richRental, t).source, 'not_stated');
  // A listing with little data still offers the common questions.
  assert.ok(suggestedTopics(bareRental).includes('power'));
  assert.ok(suggestedTopics(unCheckedSale).includes('title'));
  assert.ok(suggestedTopics(land).includes('title'));
});
