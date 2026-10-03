"use client";

import { SelectHTMLAttributes, ReactNode } from "react";
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
  ...props
}: SelectProps) {
  const selectId = id ?? name ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className={labelClassName}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        className={fieldClassName}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-[12px] text-red-600 mt-1">{error}</p>}
    </div>
  );
}
