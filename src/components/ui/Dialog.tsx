import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from './cn';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name for the dialog — read by screen readers on open. */
  label: string;
  className?: string;
  children: React.ReactNode;
}

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Accessible modal shell — role="dialog", focus trap, Escape-to-close, and
 * focus return to the trigger element. The event-registration and donation
 * modals in App.tsx, plus the checkout modal in MembershipPlans.tsx, had
 * none of this: no focus trap, no Escape handler, no focus return. */
export default function Dialog({ open, onClose, label, className = '', children }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement as HTMLElement;
    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusable?.[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && focusable && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden relative z-10 max-h-[90vh] flex flex-col',
              className
            )}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export interface DialogHeaderProps {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  onClose: () => void;
  className?: string;
}

/** The navy header bar + close (X) button shared by every modal on the site. */
export function DialogHeader({ title, eyebrow, onClose, className = '' }: DialogHeaderProps) {
  return (
    <div className={cn('bg-navy p-5 text-white flex justify-between items-center', className)}>
      <div>
        {eyebrow && <span className="text-[10px] uppercase text-gold font-bold tracking-wider">{eyebrow}</span>}
        <h4 className="font-bold text-base font-heading line-clamp-1">{title}</h4>
      </div>
      <button
        onClick={onClose}
        aria-label="Close dialog"
        className="text-slate-300 hover:text-white hover:bg-white/10 p-1.5 rounded-md transition-colors"
      >
        <X className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  );
}
