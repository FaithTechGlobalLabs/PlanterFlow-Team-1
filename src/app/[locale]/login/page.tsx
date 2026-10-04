import { useTranslations } from "next-intl";
import { BrandNav } from "@/components/ui/BrandNav";
import { LivingGlobe } from "@/components/living-globe";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  const t = useTranslations();

  return (
    <main className="login-shell">
      <BrandNav />

      <div className="login-layout">
        <section className="login-story" aria-labelledby="login-heading">
          <div className="login-copy">
            <p className="login-eyebrow">{t("login.welcome")}</p>

            <h1 id="login-heading">
              {t("login.headline_desktop")}
            </h1>

            <p className="login-intro">
              {t("login.subline_desktop")}
            </p>
          </div>

          <div className="login-visual-stage">
            <LivingGlobe label={t("login.globe_label")} />
          </div>

          <p className="login-story-note">
            {t("login.subline_mobile")}
          </p>
        </section>

        <section
          className="login-form-region"
          aria-label={t("login.welcome_back")}
        >
          <LoginForm />
        </section>
      </div>

      <footer className="login-footer">
        First Fruits <span>·</span> {t("brand.network")}
      </footer>
    </main>
  );
}
