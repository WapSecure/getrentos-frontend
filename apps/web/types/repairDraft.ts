/** POST /renter/maintenance/photo-draft: a repair request drafted from photos, to check and send. */
export interface RepairDraft {
  title: string;
  category: 'plumbing' | 'electrical' | 'internet' | 'security' | 'appliances' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  isEmergency: boolean;
  /** What to do right now when there is danger. */
  safetyNote: string | null;
  /** Safe things to look at or switch while waiting. */
  quickChecks: string[];
  /** The photos did not clearly show a problem. */
  unclear: boolean;
  source: 'ai' | 'heuristic';
}
