import type { ReactNode } from "react";
import { Brand } from "@/components/ui/Brand";
import { SendNetworkLogo } from "@/components/ui/SendNetworkLogo";
import { Link } from "@/i18n/routing";
import { AccountMenu } from "@/components/workspace/account-menu";
import "./garden.css";

export function CatalystShell({
  name,
  organization,
  children,
  active = "garden",
  preview = false,
}: {
  name: string;
  organization: string;
  children: ReactNode;
  active?: "garden" | "workspace" | "church";
  preview?: boolean;
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
        <div className="garden-topbar__actions">
          <SendNetworkLogo className="garden-topbar__partner-logo h-5 w-auto" />
          <AccountMenu name={name} preview={preview} />
        </div>
      </header>
      <nav className="garden-nav" aria-label="Catalyst navigation">
        <span className="garden-nav-org">
          {organization || "Your community"}
        </span>
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
        First Fruits{" "}
        <span className="garden-footer-tagline">
          Care for the people. Notice the growth.
        </span>
      </footer>
    </div>
  );
}
