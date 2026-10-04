"use client";
import { Link } from "@/i18n/routing";
import { Brand } from "./Brand";
import { SendNetworkLogo } from "./SendNetworkLogo";

export function BrandNav() {
  return (
    <nav className="brand-nav" aria-label="First Fruits">
      <Link href="/" aria-label="First Fruits home">
        <Brand />
      </Link>
      <span className="inline-flex items-center">
        <SendNetworkLogo className="h-6 w-auto" />
      </span>
    </nav>
  );
}
