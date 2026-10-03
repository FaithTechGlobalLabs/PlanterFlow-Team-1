import { render, screen } from "@testing-library/react";
import { Input } from "@/components/ui/Input";
import { describe, it, expect } from "vitest";

describe("Input", () => {
  it("renders label and input", () => {
    render(<Input label="Email" />);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("renders error message when provided", () => {
    render(<Input label="Email" error="Email is required" />);
    expect(screen.getByText("Email is required")).toBeInTheDocument();
  });

  it("renders with placeholder", () => {
    const { container } = render(
      <Input placeholder="name@example.com" />
    );
    const input = container.querySelector("input");
    expect(input?.placeholder).toBe("name@example.com");
  });

  it("accepts password input type", () => {
    const { container } = render(<Input type="password" />);
    const input = container.querySelector("input");
    expect(input?.type).toBe("password");
  });
});
