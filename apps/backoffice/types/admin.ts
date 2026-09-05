export type PlatformRole =
  | 'renter'
  | 'landlord'
  | 'owner'
  | 'buyer'
  | 'realtor'
  | 'agent'
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
  | 'rentals.view'
  | 'rentals.moderate'
  | 'rentfinance.view'
  | 'rentfinance.approve'
  | 'maintenance.view'
  | 'maintenance.moderate';

export type AdminStaffStatus = 'active' | 'pending' | 'suspended' | 'banned';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AdminStaffMember {
  id: string;
  legalName: string;
  email: string | null;
  accountStatus: AdminStaffStatus;
  lastLoginAt: string | null;
  roles: { role: AdminStaffRole }[];
  /** Present when this account was created pending approval. */
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
export type DisputeCategory = 'escrow' | 'lease' | 'sale' | 'service_quality' | 'payment';
export type FraudAlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FraudAlertStatus = 'flagged' | 'investigating' | 'cleared' | 'confirmed';
export type PlatformEscrowStatus =
  | 'deposit_pending'
  | 'funds_held'
  | 'verification'
  | 'final_payment'
  | 'released'
  | 'frozen';
export type AuditSeverity = 'info' | 'warning' | 'critical';
export type AdminDocumentCategory = 'policy' | 'compliance_filing' | 'legal_agreement' | 'report';

export interface PlatformUser {
  id: string;
  fullName: string;
  email: string;
  roles: PlatformRole[];
  status: UserAccountStatus;
  trustScore: number;
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
  /** Real submitted documents (signed preview URLs) — present on the detail endpoint. */
  documents?: VerificationDocument[];
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
}

export interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId: 'admin' | 'party_a' | 'party_b';
  senderName: string;
  text: string;
  timestamp: string;
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

export interface PlatformEscrowTransaction {
  id: string;
  propertyTitle: string;
  buyerName: string;
  sellerName: string;
  amount: number;
  status: PlatformEscrowStatus;
  createdAt: string;
  flagged: boolean;
}

export interface AuditLogEntry {
  id: string;
  actorName: string;
  actorRole: PlatformRole;
  action: string;
  target: string;
  severity: AuditSeverity;
  timestamp: string;
  ipAddress: string;
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
