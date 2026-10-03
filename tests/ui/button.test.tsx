import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/Button";
import { describe, it, expect } from "vitest";

describe("Button", () => {
  it("renders primary button with correct text", () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("renders secondary button with correct text", () => {
    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByText("Secondary")).toBeInTheDocument();
  });

  it("disables button when disabled prop is true", () => {
    const { container } = render(
      <Button variant="primary" disabled>
        Disabled
      </Button>
    );
    const button = container.querySelector("button");
    expect(button).toBeDisabled();
  });

  it("greys out a disabled button and keeps enabled ones colored", () => {
    const { container } = render(
      <>
        <Button variant="primary" disabled>Off</Button>
        <Button variant="primary">On</Button>
      </>
    );
    const [off, on] = Array.from(container.querySelectorAll("button"));
    expect(off.className).toContain("bg-[var(--color-border)]");
    expect(off.className).toContain("cursor-not-allowed");
    expect(off.className).not.toContain("bg-[var(--color-blue)]");
    expect(on.className).toContain("bg-[var(--color-blue)]");
  });
});
