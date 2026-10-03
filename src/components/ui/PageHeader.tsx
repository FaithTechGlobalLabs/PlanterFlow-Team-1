"use client";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subline: string;
}

export function PageHeader({
  eyebrow,
  title,
  subline,
}: PageHeaderProps) {
  return (
    <div className="w-full">
      {eyebrow && (
        <p className="text-[13px] font-bold text-[var(--color-green)] mb-2 uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="text-[36px] font-bold text-[var(--color-ink)] mb-4">
        {title}
      </h1>
      <p className="text-[15px] text-[var(--color-muted)]">
        {subline}
      </p>
    </div>
  );
}
