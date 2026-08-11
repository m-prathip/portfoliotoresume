export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        Build your first job-ready resume from the work you&apos;ve already done.
      </h1>
      <p className="text-slate-600">
        Phase 1 scaffold — portfolio crawler, AI structuring, and the editor
        UI land in later phases. This page is just the entrypoint shell.
      </p>
      <div className="flex w-full max-w-md gap-2">
        <input
          type="url"
          placeholder="https://your-portfolio.com"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          disabled
        />
        <button
          type="button"
          disabled
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white opacity-50"
        >
          Analyze
        </button>
      </div>
    </main>
  );
}
