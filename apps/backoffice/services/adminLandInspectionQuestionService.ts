import { authFetch, safeCall } from '@sureground/shared';

export interface LandInspectionQuestion {
  id: string;
  question: string;
  askedBy: string;
  askedAt: string;
  inspectionId: string;
  reference: string;
  land: string;
}

export const landInspectionQuestionKeys = {
  open: ['admin', 'land', 'inspection-questions'] as const,
};

export const adminLandInspectionQuestionService = {
  open: () =>
    safeCall(() => authFetch<LandInspectionQuestion[]>('/admin/land/inspection-questions')),
  answer: (questionId: string, answer: string) =>
    safeCall(() =>
      authFetch<LandInspectionQuestion[]>(
        `/admin/land/inspection-questions/${encodeURIComponent(questionId)}/answer`,
        { method: 'POST', body: JSON.stringify({ reason: answer.trim() }) }
      )
    ),
};
