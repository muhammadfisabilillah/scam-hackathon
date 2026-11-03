import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  History,
  Shield,
  ShieldAlert,
} from "lucide-react";
import type { RiskVerdict } from "@/lib/analysis/types";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Investigation History - ScamPilot AI",
  description: "Review the last 20 scam investigations stored by ScamPilot AI.",
};

interface HistoryRow {
  id: string;
  inputText: string;
  riskScore: number;
  verdict: string;
  createdAt: Date;
}

interface VerdictStyle {
  label: string;
  badge: string;
  bar: string;
  icon: ReactNode;
}

const VERDICT_STYLES: Record<RiskVerdict, VerdictStyle> = {
  HIGH: {
    label: "High risk",
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    bar: "bg-rose-400",
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
  },
  MEDIUM: {
    label: "Medium risk",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    bar: "bg-amber-400",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  LOW: {
    label: "Low risk",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    bar: "bg-emerald-400",
    icon: <Shield className="h-3.5 w-3.5" />,
  },
};

function toVerdict(value: string): RiskVerdict {
  return value === "HIGH" || value === "MEDIUM" || value === "LOW"
    ? value
    : "LOW";
}

function formatDate(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function loadHistory(): Promise<{
  rows: HistoryRow[];
  error: string | null;
}> {
  try {
    const rows = await prisma.analysis.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        inputText: true,
        riskScore: true,
        verdict: true,
        createdAt: true,
      },
    });

    return { rows, error: null };
  } catch (error) {
    console.error(
      "[ScamPilot] History page query failed.",
      error instanceof Error ? error.message : "Unknown history error",
    );

    return {
      rows: [],
      error:
        "The local investigation database is unavailable. Check the server logs and try again.",
    };
  }
}

export default async function HistoryPage() {
  const { rows, error } = await loadHistory();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid opacity-40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl"
      />

      <header className="sticky top-0 z-20 border-b border-white/5 bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10">
              <ShieldAlert className="h-5 w-5 text-emerald-300" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight text-white">
                ScamPilot AI
              </p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                Investigation history
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:border-emerald-400/30 hover:text-emerald-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to analyzer
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-20 pt-12 sm:px-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                <History className="h-5 w-5 text-cyan-300" />
              </span>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Past investigations
              </h1>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
              The newest 20 analyses are stored locally in SQLite. Open the
              analyzer to investigate a new message.
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">
            {rows.length} {rows.length === 1 ? "case" : "cases"}
          </span>
        </section>

        <section className="mt-8">
          {error !== null ? (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
              <div>
                <h2 className="text-sm font-semibold text-rose-200">
                  History could not be loaded
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-rose-200/70">
                  {error}
                </p>
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
              <History className="h-8 w-8 text-slate-600" />
              <h2 className="mt-4 text-base font-semibold text-slate-200">
                No investigations yet
              </h2>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Run your first analysis and it will appear here automatically.
              </p>
              <Link
                href="/"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950"
              >
                <History className="h-4 w-4" />
                Open the analyzer
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Date / message
                      </th>
                      <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Verdict
                      </th>
                      <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Risk score
                      </th>
                      <th className="px-5 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rows.map((row) => {
                      const verdict = toVerdict(row.verdict);
                      const style = VERDICT_STYLES[verdict];
                      const score = Math.min(Math.max(row.riskScore, 0), 100);

                      return (
                        <tr
                          key={row.id}
                          className="transition hover:bg-white/[0.02]"
                        >
                          <td className="max-w-[30rem] px-5 py-4">
                            <p className="text-xs text-slate-500">
                              {formatDate(row.createdAt)}
                            </p>
                            <p
                              className="mt-1 truncate text-sm text-slate-300"
                              title={row.inputText}
                            >
                              {row.inputText}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${style.badge}`}
                            >
                              {style.icon}
                              {style.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="w-8 text-sm font-semibold tabular-nums text-slate-200">
                                {score}
                              </span>
                              <span className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                                <span
                                  className={`block h-full rounded-full ${style.bar}`}
                                  style={{ width: `${score}%` }}
                                />
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Link
                              href="/"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-emerald-400/30 hover:text-emerald-300"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-slate-600">
          History is stored locally on this machine. No messages leave your
          device except for the Groq explanation request.
        </p>
      </main>
    </div>
  );
}
