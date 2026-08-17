export type TaskType = 'inspection' | 'verification' | 'valuation' | 'document_pickup';
export type TaskStatus = 'assigned' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';
export type SyncStatus = 'synced' | 'pending' | 'failed';
export type RoomCondition = 'excellent' | 'good' | 'fair' | 'poor';

export interface AgentTask {
  id: string;
  type: TaskType;
  title: string;
  propertyAddress: string;
  assignedBy: string;
  assignedByRole: 'admin' | 'owner' | 'landlord';
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  notes?: string;
}

export interface InspectionRoomEntry {
  room: string;
  condition: RoomCondition;
  notes: string;
  photoCount: number;
}

export interface PropertyInspection {
  id: string;
  taskId: string;
  propertyAddress: string;
  clientName: string;
  scheduledDate: string;
  status: TaskStatus;
  rooms: InspectionRoomEntry[];
  overallCondition?: RoomCondition;
  syncStatus: SyncStatus;
}

export interface VerificationVisit {
  id: string;
  taskId: string;
  subjectName: string;
  subjectType: 'tenant' | 'buyer' | 'property';
  address: string;
  scheduledDate: string;
  status: TaskStatus;
  idVerified: boolean;
  addressConfirmed: boolean;
  notes: string;
  syncStatus: SyncStatus;
}

export interface OfflineSyncItem {
  id: string;
  recordType: 'inspection' | 'verification';
  recordLabel: string;
  capturedAt: string;
  syncStatus: SyncStatus;
  sizeLabel?: string;
}

export interface AgentReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment?: string;
  category?: string;
}

export interface AgentDocument {
  id: string;
  name: string;
  category: 'inspection_report' | 'verification_form' | 'id_scan' | 'agreement';
  relatedTo?: string;
  uploadedAt: string;
  sizeLabel: string;
}
