"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";

export function ExportReportButton({
  planterId,
  className = "",
  label,
}: {
  planterId: string;
  planterName?: string;
  label?: string;
  className?: string;
}) {
  const t = useTranslations("catalyst.exportReport");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/export/planter/${planterId}.pdf`);
      if (!response.ok) {
        setError(
          response.status === 403
            ? t("errors.forbidden")
            : response.status === 401
              ? t("errors.unauthorized")
              : t("failedExport"),
        );
        setLoading(false);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `planter-report-${planterId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setLoading(false);
    } catch {
      setError(t("unexpectedError"));
      setLoading(false);
    }
  }

  return (
    <div
      className={`ff-export inline-flex flex-col items-start gap-1 ${className}`}
    >
      <Button
        variant="secondary"
        fullWidth={false}
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="ff-export__button gap-2"
      >
        {loading ? (
          <>
            <span
              className="ff-export__spinner animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full"
              aria-hidden="true"
            />
            <span className="ff-export__label">{t("generating")}</span>
          </>
        ) : (
          <>
            <svg
              aria-hidden="true"
              className="ff-export__icon w-3.5 h-3.5 opacity-80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="ff-export__label">
              {label ?? t("buttonLabel")}
            </span>
          </>
        )}
      </Button>
      {error && (
        <p
          role="alert"
          className="ff-export__error text-sm font-semibold text-[var(--color-danger)] bg-[var(--color-danger-surface)] border border-[var(--color-danger-border)] rounded px-2 py-0.5"
        >
          {error}
        </p>
      )}
    </div>
  );
}
