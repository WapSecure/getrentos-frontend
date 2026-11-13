import type {
  CreateMeterInput,
  CreateUtilityPurchaseInput,
  CreateWaterTestInput,
  ElectricityDisco,
  ElectricityMeter,
  GeneratorHourReading,
  GeneratorProfile,
  GeneratorServiceSnapshot,
  SupplyHours,
  TariffBand,
  UpsertGeneratorProfileInput,
  UtilityGenerator,
  UtilityHealthNote,
  UtilityPurchase,
  UtilityPurchaseKind,
  UtilitiesAnalytics,
  UtilitiesSummary,
  WaterQualityTest,
  EvidenceDocument,
} from '@sureground/shared';
import { monthsBackFrom } from '@sureground/shared';
import { authFetch, safeCall, toQuery, type Paginated } from '@/lib/apiHelpers';

const BASE = '/home-management/utilities';

export type UtilityPurchasesParams = {
  propertyId?: string;
  kind?: UtilityPurchaseKind;
  generatorAssetId?: string;
  meterId?: string;
  from?: string;
  to?: string;
  includeVoided?: boolean;
  page?: number;
  pageSize?: number;
};

const post = <T>(path: string, body: unknown, method = 'POST') =>
  safeCall(() => authFetch<T>(path, { method, body: JSON.stringify(body) }));

const upload = (path: string, file: File, note?: string) => {
  const form = new FormData();
  form.append('file', file);
  if (note?.trim()) form.append('note', note.trim());
  return safeCall(() => authFetch<EvidenceDocument>(path, { method: 'POST', body: form }));
};

/** Power and water records. Meter numbers come back as the last 4 digits; only `revealMeter` returns the full number. */
export const utilitiesService = {
  listGenerators: (propertyId?: string) =>
    safeCall(() => authFetch<UtilityGenerator[]>(`${BASE}/generators${toQuery({ propertyId })}`)),
  saveGeneratorProfile: (assetId: string, input: UpsertGeneratorProfileInput) =>
    post<GeneratorProfile>(`${BASE}/generators/${assetId}/profile`, input, 'PUT'),
  recordReading: (
    assetId: string,
    input: { readAt: string; hourMeter: number; meterReset?: boolean; note?: string }
  ) =>
    post<{ reading: GeneratorHourReading; service: GeneratorServiceSnapshot }>(
      `${BASE}/generators/${assetId}/readings`,
      input
    ),
  listReadings: (assetId: string, page = 1, pageSize = 10) =>
    safeCall(() =>
      authFetch<Paginated<GeneratorHourReading>>(
        `${BASE}/generators/${assetId}/readings${toQuery({ page, pageSize })}`
      )
    ),
  recordService: (
    assetId: string,
    input: { servicedAt: string; hourMeter?: number; workOrderId?: string; note?: string }
  ) =>
    post<{ profile: GeneratorProfile; service: GeneratorServiceSnapshot }>(
      `${BASE}/generators/${assetId}/service`,
      input
    ),
  voidReading: (readingId: string, reason: string) =>
    post<{ id: string; voided: true }>(`${BASE}/readings/${readingId}/void`, { reason }),

  listHealthNotes: (assetId: string) =>
    safeCall(() => authFetch<UtilityHealthNote[]>(`${BASE}/assets/${assetId}/health-notes`)),
  addHealthNote: (
    assetId: string,
    input: { recordedAt: string; healthPercent?: number; voltage?: number; note: string }
  ) => post<UtilityHealthNote>(`${BASE}/assets/${assetId}/health-notes`, input),

  listPurchases: (params: UtilityPurchasesParams = {}) =>
    safeCall(() => authFetch<Paginated<UtilityPurchase>>(`${BASE}/purchases${toQuery(params)}`)),
  createPurchase: (input: CreateUtilityPurchaseInput) =>
    post<UtilityPurchase>(`${BASE}/purchases`, input),
  voidPurchase: (purchaseId: string, reason: string) =>
    post<{ id: string; voided: true }>(`${BASE}/purchases/${purchaseId}/void`, { reason }),
  addPurchaseDocument: (purchaseId: string, file: File, note?: string) =>
    upload(`${BASE}/purchases/${purchaseId}/documents`, file, note),
  listPurchaseDocuments: (purchaseId: string) =>
    safeCall(() => authFetch<EvidenceDocument[]>(`${BASE}/purchases/${purchaseId}/documents`)),

  listMeters: (propertyId?: string, includeRetired = false) =>
    safeCall(() =>
      authFetch<ElectricityMeter[]>(
        `${BASE}/meters${toQuery({ propertyId, includeRetired: includeRetired || undefined })}`
      )
    ),
  createMeter: (input: CreateMeterInput) => post<ElectricityMeter>(`${BASE}/meters`, input),
  updateMeter: (
    meterId: string,
    input: {
      disco?: ElectricityDisco;
      discoOther?: string;
      tariffBand?: TariffBand;
      label?: string;
    }
  ) => post<ElectricityMeter>(`${BASE}/meters/${meterId}`, input, 'PATCH'),
  retireMeter: (meterId: string, reason: string) =>
    post<{ id: string; retired: true }>(`${BASE}/meters/${meterId}/retire`, { reason }),
  revealMeter: (meterId: string) =>
    post<{ id: string; meterNumber: string | null; accountNumber: string | null }>(
      `${BASE}/meters/${meterId}/reveal`,
      {}
    ),
  supplyHours: (meterId: string, from?: string, to?: string) =>
    safeCall(() =>
      authFetch<SupplyHours>(`${BASE}/meters/${meterId}/supply-hours${toQuery({ from, to })}`)
    ),
  logSupplyHours: (meterId: string, input: { day: string; hoursSupplied: number }) =>
    post<{ day: string; hoursSupplied: number }>(
      `${BASE}/meters/${meterId}/supply-hours`,
      input,
      'PUT'
    ),

  /** Overview figures; `hasUtilityData` decides whether the tiles show at all. */
  summary: (propertyId?: string) =>
    safeCall(() => authFetch<UtilitiesSummary>(`${BASE}/summary${toQuery({ propertyId })}`)),
  /** Recorded spend for the last `months` Lagos months, ending this month (24 at most). */
  analytics: ({ propertyId, months = 12 }: { propertyId?: string; months?: number }) =>
    safeCall(() =>
      authFetch<UtilitiesAnalytics>(
        `${BASE}/analytics${toQuery({ propertyId, from: monthsBackFrom(Math.min(Math.max(months, 1), 24)) })}`
      )
    ),

  listWaterTests: (params: { propertyId?: string; page?: number; pageSize?: number } = {}) =>
    safeCall(() => authFetch<Paginated<WaterQualityTest>>(`${BASE}/water-tests${toQuery(params)}`)),
  createWaterTest: (input: CreateWaterTestInput) =>
    post<WaterQualityTest>(`${BASE}/water-tests`, input),
  voidWaterTest: (testId: string, reason: string) =>
    post<{ id: string; voided: true }>(`${BASE}/water-tests/${testId}/void`, { reason }),
  addWaterTestDocument: (testId: string, file: File, note?: string) =>
    upload(`${BASE}/water-tests/${testId}/documents`, file, note),
};
