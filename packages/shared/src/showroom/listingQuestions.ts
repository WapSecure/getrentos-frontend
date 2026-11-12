import type { ShowroomFact, ShowroomListing } from './types';
import { roomSizeLabel, type ShowroomFloorPlanRoom } from './floorPlans';
import { VERIFICATION_SUMMARY_STATUS } from '../utils/landTrust';

/**
 * Questions about a listing, answered only from what the listing itself states. Nothing here
 * guesses, estimates or works anything out: an answer quotes the listing's own data and says who
 * stated it, and anything the data does not cover is "Not stated by the lister."
 */

export const LISTING_QUESTION_TOPICS = [
  'parking',
  'power',
  'water',
  'security',
  'service_charge',
  'fees',
  'price',
  'lease',
  'furnished',
  'pets',
  'move_in',
  'size',
  'floor_plans',
  'title',
  'viewing',
  'commercial_use',
  'vat',
  'location',
  'amenities',
] as const;

export type ListingQuestionTopic = (typeof LISTING_QUESTION_TOPICS)[number];

/** For analytics only: a question that matched no topic. */
export const UNMATCHED_QUESTION_TOPIC = 'unmatched';

/** `stated`: the lister's own words. `checked`: Sureground checked it. `not_stated`: the data is silent. */
export type ListingAnswerSource = 'stated' | 'checked' | 'not_stated';

export const LISTING_ANSWER_SOURCES: readonly ListingAnswerSource[] = [
  'stated',
  'checked',
  'not_stated',
];

export const LISTING_ANSWER_SOURCE_LABEL: Record<ListingAnswerSource, string> = {
  stated: 'Stated by the lister',
  checked: 'Checked by Sureground',
  not_stated: 'Not stated',
};

export interface ListingAnswer {
  topic: ListingQuestionTopic;
  text: string;
  source: ListingAnswerSource;
  /** The listing data the answer rests on, as label and value. Empty when nothing is stated. */
  facts: ShowroomFact[];
  /** Parts of the question the listing leaves out, so the reader knows to ask. */
  gaps: string[];
}

export const NOT_STATED_BY_LISTER = 'Not stated by the lister.';

/** A short label and an example question per topic, for suggestion chips. */
export const LISTING_QUESTION_TOPIC_INFO: Record<
  ListingQuestionTopic,
  { label: string; question: string }
> = {
  parking: { label: 'Parking', question: 'Is there parking?' },
  power: { label: 'Power', question: 'Is the power steady?' },
  water: { label: 'Water', question: 'Is there running water?' },
  security: { label: 'Security', question: 'Is the area secure?' },
  service_charge: { label: 'Service charge', question: 'How much is service charge?' },
  fees: { label: 'Fees', question: 'What does it cost to move in?' },
  price: { label: 'Price', question: 'How much is it?' },
  lease: { label: 'Lease', question: 'How long is the lease?' },
  furnished: { label: 'Furnishing', question: 'Is it furnished?' },
  pets: { label: 'Pets', question: 'Can I keep a dog?' },
  move_in: { label: 'Move-in date', question: 'When can I move in?' },
  size: { label: 'Size and rooms', question: 'How big is it?' },
  floor_plans: { label: 'Room sizes', question: 'How big is the main bedroom?' },
  title: { label: 'Title and checks', question: 'Is the title checked?' },
  viewing: { label: 'Viewing', question: 'Can I inspect it?' },
  commercial_use: { label: 'Use', question: 'Can I run a business here?' },
  vat: { label: 'VAT', question: 'Is VAT included?' },
  location: { label: 'Location', question: 'Where exactly is it?' },
  amenities: { label: 'Amenities', question: 'What amenities are there?' },
};

// ---------------------------------------------------------------------------------------------
// Matching a question to topics
// ---------------------------------------------------------------------------------------------

/**
 * Lowercase words and digits only, single spaces, padded with a space at each end so a phrase
 * can be found whole. "C of O", "C-of-O" and "C.of.O" all become " c of o ".
 */
export function normaliseQuestion(question: string): string {
  const words = question
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9₦]+/g, ' ')
    .trim();
  return words ? ` ${words} ` : '';
}

/**
 * Per topic: phrases with a weight. A phrase ending in `*` matches any word starting with it
 * ("furnish*" matches "furnished"). Longer, more specific phrases carry more weight.
 */
type Synonyms = [phrase: string, weight: number][];

const SYNONYMS: Record<ListingQuestionTopic, Synonyms> = {
  parking: [
    ['parking', 3],
    ['park', 2],
    ['car park', 3],
    ['packing space', 3],
    ['parking space', 3],
    ['garage', 3],
    ['carport', 3],
    ['car', 1],
    ['cars', 1],
  ],
  power: [
    ['power', 3],
    ['light', 3],
    ['nepa', 3],
    ['phcn', 3],
    ['electric*', 3],
    ['generator', 3],
    ['gen', 2],
    ['inverter', 3],
    ['solar', 3],
    ['prepaid', 2],
    ['meter', 2],
    ['band a', 3],
    ['transformer', 3],
    ['public supply', 3],
    ['current', 1],
    ['steady', 1],
  ],
  water: [
    ['water', 3],
    ['borehole', 3],
    ['bore hole', 3],
    ['running water', 4],
    ['tap', 2],
    ['well', 1],
    ['treatment plant', 3],
    ['plumbing', 2],
  ],
  security: [
    ['security', 3],
    ['secure', 3],
    ['safe', 2],
    ['safety', 2],
    ['gated', 3],
    ['gate', 2],
    ['guard*', 3],
    ['gateman', 3],
    ['watchman', 3],
    ['maigadi', 3],
    ['vigilante', 3],
    ['cctv', 3],
    ['crime', 3],
    ['robbery', 3],
    ['fence', 2],
  ],
  service_charge: [
    ['service charge', 5],
    ['service fee', 4],
    ['estate dues', 4],
    ['dues', 3],
    ['levy', 3],
    ['levies', 3],
    ['maintenance fee', 4],
    ['facility management', 4],
  ],
  fees: [
    ['fee', 2],
    ['fees', 2],
    ['agency', 3],
    ['agent fee', 3],
    ['agreement', 2],
    ['legal', 2],
    ['caution', 3],
    ['deposit', 3],
    ['commission', 3],
    ['total', 2],
    ['move in cost', 4],
    ['cost to move in', 6],
    ['upfront', 3],
    ['altogether', 3],
    ['all in', 3],
    ['breakdown', 3],
    ['charges', 2],
    ['extra', 1],
  ],
  price: [
    ['price', 3],
    ['rent', 2],
    ['cost', 2],
    ['how much', 2],
    ['amount', 1],
    ['asking', 2],
    ['negotiable', 3],
    ['negotiate', 3],
    ['last price', 4],
    ['per annum', 2],
    ['monthly', 1],
    ['instal*', 3],
    ['pay monthly', 3],
  ],
  lease: [
    ['lease', 3],
    ['how long', 2],
    ['tenancy', 3],
    ['contract', 2],
    ['minimum', 2],
    ['duration', 3],
    ['renew*', 3],
    ['rent review', 4],
    ['escalation', 4],
    ['increase', 2],
    ['tenure', 3],
    ['leasehold', 3],
    ['freehold', 3],
    ['years', 1],
  ],
  furnished: [
    ['furnish*', 4],
    ['furniture', 4],
    ['unfurnished', 4],
    ['fitted', 3],
    ['fit out', 3],
    ['semi fitted', 3],
    ['appliance*', 3],
    ['ac', 2],
    ['air condition*', 3],
  ],
  pets: [
    ['pet', 4],
    ['pets', 4],
    ['dog', 4],
    ['dogs', 4],
    ['puppy', 4],
    ['cat', 4],
    ['cats', 4],
    ['animal', 3],
    ['animals', 3],
  ],
  move_in: [
    ['move in', 4],
    ['moving in', 4],
    ['pack in', 4],
    ['when can i', 3],
    ['available', 1],
    ['availability', 2],
    ['vacant', 3],
    ['start date', 3],
    ['from when', 3],
    ['ready', 2],
    ['occupy', 3],
    ['keys', 2],
    ['when', 1],
  ],
  size: [
    ['how big', 3],
    ['size', 2],
    ['sqm', 3],
    ['square met*', 3],
    ['m2', 3],
    ['bedroom*', 2],
    ['bathroom*', 2],
    ['rooms', 2],
    ['toilet*', 2],
    ['bq', 1],
    ['boys quarter*', 1],
    ['plot', 2],
    ['plots', 2],
    ['acre*', 3],
    ['hectare*', 3],
    ['area', 1],
    ['frontage', 3],
    ['spacious', 2],
  ],
  floor_plans: [
    ['floor plan*', 5],
    ['layout', 4],
    ['room size*', 5],
    ['dimension*', 4],
    ['measure*', 4],
    ['plan', 2],
  ],
  title: [
    ['title', 4],
    ['c of o', 5],
    ['cofo', 5],
    ['certificate of occupancy', 5],
    ['governors consent', 5],
    ['deed', 4],
    ['deed of assignment', 5],
    ['survey', 3],
    ['verified', 3],
    ['verif*', 3],
    ['checked', 3],
    ['genuine', 3],
    ['legit*', 3],
    ['fake', 3],
    ['scam', 3],
    ['document*', 3],
    ['papers', 3],
    ['gazette', 4],
    ['excision', 4],
    ['ownership', 4],
    ['owner', 2],
    ['omo onile', 4],
    ['family land', 4],
    ['allocation', 3],
  ],
  viewing: [
    ['inspect*', 4],
    ['viewing', 4],
    ['visit', 3],
    ['see the', 2],
    ['tour', 3],
    ['appointment', 3],
    ['view', 1],
  ],
  commercial_use: [
    ['shop', 3],
    ['office', 3],
    ['warehouse', 3],
    ['business', 3],
    ['commercial', 3],
    ['permitted use', 5],
    ['zoning', 4],
    ['zoned', 4],
    ['use it as', 3],
    ['use as', 3],
    ['mixed use', 4],
    ['loading', 3],
    ['restaurant', 3],
    ['school', 2],
    ['church', 2],
  ],
  vat: [
    ['vat', 5],
    ['tax', 3],
    ['value added', 5],
  ],
  location: [
    ['where', 2],
    ['location', 3],
    ['located', 3],
    ['address', 4],
    ['street', 3],
    ['close to', 3],
    ['near*', 3],
    ['distance', 3],
    ['how far', 3],
    ['far', 1],
    ['landmark', 3],
    ['junction', 3],
    ['bus stop', 3],
    ['area', 1],
  ],
  amenities: [
    ['amenit*', 4],
    ['facilities', 3],
    ['facility', 2],
    ['features', 3],
    ['pool', 3],
    ['swimming', 3],
    ['gym', 3],
    ['playground', 3],
    ['elevator', 3],
    ['lift', 3],
    ['pop', 2],
    ['wardrobe*', 3],
    ['bq', 3],
    ['boys quarter*', 4],
  ],
};

const ROOM_WORDS =
  /\b(bed ?rooms?|master|main room|kitchen|living|sitting|parlou?r|lounge|dining|bath ?rooms?|toilets?|study|office|store|bq|boys quarters?|room)\b/;
const SIZE_WORDS = /\b(big|size|sizes|large|small|dimensions?|measure\w*|sqm|square|wide|long)\b/;

function phraseScore(norm: string, phrase: string): boolean {
  if (phrase.endsWith('*')) {
    const stem = phrase.slice(0, -1);
    return norm.includes(` ${stem}`);
  }
  return norm.includes(` ${phrase} `);
}

export interface TopicMatch {
  topic: ListingQuestionTopic;
  score: number;
}

/**
 * The topics a question is about, best first. Deterministic: ties keep the catalogue's order.
 * An empty list means the question matched nothing in the catalogue.
 */
export function matchTopics(question: string): TopicMatch[] {
  const norm = normaliseQuestion(question);
  if (!norm) return [];
  const scores = new Map<ListingQuestionTopic, number>();
  for (const topic of LISTING_QUESTION_TOPICS) {
    let score = 0;
    for (const [phrase, weight] of SYNONYMS[topic]) {
      if (phraseScore(norm, phrase)) score += weight;
    }
    if (score > 0) scores.set(topic, score);
  }
  // "How big is the main bedroom?" asks for one room's size: that lives on the floor plan.
  if (ROOM_WORDS.test(norm) && SIZE_WORDS.test(norm)) {
    scores.set('floor_plans', (scores.get('floor_plans') ?? 0) + 6);
  }
  // "How much is service charge?" is about the charge, not the price.
  if (scores.has('service_charge') && scores.has('price')) {
    scores.set('price', Math.min(scores.get('price')!, 1));
  }
  return LISTING_QUESTION_TOPICS.filter((t) => scores.has(t))
    .map((topic) => ({ topic, score: scores.get(topic)! }))
    .sort((a, b) => b.score - a.score);
}

/** The topics worth answering for a question: the best, and a close second. At most two. */
export function topicsToAnswer(question: string): ListingQuestionTopic[] {
  const [first, second] = matchTopics(question);
  if (!first) return [];
  return second && second.score * 2 >= first.score + 1
    ? [first.topic, second.topic]
    : [first.topic];
}

// ---------------------------------------------------------------------------------------------
// Answering from the listing's data
// ---------------------------------------------------------------------------------------------

// The amount as stated, never rounded.
const naira = (n: number) => `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;

const day = (iso?: string | null) => {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? undefined
    : d.toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Africa/Lagos',
      });
};

const list = (items: string[]) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;

const lowerFirst = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0]!.toLowerCase() + s.slice(1) : s);

const factValue = (listing: ShowroomListing, label: string) =>
  listing.facts.find((f) => f.label === label)?.value;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Amenities the lister ticked that match a topic, exactly as written. */
const AMENITY_PATTERNS: Partial<Record<ListingQuestionTopic, RegExp>> = {
  parking: /\b(parking|car ?park|garage|carport)\b/i,
  power:
    /\b(power|generator|inverter|solar|electric\w*|prepaid meter|transformer|24\s*\/?\s*7 (light|power)|steady light|constant light)\b/i,
  water: /\b(water|borehole|bore hole|treatment plant)\b/i,
  security: /\b(security|gated|guards?|cctv|gatehouse|alarm|intercom|fenced|perimeter)\b/i,
  furnished: /\b(furnish\w*|furniture|air ?condition\w*|wardrobes?|fitted kitchen)\b/i,
  pets: /\b(pets?|dogs?|cats?)\b/i,
  amenities: /./,
};

/** Description sentences that mention a topic, quoted as written. */
const DESCRIPTION_PATTERNS: Partial<Record<ListingQuestionTopic, RegExp>> = {
  parking: /\b(parking|car ?park|garage|carport|parking space)\b/i,
  power: /\b(power|light|nepa|phcn|electric\w*|generator|inverter|solar|prepaid|transformer)\b/i,
  water: /\b(water|borehole|bore hole|treatment plant)\b/i,
  security: /\b(security|secure|gated|guards?|cctv|gateman|watchman|fenced)\b/i,
  service_charge: /\b(service charge|service fee|estate dues|levy|levies)\b/i,
  fees: /\b(agency fee|agent fee|agreement|legal fee|caution|deposit|commission)\b/i,
  lease: /\b(lease|tenancy|minimum of|renewal|renewable)\b/i,
  furnished: /\b(furnish\w*|furniture|unfurnished|fitted)\b/i,
  pets: /\b(pets?|dogs?|cats?|animals?)\b/i,
  move_in: /\b(available from|move in|vacant|ready for occupation)\b/i,
  viewing: /\b(inspection|viewing|visit|appointment)\b/i,
  commercial_use: /\b(permitted use|zon(ed|ing)|commercial use|suitable for)\b/i,
  title:
    /\b(c of o|certificate of occupancy|governor'?s consent|deed of assignment|survey plan|gazette|excision)\b/i,
  size: /\b(bq|boys'? quarters?|sqm|square met(re|er)s?)\b/i,
  amenities: /\b(bq|boys'? quarters?)\b/i,
};

const MAX_QUOTES = 2;
const QUOTE_MAX = 240;

function descriptionQuotes(listing: ShowroomListing, topic: ListingQuestionTopic): string[] {
  const pattern = DESCRIPTION_PATTERNS[topic];
  if (!pattern || !listing.description) return [];
  const sentences = listing.description
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences
    .filter((s) => pattern.test(s))
    .slice(0, MAX_QUOTES)
    .map((s) => (s.length > QUOTE_MAX ? `${s.slice(0, QUOTE_MAX - 3).trimEnd()}...` : s));
}

function matchingAmenities(listing: ShowroomListing, topic: ListingQuestionTopic): string[] {
  const pattern = AMENITY_PATTERNS[topic];
  return pattern ? listing.amenities.filter((a) => a.trim() && pattern.test(a)) : [];
}

/** Builds an answer from statements: lister lines first, then Sureground's checked lines. */
class Builder {
  stated: string[] = [];
  checked: string[] = [];
  /** Sureground's own status lines (not checked yet, under offer): context, never a source. */
  notes: string[] = [];
  facts: ShowroomFact[] = [];
  gaps: string[] = [];

  readonly listing: ShowroomListing;
  readonly topic: ListingQuestionTopic;
  readonly question?: string;

  // Plain fields, not parameter properties: the tests run under Node's type stripping.
  constructor(listing: ShowroomListing, topic: ListingQuestionTopic, question?: string) {
    this.listing = listing;
    this.topic = topic;
    this.question = question;
  }

  state(sentence: string, ...facts: ShowroomFact[]) {
    this.stated.push(sentence);
    this.facts.push(...facts);
    return this;
  }

  check(sentence: string, ...facts: ShowroomFact[]) {
    this.checked.push(sentence);
    this.facts.push(...facts);
    return this;
  }

  amenities() {
    const found = matchingAmenities(this.listing, this.topic);
    if (found.length) {
      this.state(
        `The lister includes ${list(found.map(lowerFirst))} in the amenities.`,
        ...found.map((value) => ({ label: 'Amenity', value }))
      );
    }
    return this;
  }

  description() {
    const quotes = descriptionQuotes(this.listing, this.topic);
    if (quotes.length) {
      this.state(
        `The lister's description says: ${quotes.map((q) => `"${q}"`).join(' ')}`,
        ...quotes.map((value) => ({ label: 'From the description', value }))
      );
    }
    return this;
  }

  note(sentence: string, ...facts: ShowroomFact[]) {
    this.notes.push(sentence);
    this.facts.push(...facts);
    return this;
  }

  gap(...items: string[]) {
    this.gaps.push(...items);
    return this;
  }

  build(): ListingAnswer {
    const { topic, stated, checked, notes, facts } = this;
    const gaps = [...new Set(this.gaps)];
    if (!stated.length && !checked.length) {
      const text = [NOT_STATED_BY_LISTER, ...notes].join(' ');
      return { topic, text, source: 'not_stated', facts: notes.length ? facts : [], gaps };
    }
    const text = [...checked, ...stated, ...notes].join(' ');
    return { topic, text, source: checked.length ? 'checked' : 'stated', facts, gaps };
  }
}

function rentFeeLine(listing: ShowroomListing, label: string) {
  return listing.costs.lines.find((l) => l.label === label);
}

// The rental mapper lists these fees as lines when stated, as "not stated" when missing, and
// leaves them out of both when the landlord entered zero: a stated "none".
const RENT_FEES = ['Service charge', 'Agency fee', 'Legal fee', 'Security deposit'];
const statedNone = (listing: ShowroomListing, label: string) =>
  listing.market === 'rent' &&
  RENT_FEES.includes(label) &&
  !rentFeeLine(listing, label) &&
  !listing.costs.notStated.includes(label);

const ANSWERS: Record<ListingQuestionTopic, (b: Builder) => Builder> = {
  parking(b) {
    const spaces = b.listing.commercial?.parkingSpaces;
    if (spaces !== undefined) {
      b.state(
        spaces === 0
          ? 'The lister states there is no parking.'
          : `The lister states there ${spaces === 1 ? 'is 1 parking space' : `are ${spaces} parking spaces`}.`,
        { label: 'Parking', value: spaces === 0 ? 'None' : plural(spaces, 'space', 'spaces') }
      );
    }
    return b.amenities().description();
  },

  power(b) {
    const c = b.listing.commercial;
    if (c?.publicSupplyHoursStated !== undefined) {
      const h = c.publicSupplyHoursStated;
      b.state(
        h === 0
          ? 'The lister states there is no public power supply.'
          : `The lister states about ${plural(h, 'hour', 'hours')} of public power a day.`,
        {
          label: 'Public supply',
          value: h === 0 ? 'None' : `About ${plural(h, 'hour', 'hours')} a day`,
        }
      );
    }
    if (c?.generator !== undefined) {
      b.state(
        c.generator
          ? `The lister states there is a generator${c.generatorNote ? `: ${c.generatorNote}` : ''}.`
          : 'The lister states there is no generator.',
        { label: 'Generator', value: c.generator ? 'Yes' : 'No' }
      );
    }
    if (c?.solar !== undefined) {
      b.state(
        c.solar ? 'The lister states there is solar.' : 'The lister states there is no solar.',
        {
          label: 'Solar',
          value: c.solar ? 'Yes' : 'No',
        }
      );
    }
    const utilities = factValue(b.listing, 'Utilities');
    if (utilities && /electric|power/i.test(utilities)) {
      b.state(`The lister lists these utilities: ${utilities}.`, {
        label: 'Utilities',
        value: utilities,
      });
    }
    b.amenities().description();
    // How steady the power is: only ever the lister's own figure, never measured by Sureground.
    if (c?.publicSupplyHoursStated === undefined) b.gap('Hours of public power a day');
    return b;
  },

  water(b) {
    const utilities = factValue(b.listing, 'Utilities');
    if (utilities && /water|borehole/i.test(utilities)) {
      b.state(`The lister lists these utilities: ${utilities}.`, {
        label: 'Utilities',
        value: utilities,
      });
    }
    return b.amenities().description();
  },

  security(b) {
    return b.amenities().description();
  },

  service_charge(b) {
    const line = rentFeeLine(b.listing, 'Service charge');
    if (line) {
      b.state(`The lister states a service charge of ${naira(line.amount)}.`, {
        label: line.label,
        value: naira(line.amount),
      });
    } else if (statedNone(b.listing, 'Service charge')) {
      b.state('The lister states there is no service charge.', {
        label: 'Service charge',
        value: 'None',
      });
    }
    b.description();
    if (!line && !statedNone(b.listing, 'Service charge')) b.gap('Service charge');
    return b;
  },

  fees(b) {
    const { costs } = b.listing;
    const [first, ...rest] = costs.lines;
    if (first && first.amount > 0) {
      const lines = costs.lines.filter((l) => l.amount > 0);
      b.state(
        `The lister states: ${lines.map((l) => `${lowerFirst(l.label)} ${naira(l.amount)}`).join(', ')}.`,
        ...lines.map((l) => ({ label: l.label, value: naira(l.amount) }))
      );
      // The total is the listing's own sum of the lines above, shown on the page as well.
      if (costs.total && rest.length > 0) {
        b.state(`${costs.total.label}: ${naira(costs.total.amount)}.`, {
          label: costs.total.label,
          value: naira(costs.total.amount),
        });
      }
      const none = RENT_FEES.filter((label) => statedNone(b.listing, label));
      if (none.length) {
        b.state(`The lister states there is no ${list(none.map(lowerFirst))}.`);
      }
    }
    b.description();
    return b.gap(...costs.notStated);
  },

  price(b) {
    const { listing } = b;
    if (listing.price > 0) {
      if (listing.market === 'rent') {
        b.state(
          `The lister states the rent is ${naira(listing.price)}${listing.priceUnit ? ` a ${listing.priceUnit}` : ''}.`,
          { label: 'Rent', value: naira(listing.price) }
        );
        if (factValue(listing, 'Monthly payments') === 'Available') {
          b.state('The lister states monthly payments are available.', {
            label: 'Monthly payments',
            value: 'Available',
          });
        }
      } else {
        b.state(`The lister states an asking price of ${naira(listing.price)}.`, {
          label: 'Asking price',
          value: naira(listing.price),
        });
      }
    }
    if (listing.underOffer) {
      b.note('The seller has accepted an offer on this property.', {
        label: 'Status',
        value: 'Under offer',
      });
    }
    return b;
  },

  lease(b) {
    const { listing } = b;
    const minimum = factValue(listing, 'Minimum lease');
    if (minimum) {
      b.state(`The lister states a minimum lease of ${minimum}.`, {
        label: 'Minimum lease',
        value: minimum,
      });
    }
    const c = listing.commercial;
    if (c?.leaseTermOptionsYears?.length) {
      const years = c.leaseTermOptionsYears;
      const value = `${years.length === 1 ? String(years[0]) : `${years.slice(0, -1).join(', ')} or ${years.at(-1)}`} ${years.length === 1 && years[0] === 1 ? 'year' : 'years'}`;
      b.state(`The lister offers lease terms of ${value}.`, {
        label: 'Lease terms on offer',
        value,
      });
    }
    if (c?.rentReviewNote) {
      b.state(`On rent review, the lister states: "${c.rentReviewNote}"`, {
        label: 'Rent review',
        value: c.rentReviewNote,
      });
    }
    if (c?.escalationNote) {
      b.state(`On escalation, the lister states: "${c.escalationNote}"`, {
        label: 'Escalation',
        value: c.escalationNote,
      });
    }
    const until = factValue(listing, 'Available until');
    if (until) {
      b.state(`The lister states it is available until ${until}.`, {
        label: 'Available until',
        value: until,
      });
    }
    const tenure = factValue(listing, 'Tenure');
    if (tenure) {
      b.state(`The lister states the tenure is: ${tenure}.`, { label: 'Tenure', value: tenure });
    }
    const paid = factValue(listing, 'Rent paid');
    if (paid && b.stated.length) {
      b.state(`Rent is paid ${paid.toLowerCase()}.`, { label: 'Rent paid', value: paid });
    }
    return b.description();
  },

  furnished(b) {
    const furnished = factValue(b.listing, 'Furnished');
    if (furnished) {
      b.state(
        furnished === 'Yes'
          ? 'The lister states it is furnished.'
          : 'The lister states it is not furnished.',
        { label: 'Furnished', value: furnished }
      );
    }
    const fitOut = b.listing.commercial?.fitOutCondition;
    if (fitOut) {
      const label = { SHELL: 'Shell', SEMI_FITTED: 'Semi-fitted', FITTED: 'Fitted' }[fitOut];
      b.state(`The lister states the fit-out is: ${label}.`, { label: 'Fit-out', value: label });
    }
    return b.amenities().description();
  },

  pets(b) {
    const pets = factValue(b.listing, 'Pets allowed');
    if (pets) {
      b.state(
        pets === 'Yes'
          ? 'The lister states pets are allowed.'
          : 'The lister states pets are not allowed.',
        { label: 'Pets allowed', value: pets }
      );
    }
    return b.amenities().description();
  },

  move_in(b) {
    const { listing } = b;
    const from = factValue(listing, 'Available from');
    if (from) {
      b.state(`The lister states it is available from ${from}.`, {
        label: 'Available from',
        value: from,
      });
    }
    const until = factValue(listing, 'Available until');
    if (until) {
      b.state(`The lister states it is available until ${until}.`, {
        label: 'Available until',
        value: until,
      });
    }
    if (listing.underOffer) {
      b.note('The seller has accepted an offer on this property.', {
        label: 'Status',
        value: 'Under offer',
      });
    }
    return b.description();
  },

  size(b) {
    const { listing } = b;
    const parts: string[] = [];
    if (listing.bedrooms) {
      parts.push(plural(listing.bedrooms, 'bedroom', 'bedrooms'));
      b.facts.push({ label: 'Bedrooms', value: String(listing.bedrooms) });
    }
    if (listing.bathrooms) {
      parts.push(plural(listing.bathrooms, 'bathroom', 'bathrooms'));
      b.facts.push({ label: 'Bathrooms', value: String(listing.bathrooms) });
    }
    if (listing.size) {
      parts.push(`${listing.size} m²`);
      b.facts.push({ label: 'Size', value: `${listing.size} m²` });
    }
    if (parts.length) b.state(`The lister states ${list(parts)}.`);
    const lettable = listing.commercial?.lettableAreaSqm;
    if (lettable !== undefined) {
      const value = `${new Intl.NumberFormat('en-NG', { maximumFractionDigits: 2 }).format(lettable)} m²`;
      b.state(`The lister states a lettable area of ${value}.`, { label: 'Lettable area', value });
    }
    for (const label of ['Area', 'Frontage', 'Depth']) {
      const value = factValue(listing, label);
      if (value) {
        b.state(`The lister states the ${label.toLowerCase()} is ${value}.`, { label, value });
      }
    }
    return b.description();
  },

  floor_plans(b) {
    const plans = b.listing.floorPlans ?? [];
    const sized = plans.flatMap((plan) =>
      plan.rooms
        .filter((r) => r.widthM !== undefined && r.lengthM !== undefined)
        .map((room) => ({ plan, room }))
    );
    if (!plans.length) return b;
    if (!sized.length) {
      b.state(
        `The lister added ${plans.length === 1 ? 'a floor plan' : `${plans.length} floor plans`} (${list(plans.map((p) => p.levelName))}) but no room sizes.`,
        ...plans.map((p) => ({ label: 'Floor plan', value: p.levelName }))
      );
      return b.gap('Room sizes');
    }
    const wanted = roomsAskedAbout(
      b.question,
      sized.map((s) => s.room)
    );
    const shown = wanted.length ? sized.filter((s) => wanted.includes(s.room)) : sized;
    for (const plan of plans) {
      const rooms = shown.filter((s) => s.plan === plan).map((s) => s.room);
      if (!rooms.length) continue;
      const sizes = rooms.map((r) => `${r.name} ${roomSizeLabel(r, plan.measurement)!}`);
      const facts = rooms.map((r) => ({
        label: `${r.name} (${plan.levelName})`,
        value: roomSizeLabel(r, plan.measurement)!,
      }));
      if (plan.measurement === 'checked') {
        const on = day(plan.checkedAt);
        b.check(
          `Checked by Sureground${on ? ` on ${on}` : ''}, ${plan.levelName}: ${sizes.join('; ')}.`,
          ...facts
        );
      } else {
        b.state(
          `The lister states these sizes for ${plan.levelName}: ${sizes.join('; ')}.`,
          ...facts
        );
      }
    }
    return b;
  },

  title(b) {
    const { listing } = b;
    const titleType = factValue(listing, 'Title');
    if (titleType) {
      b.state(`The lister states the title is: ${titleType}.`, {
        label: 'Title',
        value: titleType,
      });
    }
    const diligence = factValue(listing, 'Due diligence');
    if (diligence) {
      b.note(`Due diligence status on Sureground: ${diligence}.`, {
        label: 'Due diligence',
        value: diligence,
      });
    }
    const summary = listing.verificationSummary;
    if (summary) {
      const status = VERIFICATION_SUMMARY_STATUS[summary.status];
      const fact = { label: 'Sureground check', value: status.label };
      const checkedStatus = ['EVIDENCE_VERIFIED', 'CONDITIONALLY_APPROVED', 'INVESTMENT_ELIGIBLE'];
      if (checkedStatus.includes(summary.status) && summary.scope.length) {
        const on = day(summary.checkedAt);
        b.check(
          `Checked by Sureground${on ? ` on ${on}` : ''}: ${status.label}. Checks passed: ${list(summary.scope.map(lowerFirst))}. ${summary.limits[0] ?? ''}`.trim(),
          fact,
          ...summary.scope.map((value) => ({ label: 'Check passed', value }))
        );
        if (summary.openIssues.length) {
          b.check(`Open issues: ${list(summary.openIssues.map(lowerFirst))}.`);
        }
      } else {
        // Not checked, still in review, refused or lapsed: say so plainly, in the status's own words.
        b.note(status.description, fact);
      }
    }
    const steps = listing.trustChain?.steps.filter((s) => s.met && s.id !== 'payment') ?? [];
    if (steps.length) {
      b.check(
        `Checked by Sureground: ${list(steps.map((s) => s.label))}.`,
        ...steps.map((s) => ({ label: 'Sureground check', value: s.label }))
      );
    }
    // Steps not met yet are gaps, never claims.
    b.gap(
      ...(listing.trustChain?.steps.filter((s) => !s.met && s.id !== 'payment') ?? []).map(
        (s) => s.label
      )
    );
    b.description();
    if (!titleType && !summary && !steps.length) b.gap('Title documents');
    return b;
  },

  viewing(b) {
    return b.description().gap('Viewing arrangements');
  },

  commercial_use(b) {
    const { listing } = b;
    const c = listing.commercial;
    if (c?.permittedUse) {
      const label = {
        SHOP: 'Shop',
        OFFICE: 'Office',
        WAREHOUSE: 'Warehouse',
        MIXED: 'Mixed use',
        OTHER: 'Other',
      }[c.permittedUse];
      b.state(
        `The lister states the permitted use is: ${label}${c.permittedUseNote ? ` (${c.permittedUseNote})` : ''}.`,
        { label: 'Permitted use', value: label }
      );
    } else if (c?.permittedUseNote) {
      b.state(`The lister states the permitted use is: ${c.permittedUseNote}.`, {
        label: 'Permitted use',
        value: c.permittedUseNote,
      });
    }
    if (c?.loadingAccess !== undefined) {
      b.state(
        c.loadingAccess
          ? `The lister states there is loading access${c.loadingAccessNote ? `: ${c.loadingAccessNote}` : ''}.`
          : 'The lister states there is no loading access.',
        { label: 'Loading access', value: c.loadingAccess ? 'Yes' : 'No' }
      );
    }
    for (const label of ['Permitted use', 'Zoning']) {
      const value = factValue(listing, label);
      if (value) {
        b.state(`The lister states the ${label.toLowerCase()} is: ${value}.`, { label, value });
      }
    }
    const type = factValue(listing, 'Property type');
    if (type && b.stated.length === 0) {
      b.state(`The lister lists the property type as: ${type}.`, {
        label: 'Property type',
        value: type,
      });
    }
    return b.description();
  },

  vat(b) {
    const c = b.listing.commercial;
    const amount = b.listing.market === 'rent' ? 'rent' : 'price';
    if (c?.vatStatedPct !== undefined) {
      const pct = `${new Intl.NumberFormat('en-NG', { maximumFractionDigits: 2 }).format(c.vatStatedPct)}%`;
      b.state(`The landlord states VAT of ${pct}.`, { label: 'VAT', value: pct });
    }
    if (c?.vatIncluded !== undefined) {
      b.state(
        c.vatIncluded
          ? `The landlord states the ${amount} includes VAT.`
          : `The landlord states the ${amount} does not include VAT.`,
        { label: 'VAT included', value: c.vatIncluded ? 'Yes' : 'No' }
      );
    }
    if (b.stated.length) b.note('Sureground does not add VAT to any amount on this page.');
    return b;
  },

  location(b) {
    const { listing } = b;
    if (listing.address) {
      b.state(`The lister gives the address as ${listing.address}, ${listing.location}.`, {
        label: 'Address',
        value: `${listing.address}, ${listing.location}`,
      });
    } else if (listing.location) {
      b.state(`The lister gives the area as ${listing.location}.`, {
        label: 'Area',
        value: listing.location,
      });
      b.gap('Exact address');
    }
    for (const label of ['Estate', 'Plot', 'Block', 'Road access']) {
      const value = factValue(listing, label);
      if (value) b.facts.push({ label, value });
    }
    return b;
  },

  amenities(b) {
    return b.amenities().description();
  },
};

const IGNORED_ROOM_WORDS = new Set(['room', 'the', 'and', 'of', 'a']);
const ROOM_ALIASES: Record<string, string[]> = {
  main: ['master', 'main'],
  master: ['master', 'main'],
  parlour: ['living', 'sitting', 'lounge', 'parlour'],
  parlor: ['living', 'sitting', 'lounge', 'parlour'],
  sitting: ['living', 'sitting', 'lounge', 'parlour'],
  living: ['living', 'sitting', 'lounge', 'parlour'],
  lounge: ['living', 'sitting', 'lounge', 'parlour'],
  toilet: ['toilet', 'bathroom', 'wc'],
  bathroom: ['toilet', 'bathroom', 'wc'],
  bq: ['bq', 'boys', 'quarters'],
};

/** The rooms whose names the question mentions ("main bedroom" finds "Master bedroom"). */
function roomsAskedAbout(
  question: string | undefined,
  rooms: ShowroomFloorPlanRoom[]
): ShowroomFloorPlanRoom[] {
  if (!question) return [];
  const asked = normaliseQuestion(question)
    .trim()
    .split(' ')
    .map((w) => w.replace(/s$/, ''))
    .filter((w) => w && !IGNORED_ROOM_WORDS.has(w));
  if (!asked.length) return [];
  const scored = rooms.map((room) => {
    const words = normaliseQuestion(room.name)
      .trim()
      .split(' ')
      .map((w) => w.replace(/s$/, ''))
      .filter((w) => !IGNORED_ROOM_WORDS.has(w));
    const score = asked.filter((w) =>
      (ROOM_ALIASES[w] ?? [w]).some((alias) => words.includes(alias))
    ).length;
    return { room, score };
  });
  const best = Math.max(0, ...scored.map((s) => s.score));
  return best > 0 ? scored.filter((s) => s.score === best).map((s) => s.room) : [];
}

/**
 * The answer to one topic, from this listing's data only. `question` narrows a room-size answer
 * to the rooms it names; it never adds anything the listing does not state.
 */
export function answerFor(
  listing: ShowroomListing,
  topic: ListingQuestionTopic,
  question?: string
): ListingAnswer {
  return ANSWERS[topic](new Builder(listing, topic, question)).build();
}

/** The answer when a question matches no topic: nothing to quote, so ask the lister. */
export const UNMATCHED_ANSWER_TEXT =
  'This listing does not say. Ask the lister, or try one of the suggested questions.';

/** Answers for a free-text question: one or two topics, or none when nothing matched. */
export function answerQuestion(listing: ShowroomListing, question: string): ListingAnswer[] {
  return topicsToAnswer(question).map((topic) => answerFor(listing, topic, question));
}

const SUGGESTION_ORDER: Record<ShowroomListing['market'], ListingQuestionTopic[]> = {
  rent: [
    'fees',
    'service_charge',
    'power',
    'parking',
    'lease',
    'move_in',
    'floor_plans',
    'furnished',
    'pets',
    'vat',
    'commercial_use',
    'title',
    'water',
    'security',
  ],
  sale: [
    'title',
    'floor_plans',
    'size',
    'power',
    'parking',
    'commercial_use',
    'vat',
    'water',
    'security',
    'fees',
  ],
  land: ['title', 'size', 'commercial_use', 'power', 'water', 'location', 'fees'],
};

/** Always offered, even unanswered: they are what people ask most, and lead to "Ask the lister". */
const COMMON: Record<ShowroomListing['market'], ListingQuestionTopic[]> = {
  rent: ['power', 'parking'],
  sale: ['title', 'parking'],
  land: ['title', 'location'],
};

/**
 * Topics for suggestion chips: those the listing has data on, in the order that matters most for
 * its market, then a couple of common questions. At most `max`.
 */
export function suggestedTopics(listing: ShowroomListing, max = 6): ListingQuestionTopic[] {
  const answered = SUGGESTION_ORDER[listing.market].filter(
    (t) => answerFor(listing, t).source !== 'not_stated'
  );
  const common = COMMON[listing.market].filter((t) => !answered.includes(t));
  const withCommon = [...answered.slice(0, Math.max(0, max - common.length)), ...common];
  return [...new Set(withCommon)].slice(0, max);
}
