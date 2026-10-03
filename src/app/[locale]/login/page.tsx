import { useTranslations } from "next-intl";
import { BrandNav } from "@/components/ui/BrandNav";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  const t = useTranslations();
  return <main className="login-shell">
    <BrandNav />
    <div className="login-layout">
      <section className="login-story" aria-labelledby="login-heading">
        <p className="login-eyebrow">{t("login.welcome")}</p>
        <h1 id="login-heading">{t("login.headline_desktop")}</h1>
        <p className="login-intro">{t("login.subline_desktop")}</p>
        <div className="login-globe" aria-hidden="true"><div className="login-sphere"><div className="login-land" /><span /><span /></div></div>
        <p className="login-story-note">{t("login.subline_mobile")}</p>
      </section>
      <section className="login-form-region" aria-label={t("login.welcome_back")}><LoginForm /></section>
    </div>
    <footer className="login-footer">First Fruits <span>·</span> {t("brand.network")}</footer>
  </main>;
}
