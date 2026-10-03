"use client";

import { useActionState } from "react";
import { acceptInvite, type AcceptState } from "./actions";
import { field, label, primaryButton } from "../_shared/styles";

export default function InviteForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<AcceptState, FormData>(acceptInvite, {});

  return (
    <form action={action} className="mt-6 space-y-5">
      <input type="hidden" name="token" value={token} />

      <div>
        <label htmlFor="name" className={label}>Your name</label>
        <input id="name" name="name" type="text" autoComplete="name" required className={field} />
      </div>

      <div>
        <label htmlFor="password" className={label}>Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          placeholder="Create a secure password"
          className={field}
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm font-medium text-[#B3261E]">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Setting things up…" : "Accept and continue"}
      </button>
    </form>
  );
}
