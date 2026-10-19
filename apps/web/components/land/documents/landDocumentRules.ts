import { LAND_DOCUMENT_TYPES, type LandDocumentType } from '@/types/landDocument';

/**
 * The API's rules for a land document upload (file-upload.policy.ts,
 * validateLandDocumentUpload), so a bad file is explained before it is sent.
 * The API still decides.
 */
/** The same cap in MB, for the shared upload control. */
export const LAND_DOCUMENT_MAX_MB = 20;
export const LAND_DOCUMENT_MAX_BYTES = LAND_DOCUMENT_MAX_MB * 1024 * 1024;

export const LAND_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/** For the file input's `accept`: extensions as well, since some systems report no MIME type. */
export const LAND_DOCUMENT_ACCEPT = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.doc',
  '.docx',
  ...LAND_DOCUMENT_MIME_TYPES,
].join(',');

export const LAND_DOCUMENT_FILE_HINT = 'PDF, JPEG, PNG, WebP, DOC or DOCX, up to 20 MB.';

/** Why this file would be refused, or null when it looks acceptable. */
export const landDocumentFileProblem = (file: File): string | null => {
  if (file.size > LAND_DOCUMENT_MAX_BYTES) return 'This file is larger than 20 MB.';
  if (file.size === 0) return 'This file is empty.';
  if (file.type && !LAND_DOCUMENT_MIME_TYPES.includes(file.type)) {
    return `This file type is not accepted. Use ${LAND_DOCUMENT_FILE_HINT}`;
  }
  return null;
};

export const LAND_DOCUMENT_TYPE_LABELS: Record<LandDocumentType, string> = {
  CERTIFICATE_OF_OCCUPANCY: 'Certificate of Occupancy',
  GOVERNORS_CONSENT: "Governor's Consent",
  DEED_OF_ASSIGNMENT: 'Deed of Assignment',
  REGISTERED_CONVEYANCE: 'Registered conveyance',
  SURVEY_PLAN: 'Survey plan',
  EXCISION_GAZETTE: 'Excision gazette',
  ALLOCATION_LETTER: 'Allocation letter',
  LAYOUT_PLAN: 'Layout plan',
  REGISTRY_SEARCH_REPORT: 'Registry search report',
  CHARTING_REPORT: 'Charting report',
  LITIGATION_SEARCH_REPORT: 'Litigation search report',
  SITE_INSPECTION_REPORT: 'Site inspection report',
  VALUATION_REPORT: 'Valuation report',
  CONTRACT_OF_SALE: 'Contract of sale',
  POWER_OF_ATTORNEY: 'Power of attorney',
  RECEIPT: 'Receipt',
  PHOTO: 'Photo',
  OTHER: 'Other',
  LETTERS_OF_ADMINISTRATION: 'Letters of administration',
  PROBATE: 'Grant of probate',
  COURT_ORDER: 'Court order',
  BOARD_RESOLUTION: 'Board resolution',
  DEVELOPMENT_AGREEMENT: 'Development agreement',
  FAMILY_RESOLUTION: 'Family resolution',
  COMMUNITY_RESOLUTION: 'Community resolution',
  CONSENT_LETTER: 'Signed consent',
  LEGAL_INQUIRY_REPORT: 'Legal inquiry report',
};

export const LAND_DOCUMENT_TYPE_OPTIONS = LAND_DOCUMENT_TYPES.map((value) => ({
  value,
  label: LAND_DOCUMENT_TYPE_LABELS[value],
}));

/** A readable label for a stored document type, including values older rows may carry. */
export const landDocumentTypeLabel = (value: string) =>
  LAND_DOCUMENT_TYPE_LABELS[value as LandDocumentType] ??
  value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ');

export const isLandDocumentType = (value: string): value is LandDocumentType =>
  (LAND_DOCUMENT_TYPES as readonly string[]).includes(value);
