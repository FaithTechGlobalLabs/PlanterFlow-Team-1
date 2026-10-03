"use client";

import { useActionState } from "react";
import { saveLanguage, type LanguageState } from "./actions";
import { LANGUAGES } from "../_shared/data";
import { field, label, primaryButton } from "../_shared/styles";

export default function WelcomeForm({
  churchName,
  roleLabel,
}: {
  churchName: string;
  roleLabel: string;
}) {
  const [state, action, pending] = useActionState<LanguageState, FormData>(saveLanguage, {});

  return (
    <form action={action} className="mt-6 space-y-5">
      <div>
        <label htmlFor="language" className={label}>Preferred language</label>
        <select id="language" name="language" defaultValue="en" className={field}>
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* Read-only: set by whoever sent the invite. */}
      <p
        aria-label={`Your role: ${roleLabel}`}
        className="inline-block rounded-xl bg-[#E6F0E8] px-6 py-3 text-sm font-semibold text-[#3D7A5A]"
      >
        {roleLabel}
      </p>

      {state.error && (
        <p role="alert" className="text-sm font-medium text-[#B3261E]">{state.error}</p>
      )}

      <div>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Joining…" : `Join ${churchName}`}
        </button>
      </div>
    </form>
  );
}
