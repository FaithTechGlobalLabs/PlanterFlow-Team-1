import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { getInvite } from "./queries";
import InviteForm from "./invite-form";

// Loaded here (not in the root layout) so this page doesn't touch shared files.
// If the team picks a global font later, delete this and the className below.
const dmSans = DM_Sans({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = { title: "Join your team · First Fruits" };

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

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInvite(token);

  return (
    <main className={`${dmSans.className} min-h-screen bg-[#F3F5F2] text-[#14304A]`}>
      <div className="mx-auto max-w-3xl px-6 py-8 sm:py-10">
        <header className="flex items-center justify-between gap-4 text-sm font-semibold">
          <span className="flex items-center gap-3">
            <Logo />
            First Fruits
          </span>
          <span className="text-[#5B6B78]">With SEND Network</span>
        </header>

        {invite ? (
          <>
            <p className="mt-12 text-sm font-semibold text-[#3D7A5A]">
              {invite.invitedBy ? `Invited by ${invite.invitedBy} · ` : "Invited to "}
              {invite.churchName}
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Welcome to the team.
            </h1>
            <p className="mt-5 text-base text-[#5B6B78]">
              Your church and permissions are already set.
            </p>

            <section className="mt-6 rounded-2xl bg-white p-6 sm:p-7">
              <h2 className="text-2xl font-bold tracking-tight">Make yourself at home</h2>
              <p className="mt-3 text-base text-[#5B6B78]">
                One quick step before joining the garden.
              </p>
              <InviteForm invite={invite} />
            </section>
          </>
        ) : (
          <section className="mt-16 rounded-2xl bg-white p-6 sm:p-7">
            <h1 className="text-2xl font-bold tracking-tight">This invite link isn’t working</h1>
            <p className="mt-3 max-w-prose text-base text-[#5B6B78]">
              It may have expired or already been used. Ask the person who invited you to
              send a new link.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
