"use client";

import { ReactNode } from "react";
import { Link } from "@/i18n/routing";

interface ButtonProps {
  variant: "primary" | "secondary";
  children?: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export function Button({
  variant,
  children,
  href,
  onClick,
  type = "button",
  disabled = false,
  fullWidth = true,
  className = "",
}: ButtonProps) {
  const baseClasses =
    "flex items-center justify-center h-12 px-4 rounded-[var(--radius-card)] text-[13px] font-bold leading-[1.4] transition-opacity";
  const widthClass = fullWidth ? "w-full" : "self-start";
  const variantClasses = disabled
    ? "bg-[var(--color-border)] text-[var(--color-muted)] cursor-not-allowed"
    : variant === "primary"
      ? "bg-[var(--color-blue)] text-white cursor-pointer hover:opacity-90"
      : "bg-[var(--color-sage)] text-[var(--color-ink)] cursor-pointer hover:opacity-90";

  const combinedClasses = `${baseClasses} ${widthClass} ${variantClasses} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses}
    >
      {children}
    </button>
  );
}
