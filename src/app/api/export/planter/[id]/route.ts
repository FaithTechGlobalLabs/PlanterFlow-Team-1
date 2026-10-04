import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getSessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

function sanitizePdfText(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[—–]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x00-\xFF]/g, "");
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
  objectives: Array<{
    title: string;
    description: string | null;
    status: string;
    categoryTitle: string;
    progress: Array<{ created_at: string; value: number | null; note: string | null }>;
    messages: Array<{ created_at: string; authorName: string; body: string }>;
  }>;
}): Promise<Uint8Array> {
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
  page.drawText("FIRST FRUITS · AUTHORIZED PLANTER REPORT", {
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
  const metaText = `Church: ${churchLabel}   |   Export Date: ${sanitizePdfText(data.exportDate)}`;
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
  page.drawText("Check-in History", {
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
    drawWrappedText("No check-ins recorded yet.", margin, fontOblique, 10, grayColor);
    y -= 10;
  } else {
    for (const c of data.checkIns) {
      checkPageSpace(45);
      const dateStr = new Date(c.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

      page.drawText(`Check-in  ·  ${dateStr}`, {
        x: margin,
        y: y - 11,
        size: 11,
        font: fontBold,
        color: darkColor,
      });
      y -= 16;

      page.drawText(`Feeling: ${sanitizePdfText(c.feeling) || "N/A"}  |  Momentum: ${sanitizePdfText(c.momentum) || "N/A"}`, {
        x: margin + 10,
        y: y - 9,
        size: 9,
        font: fontOblique,
        color: grayColor,
      });
      y -= 14;

      if (c.note) {
        drawWrappedText(`Notes: ${c.note}`, margin + 10, font, 9.5, darkColor, contentWidth - 10);
      }
      if (c.support) {
        drawWrappedText(`Support Needed: ${c.support}`, margin + 10, font, 9.5, brandColor, contentWidth - 10);
      }
      y -= 12;
    }
  }

  // Objectives & Dialogue Section
  y -= 10;
  checkPageSpace(30);
  page.drawText("Objectives & Dialogue", {
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

  if (data.objectives.length === 0) {
    drawWrappedText("No objectives added yet.", margin, fontOblique, 10, grayColor);
  } else {
    for (const o of data.objectives) {
      checkPageSpace(45);

      const headerText = `${sanitizePdfText(o.title)}  [${o.status.toUpperCase()} · ${sanitizePdfText(o.categoryTitle)}]`;
      drawWrappedText(headerText, margin, fontBold, 11, darkColor);

      if (o.description) {
        drawWrappedText(o.description, margin + 10, font, 9.5, grayColor, contentWidth - 10);
      }

      if (o.progress.length > 0) {
        checkPageSpace(20);
        page.drawText("Progress Updates:", {
          x: margin + 10,
          y: y - 10,
          size: 9.5,
          font: fontBold,
          color: brandColor,
        });
        y -= 14;

        for (const p of o.progress) {
          const pDate = new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const valStr = p.value !== null ? ` (Recorded: ${p.value})` : "";
          drawWrappedText(`• ${pDate}${valStr}: ${p.note || ""}`, margin + 20, font, 9, darkColor, contentWidth - 20);
        }
      }

      if (o.messages.length > 0) {
        checkPageSpace(20);
        page.drawText("Dialogue:", {
          x: margin + 10,
          y: y - 10,
          size: 9.5,
          font: fontBold,
          color: brandColor,
        });
        y -= 14;

        for (const m of o.messages) {
          const mDate = new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          drawWrappedText(`${m.authorName} (${mDate}): ${m.body}`, margin + 20, font, 9, darkColor, contentWidth - 20);
        }
      }

      y -= 14;
    }
  }

  return await pdfDoc.save();
}

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

  // 7. Render Binary PDF Document
  const pdfBytes = await generatePdfReport({
    planterName: planter.display_name,
    churchName: church?.name ?? "N/A",
    churchCity: church?.city ?? "",
    exportDate,
    checkIns: checkIns.data ?? [],
    objectives: (objectives.data ?? []).map((o) => ({
      title: o.title,
      description: o.description,
      status: o.status,
      categoryTitle: categoryMap.get(o.category_id) ?? "General",
      progress: (progress.data ?? []).filter((p) => p.objective_id === o.id),
      messages: (messages.data ?? []).filter((m) => m.objective_id === o.id).map((m) => ({
        created_at: m.created_at,
        authorName: authorNameMap.get(m.author_id) ?? "Author",
        body: m.body,
      })),
    })),
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
