import { apiFetch } from './client';

export type RoommateStatus = 'pending' | 'active';

export interface Roommate {
  id: string;
  name: string;
  email: string;
  phone: string;
  sharePercentage: number;
  status: RoommateStatus;
  joinedDate: string;
  responsibilities: string[];
  rating?: number;
}

export const EXPENSE_CATEGORIES = ['rent', 'utilities', 'groceries', 'other'] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  rent: 'Rent',
  utilities: 'Utilities',
  groceries: 'Groceries',
  other: 'Other',
};

export interface RoommateExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
  date: string;
  category: ExpenseCategory;
}

export const roommatesApi = {
  list: () => apiFetch<Roommate[]>('/renter/roommates'),

  invite: (email: string, message?: string) =>
    apiFetch<Roommate>('/renter/roommates/invite', { method: 'POST', body: { email, message } }),

  listMyInvites: () => apiFetch<Roommate[]>('/renter/roommates/invites'),

  acceptInvite: (id: string) =>
    apiFetch<Roommate>(`/renter/roommates/invites/${id}/accept`, { method: 'PATCH' }),

  declineInvite: (id: string) =>
    apiFetch<void>(`/renter/roommates/invites/${id}/decline`, { method: 'PATCH' }),

  remove: (id: string) => apiFetch<void>(`/renter/roommates/${id}`, { method: 'DELETE' }),

  updateShare: (id: string, sharePercentage: number) =>
    apiFetch<Roommate>(`/renter/roommates/${id}/share`, {
      method: 'PATCH',
      body: { sharePercentage },
    }),

  completeTask: (id: string, task: string) =>
    apiFetch<Roommate>(`/renter/roommates/${id}/tasks/${encodeURIComponent(task)}/complete`, {
      method: 'PATCH',
    }),

  listExpenses: () => apiFetch<RoommateExpense[]>('/renter/roommates/expenses'),

  addExpense: (input: {
    description: string;
    amount: number;
    paidBy: string;
    splitAmong: string[];
    category: ExpenseCategory;
  }) => apiFetch<RoommateExpense>('/renter/roommates/expenses', { method: 'POST', body: input }),
};
