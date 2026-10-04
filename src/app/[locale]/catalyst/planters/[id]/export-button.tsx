"use client";

import { ExportReportButton } from "@/components/workspace/export-report-button";

/** The review page and workspace share one download and error flow. */
export function ExportButton(props: {
  planterId: string;
  label?: string;
  className?: string;
}) {
  return <ExportReportButton {...props} />;
}
