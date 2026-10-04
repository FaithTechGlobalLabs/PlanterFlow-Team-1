import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import { LoginForm } from "@/app/[locale]/login/login-form";

function renderForm() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <LoginForm />
    </NextIntlClientProvider>
  );
}

describe("LoginForm", () => {
  it("renders the existing email/password sign-in flow", () => {
    renderForm();

    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "type",
      "email"
    );

    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "type",
      "password"
    );

    expect(
      screen.getByRole("button", { name: "Sign in" })
    ).toBeInTheDocument();
  });

  it("preserves password recovery and invitation navigation", () => {
    renderForm();

    expect(
      screen.getByRole("link", { name: "Forgot password?" })
    ).toHaveAttribute("href", "/en/recover");

    expect(
      screen.getByRole("link", { name: "Accept invitation" })
    ).toHaveAttribute("href", "/en/invite");

    expect(
      screen.getByText(
        "Invitation only · Contact your catalyst for access."
      )
    ).toBeInTheDocument();
  });
});
