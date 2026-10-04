import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: planterId } = await params;
  const { user, profile } = await getSessionProfile();

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // 1. Verify target planter exists
  const { data: planter } = await supabase
    .from("profiles")
    .select("id, display_name, role, org_id")
    .eq("id", planterId)
    .maybeSingle();

  if (!planter || planter.role !== "planter") {
    return NextResponse.json({ error: "Planter not found" }, { status: 404 });
  }

  // 2. Validate authorization
  // Caller must be:
  // a) The planter themselves
  // b) The Catalyst assigned to this pastor's church
  // c) An organization Admin in the same org
  let isAuthorized = false;

  if (user.id === planterId) {
    isAuthorized = true;
  } else if (profile.role === "catalyst") {
    if (profile.is_admin && profile.org_id === planter.org_id) {
      isAuthorized = true;
    } else {
      const { data: church } = await supabase
        .from("churches")
        .select("id")
        .eq("pastor_id", planterId)
        .eq("catalyst_id", user.id)
        .maybeSingle();

      if (church) {
        isAuthorized = true;
      }
    }
  }

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Forbidden: You are not authorized to export these records." },
      { status: 403 }
    );
  }

  // 3. Fetch Church details
  const { data: church } = await supabase
    .from("churches")
    .select("name, city, planting_start_date")
    .eq("pastor_id", planterId)
    .maybeSingle();

  // 4. Fetch Categories, Objectives, Check-ins
  const [categories, objectives, checkIns] = await Promise.all([
    supabase.from("objective_categories").select("id, title, sort_order").order("sort_order"),
    supabase
      .from("objectives")
      .select("id, title, description, category_id, cadence, status, created_at")
      .eq("planter_id", planterId)
      .order("created_at"),
    supabase
      .from("check_ins")
      .select("id, note, feeling, momentum, support, created_at")
      .eq("planter_id", planterId)
      .order("created_at", { ascending: true }),
  ]);

  const objectiveIds = (objectives.data ?? []).map((o) => o.id);

  // 5. Fetch Progress & Dialogue Messages
  const [progress, messages] = objectiveIds.length
    ? await Promise.all([
        supabase
          .from("progress_entries")
          .select("objective_id, note, value, created_at")
          .in("objective_id", objectiveIds)
          .order("created_at", { ascending: true }),
        supabase
          .from("dialogue_messages")
          .select("id, objective_id, author_id, body, created_at")
          .in("objective_id", objectiveIds)
          .order("created_at", { ascending: true }),
      ])
    : [{ data: [] }, { data: [] }];

  // 6. Fetch Author Names for Messages
  const authorIds = [...new Set((messages.data ?? []).map((m) => m.author_id))];
  const { data: authors } = authorIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", authorIds)
    : { data: [] };

  const authorNameMap = new Map((authors ?? []).map((a) => [a.id, a.display_name]));
  const categoryMap = new Map((categories.data ?? []).map((c) => [c.id, c.title]));

  const exportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Check if client explicitly requests JSON output
  const url = new URL(request.url);
  if (url.searchParams.get("format") === "json") {
    return NextResponse.json({
      exportDate,
      planter: { id: planter.id, name: planter.display_name },
      church: church ? { name: church.name, city: church.city, startDate: church.planting_start_date } : null,
      objectives: (objectives.data ?? []).map((o) => ({
        ...o,
        categoryTitle: categoryMap.get(o.category_id) ?? "Uncategorized",
        progress: (progress.data ?? []).filter((p) => p.objective_id === o.id),
        messages: (messages.data ?? []).filter((m) => m.objective_id === o.id).map((m) => ({
          ...m,
          authorName: authorNameMap.get(m.author_id) ?? "Unknown Author",
        })),
      })),
      checkIns: checkIns.data ?? [],
    });
  }

  // 7. Render Print-Ready Export HTML (Save to PDF)
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>First Fruits Export - ${escapeHtml(planter.display_name)}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-after: always; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1A1A1A;
      line-height: 1.5;
      padding: 32px;
      max-width: 800px;
      margin: 0 auto;
      background: #FFFFFF;
    }
    .header {
      border-bottom: 2px solid #3B5249;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .brand {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: #3B5249;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .title {
      font-size: 28px;
      font-weight: 800;
      color: #1A1A1A;
      margin: 0 0 8px 0;
    }
    .meta {
      font-size: 14px;
      color: #555555;
    }
    .actions {
      margin-bottom: 24px;
      display: flex;
      gap: 12px;
    }
    .btn {
      background: #3B5249;
      color: #FFFFFF;
      border: none;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      text-decoration: none;
    }
    .btn:hover { background: #2D3E38; }
    .section {
      margin-bottom: 28px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #3B5249;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    .card {
      background: #F8FAF9;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 8px;
    }
    .card-title {
      font-size: 16px;
      font-weight: 700;
      margin: 0;
    }
    .badge {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 12px;
      background: #E2E8F0;
      color: #2D3748;
      font-weight: 600;
    }
    .badge.active { background: #D1FAE5; color: #065F46; }
    .badge.done { background: #E0E7FF; color: #3730A3; }
    .timeline-item {
      padding: 8px 0;
      border-bottom: 1px dashed #E2E8F0;
      font-size: 14px;
    }
    .timeline-item:last-child { border-bottom: none; }
    .author { font-weight: 600; color: #3B5249; }
    .date { font-size: 12px; color: #718096; margin-left: 8px; }
  </style>
</head>
<body>
  <div class="actions no-print">
    <button onclick="window.print()" class="btn">🖨️ Print / Save as PDF</button>
  </div>

  <div class="header">
    <div class="brand">FIRST FRUITS · AUTHORIZED PLANTER REPORT</div>
    <h1 class="title">${escapeHtml(planter.display_name)}</h1>
    <div class="meta">
      <strong>Church:</strong> ${escapeHtml(church?.name ?? "N/A")}${church?.city ? ` (${escapeHtml(church.city)})` : ""}
      &nbsp;·&nbsp; <strong>Export Date:</strong> ${exportDate}
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Check-in History</h2>
    ${
      (checkIns.data ?? []).length === 0
        ? `<p class="meta">No check-ins recorded yet.</p>`
        : (checkIns.data ?? [])
            .map(
              (c) => `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Check-in</span>
          <span class="date">${new Date(c.created_at).toLocaleDateString()}</span>
        </div>
        ${c.note ? `<p><strong>Notes:</strong> ${escapeHtml(c.note)}</p>` : ""}
        <p class="meta">Feeling: ${escapeHtml(c.feeling ?? "N/A")} · Momentum: ${escapeHtml(c.momentum ?? "N/A")}</p>
        ${c.support ? `<p><strong>Support Needed:</strong> ${escapeHtml(c.support)}</p>` : ""}
      </div>`
            )
            .join("")
    }
  </div>

  <div class="section">
    <h2 class="section-title">Objectives & Dialogue</h2>
    ${
      (objectives.data ?? []).length === 0
        ? `<p class="meta">No objectives added yet.</p>`
        : (objectives.data ?? [])
            .map((o) => {
              const objProgress = (progress.data ?? []).filter((p) => p.objective_id === o.id);
              const objMessages = (messages.data ?? []).filter((m) => m.objective_id === o.id);
              const catTitle = categoryMap.get(o.category_id) ?? "General";

              return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${escapeHtml(o.title)}</h3>
          <span class="badge ${o.status === "done" ? "done" : "active"}">${escapeHtml(o.status)} · ${escapeHtml(catTitle)}</span>
        </div>
        ${o.description ? `<p>${escapeHtml(o.description)}</p>` : ""}
        
        ${
          objProgress.length > 0
            ? `
          <div style="margin-top: 12px;">
            <strong>Progress Updates:</strong>
            ${objProgress
              .map(
                (p) => `
              <div class="timeline-item">
                <span class="date">${new Date(p.created_at).toLocaleDateString()}</span>
                ${p.value !== null ? `<span> (Value: ${p.value})</span>` : ""}
                ${p.note ? `<br/>${escapeHtml(p.note)}` : ""}
              </div>`
              )
              .join("")}
          </div>`
            : ""
        }

        ${
          objMessages.length > 0
            ? `
          <div style="margin-top: 12px;">
            <strong>Dialogue:</strong>
            ${objMessages
              .map(
                (m) => `
              <div class="timeline-item">
                <span class="author">${escapeHtml(authorNameMap.get(m.author_id) ?? "Author")}</span>
                <span class="date">${new Date(m.created_at).toLocaleString()}</span>
                <div>${escapeHtml(m.body)}</div>
              </div>`
              )
              .join("")}
          </div>`
            : ""
        }
      </div>`;
            })
            .join("")
    }
  </div>
</body>
</html>`;

  return new NextResponse(htmlContent, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
