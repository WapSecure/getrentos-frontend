export type PlatformRole =
  | 'renter'
  | 'landlord'
  | 'owner'
  | 'buyer'
  | 'realtor'
  | 'agent'
  | 'estate'
  | 'property_manager'
  | 'gateman'
  | 'resident'
  | 'admin';

export type AdminStaffRole =
  | 'backoffice_admin'
  | 'super_admin'
  | 'verification_officer'
  | 'fraud_analyst'
  | 'dispute_officer'
  | 'escrow_officer'
  | 'finance_approver'
  | 'compliance_manager'
  | 'support_agent';

export type AdminPermission =
  | 'dashboard.view'
  | 'users.view'
  | 'users.manage'
  | 'verifications.review'
  | 'verifications.approve'
  | 'disputes.review'
  | 'disputes.resolve'
  | 'fraud.review'
  | 'fraud.freeze'
  | 'escrow.view'
  | 'escrow.approve'
  | 'audit.view'
  | 'documents.manage'
  | 'messages.manage'
  | 'reports.view'
  | 'platform.configure'
  | 'staff.manage'
  | 'staff.create'
  | 'staff.approve'
  | 'shortlet.view'
  | 'shortlet.moderate'
  | 'shortlet.payout'
  | 'rentals.view'
  | 'rentals.moderate'
  | 'rentfinance.view'
  | 'rentfinance.approve'
  | 'maintenance.view'
  | 'maintenance.moderate'
  | 'sales.view'
  | 'sales.moderate'
  | 'professionals.moderate'
  | 'estate.view'
  | 'estate.moderate'
  | 'subscriptions.view'
  | 'subscriptions.manage'
  | 'managed.view'
  | 'managed.operate'
  | 'ai.observe'
  | 'collections.manage'
  | 'diaspora.ops';

export type AdminStaffStatus = 'active' | 'pending' | 'suspended' | 'banned';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AdminStaffMember {
  id: string;
  legalName: string;
  email: string | null;
  accountStatus: AdminStaffStatus;
  lastLoginAt: string | null;
  roles: { role: AdminStaffRole }[];
  staffApproval?: {
    id: string;
    status: ApprovalStatus;
    createdAt: string;
    createdBy: { id: string; legalName: string; email: string };
  } | null;
}

export interface AdminStaffApproval {
  id: string;
  status: ApprovalStatus;
  createdAt: string;
  createdBy: {
    id: string;
    legalName: string;
    email: string;
    roles: { role: AdminStaffRole }[];
  };
  staffUser: {
    id: string;
    email: string | null;
    legalName: string;
    accountStatus: string;
    roles: { role: AdminStaffRole }[];
  };
}

export type UserAccountStatus = 'active' | 'suspended' | 'pending' | 'banned';
export type VerificationRequestType = 'identity' | 'property' | 'license';
export type VerificationRequestStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'needs_clarification';
export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'escalated';
export type DisputeCategory =
  | 'escrow'
  | 'lease'
  | 'sale'
  | 'service_quality'
  | 'payment'
  | 'damage'
  | 'cancellation'
  | 'other';
export type DisputeResolveOutcome = 'none' | 'release' | 'refund';
export type FraudAlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FraudAlertStatus = 'flagged' | 'investigating' | 'cleared' | 'confirmed';
export type PlatformEscrowStatus =
  | 'deposit_pending'
  | 'funds_held'
  | 'verification'
  | 'final_payment'
  | 'released'
  | 'frozen'
  | 'disputed'
  | 'refunded';
export type AuditSeverity = 'info' | 'warning' | 'critical';
export type AdminDocumentCategory = 'policy' | 'compliance_filing' | 'legal_agreement' | 'report';

export type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface PlatformUser {
  id: string;
  fullName: string;
  email: string;
  roles: PlatformRole[];
  status: UserAccountStatus;
  trustScore: number;
  planTier: PlanTier;
  joinedDate: string;
  lastActiveAt: string;
}

export interface VerificationDocument {
  name: string;
  mimeType: string | null;
  url: string;
}

export interface VerificationRequest {
  id: string;
  applicantName: string;
  applicantRole: PlatformRole;
  type: VerificationRequestType;
  subjectLabel: string;
  status: VerificationRequestStatus;
  submittedAt: string;
  documentCount: number;
  rejectionReason?: string;
  documents?: VerificationDocument[];
  media?: VerificationDocument[];
  ownershipProofs?: OwnershipProofRef[];
  approvalRisk?: { reasons: string[]; secondOfficerRequired: boolean };
}

export interface OwnershipProofRef {
  id: string;
  documentType: string;
  status: string;
}

export interface OwnershipDocCheck {
  proofId: string;
  claimedOwnerName: string;
  propertyAddressOnFile: string | null;
  nameMatch: 'MATCH' | 'PARTIAL' | 'MISMATCH' | 'UNREADABLE';
  addressConsistent: boolean | null;
  extraction: {
    ownerName: string | null;
    propertyReference: string | null;
    documentKind: string | null;
    legible: boolean;
    concerns: string[];
  } | null;
  reasons: Array<{ code: string; severity: 'info' | 'warn' | 'critical'; detail: string }>;
  recommendation: string;
  coverage: { documentRead: boolean };
  model: string | null;
  checkedAt: string;
}

export interface Dispute {
  id: string;
  title: string;
  category: DisputeCategory;
  raisedBy: string;
  against: string;
  amount?: number;
  status: DisputeStatus;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  description: string;
  resolution?: string;
  resolvedAt?: string;
}

export interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId: 'admin' | 'party_a' | 'party_b';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface DisputeParty {
  id: string;
  legalName: string;
  email?: string;
}

// EXTERNAL entries are links recorded before uploads existed; we never held those files, so label them as someone else's word.
export interface EvidenceItem {
  id: string;
  kind: 'STORED' | 'EXTERNAL';
  name: string;
  mimeType: string | null;
  url: string;
  host?: string | null;
  sizeBytes?: number | null;
  source: 'PARTY' | 'ADMIN';
  // Absent for legacy links.
  uploadedBy?: DisputeParty | null;
  note?: string | null;
  uploadedAt: string;
  // Null when the URL is not ours to expire.
  urlExpiresInSeconds?: number | null;
}

export interface DisputeTimelineEvent {
  eventType: string;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface DisputeTransactionContext {
  id: string;
  escrowStatus: string;
  amount?: number;
  depositAmount?: number;
  flagged?: boolean;
  frozenReason?: string;
  offer?: { id: string; status: string };
  property?: { id: string; title: string };
  buyer?: DisputeParty;
  seller?: DisputeParty;
  events?: DisputeTimelineEvent[];
}

export interface DisputeDetail {
  id: string;
  title: string;
  category: DisputeCategory;
  priority: 'low' | 'medium' | 'high';
  status: DisputeStatus;
  description: string;
  evidence?: EvidenceItem[];
  createdAt: string;
  updatedAt: string;
  resolution?: string;
  resolvedAt?: string;
  raisedBy: DisputeParty;
  against: DisputeParty;
  resolvedBy?: { id: string; legalName: string };
  transaction?: DisputeTransactionContext;
  messages?: DisputeMessage[];
}

export interface FraudAlert {
  id: string;
  subjectName: string;
  subjectRole: PlatformRole;
  reason: string;
  severity: FraudAlertSeverity;
  status: FraudAlertStatus;
  detectedAt: string;
  relatedEntity: string;
}

export interface FraudAlertSubject {
  id: string;
  legalName: string;
  email?: string;
  phone?: string;
  role: PlatformRole;
  isVerified: boolean;
}

export interface FraudAlertDetail {
  id: string;
  subject: FraudAlertSubject;
  reason: string;
  severity: FraudAlertSeverity;
  status: FraudAlertStatus;
  detectedAt: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  resolvedBy?: { id: string; legalName: string };
  resolvedAt?: string;
  evidence?: EvidenceItem[];
  aiSignal?: FraudAlertAiSignal;
}

export interface FraudAlertAiSignal {
  riskScore: number;
  band: 'LOW' | 'MEDIUM' | 'HIGH';
  source: 'ai' | 'heuristic';
  model?: string | null;
  scannedAt: string;
  recommendation: string;
  reasons: { code: string; severity: string; detail: string }[];
  duplicates: {
    listingId: string;
    similarity: number;
    title: string | null;
    city: string | null;
  }[];
  photoReuse: {
    matchType: 'EXACT' | 'NEAR' | string;
    distance: number;
    otherListingId: string | null;
    otherPropertyId: string | null;
  }[];
  coverage: Record<string, boolean>;
}

export interface PlatformEscrowTransaction {
  id: string;
  propertyTitle: string;
  buyerName: string;
  sellerName: string;
  // Naira.
  amount: number;
  // The buyer's deposit, in naira: what a release or refund moves.
  heldAmount: number;
  status: PlatformEscrowStatus;
  createdAt: string;
  flagged: boolean;
  flaggedReason?: string;
}

export interface AuditLogEntry {
  id: string;
  actorName: string;
  actorRole: PlatformRole;
  action: string;
  target: string;
  severity: AuditSeverity;
  timestamp: string;
  ipAddress?: string;
  entityType?: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
}

/** A stored file in the media registry (GET /admin/media). */
export interface AdminMediaItem {
  objectKey: string;
  folder: string;
  classification: 'PUBLIC' | 'RESTRICTED' | 'CONFIDENTIAL';
  status: string;
  contentType: string | null;
  sizeBytes: number | null;
  ownerType: string | null;
  ownerId: string | null;
  legalHold: boolean;
  createdAt: string;
  deletedAt: string | null;
}

export interface AdminMediaHealth {
  checkedAt: string;
  stats: {
    processingOverAnHour: number;
    uploadingOverTwoDays: number;
    rejectedLast24h: number;
    rejectedDailyAverage7d: number;
    storedFiles: number;
    storedGb: number;
    uploadedThisMonthGb: number;
    legalHolds: number;
  };
  limits: { storageBudgetGb: number; monthlyUploadBudgetGb: number; processingBacklog: number };
  alerts: { code: string; severity: 'warning' | 'critical'; message: string }[];
}

export interface AdminDocument {
  id: string;
  name: string;
  category: AdminDocumentCategory;
  uploadedAt: string;
  sizeLabel: string;
}

export interface Conversation {
  id: string;
  participantName: string;
  participantRole: string;
  lastMessage?: string;
  lastMessageTime?: string;
  status?: 'OPEN' | 'RESOLVED';
  category?: string | null;
  source?: string;
  userId?: string | null;
  unreadCount: number;
}

export interface ThreadMessage {
  id: string;
  senderId: 'admin' | 'contact';
  text: string;
  timestamp: string;
  read: boolean;
}

export interface RevenuePoint {
  month: string;
  gmv: number;
}

export interface RevenueBreakdown {
  category: string;
  amount: number;
  share: number;
}

export type NotificationPreferenceId =
  | 'fraud'
  | 'disputes'
  | 'verifications'
  | 'escrow'
  | 'messages';

export interface NotificationPreference {
  id: NotificationPreferenceId;
  email: boolean;
  push: boolean;
}

export type PlatformConfigRole = 'renter' | 'landlord' | 'owner' | 'buyer' | 'realtor' | 'agent';

export interface RoleRequirement {
  role: PlatformConfigRole;
  requiresVerification: boolean;
}

export interface PlatformConfig {
  minTrustScore: number;
  escrowHoldDays: number;
  autoFlagFraud: boolean;
  roleRequirements: RoleRequirement[];
}

export interface AdminProfile {
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
}

export interface TwoFactorStatus {
  enrolled: boolean;
  enabled: boolean;
  recoveryCodesLeft?: number;
  // False when the backend runs with STAFF_MFA_REQUIRED=false; treat a missing value as true.
  requiredForAdminTools?: boolean;
}

export interface TwoFactorEnrollment {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}

export interface StaffSession {
  id: string;
  device: string;
  ipAddress?: string;
  lastActiveAt: string;
  current: boolean;
}

export interface StaffPasskey {
  id: string;
  deviceName: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface AiCapabilityUsage {
  capability: string;
  calls: number;
  costUsd: number;
  succeeded: number;
  failed: number;
  blocked: number;
  fellBack: number;
  dropped: number;
  dropReasons: Record<string, number>;
  medianLatencyMs: number | null;
  p95LatencyMs: number | null;
}

export interface AiUsageDay {
  // YYYY-MM-DD, Lagos.
  day: string;
  calls: number;
  costUsd: number;
  fellBack: number;
  dropped: number;
}

export interface AiBudgetStatus {
  dailyBudgetUsd: number;
  spentTodayUsd: number;
  remainingUsd: number;
  exceeded: boolean;
}

export interface AiReviewCapabilitySummary {
  capability: string;
  total: number;
  pending: number;
  byOutcome: Record<
    'PENDING' | 'CONFIRMED' | 'CLEARED' | 'ACCEPTED' | 'EDITED' | 'REJECTED',
    number
  >;
  // confirmed / (confirmed + cleared), as a percentage; null until a reviewer decides one.
  precision: number | null;
  alertsOpened: number;
  alertsDecided: number;
  // (accepted + edited) / decided, as a percentage.
  acceptanceRate: number | null;
  medianMinutesToDecision: number | null;
  medianMinutesReportedToDecision: number | null;
}

export interface AiReviewsSummary {
  since: string | null;
  capabilities: AiReviewCapabilitySummary[];
}

export interface AiUsageSummary {
  globallyEnabled: boolean;
  disabledCapabilities: string[];
  budget: AiBudgetStatus;
  days: number;
  since: string;
  totalCalls: number;
  totalCostUsd: number;
  daily: AiUsageDay[];
  capabilities: AiCapabilityUsage[];
  keyConfigured: boolean;
}

export interface DisputeSummary {
  disputeId: string;
  facts: string[];
  summary: string;
  buyerSays: string | null;
  sellerSays: string | null;
  agreed: string[];
  toVerify: string[];
  missingEvidence: string[];
  source: 'ai' | 'heuristic';
  disclaimer: string;
}
