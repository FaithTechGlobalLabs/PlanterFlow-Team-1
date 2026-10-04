import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectiveBoard } from "@/components/workspace/objective-board";
import { sampleWorkspace } from "@/lib/workspace/sample";
import { OBJECTIVE_STATUSES, OBJECTIVE_STATUS_LABELS } from "@/lib/workspace/objective-status";
import type { Objective, SaveResult } from "@/lib/workspace/types";

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
const objective: Objective = { ...sampleWorkspace.objectives[0], status: "planning" };
const save = vi.fn<(form: FormData) => Promise<SaveResult>>();
function board(canManage = true, objectives = [objective]) {
  return <ObjectiveBoard objectives={objectives} categoryTitle={() => "Community"}
    canManage={canManage} perform={save} onOpen={vi.fn()} />;
}
beforeEach(() => { save.mockReset(); mocks.refresh.mockReset(); });

describe("objective board", () => {
  it("shows every status, including empty columns", () => {
    render(board());
    for (const status of OBJECTIVE_STATUSES) {
      expect(screen.getByRole("region", { name: OBJECTIVE_STATUS_LABELS[status] })).toBeInTheDocument();
    }
    expect(screen.getAllByText("No objectives here.")).toHaveLength(4);
  });
  it("moves only after a successful save and submits the objective id", async () => {
    save.mockResolvedValue({ ok: true, id: objective.id });
    render(board());
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "at_risk" } });
    await waitFor(() => expect(within(screen.getByRole("region", { name: "At Risk" }))
      .getByRole("button", { name: `Open ${objective.title}` })).toBeInTheDocument());
    const form = save.mock.calls[0][0];
    expect(form.get("intent")).toBe("objective_status");
    expect(form.get("objective_id")).toBe(objective.id);
    expect(form.get("status")).toBe("at_risk");
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
  it("retains the original column and status when saving fails", async () => {
    save.mockResolvedValue({ ok: false, error: "Only the planter can make this change." });
    render(board());
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "complete" } });
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Only the planter"));
    expect(screen.getByRole("combobox")).toHaveValue("planning");
    expect(within(screen.getByRole("region", { name: "Planning" }))
      .getByRole("button", { name: `Open ${objective.title}` })).toBeInTheDocument();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it("does not expose status controls to read-only viewers", () => {
    render(board(false));
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Open ${objective.title}` })).toBeInTheDocument();
  });
  it("retains status on network failure", async () => {
    save.mockRejectedValue(new Error("offline"));
    render(board());
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "archived" } });
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Connection interrupted"));
    expect(screen.getByRole("combobox")).toHaveValue("planning");
  });
  it("disables the control while a save is pending", async () => {
    let finish!: (result: SaveResult) => void;
    save.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    render(board());
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "in_progress" } });
    expect(screen.getByRole("combobox")).toBeDisabled();
    finish({ ok: true });
    await waitFor(() => expect(screen.getByRole("combobox")).toBeEnabled());
    expect(save).toHaveBeenCalledOnce();
  });
  it("can restore an archived objective to Planning", async () => {
    save.mockResolvedValue({ ok: true });
    render(board(true, [{ ...objective, status: "archived" }]));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "planning" } });
    await waitFor(() => expect(within(screen.getByRole("region", { name: "Planning" }))
      .getByRole("button", { name: `Open ${objective.title}` })).toBeInTheDocument());
  });
});

describe("dragging objectives", () => {
  function dragTo(name: string) {
    const dataTransfer = { setData: vi.fn(), setDragImage: vi.fn(), effectAllowed: "", dropEffect: "" };
    fireEvent.dragStart(screen.getByText("Drag to move"), { dataTransfer });
    expect(dataTransfer.setDragImage).toHaveBeenCalledWith(screen.getByRole("article"), expect.any(Number), expect.any(Number));
    const column = screen.getByRole("region", { name });
    fireEvent.dragOver(column, { dataTransfer });
    fireEvent.drop(column, { dataTransfer });
  }
  it("saves a dropped card in its destination column", async () => {
    save.mockResolvedValue({ ok: true });
    render(board());
    dragTo("In Progress");
    await waitFor(() => expect(within(screen.getByRole("region", { name: "In Progress" })).getByRole("button")).toBeInTheDocument());
    expect(save.mock.calls[0][0].get("status")).toBe("in_progress");
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
  it("keeps a rejected drop in the original column", async () => {
    save.mockResolvedValue({ ok: false, error: "Save failed" });
    render(board());
    dragTo("Complete");
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Save failed"));
    expect(within(screen.getByRole("region", { name: "Planning" })).getByRole("button")).toBeInTheDocument();
  });
  it("does not save a drop into the same column", () => {
    render(board());
    dragTo("Planning");
    expect(save).not.toHaveBeenCalled();
  });
  it("does not expose dragging to read-only viewers", () => {
    render(board(false));
    expect(screen.queryByText("Drag to move")).not.toBeInTheDocument();
  });
});
