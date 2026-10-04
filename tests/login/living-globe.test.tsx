import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LivingGlobe } from "@/components/living-globe";

describe("LivingGlobe", () => {
  it("exposes one meaningful accessible visual", () => {
    const { container } = render(
      <LivingGlobe label="Church plants growing and flourishing around the world." />
    );

    expect(
      screen.getByRole("img", {
        name: "Church plants growing and flourishing around the world.",
      })
    ).toBeInTheDocument();

    expect(
      container.querySelector(".living-globe__sphere")
    ).toHaveAttribute("aria-hidden", "true");
  });

  it("renders the six decorative church-plant markers", () => {
    const { container } = render(
      <LivingGlobe label="Church plants growing and flourishing around the world." />
    );

    expect(
      container.querySelectorAll(".living-tree")
    ).toHaveLength(6);
  });
});
