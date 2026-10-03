"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface SignInState {
  error?: string;
}

export async function signIn(
  prevState: SignInState | undefined,
  formData: FormData
): Promise<SignInState> {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "login.errors.required" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (
      error.message === "Invalid login credentials" ||
      error.message === "Email not confirmed"
    ) {
      return { error: "login.errors.invalid" };
    }
    return { error: "login.errors.generic" };
  }

  redirect("/");
  return {};
}
