import type { AnnouncementDraft, PollDraft, ReportDigest } from '@/types/estateOps';
import type { ReplyLanguage } from '@/lib/replyLanguage';
import { authDownload, authFetch, safeCall, toQuery } from '@/lib/apiHelpers';
import type { ApiResponse, Paginated } from '@/lib/apiHelpers';
import type { AssistantReply, AssistantTurn } from '@/types/assistant';
import type {
  Estate,
  Household,
  HouseholdStatus,
  ImportHouseholdsResult,
  EstateDashboardStats,
  EstateDuesPoint,
  EstateFinancialStats,
  Due,
  VisitorPass,
  IssuedVisitorPass,
  StaffMember,
  Announcement,
  Violation,
  GovernanceRecord,
  GovernanceRecordSignature,
  VehicleLog,
  VehicleLogPurpose,
  DeliveryLog,
  DeliveryLogStatus,
  DeliveryCodeScreen,
  Gate,
  WatchlistEntry,
  WatchlistSeverity,
  WatchlistStatus,
  WatchlistSubjectType,
  WatchlistScreening,
  ContractorPass,
  ContractorPassStatus,
  IssuedContractorPass,
  EmergencyKind,
  EmergencyMuster,
  MusterRollState,
  MusterStatus,
  MusterSummary,
  AuthorisationDwellReport,
  OnSiteBoard,
  Incident,
  MaintenanceTicket,
  Poll,
  Amenity,
  AmenityBooking,
  CommitteeMember,
  CommitteeTitle,
  EstateMicrositeSettings,
  EstateStatement,
  EstatePayoutAccount,
  PatrolCheckpoint,
  IssuedPatrolCheckpoint,
  PatrolRoute,
  PatrolReport,
  PatrolScanResult,
  ExpectedToday,
  GuestListImportResult,
  VisitorIdCheck,
  EstateStatementLineDispute,
} from '@/types/estate';
import type { CollectionPlan } from '@/types/collectionPlan';

type EstatePageQuery = {
  page?: number;
  pageSize?: number;
};

export type GateWriteOptions = {
  /** ISO time the guard acted, for a write queued offline. */
  occurredAt?: string;
  gateId?: string;
  /** Only set on a deliberate override; it is what the estate office is notified with. */
  overrideReason?: string;
};

/**
 * Drops absent fields: `gateId: ''` or `occurredAt: null` would be rejected and the write lost.
 * Undefined when nothing is set, so no body is sent.
 */
function buildGateWriteBody(extra: Record<string, unknown>): Record<string, unknown> | undefined {
  const body = Object.fromEntries(
    Object.entries(extra).filter(([, value]) => value !== undefined && value !== '')
  );
  return Object.keys(body).length > 0 ? body : undefined;
}

export const estateService = {
  /** Messages are in `language` when given. */
  getCollectionPlan: (estateId: string, language: ReplyLanguage = 'en') =>
    safeCall<CollectionPlan>(() =>
      authFetch(
        `/estate/${estateId}/collections/plan${language === 'en' ? '' : `?language=${language}`}`
      )
    ),

  askAssistant: (
    estateId: string,
    question: string,
    history: AssistantTurn[],
    language?: ReplyLanguage
  ) =>
    safeCall<AssistantReply>(() =>
      authFetch(`/estate/${estateId}/assistant/ask`, {
        method: 'POST',
        body: JSON.stringify({ question, history, language }),
      })
    ),

  async createEstate(data: {
    name: string;
    address: string;
    city: string;
    state: string;
    /** The Google place the address was picked from; the API checks it and stores Google's address. */
    placeId?: string;
    gateCount?: number;
  }): Promise<ApiResponse<Estate>> {
    return safeCall(() => authFetch('/estate', { method: 'POST', body: JSON.stringify(data) }));
  },

  async getMyEstate(): Promise<ApiResponse<Estate | null>> {
    return safeCall(() => authFetch('/estate/me'));
  },

  async listMyEstates(): Promise<ApiResponse<Estate[]>> {
    return safeCall(() => authFetch('/estate/mine'));
  },

  async getDashboardStats(estateId: string): Promise<ApiResponse<EstateDashboardStats>> {
    return safeCall(() => authFetch(`/estate/${estateId}/dashboard/stats`));
  },

  async getDuesCollectedTrend(estateId: string): Promise<ApiResponse<EstateDuesPoint[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/dashboard/dues-trend`));
  },

  async updateDueSettings(
    estateId: string,
    data: { lateFeeAmount: number; graceDays?: number }
  ): Promise<ApiResponse<Estate>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/due-settings`, { method: 'PATCH', body: JSON.stringify(data) })
    );
  },

  async getFinancialStats(
    estateId: string,
    period: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
  ): Promise<ApiResponse<EstateFinancialStats>> {
    return safeCall(() => authFetch(`/estate/${estateId}/financials/stats?period=${period}`));
  },

  async getFinancialChartSeries(estateId: string): Promise<ApiResponse<EstateDuesPoint[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/financials/chart`));
  },

  async exportFinancialsCsv(estateId: string): Promise<ApiResponse<void>> {
    return safeCall(async () => {
      const blob = await authDownload(`/estate/${estateId}/financials/export`);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sureground-estate-financials.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  },

  async listStatements(
    estateId: string,
    params: EstatePageQuery = {}
  ): Promise<ApiResponse<Paginated<EstateStatement>>> {
    return safeCall(() =>
      authFetch<Paginated<EstateStatement>>(`/estate/${estateId}/statements${toQuery(params)}`)
    );
  },

  async getStatement(estateId: string, id: string): Promise<ApiResponse<EstateStatement>> {
    return safeCall(() => authFetch(`/estate/${estateId}/statements/${id}`));
  },

  async generateStatement(
    estateId: string,
    data: { periodStart: string; periodEnd: string }
  ): Promise<ApiResponse<EstateStatement>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/statements/generate`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    );
  },

  async issueStatement(estateId: string, id: string): Promise<ApiResponse<EstateStatement>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/statements/${id}/issue`, { method: 'POST' })
    );
  },

  async retryStatementPayout(estateId: string, id: string): Promise<ApiResponse<EstateStatement>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/statements/${id}/retry-payout`, { method: 'POST' })
    );
  },

  /**
   * The API refuses it for anybody else, including the estate office that maintains the statement.
   */
  async disputeStatementLine(
    estateId: string,
    statementId: string,
    lineId: string,
    reason: string
  ): Promise<ApiResponse<EstateStatementLineDispute>> {
    return safeCall(() =>
      authFetch<EstateStatementLineDispute>(
        `/estate/${estateId}/statements/${statementId}/lines/${lineId}/disputes`,
        { method: 'POST', body: JSON.stringify({ reason }) }
      )
    );
  },

  /** A note, never a verdict: the office can explain but not close. */
  async respondToStatementLineDispute(
    estateId: string,
    statementId: string,
    disputeId: string,
    response: string
  ): Promise<ApiResponse<EstateStatementLineDispute>> {
    return safeCall(() =>
      authFetch<EstateStatementLineDispute>(
        `/estate/${estateId}/statements/${statementId}/disputes/${disputeId}/respond`,
        { method: 'POST', body: JSON.stringify({ response }) }
      )
    );
  },

  async withdrawStatementLineDispute(
    estateId: string,
    statementId: string,
    disputeId: string
  ): Promise<ApiResponse<EstateStatementLineDispute>> {
    return safeCall(() =>
      authFetch<EstateStatementLineDispute>(
        `/estate/${estateId}/statements/${statementId}/disputes/${disputeId}/withdraw`,
        { method: 'POST' }
      )
    );
  },

  async getPayoutAccount(estateId: string): Promise<ApiResponse<EstatePayoutAccount>> {
    return safeCall(() => authFetch(`/estate/${estateId}/payout-account`));
  },

  async updatePayoutAccount(
    estateId: string,
    data: {
      bankCode: string;
      accountNumber: string;
      registrationNumber?: string;
      businessType?: 'BUSINESS_NAME' | 'LIMITED_COMPANY' | 'INCORPORATED_TRUSTEES';
    }
  ): Promise<ApiResponse<EstatePayoutAccount>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/payout-account`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    );
  },

  async listHouseholds(
    estateId: string,
    query: EstatePageQuery & { status?: HouseholdStatus } = {}
  ): Promise<ApiResponse<Paginated<Household>>> {
    return safeCall(() => authFetch(`/estate/${estateId}/households${toQuery(query)}`));
  },

  async addHousehold(
    estateId: string,
    data: { unitLabel: string; residentName: string; contactPhone?: string; contactEmail?: string }
  ): Promise<ApiResponse<Household>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/households`, { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async importHouseholds(
    estateId: string,
    file: File
  ): Promise<ApiResponse<ImportHouseholdsResult>> {
    const formData = new FormData();
    formData.append('file', file);
    return safeCall(() =>
      authFetch(`/estate/${estateId}/households/import`, { method: 'POST', body: formData })
    );
  },

  async updateHousehold(
    estateId: string,
    householdId: string,
    data: Partial<{
      unitLabel: string;
      residentName: string;
      contactPhone: string;
      contactEmail: string;
      status: 'ACTIVE' | 'INACTIVE';
    }>
  ): Promise<ApiResponse<Household>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/households/${householdId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    );
  },

  async removeHousehold(estateId: string, householdId: string): Promise<ApiResponse<void>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/households/${householdId}`, { method: 'DELETE' })
    );
  },

  async linkResident(
    estateId: string,
    householdId: string,
    email: string
  ): Promise<ApiResponse<Household>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/households/${householdId}/resident`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
    );
  },

  async unlinkResident(estateId: string, householdId: string): Promise<ApiResponse<Household>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/households/${householdId}/resident`, { method: 'DELETE' })
    );
  },

  async createDues(
    estateId: string,
    data: {
      amount: number;
      dueDate: string;
      description?: string;
      category?: 'RENT' | 'SERVICE_CHARGE' | 'DEPOSIT' | 'LEVY';
      billingCycle?: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
      isRecurring?: boolean;
      householdIds?: string[];
    }
  ): Promise<ApiResponse<{ created: number }>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/dues`, { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async listDues(
    estateId: string,
    query: EstatePageQuery & { status?: string } = {}
  ): Promise<ApiResponse<Paginated<Due>>> {
    return safeCall(() => authFetch(`/estate/${estateId}/dues${toQuery(query)}`));
  },

  async markDuePaid(estateId: string, dueId: string): Promise<ApiResponse<Due>> {
    return safeCall(() => authFetch(`/estate/${estateId}/dues/${dueId}/pay`, { method: 'PATCH' }));
  },

  async issueVisitorPass(
    estateId: string,
    data: {
      householdId: string;
      visitorName: string;
      visitorPhone?: string;
      purpose?: string;
      expiresAt?: string;
    }
  ): Promise<ApiResponse<IssuedVisitorPass>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/visitor-passes`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    );
  },

  async listVisitorPasses(
    estateId: string,
    query: EstatePageQuery & { status?: string; search?: string } = {}
  ): Promise<ApiResponse<Paginated<VisitorPass>>> {
    return safeCall(() => authFetch(`/estate/${estateId}/visitor-passes${toQuery(query)}`));
  },

  /** One read for every state, so an answer cannot slip between two queries. */
  async listWalkInVisitorPasses(
    estateId: string,
    query: EstatePageQuery = {}
  ): Promise<ApiResponse<Paginated<VisitorPass>>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/visitor-passes${toQuery({ ...query, source: 'gate' })}`)
    );
  },

  async revokeVisitorPass(estateId: string, passId: string): Promise<ApiResponse<VisitorPass>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/visitor-passes/${passId}/revoke`, { method: 'PATCH' })
    );
  },

  /**
   * `occurredAt` (offline queue only) stops a queued check-in being judged at replay time. `gateId`
   * is optional on purpose: a missing gate must never refuse an arrival.
   */
  async verifyVisitorPass(
    estateId: string,
    pin: string,
    options: GateWriteOptions = {}
  ): Promise<ApiResponse<VisitorPass>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/visitor-passes/verify`, {
        method: 'POST',
        body: JSON.stringify(buildGateWriteBody({ pin, ...options })),
      })
    );
  },

  /**
   * `occurredAt` is when the guard let the visitor out, not when the queue sent it; the gate is
   * recorded as an exit gate.
   */
  async checkOutVisitorPass(
    estateId: string,
    passId: string,
    options: GateWriteOptions = {}
  ): Promise<ApiResponse<VisitorPass>> {
    const body = buildGateWriteBody(options);
    return safeCall(() =>
      authFetch(`/estate/${estateId}/visitor-passes/${passId}/check-out`, {
        method: 'PATCH',
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
    );
  },

  /** Admits nobody: it asks the household, and the gate stays shut until they answer. */
  async requestWalkInVisitorPass(
    estateId: string,
    data: {
      householdId: string;
      visitorName: string;
      visitorPhone?: string;
      purpose?: string;
      gateId?: string;
      overrideReason?: string;
    }
  ): Promise<ApiResponse<VisitorPass>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/visitor-passes/walk-in`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    );
  },

  /** `occurredAt` is when the guard acted, as on the queued check-in. */
  async admitWalkInVisitorPass(
    estateId: string,
    passId: string,
    options: GateWriteOptions = {}
  ): Promise<ApiResponse<VisitorPass>> {
    const body = buildGateWriteBody(options);
    return safeCall(() =>
      authFetch(`/estate/${estateId}/visitor-passes/${passId}/admit`, {
        method: 'PATCH',
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
    );
  },

  async cancelWalkInVisitorPass(
    estateId: string,
    passId: string
  ): Promise<ApiResponse<VisitorPass>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/visitor-passes/${passId}/cancel`, { method: 'PATCH' })
    );
  },

  async logVehicleEntry(
    estateId: string,
    data: {
      plateNumber: string;
      vehicleDescription?: string;
      driverName?: string;
      purpose?: 'VISITOR' | 'RESIDENT' | 'DELIVERY' | 'STAFF' | 'OTHER';
      gateId?: string;
      /** Set only when the guard is admitting a vehicle the estate has blocked. */
      overrideReason?: string;
      photo?: File;
    }
  ): Promise<ApiResponse<VehicleLog>> {
    const formData = new FormData();
    formData.append('plateNumber', data.plateNumber);
    if (data.vehicleDescription) formData.append('vehicleDescription', data.vehicleDescription);
    if (data.driverName) formData.append('driverName', data.driverName);
    if (data.purpose) formData.append('purpose', data.purpose);
    if (data.gateId) formData.append('gateId', data.gateId);
    if (data.overrideReason) formData.append('overrideReason', data.overrideReason);
    if (data.photo) formData.append('file', data.photo);
    return safeCall(() =>
      authFetch(`/estate/${estateId}/vehicle-logs`, { method: 'POST', body: formData })
    );
  },

  async listVehicleLogs(
    estateId: string,
    query: EstatePageQuery & { purpose?: VehicleLogPurpose; open?: boolean } = {}
  ): Promise<ApiResponse<Paginated<VehicleLog>>> {
    return safeCall(() =>
      authFetch(
        `/estate/${estateId}/vehicle-logs${toQuery({
          ...query,
          purpose: query.purpose?.toUpperCase(),
        })}`
      )
    );
  },

  async markVehicleExited(estateId: string, logId: string): Promise<ApiResponse<VehicleLog>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/vehicle-logs/${logId}/exit`, { method: 'PATCH' })
    );
  },

  async logDelivery(
    estateId: string,
    data: {
      householdId?: string;
      /** When present the server derives the household from it and ignores `householdId`. */
      code?: string;
      courier?: string;
      recipientName?: string;
      gateId?: string;
      photo?: File;
    }
  ): Promise<ApiResponse<DeliveryLog>> {
    const formData = new FormData();
    if (data.householdId) formData.append('householdId', data.householdId);
    if (data.code) formData.append('code', data.code);
    if (data.courier) formData.append('courier', data.courier);
    if (data.recipientName) formData.append('recipientName', data.recipientName);
    if (data.gateId) formData.append('gateId', data.gateId);
    if (data.photo) formData.append('file', data.photo);
    return safeCall(() =>
      authFetch(`/estate/${estateId}/deliveries`, { method: 'POST', body: formData })
    );
  },

  /** Writes nothing, so checking a code does not spend it. */
  async verifyDeliveryCode(
    estateId: string,
    code: string
  ): Promise<ApiResponse<DeliveryCodeScreen>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/deliveries/verify`, {
        method: 'POST',
        body: JSON.stringify({ code }),
      })
    );
  },

  async listDeliveries(
    estateId: string,
    query: EstatePageQuery & { status?: DeliveryLogStatus } = {}
  ): Promise<ApiResponse<Paginated<DeliveryLog>>> {
    return safeCall(() => authFetch(`/estate/${estateId}/deliveries${toQuery(query)}`));
  },

  async markDeliveryCollected(
    estateId: string,
    logId: string,
    collectedBy?: string
  ): Promise<ApiResponse<DeliveryLog>> {
    const name = collectedBy?.trim();
    return safeCall(() =>
      authFetch(`/estate/${estateId}/deliveries/${logId}/collect`, {
        method: 'PATCH',
        body: JSON.stringify(name ? { collectedBy: name } : {}),
      })
    );
  },

  async inviteGateman(estateId: string, email: string): Promise<ApiResponse<StaffMember>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/staff/gateman`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
    );
  },

  async listStaff(
    estateId: string,
    query: EstatePageQuery = {}
  ): Promise<ApiResponse<Paginated<StaffMember>>> {
    return safeCall(() => authFetch(`/estate/${estateId}/staff${toQuery(query)}`));
  },

  async removeGateman(estateId: string, memberUserId: string): Promise<ApiResponse<void>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/staff/${memberUserId}`, { method: 'DELETE' })
    );
  },

  async createGate(
    estateId: string,
    data: { name: string; location?: string }
  ): Promise<ApiResponse<Gate>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/gates`, { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async listGates(estateId: string): Promise<ApiResponse<Gate[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/gates`));
  },

  async deleteGate(estateId: string, gateId: string): Promise<ApiResponse<void>> {
    return safeCall(() => authFetch(`/estate/${estateId}/gates/${gateId}`, { method: 'DELETE' }));
  },

  /** Screening runs server-side at every entry point; this only manages the list. */
  async listWatchlist(
    estateId: string,
    query: EstatePageQuery & {
      status?: WatchlistStatus;
      subjectType?: WatchlistSubjectType;
      severity?: WatchlistSeverity;
    } = {}
  ): Promise<ApiResponse<Paginated<WatchlistEntry>>> {
    return safeCall(() => authFetch(`/estate/${estateId}/watchlist${toQuery(query)}`));
  },

  /** Multipart for the photo; the API requires a reason. */
  async addWatchlistEntry(
    estateId: string,
    data: {
      label: string;
      reason: string;
      subjectType?: WatchlistSubjectType;
      severity?: WatchlistSeverity;
      phone?: string;
      plateNumber?: string;
      /** ISO date; omit for an entry that stays until somebody lifts it. */
      expiresAt?: string;
      photo?: File;
    }
  ): Promise<ApiResponse<WatchlistEntry>> {
    const formData = new FormData();
    formData.append('label', data.label);
    formData.append('reason', data.reason);
    if (data.subjectType) formData.append('subjectType', data.subjectType);
    if (data.severity) formData.append('severity', data.severity);
    if (data.phone) formData.append('phone', data.phone);
    if (data.plateNumber) formData.append('plateNumber', data.plateNumber);
    if (data.expiresAt) formData.append('expiresAt', data.expiresAt);
    if (data.photo) formData.append('file', data.photo);
    return safeCall(() =>
      authFetch(`/estate/${estateId}/watchlist`, { method: 'POST', body: formData })
    );
  },

  /** The row stays, so the decision is kept on record. */
  async liftWatchlistEntry(
    estateId: string,
    entryId: string,
    liftReason: string
  ): Promise<ApiResponse<WatchlistEntry>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/watchlist/${entryId}/lift`, {
        method: 'PATCH',
        body: JSON.stringify({ liftReason }),
      })
    );
  },

  /** "active" is translated server-side to still in force, not the ACTIVE column. */
  async listContractorPasses(
    estateId: string,
    query: EstatePageQuery & { status?: ContractorPassStatus } = {}
  ): Promise<ApiResponse<Paginated<ContractorPass>>> {
    return safeCall(() => authFetch(`/estate/${estateId}/contractor-passes${toQuery(query)}`));
  },

  /**
   * Enterprise-only: a 403 `PLAN_UPGRADE_REQUIRED` is expected and carries the required and current
   * tiers.
   */
  async createContractorPass(
    estateId: string,
    data: {
      householdId: string;
      name: string;
      phone?: string;
      company?: string;
      trade?: string;
      validFrom: string;
      validUntil: string;
      /** Omit or empty for every day. */
      daysOfWeek?: number[];
      dailyFrom?: string;
      dailyTo?: string;
    }
  ): Promise<ApiResponse<IssuedContractorPass>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/contractor-passes`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    );
  },

  /** The row stays, so the decision is kept on record. */
  async revokeContractorPass(
    estateId: string,
    passId: string,
    reason: string
  ): Promise<ApiResponse<ContractorPass>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/contractor-passes/${passId}/revoke`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      })
    );
  },

  /** Access-checked: a "nobody matched" answer reveals who the estate is watching. */
  async screenWatchlist(
    estateId: string,
    query: { name?: string; phone?: string; plateNumber?: string }
  ): Promise<ApiResponse<WatchlistScreening>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/watchlist/screen`, {
        method: 'POST',
        body: JSON.stringify(query),
      })
    );
  },

  /**
   * The roll is built server-side in the same transaction, so it is a snapshot taken at a stated
   * time.
   */
  async declareMuster(
    estateId: string,
    data: { kind: EmergencyKind; description: string; assemblyPoint?: string }
  ): Promise<ApiResponse<EmergencyMuster>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/emergency-musters`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    );
  },

  /** Null is the ordinary case. */
  async getActiveMuster(estateId: string): Promise<ApiResponse<EmergencyMuster | null>> {
    return safeCall(() => authFetch(`/estate/${estateId}/emergency-musters/active`));
  },

  /** Summaries only; a roll holds a line per person. */
  async listMusters(
    estateId: string,
    query: EstatePageQuery & { status?: MusterStatus } = {}
  ): Promise<ApiResponse<Paginated<MusterSummary>>> {
    return safeCall(() => authFetch(`/estate/${estateId}/emergency-musters${toQuery(query)}`));
  },

  async getMuster(estateId: string, musterId: string): Promise<ApiResponse<EmergencyMuster>> {
    return safeCall(() => authFetch(`/estate/${estateId}/emergency-musters/${musterId}`));
  },

  /** Returns the whole muster so the on-screen tally always matches the roll. */
  async updateRollEntry(
    estateId: string,
    musterId: string,
    entryId: string,
    data: { state: MusterRollState; stateNote?: string }
  ): Promise<ApiResponse<EmergencyMuster>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/emergency-musters/${musterId}/roll/${entryId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    );
  },

  /** Only adds lines; existing lines are left alone. */
  async addMusterArrivals(
    estateId: string,
    musterId: string
  ): Promise<ApiResponse<EmergencyMuster>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/emergency-musters/${musterId}/roll/arrivals`, {
        method: 'POST',
      })
    );
  },

  /** The API requires a note while anybody is unaccounted for. */
  async closeMuster(
    estateId: string,
    musterId: string,
    closingNote?: string
  ): Promise<ApiResponse<EmergencyMuster>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/emergency-musters/${musterId}/close`, {
        method: 'POST',
        body: JSON.stringify(closingNote ? { closingNote } : {}),
      })
    );
  },

  /**
   * Enterprise: a 403 `PLAN_UPGRADE_REQUIRED` is expected. Never recompute elapsed time from
   * `admittedAt`; the server's numbers must match the office's notification.
   */
  async getOnSiteBoard(estateId: string): Promise<ApiResponse<OnSiteBoard>> {
    return safeCall(() => authFetch(`/estate/${estateId}/dwell/on-site`));
  },

  /** The window is exclusive at the end, so back-to-back months never count a visit twice. */
  async getAuthorisationDwell(
    estateId: string,
    query: EstatePageQuery & { from?: string; to?: string; sort?: 'dwell' | 'visits' } = {}
  ): Promise<ApiResponse<AuthorisationDwellReport>> {
    return safeCall(() => authFetch(`/estate/${estateId}/dwell/authorisations${toQuery(query)}`));
  },

  /** The API never sends checkpoint codes. */
  async listPatrolCheckpoints(estateId: string): Promise<ApiResponse<PatrolCheckpoint[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/patrol-checkpoints`));
  },

  /** The reply is the only time the code is readable; nothing can fetch it back. */
  async createPatrolCheckpoint(
    estateId: string,
    data: { name: string; location?: string }
  ): Promise<ApiResponse<IssuedPatrolCheckpoint>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/patrol-checkpoints`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    );
  },

  async updatePatrolCheckpoint(
    estateId: string,
    checkpointId: string,
    data: { name?: string; location?: string; active?: boolean }
  ): Promise<ApiResponse<PatrolCheckpoint>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/patrol-checkpoints/${checkpointId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    );
  },

  /**
   * Invalidates the code on the wall; one cheap call because a photographed code defeats the
   * checkpoint.
   */
  async reissuePatrolCheckpointCode(
    estateId: string,
    checkpointId: string
  ): Promise<ApiResponse<IssuedPatrolCheckpoint>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/patrol-checkpoints/${checkpointId}/reissue-code`, {
        method: 'POST',
      })
    );
  },

  async listPatrolRoutes(estateId: string): Promise<ApiResponse<PatrolRoute[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/patrol-routes`));
  },

  async createPatrolRoute(
    estateId: string,
    data: {
      name: string;
      daysOfWeek?: number[];
      startTime: string;
      windowMinutes: number;
      checkpointIds: string[];
    }
  ): Promise<ApiResponse<PatrolRoute>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/patrol-routes`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    );
  },

  async updatePatrolRoute(
    estateId: string,
    routeId: string,
    data: {
      name?: string;
      daysOfWeek?: number[];
      startTime?: string;
      windowMinutes?: number;
      checkpointIds?: string[];
      active?: boolean;
    }
  ): Promise<ApiResponse<PatrolRoute>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/patrol-routes/${routeId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    );
  },

  /**
   * Counted server-side against the roster frozen when each round opened, so it matches the notice
   * already sent.
   */
  async getPatrolReport(
    estateId: string,
    query: { from?: string; to?: string; routeId?: string } = {}
  ): Promise<ApiResponse<PatrolReport>> {
    return safeCall(() => authFetch(`/estate/${estateId}/patrols/rounds${toQuery(query)}`));
  },

  /** Deliberately not plan-gated: refusing a scan would lose the patrol record. */
  async scanPatrolCheckpoint(
    estateId: string,
    code: string,
    options: GateWriteOptions = {}
  ): Promise<ApiResponse<PatrolScanResult>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/patrols/scan`, {
        method: 'POST',
        body: JSON.stringify({ code, ...options }),
      })
    );
  },

  async createAnnouncement(
    estateId: string,
    data: {
      title: string;
      body: string;
      priority?: 'NORMAL' | 'URGENT';
      deliveryChannels?: ('SMS' | 'WHATSAPP')[];
    }
  ): Promise<ApiResponse<Announcement>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/announcements`, { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async listAnnouncements(
    estateId: string,
    query: EstatePageQuery = {}
  ): Promise<ApiResponse<Paginated<Announcement>>> {
    return safeCall(() => authFetch(`/estate/${estateId}/announcements${toQuery(query)}`));
  },

  async updateAnnouncement(
    estateId: string,
    announcementId: string,
    data: Partial<{ title: string; body: string; priority: 'NORMAL' | 'URGENT' }>
  ): Promise<ApiResponse<Announcement>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/announcements/${announcementId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
    );
  },

  async removeAnnouncement(estateId: string, announcementId: string): Promise<ApiResponse<void>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/announcements/${announcementId}`, { method: 'DELETE' })
    );
  },

  async reportViolation(
    estateId: string,
    data: {
      householdId: string;
      description: string;
      category?:
        | 'NOISE'
        | 'UNAUTHORIZED_PARKING'
        | 'PET_VIOLATION'
        | 'PROPERTY_MAINTENANCE'
        | 'OTHER';
    }
  ): Promise<ApiResponse<Violation>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/violations`, { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async listViolations(estateId: string, status?: string): Promise<ApiResponse<Violation[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/violations${toQuery({ status })}`));
  },

  async issueViolationWarning(
    estateId: string,
    violationId: string
  ): Promise<ApiResponse<Violation>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/violations/${violationId}/warn`, { method: 'PATCH' })
    );
  },

  async resolveViolation(
    estateId: string,
    violationId: string,
    resolutionNotes?: string
  ): Promise<ApiResponse<Violation>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/violations/${violationId}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ resolutionNotes }),
      })
    );
  },

  async dismissViolation(
    estateId: string,
    violationId: string,
    resolutionNotes?: string
  ): Promise<ApiResponse<Violation>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/violations/${violationId}/dismiss`, {
        method: 'PATCH',
        body: JSON.stringify({ resolutionNotes }),
      })
    );
  },

  async reportIncident(
    estateId: string,
    data: {
      description: string;
      category?: 'SECURITY' | 'MAINTENANCE' | 'SAFETY' | 'OTHER';
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      photo?: File;
    }
  ): Promise<ApiResponse<Incident>> {
    const formData = new FormData();
    formData.append('description', data.description);
    if (data.category) formData.append('category', data.category);
    if (data.priority) formData.append('priority', data.priority);
    if (data.photo) formData.append('file', data.photo);
    return safeCall(() =>
      authFetch(`/estate/${estateId}/incidents`, { method: 'POST', body: formData })
    );
  },

  async listIncidents(estateId: string, status?: string): Promise<ApiResponse<Incident[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/incidents${toQuery({ status })}`));
  },

  async startIncident(estateId: string, incidentId: string): Promise<ApiResponse<Incident>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/incidents/${incidentId}/start`, { method: 'PATCH' })
    );
  },

  async resolveIncident(
    estateId: string,
    incidentId: string,
    resolutionNotes?: string
  ): Promise<ApiResponse<Incident>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/incidents/${incidentId}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ resolutionNotes }),
      })
    );
  },

  async dismissIncident(
    estateId: string,
    incidentId: string,
    resolutionNotes?: string
  ): Promise<ApiResponse<Incident>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/incidents/${incidentId}/dismiss`, {
        method: 'PATCH',
        body: JSON.stringify({ resolutionNotes }),
      })
    );
  },

  async listMaintenanceTickets(
    estateId: string,
    status?: string
  ): Promise<ApiResponse<MaintenanceTicket[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/maintenance${toQuery({ status })}`));
  },

  async startMaintenanceTicket(
    estateId: string,
    ticketId: string
  ): Promise<ApiResponse<MaintenanceTicket>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/maintenance/${ticketId}/start`, { method: 'PATCH' })
    );
  },

  async resolveMaintenanceTicket(
    estateId: string,
    ticketId: string,
    resolutionNotes?: string
  ): Promise<ApiResponse<MaintenanceTicket>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/maintenance/${ticketId}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ resolutionNotes }),
      })
    );
  },

  async dismissMaintenanceTicket(
    estateId: string,
    ticketId: string,
    resolutionNotes?: string
  ): Promise<ApiResponse<MaintenanceTicket>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/maintenance/${ticketId}/dismiss`, {
        method: 'PATCH',
        body: JSON.stringify({ resolutionNotes }),
      })
    );
  },

  /** Managers only. */
  async getReportDigest(estateId: string): Promise<ApiResponse<ReportDigest>> {
    return safeCall(() => authFetch(`/estate/${estateId}/reports/digest`));
  },

  /** Nothing is posted. */
  async draftAnnouncement(
    estateId: string,
    notes: string,
    language: ReplyLanguage = 'en'
  ): Promise<ApiResponse<AnnouncementDraft>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/announcements/draft`, {
        method: 'POST',
        body: JSON.stringify({ notes, ...(language === 'en' ? {} : { language }) }),
      })
    );
  },

  /** Nothing is posted. */
  async draftPoll(estateId: string, topic: string): Promise<ApiResponse<PollDraft>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/polls/draft`, {
        method: 'POST',
        body: JSON.stringify({ topic }),
      })
    );
  },

  async createPoll(
    estateId: string,
    data: { question: string; options: string[] }
  ): Promise<ApiResponse<Poll>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/polls`, { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async listPolls(estateId: string): Promise<ApiResponse<Poll[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/polls`));
  },

  async closePoll(estateId: string, pollId: string): Promise<ApiResponse<Poll>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/polls/${pollId}/close`, { method: 'PATCH' })
    );
  },

  async createAmenity(
    estateId: string,
    data: { name: string; description?: string }
  ): Promise<ApiResponse<Amenity>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/amenities`, { method: 'POST', body: JSON.stringify(data) })
    );
  },

  async listAmenities(estateId: string): Promise<ApiResponse<Amenity[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/amenities`));
  },

  async deleteAmenity(estateId: string, amenityId: string): Promise<ApiResponse<void>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/amenities/${amenityId}`, { method: 'DELETE' })
    );
  },

  async listAmenityBookings(estateId: string): Promise<ApiResponse<AmenityBooking[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/amenity-bookings`));
  },

  async cancelAmenityBooking(
    estateId: string,
    bookingId: string
  ): Promise<ApiResponse<AmenityBooking>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/amenity-bookings/${bookingId}/cancel`, { method: 'PATCH' })
    );
  },

  async uploadGovernanceRecord(
    estateId: string,
    data: {
      title: string;
      type?: 'BYLAWS' | 'MEETING_MINUTES' | 'OTHER';
      meetingDate?: string;
      file: File;
      newVersionOfId?: string;
      requiresSignatures?: boolean;
    }
  ): Promise<ApiResponse<GovernanceRecord>> {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.type) formData.append('type', data.type);
    if (data.meetingDate) formData.append('meetingDate', data.meetingDate);
    if (data.newVersionOfId) formData.append('newVersionOfId', data.newVersionOfId);
    if (data.requiresSignatures !== undefined) {
      formData.append('requiresSignatures', String(data.requiresSignatures));
    }
    formData.append('file', data.file);
    return safeCall(() =>
      authFetch(`/estate/${estateId}/governance`, { method: 'POST', body: formData })
    );
  },

  async listGovernanceRecords(
    estateId: string,
    type?: string
  ): Promise<ApiResponse<GovernanceRecord[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/governance${toQuery({ type })}`));
  },

  async listGovernanceRecordVersions(
    estateId: string,
    recordId: string
  ): Promise<ApiResponse<GovernanceRecord[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/governance/${recordId}/versions`));
  },

  async listGovernanceRecordSignatures(
    estateId: string,
    recordId: string
  ): Promise<ApiResponse<GovernanceRecordSignature[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/governance/${recordId}/signatures`));
  },

  async removeGovernanceRecord(estateId: string, recordId: string): Promise<ApiResponse<void>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/governance/${recordId}`, { method: 'DELETE' })
    );
  },

  async appointCommitteeMember(
    estateId: string,
    data: { householdId: string; title?: CommitteeTitle }
  ): Promise<ApiResponse<CommitteeMember>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/committee`, {
        method: 'POST',
        body: JSON.stringify({
          householdId: data.householdId,
          ...(data.title ? { title: data.title.toUpperCase() } : {}),
        }),
      })
    );
  },

  async listCommitteeMembers(estateId: string): Promise<ApiResponse<CommitteeMember[]>> {
    return safeCall(() => authFetch(`/estate/${estateId}/committee`));
  },

  async removeCommitteeMember(estateId: string, memberId: string): Promise<ApiResponse<void>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/committee/${memberId}`, { method: 'DELETE' })
    );
  },

  async getMicrositeSettings(estateId: string): Promise<ApiResponse<EstateMicrositeSettings>> {
    return safeCall(() => authFetch(`/estate/${estateId}/microsite`));
  },

  async updateMicrositeSettings(
    estateId: string,
    patch: Partial<Pick<EstateMicrositeSettings, 'slug' | 'bio' | 'enabled'>>
  ): Promise<ApiResponse<EstateMicrositeSettings>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/microsite`, { method: 'PATCH', body: JSON.stringify(patch) })
    );
  },

  async uploadMicrositeBanner(
    estateId: string,
    file: File
  ): Promise<ApiResponse<EstateMicrositeSettings>> {
    const formData = new FormData();
    formData.append('file', file);
    return safeCall(() =>
      authFetch(`/estate/${estateId}/microsite/banner`, { method: 'POST', body: formData })
    );
  },

  /** Enterprise. Each row carries its own deadline; render it rather than deciding who is due. */
  async getExpectedToday(estateId: string): Promise<ApiResponse<ExpectedToday>> {
    return safeCall(() => authFetch(`/estate/${estateId}/expected-today`));
  },

  /**
   * One household and one deadline for the list; each row becomes a screened visitor pass and the
   * reply reports every row's outcome.
   */
  async importGuestList(
    estateId: string,
    data: { householdId: string; expiresAt: string; file: File }
  ): Promise<ApiResponse<GuestListImportResult>> {
    const formData = new FormData();
    formData.append('householdId', data.householdId);
    formData.append('expiresAt', data.expiresAt);
    formData.append('file', data.file);
    return safeCall(() =>
      authFetch(`/estate/${estateId}/expected-visitors/import`, {
        method: 'POST',
        body: formData,
      })
    );
  },

  /**
   * Fetch one pass at a time, never in a list: it carries a short-lived signed URL to an identity
   * document. Null means the guard recorded nothing.
   */
  async getVisitorIdCheck(
    estateId: string,
    passId: string
  ): Promise<ApiResponse<VisitorIdCheck | null>> {
    return safeCall(() => authFetch(`/estate/${estateId}/visitor-passes/${passId}/id-check`));
  },
};
