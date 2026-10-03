import { useTranslations } from "next-intl";
import { BrandNav } from "@/components/ui/BrandNav";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlobeCard } from "@/components/globe-card";
import { LoginForm } from "./login-form";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] p-8 md:p-10">
      <BrandNav />

      <div className="mt-8 max-w-4xl mx-auto">
        <div className="hidden md:block mb-12">
          <PageHeader
            eyebrow={t("login.welcome")}
            title={t("login.headline_desktop")}
            subline={t("login.subline_desktop")}
          />
        </div>

        <div className="md:hidden mb-12">
          <PageHeader
            eyebrow={t("login.welcome")}
            title={t("login.headline_mobile")}
            subline={t("login.subline_mobile")}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <GlobeCard />
          <LoginForm />
        </div>

        <div className="hidden md:block">
          <Button
            variant="secondary"
            href="/recover"
            className="w-[300px]"
          >
            {t("login.forgot_password")}
          </Button>
        </div>
      </div>
    </div>
  );
}
