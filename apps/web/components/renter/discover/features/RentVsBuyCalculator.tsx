'use client';

import { useState } from 'react';
import { Calculator, Info, TrendingUp, Home, Wallet } from 'lucide-react';
import {
  Button,
  CurrencyInput,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  NumberInput,
  Select,
} from '@getrentos/ui';

const loanTermOptions = [
  { value: '15', label: '15 years' },
  { value: '20', label: '20 years' },
  { value: '30', label: '30 years' },
];

interface RentVsBuyCalculatorProps {
  propertyPrice: number;
  monthlyRent: number;
}

export const RentVsBuyCalculator = ({ propertyPrice, monthlyRent }: RentVsBuyCalculatorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downPayment, setDownPayment] = useState(propertyPrice * 0.2);
  const [interestRate, setInterestRate] = useState(15);
  const [loanTerm, setLoanTerm] = useState(30);

  const calculateMonthlyMortgage = () => {
    const loanAmount = propertyPrice - downPayment;
    if (loanAmount <= 0) return 0;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    const mortgage =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    return isNaN(mortgage) ? 0 : mortgage;
  };

  const monthlyMortgage = calculateMonthlyMortgage();
  const monthlyMaintenance = propertyPrice * 0.001;
  const monthlyPropertyTax = propertyPrice * 0.0025;
  const totalMonthlyCost = monthlyMortgage + monthlyMaintenance + monthlyPropertyTax;
  const monthlyDifference = totalMonthlyCost - monthlyRent;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
      >
        <Calculator className="w-3 h-3" />
        Rent vs Buy
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="p-0 sm:max-w-lg">
          <div className="sticky top-0 bg-card p-4 pr-12 border-b border-border flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-accent">
              <Calculator className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="font-semibold text-foreground">
                Rent vs Buy Analysis
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Compare costs and make informed decisions
              </DialogDescription>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Property Info Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-info/20 bg-info-subtle p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Home className="w-4 h-4 text-info" />
                  <span className="text-xs text-info">Property Price</span>
                </div>
                <p className="text-lg font-bold text-foreground">{formatCurrency(propertyPrice)}</p>
              </div>
              <div className="rounded-lg border border-success/20 bg-success-subtle p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-success" />
                  <span className="text-xs text-success">Monthly Rent</span>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(monthlyRent)}/mo
                </p>
              </div>
            </div>

            {/* Input Section */}
            <div className="space-y-3">
              <Field
                label="Down Payment"
                hint={
                  downPayment < propertyPrice * 0.2
                    ? '⚠️ Consider a larger down payment to avoid extra costs'
                    : "✓ Good! You're avoiding additional insurance"
                }
              >
                <CurrencyInput prefix="₦" value={downPayment} onValueChange={setDownPayment} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Interest Rate (%)">
                  <NumberInput
                    integer={false}
                    value={interestRate}
                    onValueChange={(v) => setInterestRate(Number(v) || 0)}
                  />
                </Field>
                <Field label="Loan Term">
                  <Select
                    value={String(loanTerm)}
                    onValueChange={(v) => setLoanTerm(Number(v))}
                    options={loanTermOptions}
                  />
                </Field>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Monthly Cost Breakdown
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground">Mortgage Payment</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(monthlyMortgage)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="text-xs text-muted-foreground">Maintenance & Tax</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(monthlyMaintenance + monthlyPropertyTax)}
                  </p>
                </div>
              </div>

              <div
                className={
                  monthlyDifference <= 0
                    ? 'p-4 rounded-lg border border-success/20 bg-success-subtle'
                    : 'p-4 rounded-lg border border-warning/20 bg-warning-subtle'
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-x-3">
                  <span className="text-sm font-medium text-foreground">Monthly Difference</span>
                  <span
                    className={`text-xl font-bold ${monthlyDifference <= 0 ? 'text-success' : 'text-warning'}`}
                  >
                    {formatCurrency(Math.abs(monthlyDifference))}{' '}
                    {monthlyDifference <= 0 ? 'cheaper to buy' : 'cheaper to rent'}
                  </span>
                </div>

                {monthlyDifference <= 0 ? (
                  <div className="flex items-start gap-2 mt-3 pt-2 border-t border-success/20">
                    <Info className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    <p className="text-xs text-foreground/80">
                      Buying builds equity over time. You&apos;ll own the property after {loanTerm}{' '}
                      years.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 mt-3 pt-2 border-t border-warning/20">
                    <Info className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                    <p className="text-xs text-foreground/80">
                      Renting may be more affordable now. Consider saving{' '}
                      {formatCurrency(propertyPrice * 0.2 - downPayment)} more for down payment.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Button variant="primary" fullWidth onClick={handleClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
