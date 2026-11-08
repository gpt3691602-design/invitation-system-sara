import type { ReactNode } from "react";

export const inputClass =
  "block w-full min-h-11 rounded-lg border border-gray-300 bg-white px-3 py-2 text-base " +
  "focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 " +
  "aria-[invalid=true]:border-red-500";

export function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-900">
        {label}
        {required && <span className="ms-1 text-red-600" aria-hidden>*</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// aria props that tie an input to its hint or error text.
export function describedBy(id: string, error?: string, hint?: string) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;
}
