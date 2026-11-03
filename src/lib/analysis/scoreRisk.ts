import type {
  Indicator,
  RiskAssessment,
  RiskVerdict,
} from "@/lib/analysis/types";
import type { UrlScanResult } from "@/lib/browser/types";

const TRUSTED_DOMAINS: readonly string[] = [
  "google.com",
  "youtube.com",
  "facebook.com",
  "instagram.com",
  "whatsapp.com",
  "linkedin.com",
  "microsoft.com",
  "apple.com",
  "amazon.com",
  "github.com",
  "paypal.com",
  "x.com",
  "twitter.com",
  "tiktok.com",
  "dropbox.com",
  "usps.com",
  "fedex.com",
  "dhl.com",
  "ups.com",
  "bca.co.id",
  "bankmandiri.co.id",
  "bni.co.id",
  "bri.co.id",
  "cimbniaga.co.id",
  "permata.co.id",
  "danamon.co.id",
  "btn.co.id",
  "shopee.co.id",
  "tokopedia.com",
  "bukalapak.com",
  "lazada.co.id",
  "gojek.com",
  "grab.com",
  "dana.id",
  "ovo.id",
  "linkaja.id",
  "jenius.com",
  "kredivo.com",
  "blibli.com",
  "tiket.com",
  "traveloka.com",
];

function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function isSuspiciousDomain(url: string): boolean {
  const hostname = getHostname(url);

  if (hostname === null) {
    return false;
  }

  return !TRUSTED_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );
}

function summarizeValues(indicators: readonly Indicator[]): string {
  return indicators
    .slice(0, 3)
    .map((indicator) => indicator.value)
    .join(", ");
}

export function calculateRiskScore(
  indicators: readonly Indicator[],
  urlScanResult: UrlScanResult | null = null,
): RiskAssessment {
  const reasons: string[] = [];
  let score = 0;

  const urgencyIndicators = indicators.filter(
    (indicator) => indicator.type === "urgency",
  );
  if (urgencyIndicators.length > 0) {
    score += 15;
    reasons.push(
      `Uses urgency or threat language to pressure the reader (${summarizeValues(urgencyIndicators)}).`,
    );
  }

  const sensitiveIndicators = indicators.filter(
    (indicator) => indicator.type === "sensitive_request",
  );
  if (sensitiveIndicators.length > 0) {
    score += 25;
    reasons.push(
      `Requests sensitive credentials or a money transfer (${summarizeValues(sensitiveIndicators)}).`,
    );
  }

  const urlIndicators = indicators.filter(
    (indicator) => indicator.type === "url",
  );
  if (urlIndicators.length > 0) {
    score += 10;
    reasons.push(
      `Contains ${urlIndicators.length} link(s) that could redirect to an untrusted destination.`,
    );
  }

  const suspiciousUrl = urlIndicators.find((indicator) =>
    isSuspiciousDomain(indicator.value),
  );
  if (suspiciousUrl !== undefined) {
    score += 15;
    const hostname = getHostname(suspiciousUrl.value);

    reasons.push(
      `Link uses an untrusted domain${hostname !== null ? ` (${hostname})` : ""} that is not a known brand.`,
    );
  }

  if (urlScanResult !== null && urlScanResult.hasPasswordField) {
    score += 25;
    reasons.push(
      "The remote browser agent detected a password field on the linked page, which strongly suggests credential harvesting.",
    );
  }

  if (
    urlScanResult !== null &&
    urlScanResult.formsCount > 0 &&
    isSuspiciousDomain(
      urlScanResult.finalUrl ?? urlScanResult.originalUrl,
    )
  ) {
    score += 10;
    reasons.push(
      `The remote browser agent found ${urlScanResult.formsCount} form(s) on the untrusted page.`,
    );
  }

  const cappedScore = Math.min(score, 100);
  const verdict: RiskVerdict =
    cappedScore >= 60 ? "HIGH" : cappedScore >= 30 ? "MEDIUM" : "LOW";

  return {
    score: cappedScore,
    verdict,
    reasons,
  };
}
