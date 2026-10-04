"use client";

import { useId, SelectHTMLAttributes, ReactNode } from "react";
import { fieldClassName, labelClassName } from "./field-styles";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export function Select({
  label,
  error,
  id,
  name,
  children,
  className,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div className="ff-field ff-field--select w-full">
      {label && (
        <label htmlFor={selectId} className={labelClassName}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        className={`${fieldClassName} ${className ?? ""}`}
        aria-invalid={error ? true : invalid}
        aria-describedby={
          [describedBy, error ? errorId : null].filter(Boolean).join(" ") ||
          undefined
        }
        {...props}
      >
        {children}
      </select>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="ff-field__error text-sm text-[var(--color-danger)] mt-1"
        >
          {error}
        </p>
      )}
    </div>
  );
}
