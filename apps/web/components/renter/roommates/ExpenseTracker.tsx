'use client';

import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, ReceiptText } from 'lucide-react';
import { NairaSign } from '@getrentos/ui/NairaSign';
import {
  Alert,
  Badge,
  Button,
  Card,
  CurrencyInput,
  EmptyState,
  Field,
  IconButton,
  Input,
  Select,
  type BadgeVariant,
} from '@getrentos/ui';

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
  onAddExpense: (expense: Expense) => Promise<void>;
}

const categoryVariants: Record<string, BadgeVariant> = {
  rent: 'info',
  utilities: 'warning',
  groceries: 'success',
  other: 'neutral',
};

const categoryOptions = [
  { value: 'rent', label: 'Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'other', label: 'Other' },
];

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
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState<NewExpense>({
    description: '',
    amount: '',
    paidBy: '',
    splitAmong: [],
    category: 'other',
  });

  const handleAddExpense = async () => {
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
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await onAddExpense(expense);
      setNewExpense({
        description: '',
        amount: '',
        paidBy: '',
        splitAmong: [],
        category: 'other',
      });
      setShowAddExpense(false);
    } catch {
      setErrorMessage('The expense could not be saved. Your details are unchanged.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCategoryChange = (value: string): CategoryType => {
    return value as CategoryType;
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Card>
      <div className="p-4 border-b border-border flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <NairaSign className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Expense Tracker</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Total: {formatCurrency(totalExpenses)}
          </span>
          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="w-3 h-3" />}
            onClick={() => setShowAddExpense(!showAddExpense)}
          >
            Add
          </Button>
          <IconButton
            size="sm"
            label={isExpanded ? 'Collapse expenses' : 'Expand expenses'}
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded(!isExpanded)}
            icon={isExpanded ? <ChevronUp /> : <ChevronDown />}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="p-4">
          {showAddExpense && (
            <div className="mb-4 p-3 rounded-lg bg-secondary/60 border border-border space-y-3">
              <Field label="Description">
                <Input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="Description"
                />
              </Field>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Field label="Amount">
                  <CurrencyInput
                    prefix="₦"
                    value={newExpense.amount}
                    onValueChange={(v) =>
                      setNewExpense({ ...newExpense, amount: v === 0 ? '' : String(v) })
                    }
                    placeholder="Amount"
                  />
                </Field>
                <Field label="Category">
                  <Select
                    value={newExpense.category}
                    onValueChange={(value) =>
                      setNewExpense({ ...newExpense, category: handleCategoryChange(value) })
                    }
                    options={categoryOptions}
                  />
                </Field>
              </div>
              <Field label="Paid by">
                <Select
                  value={newExpense.paidBy}
                  onValueChange={(value) => setNewExpense({ ...newExpense, paidBy: value })}
                  placeholder="Paid by"
                  options={roommates.map((r) => ({ value: r.name, label: r.name }))}
                />
              </Field>
              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => void handleAddExpense()}
                  disabled={!newExpense.description || !newExpense.amount || !newExpense.paidBy}
                  isLoading={isSaving}
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
              <EmptyState icon={ReceiptText} title="No expenses recorded" size="compact" bare />
            ) : (
              expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{expense.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>Paid by {expense.paidBy}</span>
                      <span aria-hidden="true">•</span>
                      <span>{formatDate(expense.date)}</span>
                      <Badge variant={categoryVariants[expense.category]} className="capitalize">
                        {expense.category}
                      </Badge>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-primary">
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
