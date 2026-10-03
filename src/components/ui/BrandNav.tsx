"use client";

export function BrandNav() {
  return (
    <nav className="flex items-center justify-between h-11 gap-4">
      <img
        src="/brand/first-fruits-mark.svg"
        alt="First Fruits"
        className="w-6 h-6 md:w-8 md:h-8"
      />
      <span className="text-[13px] font-bold text-[var(--color-navy)]">
        FIRST FRUITS
      </span>
      <span className="hidden md:inline text-[13px] font-bold text-[var(--color-muted)] ml-auto">
        WITH SEND NETWORK
      </span>
      <span className="md:hidden text-[13px] font-bold text-[var(--color-muted)] ml-auto">
        SEND NETWORK
      </span>
    </nav>
  );
}
