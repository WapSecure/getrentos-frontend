'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, DoorOpen, MapPin } from 'lucide-react';
import { useGatemanPost } from '@/lib/gateman/GatemanPostProvider';

/**
 * Which estate and which barrier this guard is working.
 *
 * The browser counterpart of the mobile gate console's post switcher. It lives
 * in the navbar rather than on a single page because every gate screen writes
 * against the same post: an arrival recorded from the vehicles page has to be
 * attributed to the same barrier as one recorded from check-in.
 */
export const PostSwitcher = () => {
  const { estate, estates, gate, gates, needsGateChoice, selectEstate, selectGate, isLoading } =
    useGatemanPost();
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

  // Nothing to choose and nothing to warn about: a lone gate on a lone estate is
  // already known, so the control would only take up room. Stays mounted while
  // the post is loading, because a control that vanishes and pops back in is
  // worse than one that is briefly blank — and during that window the "pick your
  // gate" warning would be absent exactly when the guard is about to check
  // someone in.
  if (!isLoading && estates.length <= 1 && gates.length <= 1) return null;

  const label =
    gate?.name ?? (isLoading ? 'Loading post…' : needsGateChoice ? 'Which gate?' : 'No gate');

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors max-w-[10rem] sm:max-w-[14rem] ${
          needsGateChoice && !isLoading
            ? 'border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
            : 'border-border hover:bg-secondary'
        } ${isLoading ? 'opacity-60' : ''}`}
      >
        <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium truncate">{label}</span>
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
            className="absolute right-0 mt-2 w-72 bg-card rounded-xl shadow-lg border border-border z-50 overflow-hidden"
          >
            {estates.length > 1 && (
              <>
                <div className="p-3 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Your Estates
                  </p>
                </div>
                <div className="py-2 max-h-56 overflow-y-auto">
                  {estates.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => selectEstate(option.id)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors text-left"
                    >
                      <span className="truncate">{option.name}</span>
                      {option.id === estate?.id && (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="p-3 border-y border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                This Gate
              </p>
            </div>
            <div className="py-2 max-h-56 overflow-y-auto">
              {gates.length === 0 ? (
                <p className="px-4 py-2 text-sm text-muted-foreground">
                  This estate has no named gates yet. Arrivals are still recorded, just without a
                  barrier.
                </p>
              ) : (
                gates.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      selectGate(option.id);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors text-left"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <DoorOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{option.name}</span>
                    </span>
                    {option.id === gate?.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                ))
              )}
            </div>

            {needsGateChoice && (
              <div className="border-t border-border px-4 py-3 bg-amber-50 dark:bg-amber-900/20">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  This estate has more than one gate. Pick the one you&apos;re standing at so
                  arrivals are recorded against it.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
