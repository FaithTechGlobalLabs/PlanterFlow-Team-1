"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Link } from "@/i18n/routing";
import { signOut } from "@/app/[locale]/actions";
import "./account-menu.css";

function AccountActions() {
  const { pending } = useFormStatus();
  return <>
    <button type="submit" disabled={pending}>{pending ? "Signing out…" : "Switch account"}</button>
    <button type="submit" disabled={pending}>Sign out</button>
  </>;
}

export function AccountMenu({ name, preview = false }: { name: string; preview?: boolean }) {
  const root = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target) && root.current) root.current.open = false;
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && root.current?.open) {
        root.current.open = false;
        root.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const initials = name.trim().split(/\s+/).map(word => word[0]).slice(0, 2).join("") || "?";
  return <details className="ff-account" ref={root}>
    <summary aria-label={`Account options for ${name || "your account"}`}>
      <span className="ff-avatar" aria-hidden="true">{initials}</span>
      <span>{name || "Your account"}</span><span aria-hidden="true">▾</span>
    </summary>
    <div className="ff-account-panel">
      <strong>{name || "Your account"}</strong>
      {preview ? <><p>Sample account. Sign in to open your workspace.</p><Link href="/login">Sign in</Link></> : <>
        <form action={signOut}><AccountActions /></form>
      </>}
    </div>
  </details>;
}
