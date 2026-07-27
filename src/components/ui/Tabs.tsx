import React, { useRef } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
}

export interface TabListProps {
  /** Stable string shared with the matching TabPanel(s) so ids line up
   * without needing React.useId() to match across sibling components. */
  idPrefix: string;
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  tabClassName?: (selected: boolean) => string;
}

const DEFAULT_TAB_CLASS = (selected: boolean) =>
  `inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg border transition-colors ${
    selected
      ? 'bg-navy text-white border-navy'
      : 'bg-white text-gray-700 border-gray-200 hover:border-accent-sky hover:text-accent-sky'
  }`;

/** Real ARIA tabs (role="tablist"/"tab", aria-selected, arrow-key navigation)
 * — replaces the color-only active-state toggle buttons in Benefits.tsx and
 * the filter pills in EventsProjects.tsx, neither of which exposed selection
 * state to assistive tech. */
export function TabList({ idPrefix, items, activeId, onChange, className = '', tabClassName = DEFAULT_TAB_CLASS }: TabListProps) {
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const nextIndex = e.key === 'ArrowRight' ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
    const nextItem = items[nextIndex];
    onChange(nextItem.id);
    buttonRefs.current[nextItem.id]?.focus();
  };

  return (
    <div role="tablist" className={className}>
      {items.map((item, index) => {
        const Icon = item.icon;
        const selected = item.id === activeId;
        return (
          <button
            key={item.id}
            ref={(el) => {
              buttonRefs.current[item.id] = el;
            }}
            role="tab"
            type="button"
            id={`${idPrefix}-tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={tabClassName(selected)}
          >
            {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export interface TabPanelProps {
  idPrefix: string;
  id: string;
  activeId: string;
  className?: string;
  children: React.ReactNode;
}

export function TabPanel({ idPrefix, id, activeId, className = '', children }: TabPanelProps) {
  if (id !== activeId) return null;
  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${id}`}
      aria-labelledby={`${idPrefix}-tab-${id}`}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  );
}
