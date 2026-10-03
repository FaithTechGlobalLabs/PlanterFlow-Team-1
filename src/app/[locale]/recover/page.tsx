import { Link } from "@/i18n/routing";

export default function RecoverPage() {
  return (
    <main className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center min-h-screen">
      <h1 className="text-2xl font-bold">Password Recovery</h1>
      <p className="text-[var(--color-muted)]">Coming soon.</p>
      <Link href="/login" className="text-[var(--color-blue)] underline">
        Back to login
      </Link>
    </main>
  );
}
