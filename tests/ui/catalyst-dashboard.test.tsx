import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { sampleCatalyst, sampleWorkspace } from "@/lib/workspace/sample";

const mocks = vi.hoisted(() => ({ save: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/i18n/routing", () => ({ Link: ({ children, href, ...props }: { children: ReactNode; href: string }) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/app/[locale]/dashboard/actions", () => ({ saveWorkspace: mocks.save }));
vi.mock("@/app/[locale]/dashboard/category-actions", () => ({ saveCategory: mocks.save }));
vi.mock("@/app/[locale]/actions", () => ({ signOut: vi.fn() }));
import { CatalystDashboard } from "@/components/workspace/catalyst-dashboard";
import { Workspace } from "@/components/workspace/workspace";

beforeEach(() => {
  mocks.save.mockReset();
  mocks.refresh.mockReset();
  HTMLDialogElement.prototype.showModal = function() { this.open = true; };
});

it("filters planters by church and exposes direct workspace links", () => {
  render(<CatalystDashboard data={sampleCatalyst}/>);
  expect(screen.getByRole("link", { name: /Open Daniel/ })).toHaveAttribute("href", `/dashboard?planter=${sampleWorkspace.planter.id}`);
  fireEvent.change(screen.getByPlaceholderText("Search name, church, or city…"), { target: { value: "no such church" } });
  expect(screen.getByText("No planters match these filters.")).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText("Search name, church, or city…"), { target: { value: "Hope" } });
  expect(screen.getByRole("link", { name: /Open Daniel/ })).toBeInTheDocument();
});

it("protects categories in use and keeps failed edits available", async () => {
  mocks.save.mockResolvedValue({ ok: false, error: "Please try again." });
  render(<CatalystDashboard data={sampleCatalyst}/>);
  fireEvent.click(screen.getByRole("button", { name: "Objective categories" }));
  const used = sampleCatalyst.categories.find(category => category.id === sampleCatalyst.objectives[0].category_id)!;
  expect(screen.queryByRole("button", { name: `Remove ${used.title}` })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: `Edit ${used.title}` }));
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "A better category" } });
  fireEvent.submit(screen.getByRole("button", { name: "Save category" }).closest("form")!);
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Please try again."));
  expect(screen.getByLabelText("Title")).toHaveValue("A better category");
});

it("opens an objective directly from a Catalyst link without planter editing", () => {
  render(<Workspace data={{ ...sampleWorkspace, viewer: sampleCatalyst.viewer }} initialObjective={sampleWorkspace.objectives[0].id}/>);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(sampleWorkspace.objectives[0].title);
  expect(screen.getByRole("button", { name: "Send reply" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Edit objective" })).not.toBeInTheDocument();
});
