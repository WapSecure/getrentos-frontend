'use client';

import { NumberInput } from '@getrentos/ui';

import { LegacySelect } from '@getrentos/ui';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, X, Info, TrendingUp, Home, Wallet } from 'lucide-react';
import { Button, CurrencyInput } from '@getrentos/ui';

interface RentVsBuyCalculatorProps {
  propertyPrice: number;
  monthlyRent: number;
}

export const RentVsBuyCalculator = ({ propertyPrice, monthlyRent }: RentVsBuyCalculatorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downPayment, setDownPayment] = useState(propertyPrice * 0.2);
  const [interestRate, setInterestRate] = useState(15);
  const [loanTerm, setLoanTerm] = useState(30);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
        onClick={handleOpen}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors"
      >
        <Calculator className="w-3 h-3" />
        Rent vs Buy
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-card rounded-xl max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sticky Header */}
              <div className="sticky top-0 bg-card p-4 border-b border-border flex justify-between items-center z-10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-accent">
                    <Calculator className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Rent vs Buy Analysis</h3>
                    <p className="text-xs text-gray-500">
                      Compare costs and make informed decisions
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Property Info Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-linear-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Home className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-blue-600">Property Price</span>
                    </div>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                      {formatCurrency(propertyPrice)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-linear-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-600">Monthly Rent</span>
                    </div>
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">
                      {formatCurrency(monthlyRent)}/mo
                    </p>
                  </div>
                </div>

                {/* Input Section */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Down Payment
                    </label>
                    <CurrencyInput
                      prefix="₦"
                      value={downPayment}
                      onValueChange={setDownPayment}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {downPayment < propertyPrice * 0.2
                        ? '⚠️ Consider a larger down payment to avoid extra costs'
                        : "✓ Good! You're avoiding additional insurance"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Interest Rate (%)
                      </label>
                      <NumberInput
                        integer={false}
                        value={interestRate}
                        onValueChange={(v) => setInterestRate(Number(v) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Loan Term
                      </label>
                      <LegacySelect
                        value={loanTerm}
                        onChange={(e) => setLoanTerm(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value={15}>15 years</option>
                        <option value={20}>20 years</option>
                        <option value={30}>30 years</option>
                      </LegacySelect>
                    </div>
                  </div>
                </div>

                {/* Results Section */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Monthly Cost Breakdown
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                      <p className="text-xs text-gray-500">Mortgage Payment</p>
                      <p className="text-lg font-bold text-foreground">
                        {formatCurrency(monthlyMortgage)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                      <p className="text-xs text-gray-500">Maintenance & Tax</p>
                      <p className="text-lg font-bold text-foreground">
                        {formatCurrency(monthlyMaintenance + monthlyPropertyTax)}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${monthlyDifference <= 0 ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Monthly Difference</span>
                      <span
                        className={`text-xl font-bold ${monthlyDifference <= 0 ? 'text-green-600' : 'text-amber-600'}`}
                      >
                        {formatCurrency(Math.abs(monthlyDifference))}{' '}
                        {monthlyDifference <= 0 ? 'cheaper to buy' : 'cheaper to rent'}
                      </span>
                    </div>

                    {monthlyDifference <= 0 ? (
                      <div className="flex items-start gap-2 mt-3 pt-2 border-t border-green-200 dark:border-green-800">
                        <Info className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-green-700 dark:text-green-300">
                          Buying builds equity over time. You&apos;ll own the property after{' '}
                          {loanTerm} years.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 mt-3 pt-2 border-t border-amber-200 dark:border-amber-800">
                        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-700 dark:text-amber-300">
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
