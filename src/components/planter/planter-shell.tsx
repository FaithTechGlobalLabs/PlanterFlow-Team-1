import type { ReactNode } from "react";
import { Brand } from "@/components/ui/Brand";
import { Link } from "@/i18n/routing";
import { signOut } from "@/app/[locale]/actions";
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
          <span>with SEND Network</span>
        </Link>
        <details className="planter-account">
          <summary>{name || "Your account"}</summary>
          <div>
            {!preview && (
              <form action={signOut}>
                <button type="submit">Sign out</button>
              </form>
            )}
          </div>
        </details>
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
