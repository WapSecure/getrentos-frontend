'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Plus, Building2 } from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';

export const EstateSwitcher = () => {
  const { estate, estates, selectEstate } = useSelectedEstate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // A single-estate manager (the overwhelming majority) sees no switcher at all.
  if (estates.length <= 1) return null;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors max-w-[10rem] sm:max-w-[14rem]"
      >
        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium text-foreground truncate">
          {estate?.name ?? 'Select estate'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-0 mt-2 w-64 bg-card rounded-xl shadow-lg border border-border z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Your Estates
              </p>
            </div>
            <div className="py-2 max-h-64 overflow-y-auto">
              {estates.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    selectEstate(option.id);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors text-left"
                >
                  <span className="truncate">{option.name}</span>
                  {option.id === estate?.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              ))}
            </div>
            <div className="border-t border-border py-2">
              <Link
                href={ROUTES.ESTATE_SETUP}
                className="flex items-center gap-3 px-4 py-2 text-sm text-primary hover:bg-secondary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Plus className="w-4 h-4" />
                Add Another Estate
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
