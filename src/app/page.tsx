"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  History,
  Lock,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";
import { AnalysisResultPanel } from "@/components/analysis/AnalysisResultPanel";
import type { AnalyzeResult } from "@/lib/analysis/types";
import {
  analyzeResultSchema,
  apiErrorSchema,
} from "@/lib/analysis/validation";
import {
  samples,
  type SampleMessage,
  type SampleRisk,
} from "@/lib/fixtures/samples";

type ToastTone = "success" | "info";

interface ToastState {
  message: string;
  tone: ToastTone;
}

interface RiskStyle {
  badge: string;
  dot: string;
  label: string;
}

const RISK_STYLES: Record<SampleRisk, RiskStyle> = {
  HIGH: {
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    dot: "bg-rose-400",
    label: "High risk",
  },
  MEDIUM: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400",
    label: "Medium risk",
  },
  LOW: {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    dot: "bg-emerald-400",
    label: "Low risk",
  },
};

const STATS: ReadonlyArray<{ label: string; value: string }> = [
  { label: "Signals inspected", value: "12+" },
  { label: "Avg. triage time", value: "<30s" },
  { label: "Investigator control", value: "100%" },
];

export default function HomePage() {
  const [message, setMessage] = useState<string>("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toastTimer = useRef<number | null>(null);
  const copyTimer = useRef<number | null>(null);

  const showToast = useCallback((text: string, tone: ToastTone = "info") => {
    if (toastTimer.current !== null) {
      window.clearTimeout(toastTimer.current);
    }

    setToast({ message: text, tone });
    toastTimer.current = window.setTimeout(() => setToast(null), 4200);
  }, []);

  const selectSample = useCallback(
    (sample: SampleMessage) => {
      setMessage(sample.text);
      setResult(null);
      setError(null);
      showToast(`Loaded "${sample.title}". Review it, then analyze.`, "info");
    },
    [showToast],
  );

  const handleCopy = useCallback(
    async (sample: SampleMessage) => {
      try {
        await navigator.clipboard.writeText(sample.text);
        setCopiedId(sample.id);

        if (copyTimer.current !== null) {
          window.clearTimeout(copyTimer.current);
        }
        copyTimer.current = window.setTimeout(() => setCopiedId(null), 1600);

        showToast(`Copied "${sample.title}" to your clipboard.`, "success");
      } catch {
        showToast("Clipboard access was blocked by your browser.", "info");
      }
    },
    [showToast],
  );

  const handleAnalyze = useCallback(async () => {
    const trimmed = message.trim();

    if (trimmed.length === 0) {
      showToast("Paste a message or load a sample first.", "info");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      let payload: unknown;

      try {
        payload = await response.json();
      } catch {
        throw new Error(`Analysis failed (HTTP ${response.status}).`);
      }

      if (!response.ok) {
        const parsedError = apiErrorSchema.safeParse(payload);

        throw new Error(
          parsedError.success
            ? parsedError.data.error
            : `Analysis failed (HTTP ${response.status}).`,
        );
      }

      const parsedResult = analyzeResultSchema.safeParse(payload);

      if (!parsedResult.success) {
        throw new Error(
          "The analysis response was not in the expected format.",
        );
      }

      setResult(parsedResult.data);
      showToast("Investigation complete. Review the findings below.", "success");
    } catch (caught) {
      const messageText =
        caught instanceof Error
          ? caught.message
          : "Analysis failed. Please try again.";

      setError(messageText);
      showToast(messageText, "info");
    } finally {
      setIsAnalyzing(false);
    }
  }, [message, showToast]);

  useEffect(() => {
    if (result !== null) {
      document
        .getElementById("analysis-result")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  useEffect(() => {
    return () => {
      if (toastTimer.current !== null) {
        window.clearTimeout(toastTimer.current);
      }
      if (copyTimer.current !== null) {
        window.clearTimeout(copyTimer.current);
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid opacity-60"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl animate-pulse-glow"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-12rem] top-1/3 h-[30rem] w-[30rem] rounded-full bg-cyan-500/10 blur-3xl"
      />

      <header className="sticky top-0 z-20 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 shadow-glow">
              <ShieldAlert className="h-5 w-5 text-emerald-300" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight text-white">
                ScamPilot AI
              </p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                Remote Control Investigation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 sm:inline-flex">
              <Lock className="h-3.5 w-3.5 text-emerald-300" />
              Human-in-the-loop
            </span>
            <Link
              href="/history"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:border-emerald-400/30 hover:text-emerald-300"
            >
              <History className="h-3.5 w-3.5" />
              History
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-24 pt-14 sm:px-6 sm:pt-20">
        <section className="mx-auto max-w-3xl text-center animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 text-xs font-medium text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered scam triage, built for humans in control
          </span>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Paste the message.
            <span className="mt-2 block text-gradient">
              Let AI investigate.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            ScamPilot AI reads the clues, scores the risk, and explains the
            evidence, while you keep remote control of every decision.
          </p>

          <dl className="mx-auto mt-9 grid max-w-xl grid-cols-3 gap-3">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-3.5 backdrop-blur"
              >
                <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  {stat.label}
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-100">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12 grid gap-6 lg:mt-16 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-1.5 shadow-2xl shadow-black/50">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-emerald-400/20 via-transparent to-cyan-400/10 opacity-60"
            />
            <div className="relative rounded-[1.35rem] bg-ink-900/95 p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                    <ShieldAlert className="h-4 w-4 text-emerald-300" />
                    Investigate a message
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Paste an email, SMS, DM, or chat excerpt.
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium tabular-nums text-slate-400">
                  {message.length.toLocaleString()} chars
                </span>
              </div>

              <label htmlFor="scam-message" className="sr-only">
                Message to investigate
              </label>
              <textarea
                id="scam-message"
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setResult(null);
                  setError(null);
                }}
                placeholder="Paste the suspicious message here. Example: 'Your account is locked, verify within 24 hours at...'"
                spellCheck={false}
                className="scrollbar-thin mt-5 h-56 w-full resize-none rounded-2xl border border-white/10 bg-ink-950/80 p-4 text-sm leading-relaxed text-slate-200 placeholder:text-slate-600 focus:border-emerald-400/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 sm:h-64 sm:text-[15px]"
              />

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <Lock className="h-3.5 w-3.5 text-slate-600" />
                  Nothing is analyzed until you press the button.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void handleAnalyze();
                  }}
                  disabled={isAnalyzing}
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-300 hover:to-cyan-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:ring-offset-2 focus:ring-offset-ink-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAnalyzing ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
                      AI Agent is investigating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Analyze Message
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Try a sample
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Realistic cases across three risk levels, including browser
                  demo targets.
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-400">
                {samples.length} cases
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {samples.map((sample) => {
                const risk = RISK_STYLES[sample.expectedRisk];

                return (
                  <div
                    key={sample.id}
                    className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-ink-900/60 p-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-ink-800/80"
                  >
                    <button
                      type="button"
                      onClick={() => selectSample(sample)}
                      className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
                    >
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${risk.badge}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${risk.dot}`}
                        />
                        {risk.label}
                      </span>
                      <p className="mt-3 text-sm font-medium text-slate-100 group-hover:text-white">
                        {sample.title}
                      </p>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {sample.text}
                      </p>
                    </button>

                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                      <span className="text-[11px] text-slate-600">
                        Click to load
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          void handleCopy(sample);
                        }}
                        aria-label={`Copy ${sample.title}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:border-emerald-400/30 hover:text-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
                      >
                        {copiedId === sample.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-300" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {error !== null ? (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
            <div>
              <p className="text-sm font-medium text-rose-200">
                Analysis failed
              </p>
              <p className="mt-1 text-xs leading-relaxed text-rose-200/70">
                {error}
              </p>
            </div>
          </div>
        ) : null}

        {result !== null ? (
          <AnalysisResultPanel
            result={result}
            onReset={() => {
              setResult(null);
              setError(null);
              setMessage("");
              document.getElementById("scam-message")?.focus();
            }}
          />
        ) : null}

        <footer className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-slate-600 sm:flex-row">
          <p className="flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-emerald-400/70" />
            Deterministic scoring, AI explanations, and read-only browser
            investigation are live.
          </p>
          <p>Built for the Remote Control AI hackathon.</p>
        </footer>
      </main>

      {toast !== null ? (
        <div
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2.5rem)] max-w-md -translate-x-1/2 animate-fade-in sm:left-auto sm:right-6 sm:translate-x-0"
        >
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-ink-800/95 px-4 py-3.5 shadow-2xl shadow-black/60 backdrop-blur-xl">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                toast.tone === "success"
                  ? "bg-emerald-400/15 text-emerald-300"
                  : "bg-cyan-400/15 text-cyan-300"
              }`}
            >
              {toast.tone === "success" ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <ShieldAlert className="h-3.5 w-3.5" />
              )}
            </span>
            <p className="flex-1 text-sm leading-relaxed text-slate-200">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Dismiss notification"
              className="rounded-md px-1 text-lg leading-none text-slate-500 transition hover:text-slate-200"
            >
              &times;
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
