'use client';

import { Check, ChevronDown, DoorOpen, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@getrentos/ui';
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

  // Nothing to choose and nothing to warn about: a lone gate on a lone estate is
  // already known, so the control would only take up room. Stays mounted while
  // the post is loading, because a control that vanishes and pops back in is
  // worse than one that is briefly blank: and during that window the "pick your
  // gate" warning would be absent exactly when the guard is about to check
  // someone in.
  if (!isLoading && estates.length <= 1 && gates.length <= 1) return null;

  const label =
    gate?.name ?? (isLoading ? 'Loading post…' : needsGateChoice ? 'Which gate?' : 'No gate');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isLoading}
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors max-w-[10rem] sm:max-w-[14rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          needsGateChoice && !isLoading
            ? 'border-warning/40 bg-warning-subtle text-warning'
            : 'border-border hover:bg-secondary'
        } ${isLoading ? 'opacity-60' : ''}`}
      >
        <MapPin className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
        <span className="text-sm font-medium truncate">{label}</span>
        <ChevronDown
          className="w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-72">
        {estates.length > 1 && (
          <>
            <DropdownMenuLabel className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Your Estates
            </DropdownMenuLabel>
            <div className="max-h-56 overflow-y-auto">
              {estates.map((option) => (
                <DropdownMenuItem
                  key={option.id}
                  // Changing estate keeps the menu open: the guard still has to
                  // pick a gate on the new estate.
                  onSelect={(event) => {
                    event.preventDefault();
                    selectEstate(option.id);
                  }}
                  className="justify-between"
                >
                  <span className="truncate">{option.name}</span>
                  {option.id === estate?.id && (
                    <Check className="w-4 h-4 text-primary shrink-0" aria-label="Selected" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuLabel className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          This Gate
        </DropdownMenuLabel>
        <div className="max-h-56 overflow-y-auto">
          {gates.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              This estate has no named gates yet. Arrivals are still recorded, just without a
              barrier.
            </p>
          ) : (
            gates.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onSelect={() => selectGate(option.id)}
                className="justify-between"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <DoorOpen className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                  <span className="truncate">{option.name}</span>
                </span>
                {option.id === gate?.id && (
                  <Check className="w-4 h-4 text-primary shrink-0" aria-label="Selected" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>

        {needsGateChoice && (
          <p className="mt-1.5 rounded-xl bg-warning-subtle px-3 py-3 text-xs text-warning">
            This estate has more than one gate. Pick the one you&apos;re standing at so arrivals
            are recorded against it.
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
