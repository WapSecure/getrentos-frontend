export type PlatformRole =
  | 'renter'
  | 'landlord'
  | 'owner'
  | 'buyer'
  | 'realtor'
  | 'agent'
  | 'admin';
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
