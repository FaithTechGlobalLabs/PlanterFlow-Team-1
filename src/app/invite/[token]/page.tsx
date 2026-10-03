import type { Metadata } from "next";
import InviteShell from "../_shared/shell";
import { getInvite } from "./queries";
import InviteForm from "./invite-form";

export const metadata: Metadata = { title: "Accept your invitation · First Fruits" };

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInvite(token);

  return (
    <InviteShell>
      {invite ? (
        <>
          <p className="mt-12 text-xs font-semibold uppercase tracking-wide text-[#3D7A5A]">
            {invite.invitedBy ? `Invited by ${invite.invitedBy}` : `Invited to ${invite.churchName}`}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Join {invite.churchName}.
          </h1>
          <p className="mt-5 text-base text-[#5B6B78]">
            Church team · Access chosen by your pastor
          </p>

          <section className="mt-6 rounded-2xl bg-white p-6 sm:p-7">
            <h2 className="text-xl font-bold tracking-tight">Accept your invitation</h2>
            <p className="mt-3 text-base text-[#5B6B78]">
              Your church and permissions are already linked.
            </p>
            <InviteForm token={invite.token} />
          </section>
        </>
      ) : (
        <section className="mt-16 rounded-2xl bg-white p-6 sm:p-7">
          <h1 className="text-2xl font-bold tracking-tight">This invite link isn’t working</h1>
          <p className="mt-3 max-w-prose text-base text-[#5B6B78]">
            It may have expired or already been used. Ask the person who invited you to send a
            new link.
          </p>
        </section>
      )}
    </InviteShell>
  );
}
