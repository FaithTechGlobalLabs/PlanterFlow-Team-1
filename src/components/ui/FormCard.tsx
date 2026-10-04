import { ReactNode } from "react";

interface FormCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormCard({ title, description, children }: FormCardProps) {
  return (
    <div className="ff-form-card bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-6 flex flex-col gap-4 w-full max-w-[720px]">
      <h2 className="ff-form-card__title text-[22px] font-bold text-[var(--color-ink)]">
        {title}
      </h2>
      {description && (
        <p className="ff-form-card__description text-[15px] text-[var(--color-muted)]">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
