import type { ReplyLanguage } from '@/lib/replyLanguage';

/** One open report in a shared-problem group. */
export interface GroupedReport {
  id: string;
  kind: 'incident' | 'ticket';
  category: string;
  priority: string;
  description: string;
  unit: string | null;
  ageDays: number;
}

/** Open reports that describe the same problem, with code-worked counts. */
export interface ReportGroup {
  title: string;
  summary: string;
  action: string;
  reports: number;
  households: number;
  oldestDays: number;
  priority: string;
  line: string;
  items: GroupedReport[];
}

/** GET /estate/:id/reports/digest */
export interface ReportDigest {
  overview: string;
  groups: ReportGroup[];
  ungrouped: number;
  total: number;
  source: 'ai' | 'heuristic';
  disclaimer: string;
}

/** POST /estate/:id/announcements/draft */
export interface AnnouncementDraft {
  title: string;
  body: string;
  priority: 'NORMAL' | 'URGENT';
  language: ReplyLanguage;
  source: 'ai' | 'heuristic';
}

/** POST /estate/:id/polls/draft */
export interface PollDraft {
  question: string;
  options: string[];
  source: 'ai' | 'heuristic';
}
