import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { InviteCatalystForm } from "@/app/[locale]/invite-catalyst/invite-catalyst-form";
import en from "../../messages/en.json";

describe("InviteCatalystForm", () => {
  it("renders email, welcome note, and admin checkbox", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <InviteCatalystForm />
      </NextIntlClientProvider>
    );

    expect(screen.getByLabelText("Catalyst email")).toBeInTheDocument();
    expect(screen.getByLabelText("Personal welcome (optional)")).toBeInTheDocument();
    expect(screen.getByLabelText("Also make this person an admin")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send invitation" })).toBeInTheDocument();
  });

  it("renders footnote text", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <InviteCatalystForm />
      </NextIntlClientProvider>
    );

    expect(
      screen.getByText("Catalysts can invite pastors. Admins can also invite catalysts.")
    ).toBeInTheDocument();
  });
});
