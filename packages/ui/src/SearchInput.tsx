'use client';

import { forwardRef, useRef, type KeyboardEvent } from 'react';
import { Search, X } from 'lucide-react';
import { Input, type InputProps } from './Input';

interface SearchInputProps extends Omit<
  InputProps,
  'value' | 'onChange' | 'type' | 'leadingIcon' | 'trailingIcon'
> {
  value: string;
  onValueChange: (value: string) => void;
  /** Read out as the input's name when there is no visible label. */
  label?: string;
}

/**
 * Search box: a search icon, a clear button once there is text, and Escape to
 * clear. Debounce in the caller if each keystroke triggers a request.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    { value, onValueChange, label = 'Search', placeholder = 'Search', onKeyDown, ...props },
    ref
  ) => {
    const innerRef = useRef<HTMLInputElement | null>(null);
    const clear = () => {
      onValueChange('');
      innerRef.current?.focus();
    };
    return (
      <Input
        {...props}
        ref={(el) => {
          innerRef.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) ref.current = el;
        }}
        type="search"
        role="searchbox"
        aria-label={props['aria-label'] ?? (props.id ? undefined : label)}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'Escape' && value) {
            event.preventDefault();
            clear();
          }
          onKeyDown?.(event);
        }}
        inputClassName="[&::-webkit-search-cancel-button]:appearance-none"
        leadingIcon={<Search className="h-4 w-4" aria-hidden="true" />}
        trailingIcon={
          value ? (
            <button
              type="button"
              onClick={clear}
              aria-label="Clear search"
              className="-mr-1.5 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : undefined
        }
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';
