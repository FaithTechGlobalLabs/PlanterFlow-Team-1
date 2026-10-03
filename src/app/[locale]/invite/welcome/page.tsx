import { redirect } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

// Old non-localized invite flow ended at /invite/welcome. Without this static
// route, /<locale>/invite/welcome would be read as an invitation token.
export default async function LegacyWelcomePage({ params }: PageProps) {
  const { locale } = await params;
  redirect({ href: "/", locale });
}
