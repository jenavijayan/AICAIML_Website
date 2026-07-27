import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from './cn';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: LucideIcon;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  success: 'bg-success-soft text-success border-success/20',
  warning: 'bg-warning-soft text-warning border-warning/20',
  danger: 'bg-danger-soft text-danger border-danger/20',
  info: 'bg-pale-blue text-corp-blue border-corp-blue/15'
};

/** Status pill — replaces the one-off badge markup duplicated for course
 * levels ("Beginner"/"Advanced"), access state ("Free"/"Members Only") and
 * category tags across Courses, EventsProjects and CourseDetail. Always
 * icon+text or text-only, never color alone, so it never relies on color
 * perception to convey meaning. */
export default function Badge({ children, variant = 'neutral', icon: Icon, className = '' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border',
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {Icon && <Icon className="w-3 h-3" aria-hidden="true" />}
      {children}
    </span>
  );
}
