import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from './cn';

export type IconButtonSize = 'sm' | 'md' | 'lg';
export type IconButtonVariant = 'ghost' | 'solid';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  /** Required — becomes the button's accessible name. There is no icon-only
   * button anywhere on the site that should ship without one. */
  label: string;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
}

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-9 h-9',
  lg: 'w-11 h-11'
};

const ICON_SIZE: Record<IconButtonSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-4.5 h-4.5',
  lg: 'w-5 h-5'
};

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  ghost: 'text-gray-500 hover:bg-gray-100 hover:text-navy',
  solid: 'bg-white/10 text-white hover:bg-accent-sky'
};

/** Icon-only button (modal close, mobile menu toggle, social links). Unlike
 * Button, `label` is required so every instance ships an aria-label. */
export default function IconButton({
  icon: Icon,
  label,
  size = 'md',
  variant = 'ghost',
  className = '',
  ...rest
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn('inline-flex items-center justify-center rounded-md transition-colors', SIZE_CLASSES[size], VARIANT_CLASSES[variant], className)}
      {...rest}
    >
      <Icon className={ICON_SIZE[size]} aria-hidden="true" />
    </button>
  );
}
