export function textField(form: FormData, name: string, max = 2000, required = true) {
  const value = form.get(name);
  if (typeof value !== "string") {
    if (!required) return "";
    throw new Error("Please complete the required fields.");
  }
  const result = value.trim();
  if (required && !result) throw new Error("Please complete the required fields.");
  if (result.length > max) throw new Error(`Please keep ${name.replaceAll("_", " ")} under ${max} characters.`);
  return result;
}
export function choiceField(form: FormData, name: string, choices: readonly string[]) {
  const value = textField(form, name, 80);
  if (!choices.includes(value)) throw new Error("Please choose one of the available options.");
  return value;
}
export function idField(form: FormData, name: string) {
  const value = textField(form, name, 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new Error("This record could not be identified. Refresh and try again.");
  return value;
}
