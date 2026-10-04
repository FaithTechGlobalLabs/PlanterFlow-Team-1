import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import en from "../../messages/en.json";

vi.mock("@/app/[locale]/catalyst/categories/actions", () => ({
  addCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  moveCategory: vi.fn(),
}));

import { CategoryManager, type CategoryView } from "@/app/[locale]/catalyst/categories/category-manager";

const categories: CategoryView[] = [
  { id: "engage", title: "Engage the City", description: "Know your neighbours.", isPrayer: false, objectiveCount: 2 },
  { id: "spare", title: "Spare", description: null, isPrayer: false, objectiveCount: 0 },
];

function renderManager(list: CategoryView[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <CategoryManager categories={list} />
    </NextIntlClientProvider>
  );
}

describe("CategoryManager", () => {
  it("lists categories with their objective counts", () => {
    renderManager(categories);
    expect(screen.getByRole("heading", { name: "Engage the City" })).toBeInTheDocument();
    expect(screen.getByText("Know your neighbours.")).toBeInTheDocument();
    expect(screen.getByText("2 objectives")).toBeInTheDocument();
    expect(screen.getByText("No objectives yet")).toBeInTheDocument();
  });

  it("disables delete for a category in use and explains why", () => {
    renderManager(categories);
    const [inUse, unused] = screen.getAllByRole("button", { name: "Delete" });
    expect(inUse).toBeDisabled();
    expect(unused).toBeEnabled();
    expect(screen.getByText(/can't be deleted. You can still rename it./)).toBeInTheDocument();
  });

  it("keeps the prayer category from being deleted", () => {
    renderManager([{ id: "prayer", title: "Prayer Requests", description: null, isPrayer: true, objectiveCount: 0 }]);
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
    expect(screen.getByText("Prayer workflow")).toBeInTheDocument();
    expect(screen.getByText(/opens the prayer workflow/)).toBeInTheDocument();
  });

  it("disables moving past either end of the list", () => {
    renderManager(categories);
    expect(screen.getByRole("button", { name: "Move Engage the City up" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move Spare down" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move Spare up" })).toBeEnabled();
  });

  it("offers an add form and an empty state", () => {
    renderManager([]);
    expect(screen.getByText("No categories yet. Add the first one below.")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeRequired();
    expect(screen.getByRole("button", { name: "Add category" })).toBeInTheDocument();
  });
});
