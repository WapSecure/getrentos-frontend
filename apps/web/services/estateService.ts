import { authDownload, authFetch, safeCall, toQuery } from '@/lib/apiHelpers';
import type { ApiResponse, Paginated } from '@/lib/apiHelpers';
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
} from '@/types/estate';

type EstatePageQuery = {
  page?: number;
  pageSize?: number;
};

/** Extra fields the gate sends alongside a visitor-pass write. */
export type GateWriteOptions = {
  /** ISO time the guard acted, for a write queued offline. */
  occurredAt?: string;
  /** The barrier the guard is standing at. */
  gateId?: string;
  /**
   * A guard's stated reason for admitting somebody the estate has blocked.
   *
   * Only ever set on a deliberate override, never on the first attempt: the
   * reason is the whole point of the override, and it is what the estate office
   * is told when they are woken by the notification.
   */
  overrideReason?: string;
};

/**
 * Drops absent fields so the gate never sends `gateId: ''` or `occurredAt: null`
 * — either would be rejected as an invalid id, and the write would be lost for a
 * reason the guard cannot see or fix. Returns undefined when nothing is set, so a
 * write with no extra fields is sent with no body at all.
 */
function buildGateWriteBody(extra: Record<string, unknown>): Record<string, unknown> | undefined {
  const body = Object.fromEntries(
    Object.entries(extra).filter(([, value]) => value !== undefined && value !== '')
  );
  return Object.keys(body).length > 0 ? body : undefined;
}

export const estateService = {
  async createEstate(data: {
    name: string;
    address: string;
    city: string;
    state: string;
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
      link.download = 'getrentos-estate-financials.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  },

  // ---- Dues statements ----
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

  // ---- Payout account ----
  async getPayoutAccount(estateId: string): Promise<ApiResponse<EstatePayoutAccount>> {
    return safeCall(() => authFetch(`/estate/${estateId}/payout-account`));
  },

  async updatePayoutAccount(
    estateId: string,
    data: { bankCode: string; accountNumber: string }
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
    query: EstatePageQuery & { status?: string } = {}
  ): Promise<ApiResponse<Paginated<VisitorPass>>> {
    return safeCall(() => authFetch(`/estate/${estateId}/visitor-passes${toQuery(query)}`));
  },

  /**
   * Every walk-in the gate has raised, whatever its state.
   *
   * One read rather than one per state, so a request the household has just
   * answered cannot slip between two queries: the console has to be able to tell
   * "waiting", "approved" and "refused" apart from the same snapshot.
   */
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
   * `occurredAt` is only sent by the offline queue. Without it a check-in that
   * waited in the queue is judged against the clock at replay, so a pass that
   * expired while the connection was down is refused and the arrival is lost.
   *
   * `gateId` is the barrier the guard is standing at. It is optional on purpose:
   * refusing an arrival because the console had not been told which gate it is
   * at would put a real person behind a data-quality problem.
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
   * Logs a checked-in visitor off the estate. Until this existed a pass stayed
   * checked in forever, so "who is inside?" was unanswerable for people.
   *
   * `occurredAt` carries the same meaning as on check-in: the time the guard
   * actually let the visitor out, not the time the queue got to send it. The
   * gate is recorded as an *exit* gate, because a visitor may well walk out of a
   * different barrier than the one they came in by.
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

  /**
   * Raises a walk-in: somebody is at the barrier with nothing arranged.
   *
   * Names the unit rather than quoting a code, because there is no code. This
   * does not admit anyone — it asks the household, and the gate stays shut until
   * they answer.
   */
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

  /**
   * Opens the barrier for a walk-in the household has already approved.
   * `occurredAt` carries the same meaning as on the queued check-in: if the
   * connection drops between the approval and the barrier, the admission is
   * queued and must be recorded as happening when the guard acted.
   */
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

  /** Withdraws a walk-in the gate raised — wrong unit, or the visitor left. */
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
      householdId: string;
      courier?: string;
      recipientName?: string;
      gateId?: string;
      photo?: File;
    }
  ): Promise<ApiResponse<DeliveryLog>> {
    const formData = new FormData();
    formData.append('householdId', data.householdId);
    if (data.courier) formData.append('courier', data.courier);
    if (data.recipientName) formData.append('recipientName', data.recipientName);
    if (data.gateId) formData.append('gateId', data.gateId);
    if (data.photo) formData.append('file', data.photo);
    return safeCall(() =>
      authFetch(`/estate/${estateId}/deliveries`, { method: 'POST', body: formData })
    );
  },

  async listDeliveries(
    estateId: string,
    query: EstatePageQuery & { status?: DeliveryLogStatus } = {}
  ): Promise<ApiResponse<Paginated<DeliveryLog>>> {
    return safeCall(() => authFetch(`/estate/${estateId}/deliveries${toQuery(query)}`));
  },

  async markDeliveryCollected(estateId: string, logId: string): Promise<ApiResponse<DeliveryLog>> {
    return safeCall(() =>
      authFetch(`/estate/${estateId}/deliveries/${logId}/collect`, { method: 'PATCH' })
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

  // --- Watch list -----------------------------------------------------------

  /**
   * The estate's do-not-admit list.
   *
   * Managing a rule, not enforcing one: the screen itself runs server-side at
   * every point somebody can enter, so nothing here has to be remembered at a
   * barrier for the list to work.
   */
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

  /**
   * Adds somebody to the list.
   *
   * Multipart because a photo is the only thing here that helps a guard
   * recognise a person, and an estate usually has one. The reason is required by
   * the API — an entry nobody can explain is one nobody can review.
   */
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

  /** Takes an entry off the list. The row stays, so the record of the decision survives. */
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

  // --- Contractor passes (Enterprise) --------------------------------------

  /**
   * The estate's standing authorisations.
   *
   * The status filter is translated server-side, so "active" means still in
   * force rather than still ACTIVE in a column — a lapsed authorisation must not
   * be able to hide in that list where nobody looks at it again.
   */
  async listContractorPasses(
    estateId: string,
    query: EstatePageQuery & { status?: ContractorPassStatus } = {}
  ): Promise<ApiResponse<Paginated<ContractorPass>>> {
    return safeCall(() => authFetch(`/estate/${estateId}/contractor-passes${toQuery(query)}`));
  },

  /**
   * Authorises somebody to arrive repeatedly.
   *
   * Enterprise-only, so a 403 `PLAN_UPGRADE_REQUIRED` is an expected answer
   * rather than a fault — it carries both the tier required and the one the
   * estate is on, which is what the upsell needs to say what they are buying.
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

  /** Withdraws an authorisation. The row stays, so the decision survives it. */
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

  /**
   * Checks details against the list instead of attempting a write.
   *
   * For a guard who would rather find out before they have told a visitor they
   * are asking the household. Answering "nobody matched" tells the asker who the
   * estate is watching, so it is access-checked like everything else here.
   */
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

  // --- Emergency mustering ---------------------------------------------------

  /**
   * Raises the alarm and takes the roll.
   *
   * The roll is built server-side in the same transaction that records the
   * muster: everybody the estate believes is inside at this moment, taken once.
   * A client that assembled the list itself would be assembling it from however
   * old its cache happened to be, and the whole value of a roll call is that it
   * is a snapshot taken at a stated time.
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

  /** The roll call in progress, or null — which is the ordinary case. */
  async getActiveMuster(estateId: string): Promise<ApiResponse<EmergencyMuster | null>> {
    return safeCall(() => authFetch(`/estate/${estateId}/emergency-musters/active`));
  },

  /**
   * Every roll call the estate has raised, newest first.
   *
   * Summaries only: a roll holds a person per line, so a page of ten of them is
   * not something to fetch to draw a list.
   */
  async listMusters(
    estateId: string,
    query: EstatePageQuery & { status?: MusterStatus } = {}
  ): Promise<ApiResponse<Paginated<MusterSummary>>> {
    return safeCall(() => authFetch(`/estate/${estateId}/emergency-musters${toQuery(query)}`));
  },

  /** One roll call with its roll, for the console that is answering it. */
  async getMuster(estateId: string, musterId: string): Promise<ApiResponse<EmergencyMuster>> {
    return safeCall(() => authFetch(`/estate/${estateId}/emergency-musters/${musterId}`));
  },

  /**
   * A marshal's answer about one person.
   *
   * Returns the whole muster, not just the line, so the tally on screen always
   * matches the roll beneath it — the numbers are the reason a marshal trusts
   * the screen, and a locally-adjusted count would be the one thing they cannot
   * check.
   */
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

  /**
   * Re-reads the gate and adds anybody who came in since the roll was taken.
   *
   * Only ever adds: the roll call that does not know about the courier admitted
   * at 14:05 will report the building clear while he is still in it. Existing
   * lines, answered or not, are left alone.
   */
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

  /**
   * Stands the roll down.
   *
   * A note is required by the API whenever somebody is still unaccounted for.
   * The form asks for it up front for that case rather than letting the manager
   * find out from a 400 — an estate that searched and did not find somebody has
   * to be able to stop, and the refusal would otherwise arrive at the worst
   * possible moment.
   */
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
};
