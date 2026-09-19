import { apiFetch } from './client';

export type AssistantStepStatus = 'completed' | 'in_progress' | 'pending';

export interface AssistantStep {
  key: string;
  title: string;
  status: AssistantStepStatus;
}

export interface ApplicationAssistant {
  steps: AssistantStep[];
  suggestion: string | null;
}

export const applicationAssistantApi = {
  get: () => apiFetch<ApplicationAssistant>('/renter/application-assistant'),
};
