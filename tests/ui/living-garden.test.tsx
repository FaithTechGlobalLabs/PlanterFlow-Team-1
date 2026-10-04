import { expect, it, vi, beforeEach } from "vitest";
import {
  fireEvent,
  render as testingRender,
  screen,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import messages from "../../messages/en.json";
import { GardenScene } from "@/components/garden/garden-scene";
import { CatalystHome } from "@/components/garden/catalyst-home";
import type { GardenChurch } from "@/app/[locale]/catalyst/garden-status";
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
function render(ui: ReactNode) {
  return testingRender(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      {ui}
    </NextIntlClientProvider>,
  );
}
const church: GardenChurch = {
  churchId: "church-1",
  churchName: "A real church",
  city: "Vancouver",
  pastorId: "pastor-1",
  pastorName: "A real pastor",
  stage: "sapling",
  lastActivityAt: "2026-10-01T12:00:00Z",
  lastCheckInAt: "2026-10-01T12:00:00Z",
  supportRequested: true,
  checkInDue: false,
  replyDue: true,
  completedObjectives: 1,
  currentObjective: "Serve our neighbours",
};
function home(garden = [church], loadFailed = false) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <CatalystHome
        greeting="Welcome back"
        garden={garden}
        loadFailed={loadFailed}
        invitations={<p>Invitation statuses</p>}
        isAdmin={false}
      />
    </NextIntlClientProvider>,
  );
}
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});
it("opens real church context with existing review and workspace routes, and closes on Escape", () => {
  home();
  fireEvent.click(
    screen.getByRole("button", {
      name: /Explore A real church, A real pastor/,
    }),
  );
  const dialog = screen.getByRole("dialog", { name: "A real church" });
  expect(dialog).toHaveTextContent("Serve our neighbours");
  expect(
    screen.getByRole("link", { name: "Respond & review" }),
  ).toHaveAttribute("href", "/catalyst/planters/pastor-1");
  expect(
    screen.getByRole("link", { name: "Open church workspace" }),
  ).toHaveAttribute("href", "/dashboard?planter=pastor-1");
  fireEvent(dialog, new Event("cancel", { bubbles: true }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("keeps search and no-church states honest", () => {
  home();
  fireEvent.change(screen.getByRole("searchbox", { name: "Find a church" }), {
    target: { value: "missing" },
  });
  expect(
    screen.getByText("No churches match your search."),
  ).toBeInTheDocument();
});
it("does not report zero churches or a quiet garden when loading failed", () => {
  home([], true);
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Your garden couldn’t load.",
  );
  expect(
    screen.queryByText("Your garden is quiet today."),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("region", { name: "Church garden" }),
  ).not.toBeInTheDocument();
});
it("makes a large garden accessible in bounded pages without losing churches", () => {
  const onSelect = vi.fn();
  render(
    <GardenScene
      plots={Array.from({ length: 13 }, (_, i) => ({
        id: String(i),
        name: `Church ${i}`,
        pastor: "Pastor",
        status: "No action needed",
      }))}
      onSelect={onSelect}
    />,
  );
  expect(
    screen.getAllByRole("button", { name: /Explore Church/ }),
  ).toHaveLength(6);
  fireEvent.click(screen.getByRole("button", { name: "Next →" }));
  fireEvent.click(screen.getByRole("button", { name: "Next →" }));
  fireEvent.click(screen.getByRole("button", { name: /Explore Church 12/ }));
  expect(onSelect).toHaveBeenCalledWith("12");
  expect(screen.getByRole("button", { name: "Next →" })).toBeDisabled();
});
it("does not fabricate a church or earned fruit in an empty garden", () => {
  const { container } = render(<GardenScene plots={[]} onSelect={vi.fn()} />);
  expect(screen.getByText("Your garden starts here.")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Explore/ }),
  ).not.toBeInTheDocument();
  expect(container.querySelectorAll(".church-tree__fruit")).toHaveLength(0);
});
