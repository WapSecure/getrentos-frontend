'use client';

import { ReactNode, forwardRef } from 'react';
import { motion, MotionProps } from 'framer-motion';
import Link from 'next/link';

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
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variants = {
      primary:
        'bg-[#c4a747] text-[#0a1a1f] hover:bg-[#a88d3a] focus:ring-[#c4a747] disabled:opacity-50 disabled:cursor-not-allowed',
      secondary:
        'bg-gray-100 text-gray-900 border border-gray-300 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:border-white/20 dark:hover:bg-white/20 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed',
      outline:
        'bg-transparent text-gray-900 border-2 border-gray-300 hover:bg-gray-100 dark:text-white dark:border-white/30 dark:hover:bg-white/10 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed',
      ghost:
        'bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed',
      danger:
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed',
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

    const widthClass = fullWidth ? 'w-full' : '';
    const shadowClass = shadow ? 'shadow-lg hover:shadow-xl transition-shadow' : '';
    const disabledClass = disabled || isLoading ? 'cursor-not-allowed' : 'cursor-pointer';

    const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${roundedStyles[rounded]} ${widthClass} ${shadowClass} ${disabledClass} ${className}`;

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
