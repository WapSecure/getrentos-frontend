'use client';

import { Children, isValidElement, type ReactNode } from 'react';
import { Select, type SelectOption } from './Select';

interface LegacySelectProps {
  value?: string | number;
  // `any` keeps existing React.ChangeEvent handlers compiling; only target.value is supplied.
  onChange?: (event: any) => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export function LegacySelect({
  value,
  onChange,
  children,
  className,
  disabled,
  'aria-label': ariaLabel,
}: LegacySelectProps) {
  const options: SelectOption[] = [];

  const collectOptions = (nodes: ReactNode) => {
    Children.forEach(nodes, (child) => {
      if (!isValidElement(child)) return;
      const props = child.props as {
        value?: string | number;
        disabled?: boolean;
        children?: ReactNode;
      };
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
