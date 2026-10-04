import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { AcceptForm } from "@/app/[locale]/invite/[token]/accept-form";
import en from "../../messages/en.json";

describe("AcceptForm", () => {
  it("renders catalyst variant with language selector", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <AcceptForm token="test-token" role="catalyst" sessionReady={true} />
      </NextIntlClientProvider>
    );

    expect(screen.getByLabelText("Your name")).toBeInTheDocument();
    expect(screen.getByLabelText("Preferred language")).toBeInTheDocument();
    expect(screen.getByLabelText("Create password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept and continue" })).toBeInTheDocument();
  });

  it("renders planter variant without language selector", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <AcceptForm token="test-token" role="planter" sessionReady={true} />
      </NextIntlClientProvider>
    );

    expect(screen.getByLabelText("Your name")).toBeInTheDocument();
    expect(screen.queryByLabelText("Preferred language")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Create password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept and continue" })).toBeInTheDocument();
  });

  it("disables submit button when session not ready", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <AcceptForm token="test-token" role="planter" sessionReady={false} />
      </NextIntlClientProvider>
    );

    const submitButton = screen.getByRole("button", { name: "Accept and continue" });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText("Open the link from your invitation email to continue.")).toBeInTheDocument();
  });
});

describe("AcceptForm team variant", () => {
  it("renders peer variant with language selector", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <AcceptForm token="test-token" role="peer" sessionReady={true} />
      </NextIntlClientProvider>
    );
    expect(screen.getByLabelText("Preferred language")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept and continue" })).toBeInTheDocument();
  });
});
