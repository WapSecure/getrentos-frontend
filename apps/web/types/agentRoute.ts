export interface AgentRoute {
  date: string;
  stops: {
    taskId: string;
    title: string;
    type: 'INSPECTION' | 'VERIFICATION' | 'VALUATION' | 'DOCUMENT_PICKUP';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    overdue: boolean;
    address: string;
    arrive: string;
    driveMinutes: number;
    distanceKm: number;
    fixedAt: string | null;
    late: boolean;
  }[];
  /** Tasks whose property has no map location yet. */
  unplaced: { taskId: string; title: string; address: string }[];
  totalKm: number;
  totalDriveMinutes: number;
  finish: string | null;
  directionsUrl: string | null;
  note: string;
}
