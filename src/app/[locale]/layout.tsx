import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ReactNode } from "react";
import "../globals.css";
import { DM_Sans } from "next/font/google";
import { AuthHashListener } from "@/components/auth-hash-listener";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: "First Fruits",
  description:
    "Help church planters track their planting vision and stay connected with their Catalyst.",
};

export default async function Layout({
  children,
  params,
}: LayoutProps) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${dmSans.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <AuthHashListener />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
