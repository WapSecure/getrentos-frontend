// Test-only fixture API for the showroom: serves fx-* listings, proxies everything else to the real API.
import http from 'node:http';

const UPSTREAM = 'http://localhost:4000';
const PORT = Number(process.env.FIXTURE_PORT ?? 4300);
const photo = (n, w = 1600, h = 1067) => `https://picsum.photos/id/${n}/${w}/${h}`;
const PHOTO_IDS = [
  1018, 1015, 1016, 1019, 1020, 1021, 1022, 1024, 1025, 1026, 1027, 1028, 1029, 1031, 1032, 1033,
  1035, 1036, 1037, 1038, 1039, 1040, 1041, 1042, 1043, 1044, 1045, 1047, 1048, 1049, 1050, 1051,
  1052, 1053, 1054, 1055, 1056, 1057, 1058, 1059,
];
const HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

const images = (count, start = 0) =>
  PHOTO_IDS.slice(start, start + count).map((id, i) => ({
    id: `fx_img_${id}`,
    kind: 'image',
    url: photo(id),
    width: 1600,
    height: 1067,
    order: i,
  }));

const rentBase = {
  title: 'Test fixture · 3-bed flat, Lekki Phase 1',
  location: 'Lekki Phase 1, Lagos',
  address: '14 Admiralty Way',
  price: 4200000,
  period: 'year',
  allowsMonthlyPayment: true,
  bedrooms: 3,
  bathrooms: 3,
  size: 165,
  rating: 4.6,
  verified: true,
  landlordName: 'Test Landlord',
  landlordVerified: true,
  landlordRating: 4.7,
  landlordReviews: 18,
  description:
    'Test fixture for the showroom milestone. Bright three-bedroom flat with an open kitchen, a balcony facing the lagoon and 24-hour power from a shared inverter.',
  amenities: [
    '24-hour power',
    'Borehole water',
    'Security',
    'Parking',
    'Balcony',
    'Fitted kitchen',
  ],
  availableFrom: '2026-12-01',
  availableUntil: '2027-11-30',
  securityDeposit: 500000,
  minimumLeaseMonths: 12,
  furnished: false,
  petsAllowed: true,
  propertyType: 'APARTMENT',
};

const video = (order, filmed = true) => ({
  id: 'fx_vid_1',
  kind: 'video',
  url: HLS,
  posterUrl: photo(1018, 960, 540),
  durationSeconds: 634,
  order,
  ...(filmed ? { filmedOnSite: true, capturedAt: '2026-10-14T09:00:00.000Z' } : {}),
});

const FIXTURES = {
  '/rentals/fx-rent-full': {
    ...rentBase,
    id: 'fx-rent-full',
    media: [...images(8), video(8)],
  },
  '/rentals/fx-rent-tagged': {
    ...rentBase,
    id: 'fx-rent-tagged',
    title: 'Test fixture · tagged rooms, fees and a 360 tour',
    serviceCharge: 600000,
    agencyFee: 420000,
    legalFee: 420000,
    media: [
      ...images(8).map((m, i) => ({
        ...m,
        room: [
          'living',
          'living',
          'kitchen',
          'bedroom',
          'bedroom',
          'bathroom',
          'exterior',
          'exterior',
        ][i],
        ...(i === 2 ? { caption: 'Open kitchen with a gas hob and a pantry' } : {}),
      })),
      video(8),
      {
        id: 'fx_tour_1',
        kind: 'tour',
        url: 'https://kuula.co/share/collection/fixture',
        tourHost: 'kuula.co',
        order: 9,
      },
    ],
  },
  '/rentals/fx-rent-empty': {
    ...rentBase,
    id: 'fx-rent-empty',
    title: 'Test fixture · studio with no photos yet',
    securityDeposit: undefined,
    media: [],
    image: undefined,
    images: [],
  },
  '/rentals/fx-rent-broken': {
    ...rentBase,
    id: 'fx-rent-broken',
    title: 'Test fixture · one broken photo link',
    media: [
      ...images(2),
      {
        id: 'fx_img_broken',
        kind: 'image',
        url: 'https://picsum.photos/id/99999999/1600/1067',
        order: 2,
      },
      ...images(2, 2).map((m, i) => ({ ...m, order: 3 + i })),
    ],
  },
  '/rentals/fx-rent-many': {
    ...rentBase,
    id: 'fx-rent-many',
    title: 'Test fixture · 40 photos',
    media: images(40),
  },
  '/rentals/fx-rent-legacy': {
    ...rentBase,
    id: 'fx-rent-legacy',
    title: 'Test fixture · older API without media list',
    media: undefined,
    image: photo(1015),
    images: [photo(1015), photo(1016), photo(1019)],
  },
  '/marketplace/listings/fx-sale': {
    id: 'fx-sale',
    title: 'Test fixture · 4-bed terrace, Ikate',
    price: 185000000,
    city: 'Ikate',
    state: 'Lagos',
    address: '3 Elegushi Road',
    bedrooms: 4,
    bathrooms: 5,
    propertyType: 'DUPLEX',
    isVerified: false,
    underOffer: false,
    amenities: ['Swimming pool', 'Boys quarters', 'Gated estate'],
    media: [...images(6, 10), video(6, false)],
  },
  '/land/listings/fx-land': {
    id: 'fx-land',
    title: 'Test fixture · 648 sqm plot, Ibeju-Lekki',
    price: 18000000,
    city: 'Ibeju-Lekki',
    state: 'Lagos',
    address: 'Plot 12, Block C, Test Gardens',
    description:
      'Test fixture: dry, fenced plot on a tarred road, two minutes from the coastal road.',
    isVerified: true,
    media: images(3, 20),
    parcel: {
      estateName: 'Test Gardens',
      plotNumber: '12',
      areaValue: 648,
      areaUnit: 'SQUARE_METERS',
      zoning: 'Residential',
      terrain: 'Dry land',
      roadAccess: true,
      utilities: ['Electricity', 'Water'],
      titleType: 'CERTIFICATE_OF_OCCUPANCY',
      tenure: 'Leasehold, 99 years',
    },
    diligence: { status: 'VERIFIED' },
  },
};

const server = http.createServer(async (req, res) => {
  const path = (req.url || '/').split('?')[0];
  const fixture = FIXTURES[path];
  if (fixture && req.method === 'GET') {
    res.writeHead(200, {
      'content-type': 'application/json',
      'access-control-allow-origin': req.headers.origin || '*',
      'access-control-allow-credentials': 'true',
    });
    res.end(JSON.stringify(fixture));
    return;
  }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const headers = { ...req.headers };
  delete headers.host;
  delete headers['content-length'];
  try {
    const upstream = await fetch(UPSTREAM + req.url, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
      redirect: 'manual',
    });
    const out = {};
    upstream.headers.forEach((v, k) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding', 'set-cookie'].includes(k))
        out[k] = v;
    });
    const cookies = upstream.headers.getSetCookie?.() ?? [];
    if (cookies.length) out['set-cookie'] = cookies;
    res.writeHead(upstream.status, out);
    res.end(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    res.writeHead(502, { 'content-type': 'text/plain' });
    res.end(`fixture proxy: ${error.message}`);
  }
});

server.listen(PORT, () => console.log(`showroom fixtures on :${PORT} -> ${UPSTREAM}`));
