import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import en from "../../messages/en.json";

vi.mock("@/app/[locale]/catalyst/planters/[id]/actions", () => ({
  sendReply: vi.fn(),
  acknowledgeCheckIn: vi.fn(),
}));

import { CheckInList, type CheckInView } from "@/app/[locale]/catalyst/planters/[id]/check-in-list";

const checkIns: CheckInView[] = [
  {
    id: "c2",
    note: "Grateful for new friendships this week.",
    feeling: "encouraged",
    momentum: "moving",
    support: "Please pray for a sustainable family rhythm.",
    createdAt: "2026-10-03T17:00:00Z",
  },
  { id: "c1", note: "Quiet week.", feeling: "tired", momentum: "steady", support: "", createdAt: "2026-09-26T17:00:00Z" },
];
const goals = [{ id: "o1", title: "Build deeper roots" }];

function renderList(list: CheckInView[], reviewedAt: string | null = null, objectives = goals) {
  return render(
    <NextIntlClientProvider locale="en" timeZone="America/Vancouver" messages={en}>
      <CheckInList checkIns={list} reviewedAt={reviewedAt} objectives={objectives} />
    </NextIntlClientProvider>
  );
}

describe("CheckInList", () => {
  it("shows the latest check-in first with mood, notes and support needed", () => {
    renderList(checkIns);
    expect(screen.getByText("Latest check-in · Oct 3, 2026")).toBeInTheDocument();
    expect(screen.getByText("Feeling: encouraged · Momentum: moving")).toBeInTheDocument();
    expect(screen.getByText("Please pray for a sustainable family rhythm.")).toBeInTheDocument();
    expect(screen.getByText("Earlier check-in · Sep 26, 2026")).toBeInTheDocument();
  });

  it("asks the Catalyst to review the latest check-in", () => {
    renderList(checkIns);
    expect(screen.getByText("Needs your review")).toBeInTheDocument();
    expect(screen.getByLabelText("Acknowledge and offer support")).toBeRequired();
    expect(screen.getByRole("button", { name: "Acknowledge check-in" })).toBeInTheDocument();
  });

  it("shows when the latest check-in was reviewed", () => {
    renderList(checkIns, "2026-10-03T18:00:00Z");
    expect(screen.getByText("Reviewed · Oct 3, 2026")).toBeInTheDocument();
  });

  it("lets the Catalyst choose a goal when there are several", () => {
    renderList(checkIns, null, [...goals, { id: "o2", title: "Make disciples" }]);
    expect(screen.getByLabelText("Post under goal")).toBeInTheDocument();
  });

  it("explains that a goal is needed before acknowledging", () => {
    renderList(checkIns, null, []);
    expect(screen.getByText("Once the pastor adds a goal, you can acknowledge this check-in here.")).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    renderList([]);
    expect(screen.getByText("No check-ins yet.")).toBeInTheDocument();
  });
});
