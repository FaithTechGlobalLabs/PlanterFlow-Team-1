"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

interface InviteLinkNoticeProps {
  link: string;
  email: string;
}

export function InviteLinkNotice({ link, email }: InviteLinkNoticeProps) {
  const t = useTranslations("inviteLink");
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-[var(--color-sage)] p-4">
      <p className="text-[13px] font-bold text-[var(--color-ink)]">{t("title")}</p>
      <p className="text-[12px] text-[var(--color-muted)]">{t("body", { email })}</p>
      <input
        readOnly
        value={link}
        aria-label={t("field_label")}
        onFocus={(event) => event.currentTarget.select()}
        className="w-full rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white px-3 py-2 text-[12px]"
      />
      <Button variant="secondary" fullWidth={false} onClick={copy}>
        {copied ? t("copied") : t("copy")}
      </Button>
    </div>
  );
}
