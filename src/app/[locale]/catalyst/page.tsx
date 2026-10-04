import { catalystCareThisMonth } from "@/lib/catalyst-care";
import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { CatalystShell } from "@/components/garden/catalyst-shell";
import { CatalystHome } from "@/components/garden/catalyst-home";
import { buildGarden } from "./garden-status";
import { buildInviteStatuses } from "./invite-status";
import { InviteList } from "./invite-list";

interface PageProps {
  params: Promise<{ locale: string }>;
}

function greetingKey(now: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "America/Vancouver",
    }).format(now),
  );
  if (hour < 12) return "greeting_morning";
  if (hour < 18) return "greeting_afternoon";
  return "greeting_evening";
}

export default async function CatalystGardenPage({ params }: PageProps) {
  const { locale } = await params;
  const { user, profile } = await requireRole("catalyst", locale);
  const t = await getTranslations("catalyst.garden");
  const tInvites = await getTranslations("catalyst.invites");
  const supabase = await createClient();
  const now = new Date();

  // Only churches assigned to this Catalyst, and only pastor invites this Catalyst sent.
  const [org, churches, invitations] = await Promise.all([
    supabase
      .from("organizations")
      .select("name")
      .eq("id", profile.org_id)
      .single(),
    supabase
      .from("churches")
      .select("id, name, city, planting_start_date, pastor_id")
      .eq("catalyst_id", user.id),
    supabase
      .from("invitations")
      .select("id, email, church_name, accepted_at, expires_at, created_at")
      .eq("invited_by", user.id)
      .eq("role", "planter")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const invites = invitations.error
    ? []
    : buildInviteStatuses(invitations.data ?? [], now);

  const pastorIds = (churches.data ?? []).map((c) => c.pastor_id);
  const [pastors, checkIns, objectives] = pastorIds.length
    ? await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", pastorIds),
        supabase
          .from("check_ins")
          .select("id, planter_id, support, created_at")
          .in("planter_id", pastorIds),
        supabase
          .from("objectives")
          .select(
            "id, planter_id, title, status, has_completed, first_completed_at",
          )
          .in("planter_id", pastorIds),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
      ];

  const objectiveIds = (objectives.data ?? []).map((o) => o.id);
  const checkInIds = (checkIns.data ?? []).map((c) => c.id);
  const [progress, acknowledgements] = await Promise.all([
    objectiveIds.length
      ? supabase
          .from("progress_entries")
          .select("id, objective_id, note, value, created_at")
          .in("objective_id", objectiveIds)
      : { data: [], error: null },
    // Only acknowledgements linked to a check-in count as a review; ordinary goal replies don't.
    checkInIds.length
      ? supabase
          .from("dialogue_messages")
          .select("id, check_in_id, author_id, created_at")
          .in("check_in_id", checkInIds)
          .eq("author_id", user.id)
      : { data: [], error: null },
  ]);

  const loadFailed = [
    churches,
    pastors,
    checkIns,
    objectives,
    progress,
    acknowledgements,
  ].some((r) => r.error);
  const garden = loadFailed
    ? []
    : buildGarden(
        {
          churches: churches.data ?? [],
          pastors: pastors.data ?? [],
          checkIns: checkIns.data ?? [],
          objectives: objectives.data ?? [],
          progress: progress.data ?? [],
          acknowledgedCheckInIds: (acknowledgements.data ?? []).flatMap((a) =>
            a.check_in_id ? [a.check_in_id] : [],
          ),
        },
        now,
      );
  return (
    <CatalystShell
      name={profile.display_name}
      organization={org.data?.name ?? ""}
    >
      <CatalystHome
        greeting={t(greetingKey(now), {
          name: profile.display_name.split(" ")[0] || "",
        })}
        garden={garden}
        careSummary={
          loadFailed
            ? undefined
            : catalystCareThisMonth({
                viewerId: user.id,
                now,
                objectives: objectives.data ?? [],
                progress: progress.data ?? [],
                responses: acknowledgements.data ?? [],
              })
        }
        loadFailed={loadFailed}
        isAdmin={profile.is_admin}
        invitations={
          invitations.error ? (
            <p
              role="alert"
              className="catalyst-invites-error text-[15px] text-[var(--color-ink)]"
            >
              {tInvites("load_error")}
            </p>
          ) : (
            <InviteList invites={invites} />
          )
        }
      />
    </CatalystShell>
  );
}
