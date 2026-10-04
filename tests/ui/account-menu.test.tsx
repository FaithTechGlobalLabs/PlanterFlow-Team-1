import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccountMenu } from "@/components/workspace/account-menu";
vi.mock("@/app/[locale]/actions", () => ({ signOut: vi.fn() }));
vi.mock("@/i18n/routing", () => ({ Link: "a" }));

describe("workspace account menu", () => {
  it("offers switch account and sign out using the existing sign-out form", () => {
    const { container } = render(<AccountMenu name="Daniel Park" />);
    const details = container.querySelector("details")!;
    details.open = true;
    expect(screen.getByRole("button", { name: "Switch account" })).toHaveAttribute("type", "submit");
    expect(screen.getByRole("button", { name: "Sign out" }).closest("form")).toBe(screen.getByRole("button", { name: "Switch account" }).closest("form"));
  });
  it("closes on Escape and outside pointer presses", () => {
    const { container } = render(<AccountMenu name="Daniel Park" />);
    const details = container.querySelector("details")!;
    details.open = true;
    fireEvent.keyDown(document, { key: "Escape" });
    expect(details.open).toBe(false);
    expect(container.querySelector("summary")).toHaveFocus();
    details.open = true;
    fireEvent.pointerDown(document.body);
    expect(details.open).toBe(false);
  });
  it("shows sign in instead of ending a real session in preview", () => {
    const { container } = render(<AccountMenu name="Sample" preview />);
    container.querySelector("details")!.open = true;
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
  });
});
