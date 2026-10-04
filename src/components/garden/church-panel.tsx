"use client";
import { useEffect, useRef, type ReactNode } from "react";

/** Native modal handles focus containment, Escape and restoring focus to the tree. */
export function ChurchPanel({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      opener?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="garden-drawer"
      aria-labelledby="garden-panel-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="garden-drawer-content">
        <header className="garden-drawer-header">
          <p className="garden-eyebrow">WALK ALONGSIDE</p>
          <button
            type="button"
            className="garden-drawer-close-btn"
            onClick={close}
            aria-label="Close church details"
          >
            ×
          </button>
        </header>
        <h2 id="garden-panel-title" className="garden-drawer-title">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
