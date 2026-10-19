'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@getrentos/shared';

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'type' | 'onClick'
> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  href?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  isLoading?: boolean;
  /**
   * Shown beside the spinner while loading ("Saving…"). Without it the label
   * stays in place, hidden, so the button keeps its width and nothing shifts.
   */
  loadingText?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  shadow?: boolean;
  title?: string;
  /**
   * Focus the button as soon as it mounts. Used by dialogs whose primary
   * action should be the keyboard's default landing spot, so pressing Enter
   * accepts the dialog rather than the destructive alternative next to it.
   */
  autoFocus?: boolean;
  /**
   * Accessible name, overriding the visible text.
   *
   * Needed wherever the same button repeats down a list — "Manage", "View",
   * "Edit" — because a screen reader then hears a column of identical labels
   * with no way to tell which row each one belongs to.
   */
  'aria-label'?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      className = '',
      onClick,
      href,
      disabled = false,
      type = 'button',
      isLoading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      rounded = 'md',
      shadow = false,
      title,
      autoFocus = false,
      'aria-label': ariaLabel,
      loadingText,
      ...rest
    },
    ref
  ) => {
    const baseStyles =
      'relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-[-0.01em] transition-[background-color,border-color,box-shadow,color] duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50';

    const variants = {
      primary: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover',
      secondary:
        'bg-secondary text-secondary-foreground border border-border/70 shadow-xs hover:bg-foreground/[0.05] hover:border-border',
      outline:
        'bg-card text-foreground border border-border shadow-xs hover:border-foreground/25 hover:bg-secondary/60 hover:shadow-sm',
      ghost: 'bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground',
      danger: 'bg-destructive text-destructive-foreground shadow-xs hover:brightness-95',
    };

    const sizes = {
      xs: 'min-h-8 px-2.5 py-1 text-xs',
      sm: 'min-h-9 px-3 py-1.5 text-sm',
      md: 'min-h-10 px-4 py-2 text-sm',
      lg: 'min-h-11 px-5 py-2.5 text-base',
      xl: 'min-h-12 px-6 py-3 text-base',
    };

    const roundedStyles = {
      none: 'rounded-none',
      sm: 'rounded-md',
      md: 'rounded-lg',
      lg: 'rounded-xl',
      full: 'rounded-full',
    };

    const combinedClassName = cn(
      baseStyles,
      variants[variant],
      sizes[size],
      roundedStyles[rounded],
      fullWidth && 'w-full',
      shadow && 'shadow-lg hover:shadow-xl transition-shadow',
      disabled || isLoading ? 'cursor-not-allowed' : 'cursor-pointer',
      className
    );

    const spinner = (
      <svg
        className="h-4 w-4 shrink-0 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    const label = (
      <>
        {icon && iconPosition === 'left' && icon}
        {children}
        {icon && iconPosition === 'right' && icon}
      </>
    );

    const content = !isLoading ? (
      label
    ) : loadingText ? (
      <>
        {spinner}
        <span>{loadingText}</span>
      </>
    ) : (
      <>
        <span className="inline-flex items-center gap-2 opacity-0">{label}</span>
        <span className="absolute inset-0 flex items-center justify-center">{spinner}</span>
      </>
    );

    if (href) {
      return (
        <Link
          href={href}
          className={combinedClassName}
          title={title}
          aria-label={ariaLabel}
          id={rest.id}
          aria-current={rest['aria-current']}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        {...rest}
        ref={ref}
        type={type}
        aria-busy={isLoading || undefined}
        onClick={onClick}
        disabled={disabled || isLoading}
        className={combinedClassName}
        title={title}
        aria-label={ariaLabel}
        autoFocus={autoFocus}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';
