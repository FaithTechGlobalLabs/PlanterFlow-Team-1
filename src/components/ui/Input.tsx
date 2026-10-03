"use client";

import { InputHTMLAttributes } from "react";
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
  ...props
}: InputProps) {
  const inputId = id ?? name ?? label?.toLowerCase().replace(/\s+/g, "-");

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
        className={fieldClassName}
        {...props}
      />
      {error && <p className="text-[12px] text-red-600 mt-1">{error}</p>}
    </div>
  );
}
