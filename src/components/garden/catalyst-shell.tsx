import type { ReactNode } from "react";
import { Brand } from "@/components/ui/Brand";
import { SendNetworkLogo } from "@/components/ui/SendNetworkLogo";
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
        </Link>
        <div className="flex items-center gap-4">
          <SendNetworkLogo className="h-5 w-auto" />
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
              <span className="garden-account-name">{name || "Your account"}</span>
            </summary>
            <div className="garden-account-dropdown">
              <p className="garden-account-role">Catalyst · {organization || "Your community"}</p>
              <form action={signOut}>
                <button type="submit" className="garden-signout-btn">Sign out</button>
              </form>
            </div>
          </details>
        </div>
      </header>
      <nav className="garden-nav" aria-label="Catalyst navigation">
        <span className="garden-nav-org">{organization || "Your community"}</span>
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
        First Fruits <span className="garden-footer-tagline">Care for the people. Notice the growth.</span>
      </footer>
    </div>
  );
}
