import type { ReactNode } from "react";
import { DM_Sans } from "next/font/google";

// Loaded here so the invite flow doesn't touch the root layout.
const dmSans = DM_Sans({ subsets: ["latin"], display: "swap" });

function Logo() {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#E1EDE4]" aria-hidden>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
        <path d="M12 21v-9" stroke="#1F5A45" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 13C12 8.5 9 6.5 5 6.5c0 4 2.2 6.5 7 6.5Z" fill="#2F7A5B" />
        <path d="M12 11c0-3.5 2.3-5.5 6-5.5 0 3.5-2 5.5-6 5.5Z" fill="#1F5A45" />
        <circle cx="16" cy="16.5" r="2.2" fill="#E8A33D" />
      </svg>
    </span>
  );
}

export default function InviteShell({ children }: { children: ReactNode }) {
  return (
    <main className={`${dmSans.className} min-h-screen bg-[#F3F5F2] text-[#14304A]`}>
      <div className="mx-auto max-w-3xl px-6 py-8 sm:py-10">
        <header className="flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-wide">
          <span className="flex items-center gap-3">
            <Logo />
            First Fruits
          </span>
          <span className="text-[#5B6B78]">With SEND Network</span>
        </header>
        {children}
      </div>
    </main>
  );
}
