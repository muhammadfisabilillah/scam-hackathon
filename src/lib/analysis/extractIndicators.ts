import type { Indicator } from "@/lib/analysis/types";

const URL_PATTERN = /https?:\/\/[^\s<>"'`)\]]+/gi;
const LOCAL_DEMO_PATTERN = /(?:^|[\s(])(\/demo\/[a-z0-9][a-z0-9\-/]*)/gi;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /(?:\+62|62|0)[\s.-]?8[1-9](?:[\s.-]?\d){6,11}\b/g;
const TIMER_PATTERN =
  /\b(?:within|in|dalam)\s+\d{1,3}\s*(?:minutes?|hours?|menit|jam)\b/gi;

const URGENCY_KEYWORDS: readonly string[] = [
  "segera",
  "diblokir",
  "10 menit",
  "24 jam",
  "verifikasi",
  "verify",
  "hadiah",
  "urgent",
  "immediately",
  "blocked",
  "suspended",
  "locked",
  "within 24 hours",
  "act now",
  "final warning",
  "final notice",
  "last chance",
  "limited time",
  "terbatas",
  "akun terkunci",
  "rekening diblokir",
  "mendesak",
  "peringatan",
  "expires",
  "deadline",
  "closes",
  "on hold",
  "returned to sender",
  "lottery",
  "winner",
  "won",
  "prize",
  "congratulations",
];

const SENSITIVE_REQUEST_KEYWORDS: readonly string[] = [
  "otp",
  "password",
  "pin",
  "transfer",
  "kata sandi",
  "kode verifikasi",
  "kode otp",
  "cvv",
  "nomor kartu",
  "card number",
  "kartu kredit",
  "credit card",
  "username",
  "minta kode",
  "kirim kode",
  "one-time password",
  "2fa code",
  "access code",
  "pay now",
  "payment required",
  "processing fee",
];

const CONFIDENCE = {
  url: 0.95,
  email: 0.9,
  phone: 0.9,
  urgency: 0.7,
  sensitiveRequest: 0.9,
} as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findKeywords(
  text: string,
  keywords: readonly string[],
): string[] {
  const normalized = text.toLowerCase();

  return keywords.filter((keyword) =>
    new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i").test(normalized),
  );
}

function stripTrailingPunctuation(value: string): string {
  return value.replace(/[.,;:!?]+$/g, "");
}

export function extractIndicators(text: string): Indicator[] {
  const indicators: Indicator[] = [];
  const seen = new Set<string>();

  const addIndicator = (indicator: Indicator): void => {
    const key = `${indicator.type}::${indicator.value.toLowerCase()}`;

    if (indicator.value.length === 0 || seen.has(key)) {
      return;
    }

    seen.add(key);
    indicators.push(indicator);
  };

  for (const match of text.matchAll(URL_PATTERN)) {
    const value = stripTrailingPunctuation(match[0]);

    addIndicator({
      type: "url",
      value,
      confidence: CONFIDENCE.url,
    });
  }

  for (const match of text.matchAll(LOCAL_DEMO_PATTERN)) {
    const value = match[1];

    if (value !== undefined) {
      addIndicator({
        type: "url",
        value,
        confidence: CONFIDENCE.url,
      });
    }
  }

  const withoutLinks = text.replace(URL_PATTERN, " ");

  for (const match of withoutLinks.matchAll(EMAIL_PATTERN)) {
    addIndicator({
      type: "email",
      value: match[0].toLowerCase(),
      confidence: CONFIDENCE.email,
    });
  }

  for (const match of withoutLinks.matchAll(PHONE_PATTERN)) {
    addIndicator({
      type: "phone",
      value: match[0].trim(),
      confidence: CONFIDENCE.phone,
    });
  }

  for (const keyword of findKeywords(text, URGENCY_KEYWORDS)) {
    addIndicator({
      type: "urgency",
      value: keyword,
      confidence: CONFIDENCE.urgency,
    });
  }

  for (const match of text.matchAll(TIMER_PATTERN)) {
    addIndicator({
      type: "urgency",
      value: match[0].toLowerCase(),
      confidence: 0.85,
    });
  }

  for (const keyword of findKeywords(text, SENSITIVE_REQUEST_KEYWORDS)) {
    addIndicator({
      type: "sensitive_request",
      value: keyword,
      confidence: CONFIDENCE.sensitiveRequest,
    });
  }

  return indicators;
}
