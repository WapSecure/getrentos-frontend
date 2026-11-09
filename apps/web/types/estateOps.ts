import type { ReplyLanguage } from '@/lib/replyLanguage';

export interface GroupedReport {
  id: string;
  kind: 'incident' | 'ticket';
  category: string;
  priority: string;
  description: string;
  unit: string | null;
  ageDays: number;
}

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

export interface ReportDigest {
  overview: string;
  groups: ReportGroup[];
  ungrouped: number;
  total: number;
  source: 'ai' | 'heuristic';
  disclaimer: string;
}

export interface AnnouncementDraft {
  title: string;
  body: string;
  priority: 'NORMAL' | 'URGENT';
  language: ReplyLanguage;
  source: 'ai' | 'heuristic';
}

export interface PollDraft {
  question: string;
  options: string[];
  source: 'ai' | 'heuristic';
}
