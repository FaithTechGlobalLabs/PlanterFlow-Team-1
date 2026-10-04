import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import en from "../../messages/en.json";
import { InviteList } from "@/app/[locale]/catalyst/invite-list";
import type { InviteView } from "@/app/[locale]/catalyst/invite-status";

function renderList(invites: InviteView[]) {
  return render(
    <NextIntlClientProvider locale="en" timeZone="America/Vancouver" messages={en}>
      <InviteList invites={invites} />
    </NextIntlClientProvider>
  );
}

describe("InviteList", () => {
  it("shows each invitation with its church, date and status", () => {
    renderList([
      { id: "a", email: "pastor@hope.ca", churchName: "Hope Church", status: "pending", sentAt: "2026-10-03T18:00:00Z" },
      { id: "b", email: "amy@river.ca", churchName: null, status: "accepted", sentAt: "2026-10-01T18:00:00Z" },
    ]);
    expect(screen.getByText("pastor@hope.ca")).toBeInTheDocument();
    expect(screen.getByText("Hope Church · Sent Oct 3, 2026")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Sent Oct 1, 2026")).toBeInTheDocument();
    expect(screen.getByText("Accepted")).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    renderList([]);
    expect(screen.getByText("You haven't invited a pastor yet.")).toBeInTheDocument();
  });
});
