import type { ReactNode } from "react";
import { Brand } from "@/components/ui/Brand";
import { SendNetworkLogo } from "@/components/ui/SendNetworkLogo";
import { Link } from "@/i18n/routing";
import { AccountMenu } from "@/components/workspace/account-menu";
import "@/components/garden/garden.css";
import "./planter.css";
export function PlanterHomeShell({
  name,
  children,
  preview = false,
  showBack = true,
}: {
  name: string;
  children: ReactNode;
  preview?: boolean;
  showBack?: boolean;
}) {
  return (
    <div className="planter-home">
      <a href="#planter-main" className="garden-skip">
        Skip to content
      </a>
      <header className="planter-topbar">
        <Link href="/" className="planter-brand" aria-label="First Fruits home">
          <Brand />
        </Link>
        <div className="planter-topbar__actions">
          <SendNetworkLogo className="planter-topbar__partner-logo h-5 w-auto" />
          <AccountMenu name={name} preview={preview} />
        </div>
      </header>
      <main id="planter-main" className="planter-home-main">
        {showBack && (
          <Link className="planter-link" href="/dashboard?view=team">
            ← Your Church Team
          </Link>
        )}
        {children}
      </main>
    </div>
  );
}
