import { getSessionProfile } from "@/lib/auth/session";
import { redirect, Link } from "@/i18n/routing";
import { loadWorkspace } from "@/lib/workspace/data";
import { Workspace } from "@/components/workspace/workspace";
import { loadCatalystDashboard } from "@/lib/workspace/catalyst";
import { CatalystDashboard } from "@/components/workspace/catalyst-dashboard";

export default async function DashboardPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ planter?: string; view?: string; objective?: string }> }) {
  const { locale } = await params;
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) return redirect({ href: "/", locale });
  if (profile.role === "peer") return redirect({ href: "/", locale });
  const { planter, view, objective } = await searchParams;
  if (profile.role === "catalyst" && !planter) return <CatalystDashboard data={await loadCatalystDashboard(profile)}/>;
  const data = await loadWorkspace(profile, planter);
  if (!data) return <main className="m-auto max-w-lg rounded-xl border border-[var(--color-border)] bg-white p-10"><h1 className="text-2xl">Your community starts here.</h1><p className="my-5">{planter ? "This planter is not available in your organization." : "Once a planter accepts your invitation, their objectives, check-ins, and prayer requests will appear here."}</p><Link href="/invite-pastor" className="underline">Invite a planter</Link><br/><Link href="/" className="mt-4 inline-block underline">Back to home</Link></main>;
  return <Workspace key={`${data.planter.id}:${view ?? "overview"}:${objective ?? ""}`} data={data} initialView={view} initialObjective={objective}/>;
}
