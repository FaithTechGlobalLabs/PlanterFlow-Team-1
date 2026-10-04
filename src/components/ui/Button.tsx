"use client";

import { ReactNode } from "react";
import { Link } from "@/i18n/routing";

interface ButtonProps {
  variant: "primary" | "secondary" | "tertiary" | "destructive";
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
    "flex items-center justify-center min-h-12 px-4 py-3 rounded-[var(--radius-card)] text-[13px] font-bold leading-[1.4] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-green)] disabled:opacity-60 disabled:cursor-wait";
  const widthClass = fullWidth ? "w-full" : "self-start";
  const variantClasses = {
    primary: "bg-[var(--color-green)] text-white hover:bg-[var(--color-navy)]",
    secondary:
      "bg-[var(--color-sage)] text-[var(--color-ink)] border border-[var(--color-border)] hover:bg-white",
    tertiary:
      "bg-transparent text-[var(--color-green)] hover:underline underline-offset-4",
    destructive: "bg-[#8b362e] text-white hover:bg-[#6e2923]",
  }[variant];

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
