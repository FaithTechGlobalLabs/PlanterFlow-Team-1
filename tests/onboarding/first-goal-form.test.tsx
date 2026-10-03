import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { FirstGoalForm } from "@/app/[locale]/onboarding/first-goal/first-goal-form";
import en from "../../messages/en.json";

describe("FirstGoalForm", () => {
  it("renders all categories with radios", () => {
    const categories = [
      { id: "cat-1", title: "Engage the City" },
      { id: "cat-2", title: "Make Disciples" },
    ];

    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <FirstGoalForm categories={categories} />
      </NextIntlClientProvider>
    );

    expect(screen.getByText("Engage the City")).toBeInTheDocument();
    expect(screen.getByText("Make Disciples")).toBeInTheDocument();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);
    expect(radios[0]).toBeChecked();
    expect(radios[1]).not.toBeChecked();
  });
});
