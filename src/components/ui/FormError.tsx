import { ReactNode } from "react";

interface FormErrorProps {
  children?: ReactNode;
}

export function FormError({ children }: FormErrorProps) {
  if (!children) return null;

  return <p className="text-[12px] text-red-600">{children}</p>;
}
