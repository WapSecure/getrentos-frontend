'use client';

import { LegacyInput } from '@getrentos/ui';

import { LegacySelect } from '@getrentos/ui';

import { useState } from 'react';
import { DollarSign, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@getrentos/ui';

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
  date: string;
  category: 'rent' | 'utilities' | 'groceries' | 'other';
}

interface Roommate {
  id: string;
  name: string;
}

interface ExpenseTrackerProps {
  expenses: Expense[];
  roommates: Roommate[];
  onAddExpense: (expense: Expense) => void;
}

const categoryColors: Record<string, string> = {
  rent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  utilities: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  groceries: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

type CategoryType = 'rent' | 'utilities' | 'groceries' | 'other';

interface NewExpense {
  description: string;
  amount: string;
  paidBy: string;
  splitAmong: string[];
  category: CategoryType;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const ExpenseTracker = ({ expenses, roommates, onAddExpense }: ExpenseTrackerProps) => {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [newExpense, setNewExpense] = useState<NewExpense>({
    description: '',
    amount: '',
    paidBy: '',
    splitAmong: [],
    category: 'other',
  });

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.paidBy) return;
    const expense: Expense = {
      id: `exp_${Date.now()}`,
      description: newExpense.description,
      amount: Number(newExpense.amount),
      paidBy: newExpense.paidBy,
      splitAmong:
        newExpense.splitAmong.length > 0 ? newExpense.splitAmong : roommates.map((r) => r.name),
      date: new Date().toISOString(),
      category: newExpense.category,
    };
    onAddExpense(expense);
    setNewExpense({
      description: '',
      amount: '',
      paidBy: '',
      splitAmong: [],
      category: 'other',
    });
    setShowAddExpense(false);
  };

  const handleCategoryChange = (value: string): CategoryType => {
    return value as CategoryType;
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Expense Tracker</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Total: {formatCurrency(totalExpenses)}
          </span>
          <Button size="sm" variant="primary" onClick={() => setShowAddExpense(!showAddExpense)}>
            <Plus className="w-3 h-3" />
            Add
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 h-auto"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 pt-0">
          {showAddExpense && (
            <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-border space-y-3">
              <LegacyInput
                type="text"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                placeholder="Description"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2">
                <LegacyInput
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  placeholder="Amount"
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <LegacySelect
                  value={newExpense.category}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, category: handleCategoryChange(e.target.value) })
                  }
                  className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="rent">Rent</option>
                  <option value="utilities">Utilities</option>
                  <option value="groceries">Groceries</option>
                  <option value="other">Other</option>
                </LegacySelect>
              </div>
              <LegacySelect
                value={newExpense.paidBy}
                onChange={(e) => setNewExpense({ ...newExpense, paidBy: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Paid by</option>
                {roommates.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </LegacySelect>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleAddExpense}
                  disabled={!newExpense.description || !newExpense.amount || !newExpense.paidBy}
                >
                  Add Expense
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddExpense(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="divide-y divide-border max-h-64 overflow-y-auto">
            {expenses.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No expenses recorded</p>
            ) : (
              expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{expense.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                      <span>Paid by {expense.paidBy}</span>
                      <span>•</span>
                      <span>{formatDate(expense.date)}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full ${categoryColors[expense.category]}`}
                      >
                        {expense.category}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
