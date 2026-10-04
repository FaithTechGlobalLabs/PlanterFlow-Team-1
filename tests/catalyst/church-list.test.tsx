import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import en from "../../messages/en.json";
import { ChurchList } from "@/app/[locale]/catalyst/church-list";
import type { GardenChurch } from "@/app/[locale]/catalyst/garden-status";

const now = new Date("2026-10-03T19:00:00Z");

const hope: GardenChurch = {
  churchId: "c1",
  churchName: "Hope Church",
  city: "Vancouver",
  pastorId: "p1",
  pastorName: "Daniel Park",
  stage: "sapling",
  lastActivityAt: "2026-10-03T16:00:00Z",
  lastCheckInAt: "2026-10-03T16:00:00Z",
  supportRequested: true,
  checkInDue: false,
  replyDue: true,
};

function renderList(churches: GardenChurch[]) {
  return render(
    <NextIntlClientProvider locale="en" timeZone="America/Vancouver" messages={en}>
      <ChurchList churches={churches} now={now} />
    </NextIntlClientProvider>
  );
}

describe("ChurchList", () => {
  it("shows each assigned church with pastor, city, stage and activity", () => {
    renderList([hope]);
    expect(screen.getByText("Hope Church · Daniel Park")).toBeInTheDocument();
    expect(screen.getByText("Vancouver · Sapling · year 1–2")).toBeInTheDocument();
    expect(screen.getByText("Last activity: today")).toBeInTheDocument();
  });

  it("shows status badges as text", () => {
    renderList([hope, { ...hope, churchId: "c2", supportRequested: false, checkInDue: true, lastActivityAt: null }]);
    expect(screen.getByText("Support requested")).toBeInTheDocument();
    expect(screen.getByText("Check-in due")).toBeInTheDocument();
    expect(screen.getByText("No activity yet")).toBeInTheDocument();
  });

  it("asks for a review when a check-in has no support request", () => {
    renderList([{ ...hope, supportRequested: false }]);
    expect(screen.getByText("Review check-in")).toBeInTheDocument();
  });

  it("links to the church's pastor page", () => {
    renderList([hope]);
    expect(screen.getByRole("link", { name: /Hope Church/ })).toHaveAttribute("href", "/en/catalyst/planters/p1");
  });

  it("shows an empty state", () => {
    renderList([]);
    expect(screen.getByText("No churches are assigned to you yet. Start with Invite a pastor.")).toBeInTheDocument();
  });
});
