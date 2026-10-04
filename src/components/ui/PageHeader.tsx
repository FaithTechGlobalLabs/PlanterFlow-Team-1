"use client";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subline: string;
}

export function PageHeader({ eyebrow, title, subline }: PageHeaderProps) {
  return (
    <div className="ff-page-header w-full">
      {eyebrow && (
        <p className="ff-page-header__eyebrow text-[13px] font-bold text-[var(--color-green)] mb-2 uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="ff-page-header__title text-[clamp(28px,5vw,36px)] font-bold text-[var(--color-ink)] mb-4">
        {title}
      </h1>
      <p className="ff-page-header__subline text-[15px] text-[var(--color-muted)]">
        {subline}
      </p>
    </div>
  );
}
