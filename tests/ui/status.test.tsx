import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Status } from "@/components/ui/Status";

describe("Status chip", () => {
  it("renders its label in the sage/green chip style", () => {
    render(<Status>Role: Catalyst</Status>);
    const chip = screen.getByText("Role: Catalyst");
    expect(chip).toBeInTheDocument();
    expect(chip.className).toContain("bg-[var(--color-sage)]");
    expect(chip.className).toContain("text-[var(--color-green)]");
  });
});
