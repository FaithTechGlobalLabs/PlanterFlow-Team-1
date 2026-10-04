import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import en from "../../messages/en.json";
import { ExportReportButton } from "@/components/workspace/export-report-button";

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider
      locale="en"
      timeZone="America/Vancouver"
      messages={en}
    >
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("ExportReportButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders export button", () => {
    renderWithIntl(<ExportReportButton planterId="planter-1" />);
    expect(
      screen.getByRole("button", { name: /Export PDF report/i }),
    ).toBeInTheDocument();
  });

  it("displays loading state while exporting and handles error response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        error: "Forbidden: You are not authorized to export these records.",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithIntl(<ExportReportButton planterId="planter-1" />);
    const button = screen.getByRole("button", { name: /Export PDF report/i });

    fireEvent.click(button);

    // Shows loading state
    expect(screen.getByText("Generating PDF...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Forbidden: You are not authorized to export these records.",
      );
    });

    expect(
      screen.getByRole("button", { name: /Export PDF report/i }),
    ).toBeInTheDocument();
  });
});
