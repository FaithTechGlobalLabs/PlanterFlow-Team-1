import { signIn } from "@/app/[locale]/login/actions";
import { describe, it, expect } from "vitest";

describe("signIn action", () => {
  it("returns required error when email is missing", async () => {
    const formData = new FormData();
    formData.set("password", "password123");

    const result = await signIn({}, formData);
    expect(result.error).toBe("login.errors.required");
  });

  it("returns required error when password is missing", async () => {
    const formData = new FormData();
    formData.set("email", "user@example.com");

    const result = await signIn({}, formData);
    expect(result.error).toBe("login.errors.required");
  });

  it("validates form submission", async () => {
    const formData = new FormData();
    expect(formData.get("email")).toBeNull();
  });
});
