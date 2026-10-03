import { describe, expect, it } from "vitest";
import { choiceField, idField, textField } from "@/lib/workspace/validation";

describe("workspace input boundaries", () => {
  it("rejects empty, oversized, and non-text input", () => {
    const f = new FormData();
    f.set("note", "   ");
    expect(() => textField(f, "note")).toThrow();
    f.set("note", "a".repeat(2001));
    expect(() => textField(f, "note")).toThrow();
    f.set("note", new File(["x"], "x.txt"));
    expect(() => textField(f, "note")).toThrow();
  });
  it("allows optional text while trimming required content", () => {
    const f = new FormData(); f.set("note", "  An honest update  ");
    expect(textField(f, "note")).toBe("An honest update");
    expect(textField(f, "support", 2000, false)).toBe("");
  });
  it("rejects unsupported choices and malformed record identifiers", () => {
    const f = new FormData(); f.set("cadence", "daily"); f.set("id", "someone-else");
    expect(() => choiceField(f, "cadence", ["weekly", "monthly"])).toThrow();
    expect(() => idField(f, "id")).toThrow();
    f.set("id", "c459f1f0-28cf-4ab8-9aab-2531a21a875d");
    expect(idField(f, "id")).toBe("c459f1f0-28cf-4ab8-9aab-2531a21a875d");
  });
});
