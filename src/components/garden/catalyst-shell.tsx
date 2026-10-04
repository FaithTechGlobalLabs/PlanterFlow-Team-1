import type { ReactNode } from "react";
import { Brand } from "@/components/ui/Brand";
import { Link } from "@/i18n/routing";
import { signOut } from "@/app/[locale]/actions";
import "./garden.css";

export function CatalystShell({
  name,
  organization,
  children,
  active = "garden",
}: {
  name: string;
  organization: string;
  children: ReactNode;
  active?: "garden" | "workspace" | "church";
}) {
  return (
    <div className="catalyst-garden-app">
      <a href="#garden-main" className="garden-skip">
        Skip to content
      </a>
      <header className="garden-topbar">
        <Link href="/catalyst" className="garden-brand">
          <Brand />
          <span>with SEND Network</span>
        </Link>
        <details className="garden-account">
          <summary>
            <span className="garden-avatar">
              {name
                .trim()
                .split(/\s+/)
                .map((word) => word[0])
                .slice(0, 2)
                .join("") || "C"}
            </span>
            <span>{name || "Your account"}</span>
          </summary>
          <div>
            <p>Catalyst · {organization || "Your community"}</p>
            <form action={signOut}>
              <button type="submit">Sign out</button>
            </form>
          </div>
        </details>
      </header>
      <nav className="garden-nav" aria-label="Catalyst navigation">
        <span>{organization || "Your community"}</span>
        <Link
          href="/catalyst"
          aria-current={active === "garden" ? "page" : undefined}
        >
          Garden
        </Link>
        <Link
          href="/dashboard"
          aria-current={active === "workspace" ? "page" : undefined}
        >
          Workspace
        </Link>
        <Link href="/catalyst#invitations">Invitations</Link>
        <Link href="/catalyst/categories">Objective categories</Link>
      </nav>
      <main id="garden-main" className="garden-main">
        {children}
      </main>
      <footer className="garden-footer">
        First Fruits <span>Care for the people. Notice the growth.</span>
      </footer>
    </div>
  );
}
