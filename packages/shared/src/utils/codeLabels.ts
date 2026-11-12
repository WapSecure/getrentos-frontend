// Machine codes (document types, event types, scan reasons) never reach people as-is.
const CODE_LABELS: Record<string, string> = {
  C_OF_O: 'Certificate of Occupancy',
  CERTIFICATE_OF_OCCUPANCY: 'Certificate of Occupancy',
  R_OF_O: 'Right of Occupancy',
  GOVERNORS_CONSENT: "Governor's consent",
  GOVERNOR_CONSENT: "Governor's consent",
  DEED_OF_ASSIGNMENT: 'Deed of assignment',
  SURVEY_PLAN: 'Survey plan',
  NATIONAL_ID: 'National ID',
  DRIVERS_LICENSE: "Driver's licence",
  DRIVERS_LICENCE: "Driver's licence",
  VOTERS_CARD: "Voter's card",
  INTERNATIONAL_PASSPORT: 'International passport',
  DETAILS_INCONSISTENT: 'Details do not agree',
  PRICE_IMPLAUSIBLE: 'Price looks implausible',
  MEDIA_SPARSE: 'Few photos',
  DESCRIPTION_TEMPLATED: 'Templated description',
  CONTACT_OFFPLATFORM: 'Asks to deal off the platform',
  IDENTITY_PRESSURE: 'Discourages verification',
  STOCK_OR_GENERIC_PHOTO: 'Stock or generic photo',
  WATERMARKED_PHOTO: 'Watermarked photo',
  PHOTO_CONTENT_MISMATCH: 'Photos do not match the listing',
  DUPLICATE_LISTING_CONTENT: 'Copies another listing',
  ESCROW_REVIEW_REQUESTED: 'Escrow review requested',
};

// Kept in capitals when a code is humanised word by word.
const ACRONYMS = new Set(['NIN', 'BVN', 'CAC', 'ID', 'KYC', 'AML', 'VAT', 'NGN', 'TIN', 'PEP']);

/** A code such as "C_OF_O" or "ACCEPTED" as a sentence-case label; unknown codes are humanised. */
export const codeLabel = (code: string | null | undefined): string => {
  if (!code) return '';
  const trimmed = code.trim();
  const known = CODE_LABELS[trimmed.toUpperCase()];
  if (known) return known;
  const words = trimmed.split(/[_\s]+/).filter(Boolean);
  return words
    .map((word, index) => {
      const upper = word.toUpperCase();
      if (ACRONYMS.has(upper)) return upper;
      const lower = word.toLowerCase();
      return index === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
    })
    .join(' ');
};

const EMBEDDED_CODE = /\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g;

/** Replaces UPPER_SNAKE codes inside a sentence, e.g. "Ownership proof (C_OF_O)". */
export const humaniseCodesInText = (text: string | null | undefined): string =>
  text ? text.replace(EMBEDDED_CODE, (code) => codeLabel(code)) : '';

/** An unambiguous date and time, e.g. "9 Nov 2026, 14:05", never "09/11/2026". */
export const formatDateTime = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
};
