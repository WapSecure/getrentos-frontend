import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';
import type { BillingCycle, ExpenseCategory } from '@/services/landlordService';

export interface BudgetWithActuals {
  id: string;
  propertyId: string;
  propertyTitle: string;
  /** null = a whole-property budget across every category. */
  category: ExpenseCategory | null;
  period: BillingCycle;
  amount: number;
  currency: string;
  actual: number;
  variance: number;
  utilisationPct: number;
  periodStart: string;
  periodEnd: string;
}

export interface SetBudgetInput {
  propertyId: string;
  category?: ExpenseCategory;
  period: BillingCycle;
  amount: number;
}

export const budgetService = {
  list(propertyId?: string): Promise<ApiResponse<BudgetWithActuals[]>> {
    const qs = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : '';
    return safeCall(() => authFetch(`/landlord/budgets${qs}`));
  },

  set(input: SetBudgetInput): Promise<ApiResponse<BudgetWithActuals>> {
    return safeCall(() =>
      authFetch('/landlord/budgets', { method: 'PUT', body: JSON.stringify(input) })
    );
  },

  remove(id: string): Promise<ApiResponse<void>> {
    return safeCall(() => authFetch(`/landlord/budgets/${id}`, { method: 'DELETE' }));
  },
};
