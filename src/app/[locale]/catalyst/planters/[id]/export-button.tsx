"use client";

import { Button } from "@/components/ui/Button";

interface ExportButtonProps {
  planterId: string;
  label?: string;
  className?: string;
}

export function ExportButton({
  planterId,
  label = "Export PDF Report",
  className = "",
}: ExportButtonProps) {
  const handleExport = () => {
    const url = `/api/export/planter/${planterId}`;
    window.open(url, "_blank");
  };

  return (
    <Button
      variant="secondary"
      onClick={handleExport}
      fullWidth={false}
      className={`exportButton min-w-[180px] ${className}`.trim()}
    >
      📄 {label}
    </Button>
  );
}
