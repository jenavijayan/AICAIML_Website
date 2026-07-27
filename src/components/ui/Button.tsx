import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-navy text-white hover:bg-corp-blue shadow-sm hover:shadow-md',
  accent: 'bg-gold text-white hover:bg-gold-dark shadow-sm hover:shadow-md',
  outline: 'bg-transparent text-navy border border-gray-300 hover:border-accent-sky hover:text-accent-sky',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 hover:text-navy',
  danger: 'bg-transparent text-danger border border-danger/30 hover:bg-danger-soft'
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'text-xs px-3.5 py-2 gap-1.5 rounded-md',
  md: 'text-sm px-5 py-2.5 gap-2 rounded-md',
  lg: 'text-base px-6 py-3 gap-2.5 rounded-lg'
};

const ICON_SIZE: Record<ButtonSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5'
};

/** Shared button — replaces the hand-rolled Tailwind strings duplicated
 * across Home, Header, Courses, EventsProjects, Benefits, MembershipPlans,
 * MembershipForms and Login. One focus ring, one disabled/loading state. */
export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all duration-150 active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Loader2 className={`${ICON_SIZE[size]} animate-spin`} aria-hidden="true" />
      ) : (
        Icon && iconPosition === 'left' && <Icon className={ICON_SIZE[size]} aria-hidden="true" />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon className={ICON_SIZE[size]} aria-hidden="true" />}
    </button>
  );
}
