import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getSessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import enMessages from "../../../../../../messages/en.json";

/**
 * Architectural Note on PDF Generation Library:
 * We use `pdf-lib` intentionally instead of `@react-pdf/renderer` because this application
 * is built to run on Cloudflare Workers / OpenNext edge runtime. `@react-pdf/renderer` relies on
 * heavy Node.js native dependencies (`yoga-layout` / `canvas` / DOM polyfills) that break in serverless edge environments.
 * `pdf-lib` is pure JS, highly performant, and fully compatible with edge and serverless runtimes.
 */

function sanitizePdfText(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[—–]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x00-\xFF]/g, "");
}

interface ExportI18n {
  header: string;
  churchMeta: string;
  exportDateMeta: string;
  checkInHistory: string;
  noCheckIns: string;
  checkInTitle: string;
  feeling: string;
  momentum: string;
  notes: string;
  supportNeeded: string;
  objectivesAndDialogue: string;
  noObjectives: string;
  progressUpdates: string;
  dialogue: string;
  notAvailable: string;
  generalCategory: string;
  categoryHeader: string;
  recorded: string;
}

interface ObjectiveExportData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  category_id: string;
  progress: Array<{ created_at: string; value: number | null; note: string | null }>;
  messages: Array<{ created_at: string; authorName: string; body: string }>;
}

interface CategoryGroup {
  categoryId: string;
  categoryTitle: string;
  objectives: ObjectiveExportData[];
}

async function generatePdfReport(data: {
  planterName: string;
  churchName: string;
  churchCity: string;
  exportDate: string;
  checkIns: Array<{
    created_at: string;
    note: string | null;
    feeling: string | null;
    momentum: string | null;
    support: string | null;
  }>;
  categoryGroups: CategoryGroup[];
  i18n: ExportI18n;
}): Promise<Uint8Array> {
  const { i18n } = data;
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  let page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 50;
  const contentWidth = width - margin * 2;
  let y = height - margin;

  const brandColor = rgb(0.23, 0.32, 0.29); // #3B5249
  const darkColor = rgb(0.1, 0.1, 0.1);
  const grayColor = rgb(0.4, 0.4, 0.4);
  const borderColor = rgb(0.88, 0.91, 0.94); // #E2E8F0

  function checkPageSpace(requiredHeight: number) {
    if (y - requiredHeight < margin) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = height - margin;
    }
  }

  function wrapText(text: string, textFont: any, fontSize: number, maxWidth: number): string[] {
    const cleanText = sanitizePdfText(text);
    const words = cleanText.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const w = textFont.widthOfTextAtSize(testLine, fontSize);
      if (w <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.length ? lines : [""];
  }

  function drawWrappedText(
    text: string,
    x: number,
    textFont = font,
    fontSize = 10,
    textColor = darkColor,
    maxW = contentWidth
  ) {
    const lines = wrapText(text, textFont, fontSize, maxW);
    for (const line of lines) {
      checkPageSpace(fontSize + 4);
      page.drawText(line, { x, y: y - fontSize, size: fontSize, font: textFont, color: textColor });
      y -= fontSize + 4;
    }
  }

  // Header
  page.drawText(sanitizePdfText(i18n.header), {
    x: margin,
    y: y - 10,
    size: 10,
    font: fontBold,
    color: brandColor,
  });
  y -= 28;

  page.drawText(sanitizePdfText(data.planterName), {
    x: margin,
    y: y - 18,
    size: 22,
    font: fontBold,
    color: darkColor,
  });
  y -= 32;

  const churchLabel = sanitizePdfText(data.churchName) + (data.churchCity ? ` (${sanitizePdfText(data.churchCity)})` : "");
  const metaText = `${i18n.churchMeta.replace("{church}", churchLabel)}   |   ${i18n.exportDateMeta.replace("{date}", sanitizePdfText(data.exportDate))}`;
  page.drawText(metaText, {
    x: margin,
    y: y - 10,
    size: 10,
    font,
    color: grayColor,
  });
  y -= 20;

  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1.5,
    color: brandColor,
  });
  y -= 25;

  // Check-in History Section
  checkPageSpace(30);
  page.drawText(sanitizePdfText(i18n.checkInHistory), {
    x: margin,
    y: y - 14,
    size: 14,
    font: fontBold,
    color: brandColor,
  });
  y -= 22;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.5,
    color: borderColor,
  });
  y -= 15;

  if (data.checkIns.length === 0) {
    drawWrappedText(i18n.noCheckIns, margin, fontOblique, 10, grayColor);
    y -= 10;
  } else {
    for (const c of data.checkIns) {
      checkPageSpace(45);
      const dateStr = new Date(c.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
      const checkInHeader = i18n.checkInTitle.replace("{date}", dateStr);

      page.drawText(sanitizePdfText(checkInHeader), {
        x: margin,
        y: y - 11,
        size: 11,
        font: fontBold,
        color: darkColor,
      });
      y -= 16;

      const feelingStr = sanitizePdfText(c.feeling) || i18n.notAvailable;
      const momentumStr = sanitizePdfText(c.momentum) || i18n.notAvailable;
      page.drawText(`${i18n.feeling}: ${feelingStr}  |  ${i18n.momentum}: ${momentumStr}`, {
        x: margin + 10,
        y: y - 9,
        size: 9,
        font: fontOblique,
        color: grayColor,
      });
      y -= 14;

      if (c.note) {
        drawWrappedText(`${i18n.notes}: ${c.note}`, margin + 10, font, 9.5, darkColor, contentWidth - 10);
      }
      if (c.support) {
        drawWrappedText(`${i18n.supportNeeded}: ${c.support}`, margin + 10, font, 9.5, brandColor, contentWidth - 10);
      }
      y -= 12;
    }
  }

  // Objectives & Dialogue Section
  y -= 10;
  checkPageSpace(30);
  page.drawText(sanitizePdfText(i18n.objectivesAndDialogue), {
    x: margin,
    y: y - 14,
    size: 14,
    font: fontBold,
    color: brandColor,
  });
  y -= 22;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.5,
    color: borderColor,
  });
  y -= 15;

  const totalObjectives = data.categoryGroups.reduce((acc, g) => acc + g.objectives.length, 0);

  if (totalObjectives === 0) {
    drawWrappedText(i18n.noObjectives, margin, fontOblique, 10, grayColor);
  } else {
    for (const group of data.categoryGroups) {
      if (group.objectives.length === 0) continue;

      checkPageSpace(25);
      const catHeading = i18n.categoryHeader.replace("{category}", group.categoryTitle);
      page.drawText(sanitizePdfText(catHeading), {
        x: margin,
        y: y - 12,
        size: 12,
        font: fontBold,
        color: brandColor,
      });
      y -= 18;

      for (const o of group.objectives) {
        checkPageSpace(45);

        const headerText = `${sanitizePdfText(o.title)}  [${o.status.toUpperCase()}]`;
        drawWrappedText(headerText, margin + 10, fontBold, 11, darkColor, contentWidth - 10);

        if (o.description) {
          drawWrappedText(o.description, margin + 15, font, 9.5, grayColor, contentWidth - 15);
        }

        // Progress updates in date order
        if (o.progress.length > 0) {
          checkPageSpace(20);
          page.drawText(sanitizePdfText(i18n.progressUpdates), {
            x: margin + 15,
            y: y - 10,
            size: 9.5,
            font: fontBold,
            color: brandColor,
          });
          y -= 14;

          for (const p of o.progress) {
            const pDate = new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const valStr = p.value !== null ? ` (${i18n.recorded}: ${p.value})` : "";
            drawWrappedText(`• ${pDate}${valStr}: ${p.note || ""}`, margin + 25, font, 9, darkColor, contentWidth - 25);
          }
        }

        // Dialogue messages in date order
        if (o.messages.length > 0) {
          checkPageSpace(20);
          page.drawText(sanitizePdfText(i18n.dialogue), {
            x: margin + 15,
            y: y - 10,
            size: 9.5,
            font: fontBold,
            color: brandColor,
          });
          y -= 14;

          for (const m of o.messages) {
            const mDate = new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            drawWrappedText(`${m.authorName} (${mDate}): ${m.body}`, margin + 25, font, 9, darkColor, contentWidth - 25);
          }
        }

        y -= 14;
      }

      y -= 10;
    }
  }

  return await pdfDoc.save();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  // Support both /api/export/planter/[id] and /api/export/planter/[id].pdf (Issue #10 route alignment)
  const planterId = rawId.endsWith(".pdf") ? rawId.slice(0, -4) : rawId;

  const { user, profile } = await getSessionProfile();

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // 1. Verify target planter exists
  const { data: planter, error: planterError } = await supabase
    .from("profiles")
    .select("id, display_name, role, org_id")
    .eq("id", planterId)
    .maybeSingle();

  if (planterError) {
    console.error("[export-planter] Error fetching planter profile:", planterError);
    return NextResponse.json({ error: "Failed to fetch database records." }, { status: 500 });
  }

  if (!planter || planter.role !== "planter") {
    return NextResponse.json({ error: "Planter not found" }, { status: 404 });
  }

  // 2. Validate authorization
  // Caller MUST be:
  // a) The planter themselves
  // b) The Catalyst explicitly assigned to this pastor's church
  let isAuthorized = false;

  if (user.id === planterId) {
    isAuthorized = true;
  } else {
    const { data: church, error: churchCheckError } = await supabase
      .from("churches")
      .select("id")
      .eq("pastor_id", planterId)
      .eq("catalyst_id", user.id)
      .maybeSingle();

    if (churchCheckError) {
      console.error("[export-planter] Error checking church assignment:", churchCheckError);
      return NextResponse.json({ error: "Failed to verify authorization." }, { status: 500 });
    }

    if (church) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Forbidden: You are not authorized to export these records." },
      { status: 403 }
    );
  }

  // 3. Fetch Church details
  const { data: church, error: churchError } = await supabase
    .from("churches")
    .select("name, city, planting_start_date")
    .eq("pastor_id", planterId)
    .maybeSingle();

  if (churchError) {
    console.error("[export-planter] Error fetching church details:", churchError);
    return NextResponse.json({ error: "Failed to fetch church details." }, { status: 500 });
  }

  // 4. Fetch Categories, Objectives, Check-ins
  const [categoriesRes, objectivesRes, checkInsRes] = await Promise.all([
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

  if (categoriesRes.error) {
    console.error("[export-planter] Error fetching categories:", categoriesRes.error);
    return NextResponse.json({ error: "Failed to fetch categories." }, { status: 500 });
  }
  if (objectivesRes.error) {
    console.error("[export-planter] Error fetching objectives:", objectivesRes.error);
    return NextResponse.json({ error: "Failed to fetch objectives." }, { status: 500 });
  }
  if (checkInsRes.error) {
    console.error("[export-planter] Error fetching check-ins:", checkInsRes.error);
    return NextResponse.json({ error: "Failed to fetch check-ins." }, { status: 500 });
  }

  const categories = categoriesRes.data ?? [];
  const objectives = objectivesRes.data ?? [];
  const checkIns = checkInsRes.data ?? [];
  const objectiveIds = objectives.map((o) => o.id);

  // 5. Fetch Progress & Dialogue Messages
  let progressData: Array<{ objective_id: string; note: string | null; value: number | null; created_at: string }> = [];
  let messagesData: Array<{ id: string; objective_id: string; author_id: string; body: string; created_at: string }> = [];

  if (objectiveIds.length > 0) {
    const [progressRes, messagesRes] = await Promise.all([
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
    ]);

    if (progressRes.error) {
      console.error("[export-planter] Error fetching progress entries:", progressRes.error);
      return NextResponse.json({ error: "Failed to fetch progress entries." }, { status: 500 });
    }
    if (messagesRes.error) {
      console.error("[export-planter] Error fetching dialogue messages:", messagesRes.error);
      return NextResponse.json({ error: "Failed to fetch dialogue messages." }, { status: 500 });
    }

    progressData = progressRes.data ?? [];
    messagesData = messagesRes.data ?? [];
  }

  // 6. Fetch Author Names for Messages
  const authorIds = [...new Set(messagesData.map((m) => m.author_id))];
  let authorsData: Array<{ id: string; display_name: string }> = [];
  if (authorIds.length > 0) {
    const authorsRes = await supabase.from("profiles").select("id, display_name").in("id", authorIds);
    if (authorsRes.error) {
      console.error("[export-planter] Error fetching author profiles:", authorsRes.error);
      return NextResponse.json({ error: "Failed to fetch message author profiles." }, { status: 500 });
    }
    authorsData = authorsRes.data ?? [];
  }

  const authorNameMap = new Map(authorsData.map((a) => [a.id, a.display_name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.title]));

  // Load i18n text
  const i18n = (enMessages as any).catalyst?.exportReport ?? {
    header: "FIRST FRUITS · AUTHORIZED PLANTER REPORT",
    churchMeta: "Church: {church}",
    exportDateMeta: "Export Date: {date}",
    checkInHistory: "Check-in History",
    noCheckIns: "No check-ins recorded yet.",
    checkInTitle: "Check-in · {date}",
    feeling: "Feeling",
    momentum: "Momentum",
    notes: "Notes",
    supportNeeded: "Support Needed",
    objectivesAndDialogue: "Objectives & Dialogue",
    noObjectives: "No objectives added yet.",
    progressUpdates: "Progress Updates:",
    dialogue: "Dialogue:",
    notAvailable: "N/A",
    generalCategory: "General",
    categoryHeader: "Category: {category}",
    recorded: "Recorded",
  };

  // Group objectives by Category & sort progress/dialogue in ascending date order
  const categoryGroupsMap = new Map<string, ObjectiveExportData[]>();

  for (const obj of objectives) {
    const catId = obj.category_id || "general";
    if (!categoryGroupsMap.has(catId)) {
      categoryGroupsMap.set(catId, []);
    }

    const objProgress = progressData
      .filter((p) => p.objective_id === obj.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const objMessages = messagesData
      .filter((m) => m.objective_id === obj.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((m) => ({
        created_at: m.created_at,
        authorName: authorNameMap.get(m.author_id) ?? "Author",
        body: m.body,
      }));

    categoryGroupsMap.get(catId)!.push({
      id: obj.id,
      title: obj.title,
      description: obj.description,
      status: obj.status,
      category_id: obj.category_id,
      progress: objProgress,
      messages: objMessages,
    });
  }

  // Construct structured Category Groups array sorted by category sort_order
  const categoryGroups: CategoryGroup[] = [];

  for (const cat of categories) {
    if (categoryGroupsMap.has(cat.id)) {
      categoryGroups.push({
        categoryId: cat.id,
        categoryTitle: cat.title,
        objectives: categoryGroupsMap.get(cat.id)!,
      });
      categoryGroupsMap.delete(cat.id);
    }
  }

  // Place any remaining uncategorized objectives under General category
  for (const [catId, objs] of categoryGroupsMap.entries()) {
    categoryGroups.push({
      categoryId: catId,
      categoryTitle: categoryMap.get(catId) ?? i18n.generalCategory,
      objectives: objs,
    });
  }

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
      categoryGroups,
      checkIns,
    });
  }

  // 7. Render Binary PDF Document
  const pdfBytes = await generatePdfReport({
    planterName: planter.display_name,
    churchName: church?.name ?? "N/A",
    churchCity: church?.city ?? "",
    exportDate,
    checkIns,
    categoryGroups,
    i18n,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="planter-report-${planterId}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
