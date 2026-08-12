"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://portfolio2resumeapi.onrender.com/api";

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15);
}

export default function Home() {
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    const url = portfolioUrl.trim();

    if (!url) {
      setError("Please enter your portfolio URL.");
      return;
    }

    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL, for example https://example.com");
      return;
    }

    setLoading(true);
    setMessage("Analyzing your portfolio...");

    try {
      const storedUserId =
        window.localStorage.getItem("portfolio2resume_user_id");

      let userId = storedUserId;

      if (!userId) {
        const userResponse = await fetch(`${API_BASE}/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: `guest-${generateId()}@portfolio2resume.local`,
            full_name: "Guest User",
          }),
        });

        const userData = await userResponse.json();

        if (!userResponse.ok) {
          throw new Error(
            userData.error || "Could not create a user session."
          );
        }

        userId = userData.user.id;

        window.localStorage.setItem(
          "portfolio2resume_user_id",
          userId as string
        );
      }

      let data;
      const response = await fetch(`${API_BASE}/portfolios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          portfolio_url: url,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json.error || "Portfolio analysis failed."
        );
      }
      data = json;

      window.sessionStorage.setItem(
        "portfolio2resume_analysis",
        JSON.stringify(data)
      );

      if (data.portfolio?.id) {
        window.sessionStorage.setItem(
          "portfolio2resume_portfolio_id",
          data.portfolio.id
        );
      }

      setMessage("Portfolio analyzed successfully!");

      router.push(`/editor/new`);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setMessage("");
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while analyzing the portfolio."
      );
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        Build your first job-ready resume from the work you&apos;ve already done.
      </h1>
      <p className="text-slate-600">
        Paste your portfolio URL and let the platform analyze your projects, skills, education and experience to create structured resume content.
      </p>
      <form onSubmit={handleAnalyze} className="flex w-full flex-col gap-4">
        <div className="flex w-full max-w-md mx-auto gap-2">
          <input
            type="url"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            placeholder="https://your-portfolio.com"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
            disabled={loading}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
        {message && (
          <p className="text-sm font-medium text-emerald-600">
            {message}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}
      </form>
    </main>
  );
}
