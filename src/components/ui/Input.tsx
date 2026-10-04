"use client";

import { useId, InputHTMLAttributes } from "react";
import { fieldClassName, labelClassName } from "./field-styles";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  id,
  name,
  placeholder,
  className,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className={labelClassName}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        placeholder={placeholder}
        className={`${fieldClassName} ${className ?? ""}`}
        aria-invalid={error ? true : invalid}
        aria-describedby={
          [describedBy, error ? errorId : null].filter(Boolean).join(" ") ||
          undefined
        }
        {...props}
      />
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
