"use client";

import { AcceptForm } from "@/app/[locale]/invite/[token]/accept-form";
import { acceptTeamInvitation } from "./actions";

export function TeamAcceptForm({ token, sessionReady }: { token: string; sessionReady: boolean }) {
  return <AcceptForm token={token} role="peer" sessionReady={sessionReady} action={acceptTeamInvitation} />;
}
