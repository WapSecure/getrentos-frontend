/**
 * Property types shown in the product use human-readable labels, while the
 * API deliberately accepts Prisma enum values. Keep that conversion at the
 * client boundary so labels such as `Land` never leak into an API request.
 */
export const PROPERTY_TYPE_OPTIONS = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'CONDO', label: 'Condo' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'LAND', label: 'Land' },
  { value: 'SHARED_APARTMENT', label: 'Shared apartment' },
] as const;

export type ApiPropertyType = (typeof PROPERTY_TYPE_OPTIONS)[number]['value'];
export type DisplayPropertyType = (typeof PROPERTY_TYPE_OPTIONS)[number]['label'];

const DISPLAY_TO_API: Record<string, ApiPropertyType> = Object.fromEntries(
  PROPERTY_TYPE_OPTIONS.flatMap(({ value, label }) => [
    [value, value],
    [label, value],
    [label.toLowerCase(), value],
  ])
) as Record<string, ApiPropertyType>;

const API_TO_DISPLAY = Object.fromEntries(
  PROPERTY_TYPE_OPTIONS.map(({ value, label }) => [value, label])
) as Record<ApiPropertyType, DisplayPropertyType>;

/** Converts a display label or enum value to the exact API enum value. */
export const toApiPropertyType = (value: string | undefined): ApiPropertyType | undefined => {
  if (!value) return undefined;
  return DISPLAY_TO_API[value] ?? DISPLAY_TO_API[value.toLowerCase()];
};

/** Converts an API enum value to the label used in cards, filters and forms. */
export const toDisplayPropertyType = (value: string | undefined): string => {
  if (!value) return '';
  const apiValue = toApiPropertyType(value);
  return apiValue ? API_TO_DISPLAY[apiValue] : value;
};

export const isLandPropertyType = (value: string | undefined): boolean =>
  toApiPropertyType(value) === 'LAND';
