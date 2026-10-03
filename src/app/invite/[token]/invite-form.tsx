"use client";

import { useActionState } from "react";
import { joinChurch, type JoinState } from "./actions";
import { LANGUAGES, ROLE_LABELS, type Invite } from "./data";

const field =
  "w-full rounded-xl border border-[#DDE3E0] bg-white px-5 py-3.5 text-[15px] font-medium text-[#14304A] outline-none transition-colors placeholder:text-[#8A97A2] focus-visible:border-[#1A6396] focus-visible:ring-2 focus-visible:ring-[#1A6396]/30";

export default function InviteForm({ invite }: { invite: Invite }) {
  const [state, action, pending] = useActionState<JoinState, FormData>(joinChurch, {});

  return (
    <form action={action} className="mt-6 space-y-5">
      <input type="hidden" name="token" value={invite.token} />

      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-semibold text-[#14304A]">
          Your name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className={field}
        />
      </div>

      <div>
        <label htmlFor="language" className="mb-2 block text-sm font-semibold text-[#14304A]">
          Preferred language
        </label>
        <select id="language" name="language" defaultValue="en" className={field}>
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      {/* Read-only: the role was set by whoever sent the invite. */}
      <p
        aria-label={`Your role: ${ROLE_LABELS[invite.role]}`}
        className="inline-block rounded-xl bg-[#E6F0E8] px-6 py-3 text-sm font-semibold text-[#3D7A5A]"
      >
        {ROLE_LABELS[invite.role]}
      </p>

      {state.error && (
        <p role="alert" className="text-sm font-medium text-[#B3261E]">
          {state.error}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#1A6396] px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#15527D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A6396] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Joining…" : `Join ${invite.churchName}`}
        </button>
      </div>
    </form>
  );
}
