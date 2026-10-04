"use client";
import { Button } from "@/components/ui/Button";
import "@/components/garden/garden.css";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="catalyst-garden-app garden-main">
      <section className="garden-surface garden-load-error" role="alert">
        <h1>Your garden couldn’t load.</h1>
        <p>Please try again in a moment.</p>
        <Button variant="primary" onClick={reset} fullWidth={false}>
          Try again
        </Button>
      </section>
    </main>
  );
}
