import { describe, it, expect } from "vitest";
import { validateCategory } from "@/app/[locale]/catalyst/categories/validation";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("validateCategory", () => {
  it("trims values and stores an empty description as null", () => {
    expect(validateCategory(form({ title: "  Make Disciples ", description: "   " }))).toEqual({
      values: { title: "Make Disciples", description: null },
    });
  });

  it("requires a title", () => {
    expect(validateCategory(form({ title: "   " }))).toEqual({ error: "title_required" });
  });

  it("rejects an overlong title or description", () => {
    expect(validateCategory(form({ title: "x".repeat(81) }))).toEqual({ error: "title_too_long" });
    expect(validateCategory(form({ title: "Ok", description: "x".repeat(281) }))).toEqual({
      error: "description_too_long",
    });
  });

  it("keeps Unicode titles intact", () => {
    expect(validateCategory(form({ title: "도시와 함께" }))).toEqual({
      values: { title: "도시와 함께", description: null },
    });
  });
});
