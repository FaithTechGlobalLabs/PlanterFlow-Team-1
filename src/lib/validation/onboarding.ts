export type ValidationResult<T> =
  | { error: string }
  | { values: T };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUPPORTED_LOCALES = ["en"];

function isValidDate(dateString: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString) && !isNaN(new Date(dateString).getTime());
}

export function validateAcceptInvitation(
  formData: FormData
): ValidationResult<{ name: string; password: string; locale: string }> {
  const name = formData.get("name")?.toString().trim() || "";
  const password = formData.get("password")?.toString() || "";
  const locale = formData.get("locale")?.toString() || "en";

  if (!name || !password) {
    return { error: "invite.errors.required" };
  }

  if (password.length < 8) {
    return { error: "invite.errors.password" };
  }

  const validLocale = SUPPORTED_LOCALES.includes(locale) ? locale : "en";

  return { values: { name, password, locale: validLocale } };
}

export function validateInvitePastor(
  formData: FormData
): ValidationResult<{ email: string; churchName: string | null; welcomeNote: string | null }> {
  const email = formData.get("email")?.toString().trim().toLowerCase() || "";
  const churchName = formData.get("churchName")?.toString().trim() || null;
  const welcomeNote = formData.get("welcomeNote")?.toString().trim() || null;

  if (!EMAIL_REGEX.test(email)) {
    return { error: "invitePastor.errors.email" };
  }

  return {
    values: {
      email,
      churchName: churchName || null,
      welcomeNote: welcomeNote || null,
    },
  };
}

export function validateInviteTeam(
  formData: FormData
): ValidationResult<{ email: string; welcomeNote: string | null }> {
  const email = formData.get("email")?.toString().trim().toLowerCase() || "";
  const welcomeNote = formData.get("welcomeNote")?.toString().trim() || null;

  if (!EMAIL_REGEX.test(email)) {
    return { error: "inviteTeam.errors.email" };
  }

  return { values: { email, welcomeNote: welcomeNote || null } };
}

export function validateInviteCatalyst(
  formData: FormData
): ValidationResult<{ email: string; welcomeNote: string | null; makeAdmin: boolean }> {
  const email = formData.get("email")?.toString().trim().toLowerCase() || "";
  const welcomeNote = formData.get("welcomeNote")?.toString().trim() || null;
  const makeAdminRaw = formData.get("makeAdmin")?.toString() || "";
  const makeAdmin = makeAdminRaw === "on" || makeAdminRaw === "true";

  if (!EMAIL_REGEX.test(email)) {
    return { error: "inviteCatalyst.errors.email" };
  }

  return {
    values: {
      email,
      welcomeNote: welcomeNote || null,
      makeAdmin,
    },
  };
}

export function validateChurch(
  formData: FormData
): ValidationResult<{ name: string; city: string; plantingStartDate: string; vision: string | null }> {
  const name = formData.get("name")?.toString().trim() || "";
  const city = formData.get("city")?.toString().trim() || "";
  const plantingStartDate = formData.get("plantingStartDate")?.toString().trim() || "";
  const vision = formData.get("vision")?.toString().trim() || null;

  if (!name || !city || !plantingStartDate) {
    return { error: "onboarding.church.errors.required" };
  }

  if (!isValidDate(plantingStartDate)) {
    return { error: "onboarding.church.errors.date" };
  }

  return {
    values: {
      name,
      city,
      plantingStartDate,
      vision: vision || null,
    },
  };
}

export function validateFirstGoal(
  formData: FormData
): ValidationResult<{ categoryId: string; title: string; dueDate: string; checkpoint: string | null }> {
  const categoryId = formData.get("categoryId")?.toString().trim() || "";
  const title = formData.get("title")?.toString().trim() || "";
  const dueDate = formData.get("dueDate")?.toString().trim() || "";
  const checkpoint = formData.get("checkpoint")?.toString().trim() || null;

  if (!categoryId || !title || !dueDate) {
    return { error: "onboarding.firstGoal.errors.required" };
  }

  return {
    values: {
      categoryId,
      title,
      dueDate,
      checkpoint: checkpoint || null,
    },
  };
}
