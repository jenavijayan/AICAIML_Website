import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from './cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds hover lift + shadow + border tint — for cards that are themselves
   * clickable or contain a primary action (course cards, project cards). */
  interactive?: boolean;
  /** 'none' — for composite cards with their own padded header and a
   * full-bleed footer action strip (course cards with a bottom CTA button
   * that needs to span edge-to-edge, not sit inside the card's padding). */
  padding?: 'md' | 'none';
  children: React.ReactNode;
}

/** Generic surface — the single card shell used everywhere a
 * `polished-card`-style container was previously hand-copied. */
export function Card({ interactive = false, padding = 'md', className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden',
        padding === 'md' && 'p-6',
        interactive && 'transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-accent-sky/30',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface IconBadgeProps {
  icon: LucideIcon;
  className?: string;
}

/** The small tinted icon swatch that sits atop feature/value-prop cards. */
export function IconBadge({ icon: Icon, className = '' }: IconBadgeProps) {
  return (
    <div className={`bg-pale-blue text-corp-blue p-3 rounded-lg w-fit mb-4 ${className}`}>
      <Icon className="w-6 h-6" aria-hidden="true" />
    </div>
  );
}

export interface StatCardProps {
  value: React.ReactNode;
  label: React.ReactNode;
  className?: string;
}

/** Navy stat tile — impact numbers on Home ("500+ Clubs Launched" etc). */
export function StatCard({ value, label, className = '' }: StatCardProps) {
  return (
    <div className={`bg-navy text-white rounded-2xl p-6 ${className}`}>
      <div className="font-heading text-3xl font-bold">{value}</div>
      <div className="text-xs uppercase tracking-wide opacity-70 mt-1">{label}</div>
    </div>
  );
}
