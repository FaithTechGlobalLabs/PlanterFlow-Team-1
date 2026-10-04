import { ReactNode } from "react";

interface FormErrorProps {
  children?: ReactNode;
}

export function FormError({ children }: FormErrorProps) {
  if (!children) return null;

  return (
    <p
      role="alert"
      className="ff-form-error text-sm text-[var(--color-danger)]"
    >
      {children}
    </p>
  );
}
