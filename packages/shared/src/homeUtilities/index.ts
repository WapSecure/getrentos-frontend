/**
 * Home management utilities (power and water): labels, privacy helpers and display maths shared by web and mobile.
 * The server is authoritative for every figure; these only format and explain what it returns.
 */

export const UTILITY_KINDS = [
  'GENERATOR',
  'INVERTER',
  'SOLAR_PANEL',
  'SOLAR_BATTERY',
  'BOREHOLE',
  'WATER_PUMP',
  'WATER_TANK',
  'WATER_TREATMENT',
] as const;
export type UtilityKind = (typeof UTILITY_KINDS)[number];

export const UTILITY_KIND_LABELS: Record<UtilityKind, string> = {
  GENERATOR: 'Generator',
  INVERTER: 'Inverter',
  SOLAR_PANEL: 'Solar panels',
  SOLAR_BATTERY: 'Solar battery',
  BOREHOLE: 'Borehole',
  WATER_PUMP: 'Water pump',
  WATER_TANK: 'Water tank',
  WATER_TREATMENT: 'Water treatment',
};

/** The utility type a common asset category implies, so picking "Generator" tags it for the Utilities tab. */
export function utilityKindForCategory(category: string | null | undefined): UtilityKind | null {
  const key = (category ?? '').trim().toLowerCase();
  const map: Record<string, UtilityKind> = {
    generator: 'GENERATOR',
    inverter: 'INVERTER',
    'solar panels': 'SOLAR_PANEL',
    'solar panel': 'SOLAR_PANEL',
    'solar battery': 'SOLAR_BATTERY',
    borehole: 'BOREHOLE',
    'water pump': 'WATER_PUMP',
    'water tank': 'WATER_TANK',
    'water treatment unit': 'WATER_TREATMENT',
    'water treatment': 'WATER_TREATMENT',
  };
  return map[key] ?? null;
}

export const POWER_UTILITY_KINDS: UtilityKind[] = [
  'GENERATOR',
  'INVERTER',
  'SOLAR_PANEL',
  'SOLAR_BATTERY',
];
export const WATER_UTILITY_KINDS: UtilityKind[] = [
  'BOREHOLE',
  'WATER_PUMP',
  'WATER_TANK',
  'WATER_TREATMENT',
];

export type FuelType = 'DIESEL' | 'PETROL';
export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  DIESEL: 'Diesel (AGO)',
  PETROL: 'Petrol (PMS)',
};

export const ELECTRICITY_DISCOS = [
  'ABUJA',
  'BENIN',
  'EKO',
  'ENUGU',
  'IBADAN',
  'IKEJA',
  'JOS',
  'KADUNA',
  'KANO',
  'PORT_HARCOURT',
  'YOLA',
  'ABA',
  'OTHER',
] as const;
export type ElectricityDisco = (typeof ELECTRICITY_DISCOS)[number];

export const DISCO_LABELS: Record<ElectricityDisco, string> = {
  ABUJA: 'Abuja (AEDC)',
  BENIN: 'Benin (BEDC)',
  EKO: 'Eko (EKEDC)',
  ENUGU: 'Enugu (EEDC)',
  IBADAN: 'Ibadan (IBEDC)',
  IKEJA: 'Ikeja Electric',
  JOS: 'Jos (JED)',
  KADUNA: 'Kaduna Electric',
  KANO: 'Kano (KEDCO)',
  PORT_HARCOURT: 'Port Harcourt (PHED)',
  YOLA: 'Yola (YEDC)',
  ABA: 'Aba Power',
  OTHER: 'Another company',
};

export function discoLabel(disco: ElectricityDisco, other?: string | null): string {
  return disco === 'OTHER' && other?.trim() ? other.trim() : DISCO_LABELS[disco];
}

export const TARIFF_BANDS = ['A', 'B', 'C', 'D', 'E'] as const;
export type TariffBand = (typeof TARIFF_BANDS)[number];

/** The minimum daily supply each band promises. NERC revises bands, so this is the label only, never a tariff. */
export const TARIFF_BAND_MIN_HOURS: Record<TariffBand, number> = {
  A: 20,
  B: 16,
  C: 12,
  D: 8,
  E: 4,
};

export const TARIFF_BAND_LABELS: Record<TariffBand, string> = {
  A: 'Band A (at least 20 hours a day)',
  B: 'Band B (at least 16 hours a day)',
  C: 'Band C (at least 12 hours a day)',
  D: 'Band D (at least 8 hours a day)',
  E: 'Band E (at least 4 hours a day)',
};

export type MeterType = 'PREPAID' | 'POSTPAID' | 'UNMETERED';
export const METER_TYPE_LABELS: Record<MeterType, string> = {
  PREPAID: 'Prepaid',
  POSTPAID: 'Postpaid',
  UNMETERED: 'Unmetered (estimated bills)',
};

export type MeterScope = 'UNIT' | 'COMMON_AREA' | 'BULK';
export const METER_SCOPE_LABELS: Record<MeterScope, string> = {
  UNIT: 'Unit meter',
  COMMON_AREA: 'Common areas',
  BULK: 'Whole building',
};

export type UtilityPurchaseKind =
  | 'FUEL'
  | 'ELECTRICITY_TOKEN'
  | 'ELECTRICITY_BILL'
  | 'WATER_TANKER';
export const PURCHASE_KIND_LABELS: Record<UtilityPurchaseKind, string> = {
  FUEL: 'Fuel',
  ELECTRICITY_TOKEN: 'Electricity token',
  ELECTRICITY_BILL: 'Electricity bill',
  WATER_TANKER: 'Water tanker',
};

export type UtilityPaidBy = 'OWNER' | 'MANAGER' | 'TENANT' | 'RESIDENT' | 'OTHER';
export const PAID_BY_LABELS: Record<UtilityPaidBy, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager (client funds)',
  TENANT: 'Tenant',
  RESIDENT: 'Resident',
  OTHER: 'Someone else',
};

export type WaterTestResult = 'PASS' | 'FAIL' | 'INCONCLUSIVE';
export const WATER_TEST_RESULT_LABELS: Record<WaterTestResult, string> = {
  PASS: 'Passed',
  FAIL: 'Failed',
  INCONCLUSIVE: 'Inconclusive',
};

/** Meter numbers are shown by their last 4 digits only. */
export function maskMeterNumber(last4: string | null | undefined): string {
  return last4 ? `Meter ending ${last4}` : 'No meter number recorded';
}

/**
 * Keeps only the last 4 digits of a prepaid token, on the device, before anything is sent or stored.
 * Returns null until at least 4 digits have been typed.
 */
export function tokenLast4(input: string | null | undefined): string | null {
  const digits = (input ?? '').replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : null;
}

export function normaliseMeterNumber(value: string): string {
  return value.replace(/[\s-]/g, '');
}

/** Nigerian prepaid meter numbers are 11 to 13 digits. */
export function isPlausibleMeterNumber(value: string | null | undefined): boolean {
  return /^\d{11,13}$/.test(normaliseMeterNumber(value ?? ''));
}

export type BandCheck = {
  status: 'NO_DATA' | 'MEETS' | 'BELOW' | 'NO_BAND';
  minHours: number | null;
  message: string;
};

/** Compares logged supply with the band's promise. Days nobody logged are not treated as zero. */
export function bandCheck(
  averageHours: number | null | undefined,
  band: TariffBand | null | undefined
): BandCheck {
  const minHours = band ? TARIFF_BAND_MIN_HOURS[band] : null;
  if (averageHours === null || averageHours === undefined) {
    return { status: 'NO_DATA', minHours, message: 'No supply logged yet' };
  }
  const average = `${formatHours(averageHours)} a day on average`;
  if (!band || minHours === null) return { status: 'NO_BAND', minHours, message: average };
  if (averageHours >= minHours) {
    return { status: 'MEETS', minHours, message: `${average}, in line with Band ${band}` };
  }
  return {
    status: 'BELOW',
    minHours,
    message: `${average}, below the ${minHours} hours Band ${band} promises`,
  };
}

export type GeneratorServiceState = 'NOT_SCHEDULED' | 'NO_BASELINE' | 'OK' | 'DUE_SOON' | 'DUE';

export type GeneratorServiceSnapshot = {
  state: GeneratorServiceState;
  hoursRemaining: number | null;
  daysRemaining: number | null;
  dueBy: 'HOURS' | 'DAYS' | null;
  hoursSinceService: number | null;
  latestReading: { readAt: string; hourMeter: number } | null;
};

const plural = (n: number, one: string, many: string) => `${n} ${Math.abs(n) === 1 ? one : many}`;

/** One plain line for a generator's service status, from the server's figures. */
export function generatorServiceLabel(
  service: Pick<GeneratorServiceSnapshot, 'state' | 'hoursRemaining' | 'daysRemaining' | 'dueBy'>
): string {
  switch (service.state) {
    case 'NOT_SCHEDULED':
      return 'No service interval set';
    case 'NO_BASELINE':
      return 'Record a service to start counting';
    case 'DUE': {
      if (service.dueBy === 'HOURS' && service.hoursRemaining !== null) {
        const over = Math.abs(service.hoursRemaining);
        return over > 0
          ? `Service overdue by ${plural(over, 'running hour', 'running hours')}`
          : 'Service due now';
      }
      if (service.daysRemaining !== null) {
        const over = Math.abs(service.daysRemaining);
        return over > 0 ? `Service overdue by ${plural(over, 'day', 'days')}` : 'Service due today';
      }
      return 'Service due now';
    }
    case 'DUE_SOON':
    case 'OK': {
      const parts: string[] = [];
      if (service.hoursRemaining !== null)
        parts.push(plural(service.hoursRemaining, 'running hour', 'running hours'));
      if (service.daysRemaining !== null) parts.push(plural(service.daysRemaining, 'day', 'days'));
      return parts.length ? `Service due in ${parts.join(' or ')}` : 'Service on track';
    }
    default:
      return '';
  }
}

export function formatHours(hours: number): string {
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} ${rounded === 1 ? 'hour' : 'hours'}`;
}

export function formatLitres(litres: number | null | undefined): string {
  if (litres === null || litres === undefined) return '';
  const rounded = Math.round(litres * 100) / 100;
  return `${rounded.toLocaleString('en-GB')} ${rounded === 1 ? 'litre' : 'litres'}`;
}

export function formatKwh(kwh: number | null | undefined): string {
  if (kwh === null || kwh === undefined) return '';
  return `${(Math.round(kwh * 100) / 100).toLocaleString('en-GB')} kWh`;
}

/** Whole naira per litre or kWh, or null when there is no quantity to divide by. */
export function pricePerUnit(amount: number, quantity: number | null | undefined): number | null {
  if (!quantity || quantity <= 0 || !Number.isFinite(amount)) return null;
  return Math.round(amount / quantity);
}

/** The unit a purchase is measured in, for form labels. */
export function purchaseQuantityUnit(kind: UtilityPurchaseKind): 'litres' | 'kWh' | null {
  if (kind === 'FUEL' || kind === 'WATER_TANKER') return 'litres';
  if (kind === 'ELECTRICITY_TOKEN') return 'kWh';
  return null;
}

// Response shapes from /home-management/utilities.

export type UtilityPerson = { id: string; name: string | null };

export type GeneratorProfile = {
  id: string;
  assetId: string;
  ratedKva: number | null;
  fuelType: FuelType;
  tankLitres: number | null;
  serviceIntervalHours: number | null;
  serviceIntervalDays: number | null;
  lastServiceAt: string | null;
  lastServiceHourMeter: number | null;
  preventivePlanId: string | null;
};

export type UtilityGenerator = {
  id: string;
  name: string;
  status: string;
  manufacturer: string | null;
  modelNumber: string | null;
  property: { id: string; title: string };
  unit: { id: string; name: string } | null;
  profile: GeneratorProfile | null;
  service: GeneratorServiceSnapshot;
  lastFuel: {
    occurredAt: string;
    litres: number | null;
    amount: number;
    fuelType: FuelType | null;
  } | null;
  canOperate: boolean;
};

export type GeneratorHourReading = {
  id: string;
  assetId: string;
  readAt: string;
  hourMeter: number;
  meterReset: boolean;
  note: string | null;
  recordedAt: string;
  recordedBy: UtilityPerson;
  voidedAt: string | null;
  voidReason: string | null;
};

export type UtilityHealthNote = {
  id: string;
  assetId: string;
  recordedAt: string;
  healthPercent: number | null;
  voltage: number | null;
  note: string;
  createdAt: string;
  recordedBy: UtilityPerson;
  documentsCount: number;
  voidedAt: string | null;
  voidReason: string | null;
};

export type ElectricityMeter = {
  id: string;
  propertyId: string;
  property?: { id: string; title: string };
  unit: { id: string; name: string } | null;
  scope: MeterScope;
  label: string | null;
  disco: ElectricityDisco;
  discoOther: string | null;
  tariffBand: TariffBand | null;
  meterType: MeterType;
  meterNumberLast4: string | null;
  accountNumberLast4: string | null;
  hasMeterNumber: boolean;
  hasAccountNumber: boolean;
  retiredAt: string | null;
  retireReason: string | null;
  createdAt: string;
  supplyLast30Days?: { daysLogged: number; averageHours: number | null };
  canOperate?: boolean;
};

export type SupplyHours = {
  meterId: string;
  tariffBand: TariffBand | null;
  from: string;
  to: string;
  days: { day: string; hoursSupplied: number; source: 'OPERATOR' | 'TENANT' }[];
  daysLogged: number;
  averageHours: number | null;
};

export type UtilityPurchase = {
  id: string;
  property: { id: string; title: string };
  unit: { id: string; name: string } | null;
  kind: UtilityPurchaseKind;
  occurredAt: string;
  amount: number;
  quantity: number | null;
  fuelType: FuelType | null;
  generator: { id: string; name: string } | null;
  tank: { id: string; name: string } | null;
  meter: {
    id: string;
    label: string | null;
    scope: MeterScope;
    meterNumberLast4: string | null;
  } | null;
  tokenLast4: string | null;
  vendor: { id: string; name: string } | null;
  supplierName: string | null;
  paidBy: UtilityPaidBy;
  purchasedByName: string | null;
  chargeable: boolean;
  note: string | null;
  replacesId: string | null;
  documentsCount: number;
  recordedAt: string;
  recordedBy: UtilityPerson;
  voidedAt: string | null;
  voidReason: string | null;
};

export type WaterQualityTest = {
  id: string;
  property: { id: string; title: string };
  asset: { id: string; name: string; utilityKind: UtilityKind | null } | null;
  sampledAt: string;
  testedAt: string | null;
  labName: string;
  result: WaterTestResult;
  parameters: Record<string, string | number | boolean | null> | null;
  cost: number | null;
  note: string | null;
  sharedWithResidents: boolean;
  documentsCount: number;
  recordedAt: string;
  recordedBy: UtilityPerson;
  voidedAt: string | null;
  voidReason: string | null;
};

export type CreateUtilityPurchaseInput = {
  propertyId: string;
  unitId?: string;
  kind: UtilityPurchaseKind;
  occurredAt: string;
  amount: number;
  quantity?: number;
  fuelType?: FuelType;
  generatorAssetId?: string;
  tankAssetId?: string;
  meterId?: string;
  tokenLast4?: string;
  vendorId?: string;
  supplierName?: string;
  paidBy: UtilityPaidBy;
  purchasedByName?: string;
  chargeable?: boolean;
  note?: string;
  replacesId?: string;
};

export type CreateMeterInput = {
  propertyId: string;
  unitId?: string;
  scope: MeterScope;
  disco: ElectricityDisco;
  discoOther?: string;
  tariffBand?: TariffBand;
  meterType: MeterType;
  meterNumber?: string;
  accountNumber?: string;
  label?: string;
};

export type CreateWaterTestInput = {
  propertyId: string;
  assetId?: string;
  sampledAt: string;
  testedAt?: string;
  labName: string;
  result: WaterTestResult;
  parameters?: Record<string, string | number | boolean | null>;
  cost?: number;
  note?: string;
  sharedWithResidents?: boolean;
};

export type UpsertGeneratorProfileInput = {
  ratedKva?: number;
  fuelType: FuelType;
  tankLitres?: number;
  serviceIntervalHours?: number;
  serviceIntervalDays?: number;
  preventivePlanId?: string;
};

/**
 * Turns a typed whole-naira amount into a number, or null when it is not a positive whole number.
 * Commas and the naira sign are ignored so "₦180,000" works.
 */
export function parseWholeNaira(input: string): number | null {
  const cleaned = input.replace(/[₦,\s]/g, '');
  if (!/^\d+$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

// Analytics and the overview (PR2).

export const UTILITY_SPEND_CATEGORIES = ['fuel', 'electricity', 'water', 'repairs'] as const;
export type UtilitySpendCategory = (typeof UTILITY_SPEND_CATEGORIES)[number];

export const UTILITY_SPEND_CATEGORY_LABELS: Record<UtilitySpendCategory, string> = {
  fuel: 'Fuel',
  electricity: 'Electricity',
  water: 'Water',
  repairs: 'Utility repairs',
};

/** Null means nothing was recorded, which is not the same as spending nothing. */
export type UtilitySpendBucket = {
  amount: number;
  quantity: number | null;
  entries: number;
} | null;

export type UtilitiesAnalytics = {
  propertyId: string | null;
  from: string;
  to: string;
  months: ({
    month: string;
    label: string;
    total: number | null;
  } & Record<UtilitySpendCategory, UtilitySpendBucket>)[];
  totals: Record<UtilitySpendCategory, UtilitySpendBucket> & { total: number | null };
  entriesCount: number;
  dieselPricePerLitre: number | null;
  unitsCount: number;
  costPerUnit: number | null;
};

export type UtilitiesSummary = {
  propertyId: string | null;
  month: string;
  monthLabel: string;
  hasUtilityData: boolean;
  spendThisMonth: number | null;
  entriesThisMonth: number;
  dieselLitresThisMonth: number | null;
  dieselSpendThisMonth: number | null;
  generatorsTotal: number;
  generatorsDue: number;
  generatorsDueSoon: number;
  waterTestsFailedRecently: number;
};

/** The overview shows utility tiles only once something has been recorded, so a new owner never sees a row of ₦0. */
export function shouldShowUtilityTiles(summary: UtilitiesSummary | null | undefined): boolean {
  return summary?.hasUtilityData === true;
}

/** Naira for a recorded figure; "No data yet" when nothing was logged, never ₦0. */
export function formatSpendOrNoData(
  value: number | null | undefined,
  empty = 'No data yet'
): string {
  if (value === null || value === undefined) return empty;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * The "per unit" figure. Only for one property: across a portfolio, a house with no units
 * would be shared over another building's flats.
 */
export function costPerUnitFigure(
  analytics: Pick<UtilitiesAnalytics, 'costPerUnit' | 'unitsCount'>,
  scopedToProperty: boolean
): { value: string; hint: string } {
  if (!scopedToProperty) {
    return {
      value: 'One property at a time',
      hint: 'Choose a property above to see its cost per unit',
    };
  }
  if (analytics.costPerUnit === null) {
    return { value: 'No data yet', hint: 'Add units to the property to see this' };
  }
  const units = analytics.unitsCount;
  return {
    value: formatSpendOrNoData(analytics.costPerUnit),
    hint: `Across ${units} ${units === 1 ? 'unit' : 'units'}`,
  };
}

/** Recorded categories for a month, largest first, as "Fuel ₦120,000, Electricity ₦20,000". */
export function monthSpendBreakdown(
  month: Record<UtilitySpendCategory, UtilitySpendBucket>
): string {
  return UTILITY_SPEND_CATEGORIES.filter((category) => month[category] !== null)
    .sort((a, b) => (month[b]?.amount ?? 0) - (month[a]?.amount ?? 0))
    .map(
      (category) =>
        `${UTILITY_SPEND_CATEGORY_LABELS[category]} ${formatSpendOrNoData(month[category]!.amount)}`
    )
    .join(', ');
}

/** `YYYY-MM` of the Lagos month an instant falls in. */
export function lagosMonthKey(value: Date = new Date()): string {
  return new Date(value.getTime() + 60 * 60_000).toISOString().slice(0, 7);
}

/** The first month of a window of `count` months ending with the current Lagos month. */
export function monthsBackFrom(count: number, now: Date = new Date()): string {
  const [year, month] = lagosMonthKey(now).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1 - (count - 1), 1)).toISOString().slice(0, 7);
}

/** How each lab reading is named and measured, so results read as "Iron 1.2 mg/L", not "ironMgL 1.2". */
export const WATER_PARAMETERS: Record<string, { label: string; unit?: string }> = {
  pH: { label: 'pH' },
  tdsMgL: { label: 'Dissolved solids', unit: 'mg/L' },
  ironMgL: { label: 'Iron', unit: 'mg/L' },
  coliforms: { label: 'Coliforms' },
};

/** A test's readings in plain words; a reading Sureground does not know keeps its own key. */
export function formatWaterParameters(
  parameters: Record<string, string | number | boolean | null> | null | undefined
): string {
  return Object.entries(parameters ?? {})
    .filter(([, value]) => value !== null && value !== '')
    .map(([key, value]) => {
      const known = WATER_PARAMETERS[key];
      if (!known) return `${key} ${value}`;
      return `${known.label} ${value}${known.unit ? ` ${known.unit}` : ''}`;
    })
    .join(', ');
}

/** "1 due", "1 due soon" or "1 due, 2 soon": a set that is nearly due is never shown as 0. */
export function generatorServiceSummary(due: number, dueSoon: number): string {
  if (due > 0 && dueSoon > 0) return `${due} due, ${dueSoon} soon`;
  if (dueSoon > 0) return `${dueSoon} due soon`;
  return `${due}`;
}

// Service charges (Phase B PR3).

export const SERVICE_CHARGE_CATEGORIES = [
  'DIESEL',
  'SECURITY',
  'CLEANING',
  'WASTE_PSP',
  'WATER',
  'REPAIRS',
  'MANAGEMENT',
  'COMMON_ELECTRICITY',
  'INSURANCE',
  'OTHER',
] as const;
export type ServiceChargeCategory = (typeof SERVICE_CHARGE_CATEGORIES)[number];

export const SERVICE_CHARGE_CATEGORY_LABELS: Record<ServiceChargeCategory, string> = {
  DIESEL: 'Diesel',
  SECURITY: 'Security',
  CLEANING: 'Cleaning',
  WASTE_PSP: 'Waste (PSP)',
  WATER: 'Water',
  REPAIRS: 'Repairs',
  MANAGEMENT: 'Management',
  COMMON_ELECTRICITY: 'Common-area electricity',
  INSURANCE: 'Insurance',
  OTHER: 'Other',
};

export type ServiceChargeBudgetStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'VOIDED';
export type ServiceChargeBillingCycle = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
export type ServiceChargeMethod = 'EQUAL' | 'WEIGHTED';

export const SERVICE_CHARGE_STATUS_LABELS: Record<ServiceChargeBudgetStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  CLOSED: 'Closed',
  VOIDED: 'Voided',
};

export const SERVICE_CHARGE_CYCLE_LABELS: Record<ServiceChargeBillingCycle, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUAL: 'Once a year',
};

export type ServiceChargeCollection =
  | 'PAID'
  | 'PART_PAID'
  | 'UNPAID'
  | 'REMOVED'
  | 'NOT_BILLED'
  | 'VOIDED';

export const SERVICE_CHARGE_COLLECTION_LABELS: Record<ServiceChargeCollection, string> = {
  PAID: 'Paid',
  PART_PAID: 'Part paid',
  UNPAID: 'Not paid yet',
  REMOVED: 'Removed when the tenancy lapsed',
  NOT_BILLED: 'Owner bears it',
  VOIDED: 'Voided',
};

export type ServiceChargeLine = {
  id: string;
  category: ServiceChargeCategory;
  label: string;
  amount: number;
};

export type ServiceChargeParticipant = {
  id: string;
  unitId: string | null;
  label: string;
  bedrooms: number | null;
  weight: number;
  included: boolean;
  exclusionReason: string | null;
};

export type ServiceChargeBudgetSummary = {
  id: string;
  title: string;
  property: { id: string; title: string };
  status: ServiceChargeBudgetStatus;
  periodStart: string;
  periodEnd: string;
  billingCycle: ServiceChargeBillingCycle;
  method: ServiceChargeMethod;
  total: number;
  unitsSharing: number;
  invoicesCount: number;
};

export type ServiceChargeBudget = {
  id: string;
  title: string;
  property: { id: string; title: string };
  status: ServiceChargeBudgetStatus;
  periodStart: string;
  /** The day after the last day covered; `lastDay` is the one to show. */
  periodEnd: string;
  lastDay: string;
  firstDueDate: string;
  method: ServiceChargeMethod;
  billingCycle: ServiceChargeBillingCycle;
  leadDays: number;
  openBook: boolean;
  notes: string | null;
  version: number;
  total: number;
  lines: ServiceChargeLine[];
  participants: ServiceChargeParticipant[];
  publishedAt: string | null;
  closedAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  invoicesCount: number;
};

export type ServiceChargePreview = {
  budgetId: string;
  status: ServiceChargeBudgetStatus;
  total: number;
  apportioned: number;
  unitsSharing: number;
  method: ServiceChargeMethod;
  instalments: {
    number: number;
    periodStart: string;
    periodEnd: string;
    dueDate: string;
    issueDate: string;
    alreadyDue: boolean;
  }[];
  participants: (ServiceChargeParticipant & {
    total: number;
    byLine: { lineId: string; amount: number }[];
    instalments: number[];
    tenancies: { tenant: string | null; from: string; to: string }[];
    notes: string[];
  })[];
  warnings: string[];
  blockers: string[];
  previewHash: string;
};

export type ServiceChargeInvoice = {
  id: string;
  instalment: number;
  unit: string;
  tenant: string | null;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  amount: number;
  prorated: boolean;
  status: 'ISSUED' | 'SKIPPED' | 'VOIDED';
  skipReason: string | null;
  collection: ServiceChargeCollection;
  amountPaid: number;
  lines: { category: ServiceChargeCategory; label: string; amount: number }[];
};

/** The server stores a period's end as the day after its last day. */
export function dayAfter(day: string): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/** A unit's weight suggested from its bedrooms (studio or unknown counts as 1). */
export function bedroomWeight(bedrooms: number | null | undefined): number {
  return bedrooms && bedrooms > 0 ? bedrooms : 1;
}

/** "Shared equally across 12 flats" / "Shared by weight across 3 units". */
export function shareSummary(method: ServiceChargeMethod, unitsSharing: number): string {
  const units = `${unitsSharing} ${unitsSharing === 1 ? 'unit' : 'units'}`;
  return method === 'EQUAL' ? `Shared equally across ${units}` : `Shared by weight across ${units}`;
}

// Tenant statements and queries (Phase B PR4a).

export type ServiceChargeQueryStatus = 'OPEN' | 'ANSWERED' | 'UPHELD' | 'REJECTED' | 'WITHDRAWN';

export const SERVICE_CHARGE_QUERY_STATUS_LABELS: Record<ServiceChargeQueryStatus, string> = {
  OPEN: 'Waiting for a reply',
  ANSWERED: 'Replied',
  UPHELD: 'Upheld',
  REJECTED: 'Not upheld',
  WITHDRAWN: 'Withdrawn',
};

/** A tenant's charge collection status; a lapsed tenancy's unpaid charge is removed. */
export type RenterServiceChargeCollection = 'PAID' | 'PART_PAID' | 'UNPAID' | 'REMOVED';

export type RenterServiceCharge = {
  id: string;
  title: string;
  property: string | null;
  unit: string;
  instalment: number;
  periodStart: string;
  /** The last day covered. */
  periodEnd: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
  collection: RenterServiceChargeCollection;
  rentPaymentId: string | null;
  openQueries: number;
};

export type RenterServiceChargeQuery = {
  id: string;
  lineId: string | null;
  reason: string;
  status: ServiceChargeQueryStatus;
  response: string | null;
  outcomeNote: string | null;
  adjustmentAmount: number | null;
  createdAt: string;
  resolvedAt: string | null;
};

export type RenterServiceChargeStatement = Omit<RenterServiceCharge, 'openQueries'> & {
  /** Percent of the instalment billed when the tenancy covered only part of it. */
  partOfInstalment: number | null;
  lines: {
    id: string;
    category: ServiceChargeCategory;
    label: string;
    amount: number;
    budgetTotal: number | null;
    /** Spent so far on this line, when the budget is open book; null otherwise. */
    spentSoFar: number | null;
  }[];
  budget: {
    periodStart: string;
    lastDay: string;
    billingCycle: ServiceChargeBillingCycle;
    method: ServiceChargeMethod;
    total: number;
    unitsSharing: number;
    weight: number | null;
    totalWeight: number | null;
    openBook: boolean;
    spentSoFar: number | null;
  };
  queries: RenterServiceChargeQuery[];
};

export type ServiceChargeQuery = {
  id: string;
  status: ServiceChargeQueryStatus;
  reason: string;
  response: string | null;
  respondedAt: string | null;
  outcomeNote: string | null;
  adjustmentAmount: number | null;
  resolvedAt: string | null;
  createdAt: string;
  line: { id: string; label: string; amount: number } | null;
  invoice: {
    id: string;
    amount: number;
    instalment: number;
    dueDate: string;
    unit: string;
    tenant: string | null;
  };
  budget: { id: string; title: string; property: { id: string; title: string } | null };
};

/** "Your share: weight 2 of 7" for a weighted budget, "1 of 6 units, equal shares" otherwise. */
export function statementShareBasis(budget: RenterServiceChargeStatement['budget']): string {
  if (budget.method === 'WEIGHTED' && budget.weight !== null && budget.totalWeight) {
    const fmt = (n: number) => Number(n.toFixed(4)).toString();
    return `Your unit's weight is ${fmt(budget.weight)} of ${fmt(budget.totalWeight)} across ${budget.unitsSharing} units`;
  }
  return `Shared equally across ${budget.unitsSharing} ${budget.unitsSharing === 1 ? 'unit' : 'units'}`;
}

/** A query can still be raised on a live charge if nothing about the same line is open. */
export function hasLiveQuery(queries: RenterServiceChargeQuery[], lineId: string | null): boolean {
  return queries.some(
    (q) => (q.status === 'OPEN' || q.status === 'ANSWERED') && q.lineId === lineId
  );
}

// Actual spend, amendments and the next period (Phase B PR4b).

export type ServiceChargeActualSource = 'UTILITY_PURCHASE' | 'EXPENSE' | 'VENDOR_INVOICE';

export const SERVICE_CHARGE_ACTUAL_SOURCE_LABELS: Record<ServiceChargeActualSource, string> = {
  UTILITY_PURCHASE: 'Utility purchase',
  EXPENSE: 'Expense',
  VENDOR_INVOICE: 'Vendor invoice',
};

export type ServiceChargeActualCandidate = {
  source: ServiceChargeActualSource;
  id: string;
  date: string;
  amount: number;
  description: string;
};

export type ServiceChargeReconciliation = {
  budgetId: string;
  status: ServiceChargeBudgetStatus;
  lines: {
    id: string;
    category: ServiceChargeCategory;
    label: string;
    retired: boolean;
    budget: number;
    actual: number;
    /** Positive when less has been spent than budgeted. */
    variance: number;
    items: { id: string; description: string; date: string; amount: number }[];
  }[];
  totals: {
    budget: number;
    actual: number;
    variance: number;
    billed: number;
    collected: number;
    outstanding: number;
    ownerBears: number;
  };
};

/** "₦200,000 under budget" / "₦50,000 over budget" / "On budget". */
export function varianceLabel(variance: number): string {
  if (variance === 0) return 'On budget';
  const amount = formatSpendOrNoData(Math.abs(variance));
  return variance > 0 ? `${amount} under budget` : `${amount} over budget`;
}

/** The request body for counting one piece of spend against a line. */
export function actualLinkBody(
  budgetLineId: string,
  candidate: Pick<ServiceChargeActualCandidate, 'source' | 'id'>
): {
  budgetLineId: string;
  utilityPurchaseId?: string;
  expenseId?: string;
  vendorInvoiceId?: string;
} {
  const key =
    candidate.source === 'UTILITY_PURCHASE'
      ? 'utilityPurchaseId'
      : candidate.source === 'EXPENSE'
        ? 'expenseId'
        : 'vendorInvoiceId';
  return { budgetLineId, [key]: candidate.id };
}
