'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import { AlertCircle, Loader2, MapPin, PencilLine, ShieldCheck, X } from '@sureground/icons';
import {
  cn,
  highlightParts,
  newPlacesSession,
  type AddressValue,
  type PlaceKind,
  type PlaceSuggestion,
  type VerifiedAddress,
} from '@sureground/shared';
import { controlShell, innerInputClass, type ControlSize } from './controlStyles';
import { useFieldControl } from './fieldContext';

export interface AddressSearchProps {
  value: AddressValue | null;
  onChange: (value: AddressValue | null) => void;
  search: (query: string, opts: { session: string; kind: PlaceKind }) => Promise<PlaceSuggestion[]>;
  resolve: (placeId: string, session: string) => Promise<VerifiedAddress>;
  kind?: PlaceKind;
  /** Leave off where the address must be real: a manual one is saved unchecked. */
  allowManual?: boolean;
  placeholder?: string;
  controlSize?: ControlSize;
  disabled?: boolean;
  onResolved?: (address: VerifiedAddress) => void;
  id?: string;
  invalid?: boolean;
  required?: boolean;
  'aria-describedby'?: string;
  'aria-label'?: string;
  className?: string;
}

type Status = 'idle' | 'loading' | 'ready' | 'error' | 'resolving';

const MIN_CHARS: Record<PlaceKind, number> = { address: 3, area: 2, any: 2 };
const DEBOUNCE_MS = 250;

export function AddressSearch({
  value,
  onChange,
  search,
  resolve,
  kind = 'address',
  allowManual = false,
  placeholder,
  controlSize = 'md',
  disabled,
  onResolved,
  className,
  ...fieldProps
}: AddressSearchProps) {
  const field = useFieldControl(fieldProps);
  const listId = useId();
  const optionId = (i: number) => `${listId}-opt-${i}`;
  const inputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState(value?.text ?? '');
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [active, setActive] = useState(-1);
  const [problem, setProblem] = useState<string | null>(null);
  const session = useRef<string | null>(null);
  const request = useRef(0);

  const lastValueText = useRef(value?.text ?? '');
  useEffect(() => {
    const next = value?.text ?? '';
    if (next !== lastValueText.current) {
      lastValueText.current = next;
      setText(next);
    }
  }, [value?.text]);

  const checked = !!value?.placeId && value.text === text;
  const min = MIN_CHARS[kind];
  const typedSinceCheck = !!value?.placeId && text !== value.text;

  useEffect(() => {
    const q = text.trim();
    if (!open || checked || q.length < min) {
      setSuggestions([]);
      setStatus('idle');
      return;
    }
    const mine = ++request.current;
    setStatus('loading');
    const timer = setTimeout(() => {
      session.current ??= newPlacesSession();
      search(q, { session: session.current, kind })
        .then((found) => {
          if (mine !== request.current) return;
          setSuggestions(found);
          setActive(found.length ? 0 : -1);
          setStatus('ready');
        })
        .catch(() => {
          if (mine !== request.current) return;
          setSuggestions([]);
          setStatus('error');
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, open, checked, min, kind, search]);

  const pick = async (s: PlaceSuggestion) => {
    const sid = session.current ?? newPlacesSession();
    request.current++;
    setOpen(false);
    setStatus('resolving');
    setProblem(null);
    setText(s.secondary ? `${s.primary}, ${s.secondary}` : s.primary);
    try {
      const v = await resolve(s.placeId, sid);
      session.current = null;
      lastValueText.current = v.formatted;
      setText(v.formatted);
      setStatus('idle');
      onChange({ placeId: v.placeId, text: v.formatted, verified: v });
      onResolved?.(v);
    } catch {
      setStatus('idle');
      setProblem('We could not check that address. Try again or pick another suggestion.');
      onChange(null);
    }
  };

  const keepTyped = () => {
    const t = text.trim();
    if (!t) return;
    request.current++;
    lastValueText.current = t;
    setOpen(false);
    setStatus('idle');
    onChange({ text: t });
  };

  const onType = (next: string) => {
    setText(next);
    setProblem(null);
    if (!open) setOpen(true);
    if (value?.placeId) {
      lastValueText.current = allowManual ? next : '';
      onChange(allowManual && next.trim() ? { text: next } : null);
    } else if (allowManual) {
      lastValueText.current = next;
      onChange(next.trim() ? { text: next } : null);
    }
  };

  const clear = () => {
    request.current++;
    session.current = null;
    lastValueText.current = '';
    setText('');
    setSuggestions([]);
    setProblem(null);
    onChange(null);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      setActive((i) => (suggestions.length ? (i + 1) % suggestions.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) =>
        suggestions.length ? (i - 1 + suggestions.length) % suggestions.length : -1
      );
    } else if (e.key === 'Enter' && open && status === 'ready') {
      if (active >= 0 && suggestions[active]) {
        e.preventDefault();
        void pick(suggestions[active]);
      }
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      setOpen(false);
    }
  };

  const showList =
    open && !checked && text.trim().length >= min && status !== 'idle' && status !== 'resolving';
  const busy = status === 'loading' || status === 'resolving';

  return (
    <div className={cn('space-y-1.5', className)}>
      <RadixPopover.Root open={showList} onOpenChange={(o) => !o && setOpen(false)}>
        <RadixPopover.Anchor asChild>
          <div
            className={controlShell({
              size: controlSize,
              invalid: field.invalid,
              disabled,
              wraps: true,
              className: 'flex items-center gap-2',
            })}
          >
            <MapPin
              className={cn('h-4 w-4 shrink-0', checked ? 'text-primary' : 'text-muted-foreground')}
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              id={field.id}
              type="text"
              role="combobox"
              autoComplete="off"
              spellCheck={false}
              aria-autocomplete="list"
              aria-expanded={showList}
              aria-controls={showList ? listId : undefined}
              aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
              aria-label={fieldProps['aria-label']}
              {...field.ariaProps}
              disabled={disabled}
              value={text}
              placeholder={
                placeholder ??
                (kind === 'area'
                  ? 'Start typing an area, e.g. Gbagada'
                  : 'Start typing the address, e.g. 12 Admiralty Way')
              }
              onChange={(e) => onType(e.target.value)}
              onFocus={() => text.trim().length >= min && !checked && setOpen(true)}
              onKeyDown={onKeyDown}
              className={innerInputClass}
            />
            {busy && (
              <Loader2
                className="h-4 w-4 shrink-0 animate-spin text-muted-foreground"
                aria-hidden="true"
              />
            )}
            {checked && !busy && (
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                title="This address was found on Google Maps"
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Checked
              </span>
            )}
            {text && !disabled && !busy && (
              <button
                type="button"
                onClick={clear}
                aria-label="Clear address"
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </RadixPopover.Anchor>
        <RadixPopover.Portal>
          <RadixPopover.Content
            sideOffset={6}
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              if (inputRef.current?.parentElement?.contains(e.target as Node)) e.preventDefault();
            }}
            className="z-[70] w-[var(--radix-popover-trigger-width)] min-w-[18rem] overflow-hidden rounded-lg border border-border bg-card p-1.5 shadow-lg"
          >
            <ul
              id={listId}
              role="listbox"
              aria-label="Address suggestions"
              className="max-h-72 overflow-y-auto overscroll-contain"
            >
              {status === 'loading' && suggestions.length === 0 && (
                <li
                  className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground"
                  role="status"
                >
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Searching addresses…
                </li>
              )}
              {suggestions.map((s, i) => (
                <li
                  key={s.placeId}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => void pick(s)}
                  className={cn(
                    'flex cursor-pointer select-none items-start gap-2.5 rounded-md px-3 py-2 text-sm',
                    i === active ? 'bg-secondary' : 'hover:bg-secondary/70'
                  )}
                >
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-foreground">
                      {highlightParts(s.primary, s.matches).map((part, j) =>
                        part.match ? (
                          <strong key={j} className="font-semibold">
                            {part.text}
                          </strong>
                        ) : (
                          <span key={j}>{part.text}</span>
                        )
                      )}
                    </span>
                    {s.secondary && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {s.secondary}
                      </span>
                    )}
                  </span>
                </li>
              ))}
              {status === 'ready' && suggestions.length === 0 && (
                <li className="px-3 py-3 text-sm text-muted-foreground" role="status">
                  No matching {kind === 'area' ? 'area' : 'address'}. Check the spelling, or add the
                  area
                  {kind === 'area' ? ' or town' : ', e.g. “Admiralty Way Lekki”'}.
                </li>
              )}
              {status === 'error' && (
                <li
                  className="flex items-start gap-2 px-3 py-3 text-sm text-muted-foreground"
                  role="status"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  Address search is not available right now.
                </li>
              )}
            </ul>
            {allowManual && (status === 'ready' || status === 'error') && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={keepTyped}
                className="mt-1 flex w-full items-center gap-2 rounded-md border-t border-border px-3 py-2 text-left text-sm text-foreground hover:bg-secondary"
              >
                <PencilLine className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 truncate">
                  Use “{text.trim()}” as typed{' '}
                  <span className="text-muted-foreground">(not checked)</span>
                </span>
              </button>
            )}
            <p className="px-3 pb-1 pt-2 text-right text-2xs text-muted-foreground">
              Powered by Google
            </p>
          </RadixPopover.Content>
        </RadixPopover.Portal>
      </RadixPopover.Root>

      {problem && (
        <p className="flex items-center gap-1.5 text-xs text-destructive" role="alert">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {problem}
        </p>
      )}
      {!problem && typedSinceCheck && !allowManual && (
        <p className="text-xs text-muted-foreground">
          Pick the address from the suggestions to check it.
        </p>
      )}
      {!problem && value && !value.placeId && allowManual && (
        <p className="text-xs text-muted-foreground">
          Typed address, not checked on Google Maps. Pick a suggestion to check it.
        </p>
      )}
      {checked && value?.verified && (
        <p className="text-xs text-muted-foreground">
          {[
            value.verified.lga && `${value.verified.lga} LGA`,
            value.verified.state,
            value.verified.postcode,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}
    </div>
  );
}
