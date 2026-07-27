import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from './cn';

export interface PageHeroProps {
  eyebrow?: React.ReactNode;
  eyebrowIcon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'left' | 'center';
  size?: 'md' | 'lg';
  /** Caps the content column width — most heroes read best at '3xl'; a hero
   * carrying extra rows (badges, meta) can widen to '5xl' (CourseDetail). */
  maxWidth?: '3xl' | '5xl';
  /** Slot above the eyebrow — used for a "Back to Courses" link on CourseDetail. */
  children?: React.ReactNode;
  /** Slot rendered after the description — used for the duration/modules
   * meta row on CourseDetail. */
  after?: React.ReactNode;
  className?: string;
}

/** Shared dark hero — the `bg-gradient-to-br from-[#071F3F] via-navy to-corp-blue`
 * + radial-dot pattern was previously copy-pasted near-identically across
 * Courses, Verification, Contact and CourseDetail. One component now owns it,
 * including the animated gradient-text title treatment. */
export default function PageHero({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  description,
  align = 'left',
  size = 'md',
  maxWidth = '3xl',
  children,
  after,
  className = ''
}: PageHeroProps) {
  const centered = align === 'center';
  return (
    <section
      className={cn(
        'relative bg-gradient-to-br from-[#071F3F] via-navy to-corp-blue text-white overflow-hidden border-b-4 border-gold',
        size === 'lg' ? 'py-20 md:py-28' : 'py-16 md:py-20',
        className
      )}
    >
      <div
        className="absolute inset-0 opacity-10 bg-[radial-gradient(#14539A_1px,transparent_1px)] [background-size:16px_16px]"
        aria-hidden="true"
      />
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${centered ? 'text-center' : ''}`}>
        <div className={`space-y-5 ${maxWidth === '5xl' ? 'max-w-5xl' : 'max-w-3xl'} ${centered ? 'mx-auto' : ''}`}>
          {children}
          {eyebrow && (
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20 text-xs font-semibold text-gold tracking-wide ${
                centered ? 'mx-auto' : ''
              }`}
            >
              {EyebrowIcon && <EyebrowIcon className="w-3.5 h-3.5" aria-hidden="true" />}
              <span>{eyebrow}</span>
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl font-bold font-heading tracking-tight leading-tight text-gradient-animate-light">
            {title}
          </h1>
          {description && (
            <p className={`text-lg text-slate-300 leading-relaxed max-w-2xl ${centered ? 'mx-auto' : ''}`}>
              {description}
            </p>
          )}
          {after}
        </div>
      </div>
    </section>
  );
}
