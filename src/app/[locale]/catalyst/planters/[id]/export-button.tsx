"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

function useExportReportTranslation() {
  try {
    return useTranslations("catalyst.exportReport");
  } catch {
    return (key: string) => {
      const map: Record<string, string> = {
        buttonLabel: "Export PDF Report",
        generating: "Generating PDF...",
        failedExport: "Failed to export report.",
        unexpectedError: "An unexpected error occurred while exporting.",
      };
      return map[key] ?? key;
    };
  }
}

interface ExportButtonProps {
  planterId: string;
  label?: string;
  className?: string;
}

export function ExportButton({
  planterId,
  label,
  className = "",
}: ExportButtonProps) {
  const t = useExportReportTranslation();
  const displayLabel = label ?? t("buttonLabel");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/export/planter/${planterId}.pdf`);
      if (!response.ok) {
        let errorMsg = t("failedExport");
        try {
          const body = await response.json();
          if (body.error) errorMsg = body.error;
        } catch {
          // ignore parsing errors
        }
        setError(errorMsg);
        setLoading(false);
        return;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `planter-report-${planterId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setLoading(false);
    } catch {
      setError(t("unexpectedError"));
      setLoading(false);
    }
  };

  return (
    <div className="planter-export-wrapper flex flex-col items-start gap-1">
      <Button
        variant="secondary"
        onClick={handleExport}
        disabled={loading}
        fullWidth={false}
        className={`exportButton min-w-[180px] ${className}`.trim()}
      >
        {loading ? (
          <>
            <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full mr-2" aria-hidden="true" />
            <span>{t("generating")}</span>
          </>
        ) : (
          <>📄 {displayLabel}</>
        )}
      </Button>
      {error && (
        <p role="alert" className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded px-2 py-0.5 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
