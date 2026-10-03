import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { sampleWorkspace } from "@/lib/workspace/sample";

const mocks = vi.hoisted(() => ({ save: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/i18n/routing", () => ({ Link: ({ children, href, ...props }: { children: ReactNode; href: string }) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/app/[locale]/dashboard/actions", () => ({ saveWorkspace: mocks.save }));
vi.mock("@/app/[locale]/actions", () => ({ signOut: vi.fn() }));
import { Workspace } from "@/components/workspace/workspace";

beforeEach(() => {
  mocks.save.mockReset();
  mocks.refresh.mockReset();
  HTMLDialogElement.prototype.showModal = function() { this.open = true; };
});

describe("planter workspace", () => {
  it("opens an objective with activities and Catalyst conversation", () => {
    render(<Workspace data={sampleWorkspace}/>);
    fireEvent.click(screen.getByRole("button", { name: /Engage the City Build deeper roots/ }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Build deeper roots");
    expect(screen.getByText("Share coffee with two neighbours", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText(/I love how you’re making space to listen/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "← All objectives" }));
    expect(screen.getByPlaceholderText("Search by title or category…")).toBeInTheDocument();
  });
  it("retains the check-in draft when persistence fails", async () => {
    mocks.save.mockResolvedValue({ ok: false, error: "Connection failed. Try again." });
    render(<Workspace data={sampleWorkspace}/>);
    fireEvent.click(screen.getByRole("button", { name: "Quick check-in" }));
    fireEvent.change(screen.getByLabelText("How are you feeling?"), { target: { value: "steady" } });
    fireEvent.change(screen.getByLabelText("How is your planting work progressing?"), { target: { value: "moving" } });
    fireEvent.change(screen.getByLabelText("A short update"), { target: { value: "A draft worth keeping" } });
    fireEvent.submit(screen.getByRole("button", { name: "Save check-in" }).closest("form")!);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Connection failed"));
    expect(screen.getByLabelText("A short update")).toHaveValue("A draft worth keeping");
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it("moves from a successful check-in to the history workflow", async () => {
    mocks.save.mockResolvedValue({ ok: true, id: "saved" });
    render(<Workspace data={sampleWorkspace}/>);
    fireEvent.click(screen.getByRole("button", { name: "Quick check-in" }));
    fireEvent.submit(screen.getByRole("button", { name: "Save check-in" }).closest("form")!);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Your check-ins" })).toBeInTheDocument());
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("lets Catalysts read and reply without presenting planter editing controls", () => {
    render(<Workspace data={{ ...sampleWorkspace, viewer: sampleWorkspace.people[1] }}/>);
    expect(screen.queryByRole("button", { name: "Quick check-in" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Engage the City Build deeper roots/ }));
    expect(screen.getByRole("button", { name: "Send reply" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit objective" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Share progress" })).not.toBeInTheDocument();
  });
  it("never calls the live save action from the sample preview", async () => {
    render(<Workspace data={sampleWorkspace} preview/>);
    fireEvent.click(screen.getByRole("button", { name: "Quick check-in" }));
    fireEvent.submit(screen.getByRole("button", { name: "Save check-in" }).closest("form")!);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("visual preview"));
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
