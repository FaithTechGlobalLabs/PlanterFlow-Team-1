import { describe, it, expect, vi } from "vitest";
import { render as renderWithTestingLibrary, screen, fireEvent } from "@testing-library/react";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../messages/en.json";

function render(ui: ReactNode) {
  return renderWithTestingLibrary(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}
import { sampleWorkspace } from "@/lib/workspace/sample";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/app/[locale]/actions", () => ({ signOut: vi.fn() }));
vi.mock("@/app/[locale]/dashboard/actions", () => ({ saveWorkspace: vi.fn() }));
import { PlanterHome } from "@/components/planter/planter-home";
import { Workspace } from "@/components/workspace/workspace";
import {
  PlanterGarden,
  TeamSnapshot,
} from "@/components/planter/planter-garden";

describe("Planter living church", () => {
  it("uses supplied names and links to existing workspace and invitation routes", () => {
    render(<PlanterHome data={sampleWorkspace} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Daniel",
    );
    expect(
      screen.getByRole("link", { name: "Open workspace" }),
    ).toHaveAttribute("href", "/dashboard");
    expect(
      screen.getAllByRole("link", { name: "Invite team member" })[0],
    ).toHaveAttribute("href", "/invite-team");
  });
  it("keeps preview branch navigation inside the preview", () => {
    render(<PlanterHome data={sampleWorkspace} preview />);
    expect(
      screen.getByRole("link", { name: /Build deeper roots.*active/ }),
    ).toHaveAttribute("href", "/preview?view=objectives&objective=neighbours");
    expect(
      screen.queryByRole("link", { name: "Invite team member" }),
    ).not.toBeInTheDocument();
  });
  it("offers truthful empty and unavailable states", () => {
    render(
      <PlanterGarden
        data={{ ...sampleWorkspace, objectives: [], progress: [] }}
      />,
    );
    expect(
      screen.getByText(/Your first branch starts here/),
    ).toBeInTheDocument();
    expect(document.querySelectorAll(".garden-fruit")).toHaveLength(0);
  });
  it("renders actual membership and pending invitations without conflating organization people", () => {
    render(
      <TeamSnapshot
        data={{
          ...sampleWorkspace,
          team: {
            unavailable: false,
            members: [
              {
                id: "peer",
                display_name: "Real member",
                role: "peer",
                joined_at: sampleWorkspace.asOf,
              },
            ],
            invitations: [
              {
                id: "invite",
                email: "person@example.invalid",
                created_at: sampleWorkspace.asOf,
                expires_at: "2026-10-10T00:00:00Z",
              },
            ],
          },
        }}
        full
      />,
    );
    expect(screen.getByText("Real member")).toBeInTheDocument();
    expect(screen.getByText("person@example.invalid")).toBeInTheDocument();
    expect(screen.queryByText("Alex Morgan")).not.toBeInTheDocument();
  });
  it("opens objective controls from an accessible branch and offers owner-only views", () => {
    render(<Workspace data={sampleWorkspace} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Build deeper roots.*active/ }),
    );
    expect(
      screen.getByRole("button", { name: "Edit objective" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Catalyst conversation" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Journey" }));
    expect(
      screen.getByRole("heading", { name: "Small steps, lasting roots." }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Quick check-in" }),
    ).not.toBeInTheDocument();
  });
  it("retains separate Church Team and private Catalyst dialogue on shared objectives", () => {
    render(
      <Workspace
        data={{
          ...sampleWorkspace,
          teamMessages: [],
          objectives: sampleWorkspace.objectives.map((o) => ({
            ...o,
            team_visible: true,
          })),
        }}
        initialObjective="neighbours"
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Catalyst conversation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send team reply" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send reply" }),
    ).toBeInTheDocument();
  });
});
