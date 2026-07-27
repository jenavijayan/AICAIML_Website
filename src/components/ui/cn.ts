import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merges class strings and resolves conflicting Tailwind utilities (e.g. a
 * caller passing `bg-slate-50` to override a component's default `bg-white`)
 * by keeping the last one for a given property group — plain string
 * concatenation silently loses this fight because Tailwind's generated
 * stylesheet order doesn't follow class-attribute order. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
