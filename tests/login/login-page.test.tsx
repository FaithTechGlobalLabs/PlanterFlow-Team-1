import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, it, expect } from "vitest";
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
  it("renders email and password fields with a sign-in button", () => {
    renderForm();
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("links to the invitation page", () => {
    renderForm();
    expect(screen.getByRole("link", { name: "Accept invitation" })).toHaveAttribute(
      "href",
      "/en/invite"
    );
  });
});
