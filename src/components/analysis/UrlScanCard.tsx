import type { ReactNode } from "react";
import {
  CheckCircle2,
  Globe,
  ImageOff,
  Lock,
  ShieldAlert,
} from "lucide-react";
import type { UrlScanItem } from "@/lib/analysis/types";

interface UrlScanCardProps {
  scan: UrlScanItem;
}

interface DetailRowProps {
  label: string;
  children: ReactNode;
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="border-b border-white/5 py-2.5 last:border-b-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-xs leading-relaxed text-slate-300">
        {children}
      </dd>
    </div>
  );
}

export function UrlScanCard({ scan }: UrlScanCardProps) {
  const isSuccess = scan.status === "SUCCESS";
  const screenshotAlt = `Screenshot of ${
    scan.pageTitle ?? scan.domain ?? "the scanned page"
  }`;

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-ink-900/50">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10">
            <Globe className="h-4 w-4 text-cyan-300" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Remote browser investigation
            </h3>
            <p className="text-[11px] text-slate-500">
              Read-only Playwright scan. No forms filled, no buttons clicked.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {scan.hasPasswordField ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-300">
              <Lock className="h-3 w-3" />
              Password field detected
            </span>
          ) : null}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
              isSuccess
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-300"
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <ShieldAlert className="h-3 w-3" />
            )}
            {isSuccess ? "Scan complete" : "Scan failed"}
          </span>
        </div>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="min-w-0">
          {scan.screenshotPath !== null ? (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-ink-950">
              <img
                src={scan.screenshotPath}
                alt={screenshotAlt}
                loading="lazy"
                className="aspect-[16/10] w-full object-cover object-top"
              />
            </div>
          ) : (
            <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-ink-950/60 px-6 text-center">
              <ImageOff className="h-6 w-6 text-slate-600" />
              <p className="text-xs text-slate-500">
                No screenshot was captured for this scan.
              </p>
            </div>
          )}
        </div>

        <div className="min-w-0">
          <dl>
            <DetailRow label="Domain">
              {scan.domain ?? "Unknown"}
            </DetailRow>
            <DetailRow label="Page title">
              {scan.pageTitle ?? "Not available"}
            </DetailRow>
            <DetailRow label="Forms on page">
              {scan.formsCount}
            </DetailRow>
            <DetailRow label="Final URL">
              <span className="break-all text-slate-400">
                {scan.finalUrl ?? scan.originalUrl}
              </span>
            </DetailRow>
          </dl>

          {scan.error !== null ? (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
              <p className="text-[11px] leading-relaxed text-amber-200/80">
                {scan.error}
              </p>
            </div>
          ) : null}

          {isSuccess ? (
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-600">
              <CheckCircle2 className="h-3 w-3 text-emerald-400/70" />
              Browser findings were included in the deterministic score.
            </p>
          ) : (
            <p className="mt-3 text-[11px] text-slate-600">
              Deterministic scoring fell back to text-only evidence.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
