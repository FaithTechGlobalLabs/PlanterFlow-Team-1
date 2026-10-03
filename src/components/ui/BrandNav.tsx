"use client";
import { Link } from "@/i18n/routing";
import { Brand } from "./Brand";
export function BrandNav() {
  return <nav className="brand-nav" aria-label="First Fruits"><Link href="/" aria-label="First Fruits home"><Brand /></Link><span>WITH SEND NETWORK</span></nav>;
}
