"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Link } from "@/i18n/routing";
import { signOut } from "@/app/[locale]/actions";
import "./account-menu.css";

function AccountActions() {
  const { pending } = useFormStatus();
  return (
    <>
      <button className="ff-account__action" type="submit" disabled={pending}>
        {pending ? "Signing out…" : "Sign out"}
      </button>
    </>
  );
}

export function AccountMenu({
  name,
  preview = false,
}: {
  name: string;
  preview?: boolean;
}) {
  const root = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function outside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !root.current?.contains(event.target) &&
        root.current
      )
        root.current.open = false;
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && root.current?.open) {
        root.current.open = false;
        root.current
          .querySelector<HTMLElement>(".ff-account__trigger")
          ?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const initials =
    name
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .slice(0, 2)
      .join("") || "?";
  return (
    <details className="ff-account" ref={root}>
      <summary
        className="ff-account__trigger"
        aria-label={`Account options for ${name || "your account"}`}
      >
        <span className="ff-account__avatar ff-avatar" aria-hidden="true">
          {initials}
        </span>
        <span className="ff-account__name">{name || "Your account"}</span>
        <span className="ff-account__chevron" aria-hidden="true">
          ▾
        </span>
      </summary>
      <div className="ff-account__panel">
        <strong className="ff-account__identity">
          {name || "Your account"}
        </strong>
        {preview ? (
          <>
            <p className="ff-account__preview-note">
              Sample account. Sign in to open your workspace.
            </p>
            <Link className="ff-account__action" href="/login">
              Sign in
            </Link>
          </>
        ) : (
          <>
            <form className="ff-account__form" action={signOut}>
              <AccountActions />
            </form>
          </>
        )}
      </div>
    </details>
  );
}
