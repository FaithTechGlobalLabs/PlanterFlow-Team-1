import { ReactNode } from "react";

interface StatusProps {
  children: ReactNode;
  className?: string;
}

export function Status({ children, className = "" }: StatusProps) {
  return (
    <span
      className={`inline-flex items-center h-9 px-4 rounded-[var(--radius-card)] bg-[var(--color-sage)] text-[13px] font-bold text-[var(--color-green)] min-w-[240px] max-w-full ${className}`}
    >
      {children}
    </span>
  );
}
