import type {
  CommercialDetails,
  CommercialFitOutCondition,
  CommercialPermittedUse,
  CostLine,
  ImagePreview,
  ImageVariant,
  MediaItem,
  MediaRoom,
  PublicLandDto,
  PublicRentalDto,
  PublicSaleDto,
  ShowroomFact,
  ShowroomListing,
} from './types';
import {
  LAND_DILIGENCE_LABELS,
  LAND_TITLE_TYPE_LABELS,
  verificationSummaryOf,
} from '../utils/landTrust';
import { tidyPlace } from '../utils/address';
import { tourSource } from '../utils/videoSource';

const money = (v: unknown) => {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};
// Falsy on purpose: "0 bed" reads as a claim about the property, not a gap in the data.
const positive = (n?: number) => (n && n > 0 ? n : undefined);
const place = (...parts: (string | undefined)[]) => tidyPlace(parts.filter(Boolean).join(', '));
const humanise = (v?: string) =>
  v
    ? v
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/^\w/, (c) => c.toUpperCase())
    : undefined;
const fact = (label: string, value: unknown): ShowroomFact[] =>
  value === undefined || value === null || value === '' ? [] : [{ label, value: String(value) }];
const yesNo = (v?: boolean) => (v === undefined ? undefined : v ? 'Yes' : 'No');
const day = (iso?: string) => {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? undefined
    : d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** `srcset` for an image's resized copies; undefined when there are none, so the original is used. */
export const srcSetOf = (variants?: ImageVariant[]) =>
  variants?.length ? variants.map((v) => `${v.url} ${v.width}w`).join(', ') : undefined;

// Inline base64 images only, so a bad value can never fetch anything or break out of a CSS `url()`.
const PLACEHOLDER_PATTERN = /^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/;

/** The API's blurred placeholder when it is a small inline image; undefined otherwise, so pages behave as before. */
export const placeholderOf = (value?: string | null) =>
  value && value.length <= 2048 && PLACEHOLDER_PATTERN.test(value) ? value : undefined;

/** A list card's cover size and placeholder, checked; undefined when missing or malformed (an older API). */
export const imagePreviewOf = (value?: Partial<ImagePreview> | null): ImagePreview | undefined => {
  const { width, height } = value ?? {};
  if (!(typeof width === 'number' && width > 0 && typeof height === 'number' && height > 0))
    return undefined;
  const placeholder = placeholderOf(value?.placeholder);
  return { width, height, ...(placeholder ? { placeholder } : {}) };
};

/** The smallest copy at least `min` px wide, or the largest there is, or the original. */
export const variantAtLeast = (url: string, variants: ImageVariant[] | undefined, min: number) => {
  if (!variants?.length) return url;
  const sorted = [...variants].sort((a, b) => a.width - b.width);
  return (sorted.find((v) => v.width >= min) ?? sorted[sorted.length - 1]!).url;
};

export const MEDIA_ROOM_LABEL: Record<MediaRoom, string> = {
  living: 'Living spaces',
  bedroom: 'Bedrooms',
  bathroom: 'Bathrooms',
  kitchen: 'Kitchen',
  exterior: 'Exterior',
  amenity: 'Amenities',
  floor_plan: 'Floor plans',
  neighbourhood: 'Neighbourhood',
  other: 'Other',
};

/** One photo's room, for a label on that photo. */
export const MEDIA_ROOM_NAME: Record<MediaRoom, string> = {
  living: 'Living room',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  kitchen: 'Kitchen',
  exterior: 'Exterior',
  amenity: 'Amenity',
  floor_plan: 'Floor plan',
  neighbourhood: 'Neighbourhood',
  other: 'Other',
};

/** A photo the lister tagged as a floor plan: a line drawing, shown whole on a light background. */
export const isFloorPlan = (m: MediaItem) => m.kind === 'image' && m.room === 'floor_plan';

export interface FloorPlanLevel {
  /** Index into the media list. */
  index: number;
  /** The lister's caption exactly as written ("Ground floor"), or a plain fallback. */
  label: string;
}

/**
 * Every floor plan in display order, one per level. The caption is the level name and is never
 * parsed: a plan is only an image, so nothing here reads or claims a measurement.
 */
export function floorPlanLevels(items: MediaItem[]): FloorPlanLevel[] {
  const plans = items.flatMap((m, index) => (isFloorPlan(m) ? [{ m, index }] : []));
  return plans.map(({ m, index }, i) => ({
    index,
    label: m.caption?.trim() ? m.caption : plans.length > 1 ? `Floor plan ${i + 1}` : 'Floor plan',
  }));
}

/**
 * Photos for a hero or mosaic, cover first. Floor plans go after every other photo, so a line
 * drawing never becomes the cover; they lead only when the listing has nothing else.
 */
export function heroPhotos(items: MediaItem[]): MediaItem[] {
  const photos = items.filter((m) => m.kind === 'image');
  return [...photos.filter((m) => !isFloorPlan(m)), ...photos.filter(isFloorPlan)];
}

export const COMMERCIAL_PERMITTED_USE_LABEL: Record<CommercialPermittedUse, string> = {
  SHOP: 'Shop',
  OFFICE: 'Office',
  WAREHOUSE: 'Warehouse',
  MIXED: 'Mixed use',
  OTHER: 'Other',
};

export const COMMERCIAL_FIT_OUT_LABEL: Record<CommercialFitOutCondition, string> = {
  SHELL: 'Shell',
  SEMI_FITTED: 'Semi-fitted',
  FITTED: 'Fitted',
};

const inRange = (v: unknown, min: number, max: number, whole = false): v is number =>
  typeof v === 'number' &&
  Number.isFinite(v) &&
  v >= min &&
  v <= max &&
  (!whole || Number.isInteger(v));
const text = (v: unknown, max: number) =>
  typeof v === 'string' && v.trim() && v.length <= max ? v.trim() : undefined;
const bool = (v: unknown) => (typeof v === 'boolean' ? v : undefined);
const oneOf = <T extends string>(labels: Record<T, string>, v: unknown) =>
  typeof v === 'string' && Object.prototype.hasOwnProperty.call(labels, v) ? (v as T) : undefined;

/**
 * The API's commercial block, checked field by field: anything malformed or out of range is
 * dropped, so the page never shows a value the lister did not state. Undefined when nothing is left.
 */
export function commercialDetailsOf(value: unknown): CommercialDetails | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const v = value as Record<string, unknown>;
  const years = Array.isArray(v.leaseTermOptionsYears)
    ? [...new Set(v.leaseTermOptionsYears.filter((y) => inRange(y, 1, 99, true)))].sort(
        (a, b) => a - b
      )
    : [];
  const out: CommercialDetails = {
    permittedUse: oneOf(COMMERCIAL_PERMITTED_USE_LABEL, v.permittedUse),
    permittedUseNote: text(v.permittedUseNote, 200),
    lettableAreaSqm: inRange(v.lettableAreaSqm, 1, 1_000_000) ? v.lettableAreaSqm : undefined,
    fitOutCondition: oneOf(COMMERCIAL_FIT_OUT_LABEL, v.fitOutCondition),
    parkingSpaces: inRange(v.parkingSpaces, 0, 10_000, true) ? v.parkingSpaces : undefined,
    publicSupplyHoursStated: inRange(v.publicSupplyHoursStated, 0, 24, true)
      ? v.publicSupplyHoursStated
      : undefined,
    generator: bool(v.generator),
    generatorNote: text(v.generatorNote, 200),
    solar: bool(v.solar),
    loadingAccess: bool(v.loadingAccess),
    loadingAccessNote: text(v.loadingAccessNote, 200),
    leaseTermOptionsYears: years.length ? years : undefined,
    rentReviewNote: text(v.rentReviewNote, 500),
    escalationNote: text(v.escalationNote, 500),
    vatStatedPct: inRange(v.vatStatedPct, 0, 100) ? v.vatStatedPct : undefined,
    vatIncluded: bool(v.vatIncluded),
  };
  const stated = Object.fromEntries(
    Object.entries(out).filter(([, x]) => x !== undefined)
  ) as CommercialDetails;
  return Object.keys(stated).length ? stated : undefined;
}

const commercialFor = (propertyType: string | undefined, value: unknown) => {
  const commercial = propertyType === 'COMMERCIAL' ? commercialDetailsOf(value) : undefined;
  return commercial ? { commercial } : {};
};

const AREA_UNIT = { SQUARE_METERS: 'sqm', ACRE: 'acres', HECTARE: 'hectares' } as const;

/** Uses the API's media list when it sends one; otherwise builds images from the older URL fields. */
export function showroomMedia(
  title: string,
  media: MediaItem[] | undefined,
  urls: (string | undefined)[]
): MediaItem[] {
  if (media?.length) {
    return [...media]
      .filter((m) => typeof m.url === 'string' && m.url.length > 0)
      .sort((a, b) => a.order - b.order)
      .map((m, i) => ({
        ...m,
        alt:
          m.alt ||
          (m.kind === 'image'
            ? `${title}, photo ${i + 1}`
            : `${title}, ${m.kind === 'video' ? 'video tour' : 'virtual tour'}`),
      }));
  }
  const unique = Array.from(new Set(urls.filter((u): u is string => !!u)));
  return unique.map((url, i) => ({
    id: `image-${i}`,
    kind: 'image',
    url,
    order: i,
    alt: `${title}, photo ${i + 1}`,
  }));
}

// The first URL is the page's share and search image, so a floor plan never leads.
const imageUrls = (media: MediaItem[]) => heroPhotos(media).map((m) => m.url);

export function fromRental(r: PublicRentalDto): ShowroomListing {
  const price = money(r.price);
  const media = showroomMedia(r.title, r.media, [r.image, ...(r.images ?? [])]);
  const rentLine: CostLine = {
    label: r.period === 'year' ? 'Rent for the first year' : 'Rent for the first month',
    amount: price,
  };
  const fees: [label: string, value: unknown][] = [
    ['Service charge', r.serviceCharge],
    ['Agency fee', r.agencyFee],
    ['Legal fee', r.legalFee],
    ['Security deposit', r.securityDeposit],
  ];
  const lines: CostLine[] = [rentLine];
  const notStated: string[] = [];
  for (const [label, value] of fees) {
    const amount = positive(money(value));
    if (amount) lines.push({ label, amount });
    // A zero the landlord entered is a stated "none", not a gap.
    else if (value === undefined || value === null) notStated.push(label);
  }
  return {
    id: r.id,
    market: 'rent',
    title: r.title,
    location: tidyPlace(r.location),
    address: r.address,
    price,
    priceUnit: r.period,
    bedrooms: positive(r.bedrooms),
    bathrooms: positive(r.bathrooms),
    size: positive(r.size),
    verified: !!r.verified,
    media,
    images: imageUrls(media),
    description: r.description,
    amenities: r.amenities ?? [],
    availableFrom: r.availableFrom,
    host: r.landlordName
      ? {
          label: 'Landlord',
          name: r.landlordName,
          verified: r.landlordVerified,
          rating: r.landlordRating || undefined,
          reviews: r.landlordReviews || undefined,
        }
      : undefined,
    facts: [
      ...fact('Property type', humanise(r.propertyType)),
      ...fact('Rent paid', r.period === 'year' ? 'Yearly' : 'Monthly'),
      ...fact('Monthly payments', r.allowsMonthlyPayment ? 'Available' : undefined),
      ...fact('Minimum lease', r.minimumLeaseMonths ? `${r.minimumLeaseMonths} months` : undefined),
      ...fact('Furnished', yesNo(r.furnished)),
      ...fact('Pets allowed', yesNo(r.petsAllowed)),
      ...fact('Available from', day(r.availableFrom)),
      ...fact('Available until', day(r.availableUntil)),
      ...fact('Rating', r.rating ? `${r.rating.toFixed(1)} / 5` : undefined),
    ],
    costs: {
      lines,
      total: { label: 'Stated costs to move in', amount: lines.reduce((s, l) => s + l.amount, 0) },
      notStated,
    },
    ...commercialFor(r.propertyType, r.commercial),
  };
}

export function fromSale(s: PublicSaleDto): ShowroomListing {
  const price = money(s.price);
  const media = showroomMedia(s.title, s.media, [s.coverImageUrl, ...(s.images ?? [])]);
  return {
    id: s.id,
    market: 'sale',
    title: s.title,
    location: place(s.city, s.state),
    address: s.address,
    price,
    bedrooms: positive(s.bedrooms),
    bathrooms: positive(s.bathrooms),
    verified: !!s.isVerified,
    underOffer: !!s.underOffer,
    verificationSummary: verificationSummaryOf(s.verificationSummary),
    media,
    images: imageUrls(media),
    amenities: s.amenities ?? [],
    facts: [
      ...fact('Property type', humanise(s.propertyType)),
      ...fact('Payment', 'Protected: Sureground holds your deposit until you confirm receipt'),
    ],
    costs: {
      lines: [{ label: 'Asking price', amount: price }],
      notStated: ['Legal fee', 'Agency fee', 'Survey and registration costs'],
    },
    ...commercialFor(s.propertyType, s.commercial),
  };
}

export function fromLand(l: PublicLandDto): ShowroomListing {
  const price = money(l.price);
  const p = l.parcel;
  const media = showroomMedia(l.title, l.media, [l.coverImageUrl, ...(l.galleryImageUrls ?? [])]);
  return {
    id: l.id,
    market: 'land',
    title: l.title,
    location: place(l.city, l.state),
    address: l.address,
    price,
    verified: !!l.isVerified,
    verificationSummary: verificationSummaryOf(l.verificationSummary),
    media,
    images: imageUrls(media),
    description: l.description,
    amenities: l.amenities ?? [],
    facts: [
      ...fact(
        'Area',
        p ? `${p.areaValue.toLocaleString('en-NG')} ${AREA_UNIT[p.areaUnit]}` : undefined
      ),
      ...fact('Title', p?.titleType ? LAND_TITLE_TYPE_LABELS[p.titleType] : undefined),
      ...fact('Estate', p?.estateName),
      ...fact('Plot', p?.plotNumber),
      ...fact('Block', p?.block),
      ...fact('Frontage', positive(p?.frontage) ? `${p!.frontage} m` : undefined),
      ...fact('Depth', positive(p?.depth) ? `${p!.depth} m` : undefined),
      ...fact('Zoning', p?.zoning),
      ...fact('Permitted use', p?.permittedUse),
      ...fact('Terrain', p?.terrain),
      ...fact('Road access', yesNo(p?.roadAccess)),
      ...fact('Utilities', p?.utilities?.length ? p.utilities.join(', ') : undefined),
      ...fact('Tenure', p?.tenure),
      ...fact('Due diligence', l.diligence ? LAND_DILIGENCE_LABELS[l.diligence.status] : undefined),
    ],
    costs: {
      lines: [{ label: 'Asking price', amount: price }],
      notStated: ['Survey fee', 'Documentation fee', 'Legal fee'],
    },
  };
}

export interface ShortletMediaSource {
  title: string;
  images?: string[];
  coverImageUrl?: string;
  media?: MediaItem[];
  videoUrl?: string;
  videoStream?: { hlsUrl: string; posterUrl: string; durationSeconds?: number };
  tourUrl?: string;
}

/** Photos, then the video tour, then the 360 tour, from the shortlet response's own fields. */
export function shortletMedia(s: ShortletMediaSource): MediaItem[] {
  if (s.media?.length) return showroomMedia(s.title, s.media, []);
  const photos = showroomMedia(s.title, undefined, [s.coverImageUrl, ...(s.images ?? [])]);
  const items: MediaItem[] = [...photos];
  const videoUrl = s.videoStream?.hlsUrl ?? s.videoUrl;
  if (videoUrl) {
    items.push({
      id: 'video-0',
      kind: 'video',
      url: videoUrl,
      posterUrl: s.videoStream?.posterUrl,
      durationSeconds: s.videoStream?.durationSeconds,
      order: items.length,
      alt: `${s.title}, video tour`,
    });
  }
  const tour = tourSource(s.tourUrl);
  if (tour) {
    items.push({
      id: 'tour-0',
      kind: 'tour',
      url: tour.embedUrl,
      tourHost: tour.host,
      order: items.length,
      alt: `${s.title}, virtual tour`,
    });
  }
  return items;
}
