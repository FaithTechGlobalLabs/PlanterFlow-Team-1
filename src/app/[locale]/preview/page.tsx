import { PlanterHome } from "@/components/planter/planter-home";
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
  const stageDates: Record<string, string | null> = {
    "fruitful-seed": "2026-09-01",
    seed: "2026-09-01",
    sprout: "2026-04-01",
    sapling: "2025-04-01",
    young: "2024-04-01",
    established: "2020-04-01",
    unknown: null,
    planned: "2027-01-01",
  };
  if (role === "catalyst" && surface === "garden") {
    const baseGarden = buildGarden(
      {
        churches: sampleCatalyst.churches.map((c, i) => ({
          ...c,
          id: `preview-church-${i}`,
          planting_start_date:
            scenario && scenario in stageDates
              ? stageDates[scenario]
              : "2025-02-01",
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
        preview
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
  let data =
    role === "catalyst"
      ? { ...sampleWorkspace, viewer: sampleCatalyst.viewer }
      : sampleWorkspace;
  if (role !== "catalyst") {
    data = {
      ...data,
      church: data.church
        ? {
            ...data.church,
            planting_start_date:
              scenario && scenario in stageDates
                ? stageDates[scenario]
                : scenario === "low"
                  ? "2026-09-01"
                  : "2024-02-01",
          }
        : null,
      team: {
        unavailable: false,
        members:
          scenario === "empty"
            ? []
            : [
                {
                  id: "sample-member",
                  display_name: "Sample team member",
                  role: "peer",
                  joined_at: "2026-09-25T12:00:00Z",
                },
                {
                  id: "sample-member-2",
                  display_name: "Sample member with a longer display name",
                  role: "peer",
                  joined_at: "2026-09-27T12:00:00Z",
                },
                {
                  id: "sample-member-3",
                  display_name: "Sample member three",
                  role: "peer",
                  joined_at: "2026-10-01T12:00:00Z",
                },
              ],
        invitations:
          scenario === "pending"
            ? [
                {
                  id: "sample-invite",
                  email: "sample@example.invalid",
                  created_at: "2026-10-01T12:00:00Z",
                  expires_at: "2026-10-08T12:00:00Z",
                },
              ]
            : [],
      },
      objectives:
        scenario === "empty"
          ? []
          : data.objectives.map((o, i) => ({
              ...o,
              team_visible: i === 0,
              has_completed: scenario === "rich" && i === 2,
              first_completed_at:
                scenario === "rich" && i === 2 ? "2026-10-02T12:00:00Z" : null,
              status:
                scenario === "rich" && i === 2
                  ? ("complete" as const)
                  : o.status,
            })),
      teamMessages: [
        {
          id: "sample-team-reply",
          objective_id: "neighbours",
          author_id: "sample-member",
          body: "Sample team conversation: we can plan the next meal together.",
          created_at: "2026-10-02T18:00:00Z",
        },
      ],
    };
    data.people = [...data.people, ...(data.team?.members ?? [])];
    if (scenario === "empty")
      data = {
        ...data,
        progress: [],
        messages: [],
        teamMessages: [],
        checkIns: [],
        prayers: [],
        threads: [],
        activities: [],
      };
    if (scenario === "long")
      data = {
        ...data,
        church: data.church
          ? {
              ...data.church,
              name: "A sample church with a very long name serving several communities together",
            }
          : null,
        objectives: data.objectives.map((o) => ({
          ...o,
          title: `${o.title} with the people of our neighbourhood and surrounding communities`,
        })),
      };
    if (scenario === "fruitful-seed") {
      data = {
        ...data,
        objectives: Array.from({ length: 24 }, (_, i) => ({
          ...data.objectives[0],
          id: `sample-outcome-${i}`,
          title: `Sample completed objective ${i + 1}`,
          status: "complete" as const,
          has_completed: true,
          first_completed_at: "2026-10-02T12:00:00Z",
        })),
        progress: Array.from({ length: 30 }, (_, i) => ({
          ...data.progress[0],
          id: `sample-progress-${i}`,
          objective_id: `sample-outcome-${i % 24}`,
          note: "A sample recorded step",
        })),
      };
    }
    if (scenario === "quiet")
      data = {
        ...data,
        progress: [],
        messages: [],
        objectives: data.objectives.map((o) => ({
          ...o,
          status: "planning" as const,
          has_completed: false,
          first_completed_at: null,
        })),
      };
    if (surface === "garden") return <PlanterHome data={data} preview />;
  }
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
