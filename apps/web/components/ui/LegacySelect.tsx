'use client';

import { Children, isValidElement, type ReactNode } from 'react';
import { Select, type SelectOption } from '@/components/ui/Select';

interface LegacySelectProps {
  value?: string | number;
  // `any` preserves compatibility with existing React.ChangeEvent handlers;
  // the adapter supplies the only field these handlers use: target.value.
  onChange?: (event: any) => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

/**
 * Migration adapter for option-based form controls. It intentionally accepts
 * native-option children and an onChange callback, while rendering the custom
 * popover Select so legacy forms can be modernized without altering business logic.
 */
export function LegacySelect({ value, onChange, children, className, disabled, 'aria-label': ariaLabel }: LegacySelectProps) {
  const options: SelectOption[] = [];

  const collectOptions = (nodes: ReactNode) => {
    Children.forEach(nodes, (child) => {
      if (!isValidElement(child)) return;
      const props = child.props as { value?: string | number; disabled?: boolean; children?: ReactNode };
      if (child.type === 'option') {
        options.push({
          value: String(props.value ?? ''),
          label: props.children,
          disabled: props.disabled,
        });
      } else {
        collectOptions(props.children);
      }
    });
  };

  collectOptions(children);

  return (
    <Select
      value={value === undefined ? undefined : String(value)}
      onValueChange={(nextValue) => onChange?.({ target: { value: nextValue } })}
      options={options}
      disabled={disabled}
      ariaLabel={ariaLabel}
      className={className}
    />
  );
}
