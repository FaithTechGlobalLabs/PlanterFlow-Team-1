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
});
