import { Workspace } from "@/components/workspace/workspace";
import { sampleWorkspace } from "@/lib/workspace/sample";
import { sampleCatalyst } from "@/lib/workspace/sample";
import { CatalystDashboard } from "@/components/workspace/catalyst-dashboard";

export const metadata = { title: "Workspace design preview · First Fruits", robots: { index: false, follow: false } };
export default async function PreviewPage({ searchParams }: { searchParams: Promise<{ role?: string; planter?: string; view?: string; objective?: string }> }) {
  const { role, planter, view, objective } = await searchParams;
  if (role === "catalyst" && !planter) return <CatalystDashboard data={sampleCatalyst} preview/>;
  const data = role === "catalyst" ? { ...sampleWorkspace, viewer: sampleCatalyst.viewer } : sampleWorkspace;
  return <Workspace key={`${role}:${view}:${objective}`} data={data} preview initialView={view} initialObjective={objective}/>;
}
