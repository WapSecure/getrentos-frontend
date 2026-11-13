import type { MaintenanceCategoryKey } from '@sureground/shared';

export interface RepairDraft {
  title: string;
  category: MaintenanceCategoryKey;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  isEmergency: boolean;
  safetyNote: string | null;
  quickChecks: string[];
  unclear: boolean;
  source: 'ai' | 'heuristic';
}
