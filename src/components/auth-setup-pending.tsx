import { getTranslations } from "next-intl/server";
import { StatusPage } from "./status-page";
import { Button } from "./ui/Button";
import { signOut } from "@/app/[locale]/actions";

export async function AuthSetupPending() {
  const t = await getTranslations();
  return <StatusPage title={t("authSetup.title")} subline={t("authSetup.description")}
    cardTitle={t("authSetup.card_title")} cardBody={<p>{t("authSetup.body")}</p>}
    actions={<form action={signOut}><Button variant="secondary" type="submit">{t("common.sign_out")}</Button></form>} />;
}
