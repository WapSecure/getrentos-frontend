/** Mirrors GET /admin/diaspora/queue (DIA-41). */
export type DiasporaQueueKind =
  | 'FOREIGN_IDENTITY_REVIEW'
  | 'RISK_OR_PROFILE_FLAG'
  | 'DILIGENCE_STEP_DUE'
  | 'MILESTONE_OVERDUE'
  | 'LEGAL_STEP_OVERDUE'
  | 'CO_APPROVAL_PENDING'
  | 'DISPUTE_RESPONSE_DUE'
  | 'MANAGED_INTAKE_REVIEW';

export interface DiasporaQueueItem {
  /** `${kind}:${subjectId}` */
  id: string;
  kind: DiasporaQueueKind;
  subjectId: string;
  investorId?: string;
  investorName?: string;
  title: string;
  /** The source record's own status code. */
  status: string;
  dueAt?: string;
  overdue: boolean;
  /** 0 on time, 1 the assignee was told it is overdue, 2 the ops lead was told. */
  escalationLevel: number;
  assignedTo?: { id: string; name: string };
  link: { app: 'backoffice'; path: string };
}
