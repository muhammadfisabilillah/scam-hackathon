"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  FileText,
  MessageSquare,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import type { AnalyzeResult, RiskVerdict } from "@/lib/analysis/types";
import { UrlScanCard } from "@/components/analysis/UrlScanCard";

interface AnalysisResultPanelProps {
  result: AnalyzeResult;
  onReset: () => void;
}

interface VerdictStyle {
  label: string;
  badge: string;
  ringColor: string;
  icon: ReactNode;
}

const VERDICT_STYLES: Record<RiskVerdict, VerdictStyle> = {
  HIGH: {
    label: "High risk",
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    ringColor: "#fb7185",
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  MEDIUM: {
    label: "Medium risk",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    ringColor: "#fbbf24",
    icon: <TriangleAlert className="h-4 w-4" />,
  },
  LOW: {
    label: "Low risk",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    ringColor: "#34d399",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
};

interface DraftCardProps {
  title: string;
  content: string;
  icon: ReactNode;
}

function DraftCard({ title, content, icon }: DraftCardProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const copyTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current !== null) {
        window.clearTimeout(copyTimer.current);
      }
    };
  }, []);

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);

      if (copyTimer.current !== null) {
        window.clearTimeout(copyTimer.current);
      }

      copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-ink-950/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-sm font-medium text-slate-200">
          {icon}
          {title}
        </h4>
        <button
          type="button"
          onClick={() => {
            void handleCopy();
          }}
          aria-label={`Copy ${title}`}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 ${
            copied
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
              : "border-white/10 bg-white/5 text-slate-400 hover:border-emerald-400/30 hover:text-emerald-300"
          }`}
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-300" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-slate-400">
        {content}
      </p>
    </div>
  );
}

export function AnalysisResultPanel({
  result,
  onReset,
}: AnalysisResultPanelProps) {
  const verdictStyle = VERDICT_STYLES[result.verdict];
  const ringStyle: CSSProperties = {
    background: `conic-gradient(${verdictStyle.ringColor} ${
      result.riskScore * 3.6
    }deg, rgba(255,255,255,0.08) 0deg)`,
  };
  const createdAt = new Date(result.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const firstScan = result.urlScans[0];

  return (
    <section
      id="analysis-result"
      aria-live="polite"
      className="mt-8 scroll-mt-24 animate-fade-in rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/30 sm:p-7"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div
          className="relative h-28 w-28 shrink-0 rounded-full p-1.5"
          style={ringStyle}
        >
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-ink-900">
            <span className="text-3xl font-semibold tracking-tight text-white">
              {result.riskScore}
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              / 100
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${verdictStyle.badge}`}
            >
              {verdictStyle.icon}
              {verdictStyle.label}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-400">
              Deterministic score
            </span>
            <span className="text-[11px] text-slate-600">{createdAt}</span>
          </div>

          <h2 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Investigation complete
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            {result.summary}
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-ink-900/50 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <TriangleAlert className="h-4 w-4 text-amber-300" />
            Why this score
          </h3>
          <ul className="mt-4 space-y-3">
            {result.explanation.why.map((reason, index) => (
              <li
                key={`${reason}-${index}`}
                className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-400"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/80" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-100">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Safe actions
          </h3>
          <ul className="mt-4 space-y-3">
            {result.explanation.safeActions.map((action, index) => (
              <li
                key={`${action}-${index}`}
                className="flex items-start gap-2.5 text-xs leading-relaxed text-emerald-100/75"
              >
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {firstScan !== undefined ? <UrlScanCard scan={firstScan} /> : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <DraftCard
          title="Suggested reply"
          content={result.explanation.replyDraft}
          icon={<MessageSquare className="h-4 w-4 text-cyan-300" />}
        />
        <DraftCard
          title="Report draft"
          content={result.explanation.reportDraft}
          icon={<FileText className="h-4 w-4 text-cyan-300" />}
        />
      </div>

      {result.indicators.length > 0 ? (
        <div className="mt-6 border-t border-white/5 pt-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Extracted indicators
            </h3>
            <span className="text-[11px] text-slate-600">
              {result.indicators.length} found
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {result.indicators.map((indicator, index) => (
              <span
                key={`${indicator.type}-${indicator.value}-${index}`}
                className="inline-flex max-w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px]"
              >
                <span className="shrink-0 font-medium uppercase tracking-wide text-slate-500">
                  {indicator.type.replace(/_/g, " ")}
                </span>
                <span className="max-w-[16rem] truncate text-slate-300">
                  {indicator.value}
                </span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-5">
        <p className="text-xs text-slate-600">
          Saved to your local investigation history.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:border-emerald-400/30 hover:text-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Investigate another message
        </button>
      </div>
    </section>
  );
}
