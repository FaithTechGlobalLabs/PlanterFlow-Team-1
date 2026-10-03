import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { InviteLinkNotice } from "@/components/invite-link-notice";
import en from "../../messages/en.json";

const link = "https://example.supabase.co/auth/v1/verify?token=abc";

function renderNotice() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <InviteLinkNotice link={link} email="pastor@hopechurch.ca" />
    </NextIntlClientProvider>
  );
}

describe("InviteLinkNotice", () => {
  it("shows the link and who to send it to", () => {
    renderNotice();

    expect(screen.getByLabelText("Invitation link")).toHaveValue(link);
    expect(screen.getByText(/pastor@hopechurch\.ca/)).toBeInTheDocument();
  });

  it("copies the link to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    renderNotice();

    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

    expect(writeText).toHaveBeenCalledWith(link);
    expect(await screen.findByRole("button", { name: "Copied" })).toBeInTheDocument();
  });
});
