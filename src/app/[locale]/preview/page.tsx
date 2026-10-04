import { CatalystShell } from "@/components/garden/catalyst-shell";
import { CatalystHome } from "@/components/garden/catalyst-home";
import { buildGarden } from "../catalyst/garden-status";
import { Workspace } from "@/components/workspace/workspace";
import { sampleWorkspace } from "@/lib/workspace/sample";
import { sampleCatalyst } from "@/lib/workspace/sample";
import { CatalystDashboard } from "@/components/workspace/catalyst-dashboard";

export const metadata = {
  title: "Workspace design preview · First Fruits",
  robots: { index: false, follow: false },
};
export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string;
    surface?: string;
    scenario?: string;
    planter?: string;
    view?: string;
    objective?: string;
  }>;
}) {
  const { role, surface, scenario, planter, view, objective } =
    await searchParams;
  if (role === "catalyst" && surface === "garden") {
    const baseGarden = buildGarden(
      {
        churches: sampleCatalyst.churches.map((c, i) => ({
          ...c,
          id: `preview-church-${i}`,
          planting_start_date: "2025-02-01",
        })),
        pastors: sampleCatalyst.people,
        checkIns: sampleCatalyst.checkIns,
        objectives: sampleCatalyst.objectives,
        progress: sampleCatalyst.progress,
        acknowledgedCheckInIds: [],
      },
      new Date(sampleWorkspace.asOf),
    );
    const garden =
      scenario === "empty"
        ? []
        : scenario === "many"
          ? Array.from({ length: 13 }, (_, i) => ({
              ...baseGarden[0],
              churchId: `sample-${i}`,
              churchName: `Sample church ${i + 1}`,
              pastorName: `Sample pastor ${i + 1}`,
              completedObjectives: i % 4,
            }))
          : scenario === "long"
            ? [
                {
                  ...baseGarden[0],
                  churchName:
                    "A sample church with a very long name serving several neighbourhoods together",
                  pastorName: "Sample pastor with a longer display name",
                },
              ]
            : scenario === "quiet"
              ? baseGarden.map((c) => ({
                  ...c,
                  supportRequested: false,
                  replyDue: false,
                  checkInDue: false,
                }))
              : baseGarden;
    return (
      <CatalystShell
        name={sampleCatalyst.viewer.display_name}
        organization="Design preview · Sample records"
      >
        <p className="garden-quiet">
          Design preview · Fictional records. Sign in to use invitations and
          review flows.
        </p>
        <CatalystHome
          greeting="Welcome to your garden"
          garden={garden}
          loadFailed={false}
          isAdmin={false}
          invitations={<p key="preview-invitations">No sample invitations.</p>}
        />
      </CatalystShell>
    );
  }
  if (role === "catalyst" && !planter)
    return <CatalystDashboard data={sampleCatalyst} preview />;
  const data =
    role === "catalyst"
      ? { ...sampleWorkspace, viewer: sampleCatalyst.viewer }
      : sampleWorkspace;
  return (
    <Workspace
      key={`${role}:${view}:${objective}`}
      data={data}
      preview
      initialView={view}
      initialObjective={objective}
    />
  );
}
