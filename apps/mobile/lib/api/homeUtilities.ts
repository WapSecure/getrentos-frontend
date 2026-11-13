import type {
  CreateMeterInput,
  CreateUtilityPurchaseInput,
  CreateWaterTestInput,
  ElectricityMeter,
  EvidenceDocument,
  GeneratorHourReading,
  GeneratorServiceSnapshot,
  SupplyHours,
  UtilityGenerator,
  UtilityPurchase,
  UtilityPurchaseKind,
  UtilitiesSummary,
  WaterQualityTest,
} from '@sureground/shared';
import { apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';
import { toQuery } from './query';
import type { Paginated } from './properties';

const BASE = '/home-management/utilities';

/** Today in Lagos, `YYYY-MM-DD`. */
export function lagosToday(now: Date = new Date()): string {
  return new Date(now.getTime() + 60 * 60_000).toISOString().slice(0, 10);
}

/** A picked day as an instant the server accepts: today is now, an earlier day is midday in Lagos. */
export function dayToInstant(day: string, now: Date = new Date()): string {
  if (!day || day >= lagosToday(now)) return now.toISOString();
  return new Date(`${day}T12:00:00+01:00`).toISOString();
}

/** Power and water records, captured on site. Meter numbers arrive as the last 4 digits only. */
export const homeUtilitiesApi = {
  /** This month's recorded spend and generators due; `hasUtilityData` is false until something is logged. */
  summary: (propertyId?: string) =>
    apiFetch<UtilitiesSummary>(`${BASE}/summary${toQuery({ propertyId })}`),
  generators: (propertyId?: string) =>
    apiFetch<UtilityGenerator[]>(`${BASE}/generators${toQuery({ propertyId })}`),
  readings: (assetId: string) =>
    apiFetch<Paginated<GeneratorHourReading>>(
      `${BASE}/generators/${assetId}/readings${toQuery({ page: 1, pageSize: 20 })}`
    ),
  logHours: (
    assetId: string,
    input: { readAt: string; hourMeter: number; meterReset?: boolean; note?: string }
  ) =>
    apiFetch<{ reading: GeneratorHourReading; service: GeneratorServiceSnapshot }>(
      `${BASE}/generators/${assetId}/readings`,
      { method: 'POST', body: input }
    ),

  purchases: (params: { propertyId?: string; kind?: UtilityPurchaseKind; page?: number } = {}) =>
    apiFetch<Paginated<UtilityPurchase>>(
      `${BASE}/purchases${toQuery({ ...params, pageSize: 20 })}`
    ),
  recordPurchase: (input: CreateUtilityPurchaseInput) =>
    apiFetch<UtilityPurchase>(`${BASE}/purchases`, { method: 'POST', body: input }),
  attachReceipt: (purchaseId: string, file: PickedFile) => {
    const form = new FormData();
    appendFile(form, 'file', file);
    return apiUpload<EvidenceDocument>(`${BASE}/purchases/${purchaseId}/documents`, form);
  },
  voidPurchase: (purchaseId: string, reason: string) =>
    apiFetch<{ id: string; voided: true }>(`${BASE}/purchases/${purchaseId}/void`, {
      method: 'POST',
      body: { reason },
    }),

  meters: (propertyId?: string) =>
    apiFetch<ElectricityMeter[]>(`${BASE}/meters${toQuery({ propertyId })}`),
  addMeter: (input: CreateMeterInput) =>
    apiFetch<ElectricityMeter>(`${BASE}/meters`, { method: 'POST', body: input }),
  supplyHours: (meterId: string) => apiFetch<SupplyHours>(`${BASE}/meters/${meterId}/supply-hours`),
  logSupply: (meterId: string, input: { day: string; hoursSupplied: number }) =>
    apiFetch<{ day: string; hoursSupplied: number }>(`${BASE}/meters/${meterId}/supply-hours`, {
      method: 'PUT',
      body: input,
    }),

  waterTests: (propertyId?: string) =>
    apiFetch<Paginated<WaterQualityTest>>(
      `${BASE}/water-tests${toQuery({ propertyId, page: 1, pageSize: 20 })}`
    ),
  recordWaterTest: (input: CreateWaterTestInput) =>
    apiFetch<WaterQualityTest>(`${BASE}/water-tests`, { method: 'POST', body: input }),
  attachLabReport: (testId: string, file: PickedFile) => {
    const form = new FormData();
    appendFile(form, 'file', file);
    return apiUpload<EvidenceDocument>(`${BASE}/water-tests/${testId}/documents`, form);
  },
};
