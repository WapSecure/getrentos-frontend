export interface RepairDraft {
  title: string;
  category: 'plumbing' | 'electrical' | 'internet' | 'security' | 'appliances' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  isEmergency: boolean;
  safetyNote: string | null;
  quickChecks: string[];
  unclear: boolean;
  source: 'ai' | 'heuristic';
}
