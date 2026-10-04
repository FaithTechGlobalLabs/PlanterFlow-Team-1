import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import en from "../../messages/en.json";

vi.mock("@/app/[locale]/catalyst/planters/[id]/actions", () => ({ sendReply: vi.fn() }));

import { ObjectiveCard, type ObjectiveView } from "@/app/[locale]/catalyst/planters/[id]/objective-card";

const dinners: ObjectiveView = {
  id: "o1",
  title: "Neighbourhood dinners",
  description: "Build relationships through shared meals.",
  categoryTitle: "Engage the City",
  cadence: "weekly",
  status: "active",
  latestProgress: { note: "Spoke with three neighbours about dinner.", value: 3, createdAt: "2026-10-03T18:00:00Z" },
  messages: [
    { id: "m1", authorName: "Daniel Park", mine: false, body: "We hosted our first dinner!", createdAt: "2026-10-02T18:00:00Z" },
    { id: "m2", authorName: "Alex Morgan", mine: true, body: "Wonderful — praying for you.", createdAt: "2026-10-03T18:30:00Z" },
  ],
};

function renderCard(objective: ObjectiveView) {
  return render(
    <NextIntlClientProvider locale="en" timeZone="America/Vancouver" messages={en}>
      <ObjectiveCard objective={objective} />
    </NextIntlClientProvider>
  );
}

describe("ObjectiveCard", () => {
  it("shows the objective with its category, cadence and description", () => {
    renderCard(dinners);
    expect(screen.getByRole("heading", { name: "Neighbourhood dinners" })).toBeInTheDocument();
    expect(screen.getByText("Plan · Engage the City · Weekly · In Progress")).toBeInTheDocument();
    expect(screen.getByText("Build relationships through shared meals.")).toBeInTheDocument();
  });

  it("maps a legacy paused objective to Planning", () => {
    renderCard({ ...dinners, status: "paused", cadence: "monthly" });
    expect(screen.getByText("Plan · Engage the City · Monthly · Planning")).toBeInTheDocument();
  });

  it("shows the latest progress entry with its number", () => {
    renderCard(dinners);
    expect(screen.getByText("Latest progress · Oct 3, 2026")).toBeInTheDocument();
    expect(screen.getByText("Spoke with three neighbours about dinner. Number: 3")).toBeInTheDocument();
  });

  it("shows the conversation with authors and marks the Catalyst's own replies", () => {
    renderCard(dinners);
    expect(screen.getByText("We hosted our first dinner!")).toBeInTheDocument();
    expect(screen.getByText(/^Daniel Park ·/)).toBeInTheDocument();
    expect(screen.getByText(/^You ·/)).toBeInTheDocument();
  });

  it("shows empty states when nothing has been logged", () => {
    renderCard({ ...dinners, latestProgress: null, messages: [] });
    expect(screen.getByText("No progress logged yet.")).toBeInTheDocument();
    expect(screen.getByText("No messages yet. Start the conversation below.")).toBeInTheDocument();
  });

  it("lets the Catalyst reply but not edit the objective", () => {
    renderCard(dinners);
    expect(screen.getByLabelText("Your reply")).toBeRequired();
    expect(screen.getByRole("button", { name: "Send encouragement" })).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
  });
});
