import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render as rtlRender, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import en from "../../messages/en.json";
import { sampleWorkspace } from "@/lib/workspace/sample";

const mocks = vi.hoisted(() => ({ save: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/i18n/routing", () => ({ Link: ({ children, href, ...props }: { children: ReactNode; href: string }) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/app/[locale]/dashboard/actions", () => ({ saveWorkspace: mocks.save }));
vi.mock("@/app/[locale]/actions", () => ({ signOut: vi.fn() }));
import { Workspace } from "@/components/workspace/workspace";

function render(ui: ReactNode) {
  return rtlRender(
    <NextIntlClientProvider locale="en" timeZone="America/Vancouver" messages={en}>
      {ui}
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  mocks.save.mockReset();
  mocks.refresh.mockReset();
  HTMLDialogElement.prototype.showModal = function() { this.open = true; };
});

describe("planter workspace", () => {
  it("opens an objective with activities and Catalyst conversation", () => {
    render(<Workspace data={sampleWorkspace}/>);
    fireEvent.click(screen.getByRole("button", { name: /Engage the City Build deeper roots/ }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Build deeper roots");
    expect(screen.getByText("Share coffee with two neighbours", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText(/I love how you’re making space to listen/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "← All objectives" }));
    expect(screen.getByPlaceholderText("Search by title or category…")).toBeInTheDocument();
  });

  it("retains the progress draft when persistence fails", async () => {
    mocks.save.mockResolvedValue({
      ok: false,
      error: "Connection failed. Try again.",
    });

    render(<Workspace data={sampleWorkspace} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Engage the City Build deeper roots/,
      })
    );

    const draft = screen.getByLabelText(
      "How is this objective progressing?"
    );

    fireEvent.change(draft, {
      target: { value: "A draft worth keeping" },
    });

    fireEvent.submit(
      screen
        .getByRole("button", { name: "Share progress" })
        .closest("form")!
    );

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Connection failed"
      )
    );

    expect(draft).toHaveValue("A draft worth keeping");
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("refreshes after successfully sharing objective progress", async () => {
    mocks.save.mockResolvedValue({ ok: true, id: "saved" });

    render(<Workspace data={sampleWorkspace} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Engage the City Build deeper roots/,
      })
    );

    fireEvent.change(
      screen.getByLabelText("How is this objective progressing?"),
      {
        target: { value: "Made progress this week" },
      }
    );

    fireEvent.submit(
      screen
        .getByRole("button", { name: "Share progress" })
        .closest("form")!
    );

    await waitFor(() =>
      expect(mocks.refresh).toHaveBeenCalledOnce()
    );

    expect(mocks.save).toHaveBeenCalledOnce();

    const form = mocks.save.mock.calls[0][0] as FormData;

    expect(form.get("intent")).toBe("progress");
    expect(form.get("note")).toBe("Made progress this week");
  });

  it("lets Catalysts read and reply without presenting planter editing controls", () => {
    render(<Workspace data={{ ...sampleWorkspace, viewer: sampleWorkspace.people[1] }}/>);

    expect(screen.queryByRole("button", { name: "Quick check-in" })).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Engage the City Build deeper roots/ })
    );

    expect(screen.getByRole("button", { name: "Send reply" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit objective" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Share progress" })).not.toBeInTheDocument();
  });

  it("never calls the live save action from the sample preview", async () => {
    render(<Workspace data={sampleWorkspace} preview />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Engage the City Build deeper roots/,
      })
    );

    fireEvent.change(
      screen.getByLabelText("How is this objective progressing?"),
      {
        target: { value: "Preview progress" },
      }
    );

    fireEvent.submit(
      screen
        .getByRole("button", { name: "Share progress" })
        .closest("form")!
    );

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "visual preview"
      )
    );

    expect(mocks.save).not.toHaveBeenCalled();
  });
});

describe("objective drafts", () => {
  const titleLabel = "What are you working toward?";
  function create() { fireEvent.click(screen.getByRole("button", { name: "Create objective" })); }
  function dismiss() { fireEvent.click(screen.getByRole("dialog")); }
  function edit(id: string) {
    fireEvent.click(screen.getByRole("button", { name: /^Objectives/ }));
    fireEvent.click(screen.getByRole("button", { name: `Open ${sampleWorkspace.objectives.find(o => o.id === id)!.title}` }));
    fireEvent.click(screen.getByRole("button", { name: "Edit objective" }));
  }
  it("restores every field after closing the new-objective modal", () => {
    render(<Workspace data={sampleWorkspace} />);
    create();
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: sampleWorkspace.categories[0].id } });
    fireEvent.change(screen.getByLabelText(titleLabel), { target: { value: "My unfinished goal" } });
    fireEvent.change(screen.getByLabelText("Why does it matter? (optional)"), { target: { value: "Important context" } });
    fireEvent.change(screen.getByLabelText("Target date (optional)"), { target: { value: "2027-01-15" } });
    fireEvent.change(screen.getByLabelText("Progress rhythm"), { target: { value: "monthly" } });
    fireEvent.click(screen.getByLabelText("Share with Church Team"));
    dismiss();
    create();
    expect(screen.getByLabelText(titleLabel)).toHaveValue("My unfinished goal");
    expect(screen.getByLabelText("Category")).toHaveValue(sampleWorkspace.categories[0].id);
    expect(screen.getByLabelText("Why does it matter? (optional)")).toHaveValue("Important context");
    expect(screen.getByLabelText("Target date (optional)")).toHaveValue("2027-01-15");
    expect(screen.getByLabelText("Progress rhythm")).toHaveValue("monthly");
    expect(screen.getByLabelText("Share with Church Team")).toBeChecked();
  });
  it("keeps new and individual edit drafts separate, including empty values", () => {
    render(<Workspace data={sampleWorkspace} />);
    create();
    fireEvent.change(screen.getByLabelText(titleLabel), { target: { value: "New draft" } });
    dismiss();
    edit(sampleWorkspace.objectives[0].id);
    fireEvent.change(screen.getByLabelText(titleLabel), { target: { value: "" } });
    dismiss();
    edit(sampleWorkspace.objectives[1].id);
    expect(screen.getByLabelText(titleLabel)).toHaveValue(sampleWorkspace.objectives[1].title);
    dismiss();
    edit(sampleWorkspace.objectives[0].id);
    expect(screen.getByLabelText(titleLabel)).toHaveValue("");
    dismiss();
    fireEvent.click(screen.getByRole("button", { name: "Garden" }));
    create();
    expect(screen.getByLabelText(titleLabel)).toHaveValue("New draft");
  });
  it("clears a discarded draft", () => {
    render(<Workspace data={sampleWorkspace} />);
    create();
    fireEvent.change(screen.getByLabelText(titleLabel), { target: { value: "Discard me" } });
    fireEvent.click(screen.getByRole("button", { name: "Discard draft" }));
    create();
    expect(screen.getByLabelText(titleLabel)).toHaveValue("");
  });
  it("retains a failed-save draft after dismissing and reopening", async () => {
    mocks.save.mockResolvedValue({ ok: false, error: "Save failed" });
    render(<Workspace data={sampleWorkspace} />);
    create();
    fireEvent.change(screen.getByLabelText(titleLabel), { target: { value: "Keep me" } });
    fireEvent.submit(screen.getByLabelText(titleLabel).closest("form")!);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Save failed"));
    dismiss();
    create();
    expect(screen.getByLabelText(titleLabel)).toHaveValue("Keep me");
  });
  it("clears the draft after a successful save", async () => {
    mocks.save.mockResolvedValue({ ok: true });
    render(<Workspace data={sampleWorkspace} />);
    create();
    fireEvent.change(screen.getByLabelText(titleLabel), { target: { value: "Saved goal" } });
    fireEvent.submit(screen.getByLabelText(titleLabel).closest("form")!);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    create();
    expect(screen.getByLabelText(titleLabel)).toHaveValue("");
  });
});
