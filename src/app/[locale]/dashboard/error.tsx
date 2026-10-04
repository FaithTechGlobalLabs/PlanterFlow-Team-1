"use client";
import { Link } from "@/i18n/routing";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="m-auto max-w-lg rounded-xl border bg-white p-10">
      <h1 className="text-2xl">Your workspace couldn’t load.</h1>
      <p className="my-5">Please try again, or return to your church home.</p>
      <button
        onClick={reset}
        className="rounded-lg bg-[var(--color-green)] px-5 py-3 text-white"
      >
        Try again
      </button>
      <Link href="/" className="block mt-6 underline">
        Back to home
      </Link>
    </main>
  );
}
