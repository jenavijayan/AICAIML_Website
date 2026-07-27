import React, { useId } from 'react';
import { cn } from './cn';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

/** Label + input pair with a real `htmlFor`/`id` association and
 * `aria-describedby`-linked hint/error text — MembershipForms.tsx currently
 * has ~40 hand-copied inputs where the label is only visually above the
 * field, not programmatically associated with it. */
export default function TextField({
  label,
  hint,
  error,
  required,
  className = '',
  id: idProp,
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const id = idProp || generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-700 mb-1">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <input
        id={id}
        required={required}
        aria-describedby={describedBy}
        aria-invalid={!!error || undefined}
        className={cn(
          'w-full text-xs rounded-md border p-2.5 focus:outline-none transition-colors bg-white',
          error ? 'border-danger focus:border-danger' : 'border-gray-300 focus:border-accent-sky',
          className
        )}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1 text-[11px] text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-[11px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
