"use client";

import { Button } from "@/components/ui/Button";

interface ExportButtonProps {
  planterId: string;
  label?: string;
}

export function ExportButton({ planterId, label = "Export PDF Report" }: ExportButtonProps) {
  const handleExport = () => {
    const url = `/api/export/planter/${planterId}`;
    window.open(url, "_blank");
  };

  return (
    <Button
      variant="secondary"
      onClick={handleExport}
      fullWidth={false}
      className="min-w-[180px]"
    >
      📄 {label}
    </Button>
  );
}
