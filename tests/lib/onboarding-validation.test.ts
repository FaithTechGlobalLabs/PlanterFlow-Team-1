import { describe, it, expect } from "vitest";
import {
  validateAcceptInvitation,
  validateChurch,
  validateFirstGoal,
  validateInvitePastor,
  validateInviteCatalyst,
} from "@/lib/validation/onboarding";

function form(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

describe("validateAcceptInvitation", () => {
  it("requires a name and an 8+ character password", () => {
    expect(validateAcceptInvitation(form({ name: "", password: "short" }))).toEqual({
      error: "invite.errors.required",
    });
    expect(validateAcceptInvitation(form({ name: "Alex", password: "short" }))).toEqual({
      error: "invite.errors.password",
    });
  });

  it("returns trimmed values when valid", () => {
    expect(
      validateAcceptInvitation(form({ name: " Alex Morgan ", password: "longenough", locale: "en" }))
    ).toEqual({ values: { name: "Alex Morgan", password: "longenough", locale: "en" } });
  });

  it("falls back to en for an unsupported locale", () => {
    const result = validateAcceptInvitation(form({ name: "Alex", password: "longenough", locale: "xx" }));
    expect(result).toEqual({ values: { name: "Alex", password: "longenough", locale: "en" } });
  });
});

describe("validateInvitePastor", () => {
  it("rejects a malformed email", () => {
    expect(validateInvitePastor(form({ email: "not-an-email" }))).toEqual({
      error: "invitePastor.errors.email",
    });
  });

  it("lowercases the email and makes church and welcome optional", () => {
    expect(validateInvitePastor(form({ email: "Pastor@HopeChurch.ca" }))).toEqual({
      values: { email: "pastor@hopechurch.ca", churchName: null, welcomeNote: null },
    });
  });
});

describe("validateInviteCatalyst", () => {
  it("rejects a malformed email", () => {
    expect(validateInviteCatalyst(form({ email: "not-an-email" }))).toEqual({
      error: "inviteCatalyst.errors.email",
    });
  });

  it("rejects a missing email", () => {
    expect(validateInviteCatalyst(form({ email: "" }))).toEqual({
      error: "inviteCatalyst.errors.email",
    });
  });

  it("lowercases the email and makes welcome note optional", () => {
    expect(validateInviteCatalyst(form({ email: "Catalyst@Example.com" }))).toEqual({
      values: { email: "catalyst@example.com", welcomeNote: null, makeAdmin: false },
    });
  });

  it("parses makeAdmin as true when set to 'on'", () => {
    expect(validateInviteCatalyst(form({ email: "admin@example.com", makeAdmin: "on" }))).toEqual({
      values: { email: "admin@example.com", welcomeNote: null, makeAdmin: true },
    });
  });

  it("parses makeAdmin as false when absent", () => {
    expect(validateInviteCatalyst(form({ email: "catalyst@example.com" }))).toEqual({
      values: { email: "catalyst@example.com", welcomeNote: null, makeAdmin: false },
    });
  });
});

describe("validateChurch", () => {
  it("requires church name, city and a planting start date", () => {
    expect(validateChurch(form({ name: "Hope Church", city: "", plantingStartDate: "" }))).toEqual({
      error: "onboarding.church.errors.required",
    });
  });

  it("rejects an invalid date", () => {
    expect(
      validateChurch(form({ name: "Hope Church", city: "Surrey", plantingStartDate: "not-a-date" }))
    ).toEqual({ error: "onboarding.church.errors.date" });
  });

  it("returns values when valid", () => {
    expect(
      validateChurch(form({ name: "Hope Church", city: "Surrey", plantingStartDate: "2026-01-15", vision: "" }))
    ).toEqual({
      values: { name: "Hope Church", city: "Surrey", plantingStartDate: "2026-01-15", vision: null },
    });
  });
});

describe("validateFirstGoal", () => {
  it("requires a category, a goal and a due date", () => {
    expect(validateFirstGoal(form({ categoryId: "", title: "Host dinners", dueDate: "2026-10-31" }))).toEqual({
      error: "onboarding.firstGoal.errors.required",
    });
  });

  it("returns values when valid, with checkpoint optional", () => {
    expect(
      validateFirstGoal(form({ categoryId: "cat-1", title: "Host two dinners", dueDate: "2026-10-31" }))
    ).toEqual({
      values: { categoryId: "cat-1", title: "Host two dinners", dueDate: "2026-10-31", checkpoint: null },
    });
  });
});
