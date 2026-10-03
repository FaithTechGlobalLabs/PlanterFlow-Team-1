import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DM_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/server";

const dmSans = DM_Sans({ subsets: ["latin"], display: "swap" });

const HOME = "/"; // where to go after saving. Change if the team has a planter home.
const PAGE = "/onboarding/first-goal";

const label = "mb-2 block text-sm font-semibold";
const input =
  "w-full rounded-xl border border-[#DDE3E0] bg-white px-5 py-4 text-[15px] font-medium outline-none focus-visible:border-[#1A6396] focus-visible:ring-2 focus-visible:ring-[#1A6396]/30";

// Sends the person back to this page with an error message.
function fail(message: string): never {
  redirect(`${PAGE}?error=${encodeURIComponent(message)}`);
}

// Runs on the server when "Create objective" is pressed.
async function createObjective(formData: FormData) {
  "use server";

  const id = String(formData.get("attempt_id") ?? "");
  const categoryId = String(formData.get("category_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const cadence = String(formData.get("cadence") ?? "");

  if (!categoryId) return fail("Choose a category.");
  if (title.length < 3) return fail("Give your objective a short title.");
  if (cadence !== "weekly" && cadence !== "monthly") return fail("Choose weekly or monthly.");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail("Please sign in first.");

  // The row id was made when the page loaded, so a double-click or retry
  // can only ever save one objective (the second try hits a duplicate id).
  const { error } = await supabase.from("objectives").insert({
    id,
    planter_id: user.id,
    category_id: categoryId,
    title,
    description: description || null,
    cadence,
  });

  if (error && error.code !== "23505") {
    console.error(error);
    return fail("We couldn't save your objective. Try again.");
  }

  redirect(HOME); // only after the objective is saved
}

export default async function FirstObjectivePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/"); // not signed in

  const { data: profile } = await supabase
    .from("profiles").select("org_id").eq("id", user.id).maybeSingle();
  const { data: categories } = profile
    ? await supabase
        .from("objective_categories").select("id, title")
        .eq("org_id", profile.org_id).eq("kind", "objective").order("sort_order")
    : { data: null };

  return (
    <main className={`${dmSans.className} min-h-screen bg-[#F3F5F2] text-[#14304A]`}>
      <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
        <header className="flex items-center justify-between gap-4">
          <span className="text-xl font-bold uppercase tracking-wide text-[#3D7A5A]">First Fruits</span>
          <Link href={HOME} className="text-sm font-semibold text-[#1A6396]">Home</Link>
        </header>

        <p className="mt-12 text-xs font-semibold uppercase tracking-wide text-[#3D7A5A]">
          Planter · First objective
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          What is your next faithful step?
        </h1>
        <p className="mt-5 text-lg text-[#5B6B78]">
          Create an objective, then break it into weekly or monthly activities.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.45fr_1fr] lg:items-start">
          <section className="rounded-2xl bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight">Your first objective</h2>

            {categories && categories.length > 0 ? (
              <form action={createObjective} className="mt-6 space-y-5">
                <input type="hidden" name="attempt_id" value={randomUUID()} />

                <div>
                  <label htmlFor="category_id" className={label}>Category</label>
                  <select id="category_id" name="category_id" defaultValue={categories[0].id} className={input}>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="title" className={label}>Objective title</label>
                  <input id="title" name="title" required placeholder="Neighbourhood dinners" className={input} />
                </div>
                <div>
                  <label htmlFor="description" className={label}>Description</label>
                  <input id="description" name="description" placeholder="Build relationships through shared meals." className={input} />
                </div>
                <div>
                  <label htmlFor="cadence" className={label}>Cadence</label>
                  <select id="cadence" name="cadence" defaultValue="weekly" className={input}>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                {error && <p role="alert" className="text-sm font-medium text-[#B3261E]">{error}</p>}

                <button
                  type="submit"
                  className="rounded-xl bg-[#1A6396] px-7 py-4 text-sm font-semibold text-white hover:bg-[#15527D]"
                >
                  Create objective
                </button>
              </form>
            ) : (
              <p className="mt-4 text-base text-[#5B6B78]">
                No objective categories found for your organization yet. Ask your Catalyst to add some.
              </p>
            )}
          </section>

          <aside className="rounded-2xl bg-[#E6F0E8] p-6 text-[#5B6B78] sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight text-[#14304A]">The shape of a plan</h2>
            <p className="mt-5 text-lg">Category → objective → activities → progress.</p>
            <p className="mt-5 text-lg">No mandatory targets or percentage complete.</p>
            <p className="mt-5 text-lg">
              Prayer Requests opens a separate prayer workflow. Personal Relationship with Jesus
              remains unscored and visible to your Catalyst.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
