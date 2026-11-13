// Maintenance categories and statuses for every app. The API sends UPPERCASE codes for home
// management and lowercase codes on the renter routes; every helper here accepts either.

export const MAINTENANCE_CATEGORY_CODES = [
  'GENERATOR_POWER',
  'ELECTRICAL',
  'WATER_BOREHOLE',
  'PLUMBING',
  'ROOFING',
  'DRAINAGE',
  'CARPENTRY',
  'PAINTING',
  'AIR_CONDITIONING',
  'APPLIANCES',
  'INTERNET',
  'SECURITY',
  'PEST_CONTROL',
  'OTHER',
] as const;

export type MaintenanceCategoryCode = (typeof MAINTENANCE_CATEGORY_CODES)[number];
export type MaintenanceCategoryKey = Lowercase<MaintenanceCategoryCode>;

export const MAINTENANCE_CATEGORY_LABELS: Record<MaintenanceCategoryCode, string> = {
  GENERATOR_POWER: 'Generator and power',
  ELECTRICAL: 'Electrical',
  WATER_BOREHOLE: 'Water and borehole',
  PLUMBING: 'Plumbing',
  ROOFING: 'Roofing and leaks',
  DRAINAGE: 'Drainage and flooding',
  CARPENTRY: 'Carpentry',
  PAINTING: 'Painting',
  AIR_CONDITIONING: 'Air conditioning',
  APPLIANCES: 'Appliances',
  INTERNET: 'Internet',
  SECURITY: 'Security',
  PEST_CONTROL: 'Pest control and fumigation',
  OTHER: 'Other',
};

/** Short hints shown under a category in pickers. */
export const MAINTENANCE_CATEGORY_HINTS: Partial<Record<MaintenanceCategoryCode, string>> = {
  GENERATOR_POWER: 'Generators, inverters, solar, power supply',
  WATER_BOREHOLE: 'Borehole, pumps, tanks, water treatment',
  ROOFING: 'Roofs and rain leaks',
  DRAINAGE: 'Drains, gutters, soakaways, flooding',
  CARPENTRY: 'Doors, windows, furniture',
  SECURITY: 'Gates, locks, CCTV',
  PEST_CONTROL: 'Fumigation, cockroaches, rodents, termites',
};

/** Names of exports in @sureground/icons (and its native build). */
export type MaintenanceCategoryIconName =
  | 'Power'
  | 'Zap'
  | 'Waves'
  | 'Droplets'
  | 'Home'
  | 'Route'
  | 'Hammer'
  | 'Palette'
  | 'Gauge'
  | 'Wrench'
  | 'Wifi'
  | 'Lock'
  | 'PawPrint'
  | 'Tag';

export const MAINTENANCE_CATEGORY_ICONS: Record<
  MaintenanceCategoryCode,
  MaintenanceCategoryIconName
> = {
  GENERATOR_POWER: 'Power',
  ELECTRICAL: 'Zap',
  WATER_BOREHOLE: 'Waves',
  PLUMBING: 'Droplets',
  ROOFING: 'Home',
  DRAINAGE: 'Route',
  CARPENTRY: 'Hammer',
  PAINTING: 'Palette',
  AIR_CONDITIONING: 'Gauge',
  APPLIANCES: 'Wrench',
  INTERNET: 'Wifi',
  SECURITY: 'Lock',
  PEST_CONTROL: 'PawPrint',
  OTHER: 'Tag',
};

export type MaintenanceCategoryGroup = {
  id: 'power-water' | 'building' | 'comfort' | 'safety' | 'other';
  label: string;
  categories: MaintenanceCategoryCode[];
};

export const MAINTENANCE_CATEGORY_GROUPS: MaintenanceCategoryGroup[] = [
  {
    id: 'power-water',
    label: 'Power and water',
    categories: ['GENERATOR_POWER', 'ELECTRICAL', 'WATER_BOREHOLE', 'PLUMBING'],
  },
  {
    id: 'building',
    label: 'Building and structure',
    categories: ['ROOFING', 'DRAINAGE', 'CARPENTRY', 'PAINTING'],
  },
  {
    id: 'comfort',
    label: 'Comfort and appliances',
    categories: ['AIR_CONDITIONING', 'APPLIANCES', 'INTERNET'],
  },
  { id: 'safety', label: 'Safety and hygiene', categories: ['SECURITY', 'PEST_CONTROL'] },
  { id: 'other', label: 'Anything else', categories: ['OTHER'] },
];

export function toMaintenanceCategoryCode(
  value: string | null | undefined
): MaintenanceCategoryCode | null {
  if (!value) return null;
  const code = value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  return (MAINTENANCE_CATEGORY_CODES as readonly string[]).includes(code)
    ? (code as MaintenanceCategoryCode)
    : null;
}

const sentenceCase = (value: string) => {
  const words = value.replace(/[_-]+/g, ' ').trim().toLowerCase();
  return words ? words[0]!.toUpperCase() + words.slice(1) : '';
};

/** Plain label for a category code in either case; unknown codes read as sentence case. */
export function maintenanceCategoryLabel(category: string | null | undefined): string {
  const code = toMaintenanceCategoryCode(category);
  if (code) return MAINTENANCE_CATEGORY_LABELS[code];
  return sentenceCase(category ?? '') || 'Other';
}

export function maintenanceCategoryIconName(
  category: string | null | undefined
): MaintenanceCategoryIconName {
  const code = toMaintenanceCategoryCode(category);
  return code ? MAINTENANCE_CATEGORY_ICONS[code] : 'Tag';
}

export function maintenanceCategoryGroup(
  category: string | null | undefined
): MaintenanceCategoryGroup {
  const code = toMaintenanceCategoryCode(category) ?? 'OTHER';
  return (
    MAINTENANCE_CATEGORY_GROUPS.find((group) => group.categories.includes(code)) ??
    MAINTENANCE_CATEGORY_GROUPS[MAINTENANCE_CATEGORY_GROUPS.length - 1]!
  );
}

const MAINTENANCE_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CANCELLED: 'Cancelled',
};

export function maintenanceStatusLabel(status: string | null | undefined): string {
  if (!status) return 'Unknown';
  return MAINTENANCE_STATUS_LABELS[status.trim().toUpperCase()] ?? sentenceCase(status);
}

/** Old service-history rows read "Status: RESOLVED"; show them in plain words. */
export function humaniseMaintenanceStatusLine(text: string): string {
  return text.replace(/\bStatus: ([A-Z_]+)\b/g, (_, code: string) => {
    return `Status: ${maintenanceStatusLabel(code)}`;
  });
}

/** Suggestions for the free-text asset category; owners can still type their own. */
export const HOME_ASSET_CATEGORY_SUGGESTIONS = [
  'Generator',
  'Inverter',
  'Solar panels',
  'Borehole',
  'Water pump',
  'Water tank',
  'Water treatment unit',
  'Air conditioner',
  'Fire extinguisher',
] as const;
