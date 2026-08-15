'use client';

import { ReactNode, forwardRef } from 'react';
import { motion, MotionProps } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/cn';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  href?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  isLoading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  shadow?: boolean;
  title?: string;
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
      rounded = 'full',
      shadow = false,
      title,
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-medium tracking-[-0.01em] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background';

    const variants = {
      primary:
        'bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed',
      secondary:
        'bg-secondary text-secondary-foreground border border-border/70 hover:bg-secondary-foreground/5 focus:ring-border disabled:opacity-50 disabled:cursor-not-allowed',
      outline:
        'bg-card text-foreground border border-border hover:border-foreground/25 hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed',
      ghost:
        'bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground focus:ring-border disabled:opacity-50 disabled:cursor-not-allowed',
      danger:
        'bg-destructive text-destructive-foreground hover:opacity-90 focus:ring-destructive disabled:opacity-50 disabled:cursor-not-allowed',
    };

    const sizes = {
      xs: 'px-2.5 py-1.5 text-xs',
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-3.5 text-lg',
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

    const content = (
      <>
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {!isLoading && icon && iconPosition === 'left' && icon}
        {!isLoading && children}
        {!isLoading && icon && iconPosition === 'right' && icon}
      </>
    );

    if (href) {
      return (
        <Link href={href} className={combinedClassName} title={title}>
          {content}
        </Link>
      );
    }

    const motionProps: MotionProps = {
      whileTap: { scale: 0.97 },
      whileHover: { scale: 1.02 },
      transition: { duration: 0.1 },
    };

    return (
      <motion.button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled || isLoading}
        className={combinedClassName}
        title={title}
        {...motionProps}
      >
        {content}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
