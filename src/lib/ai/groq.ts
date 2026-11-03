import Groq from "groq-sdk";
import type {
  Indicator,
  RiskVerdict,
  ScamExplanation,
} from "@/lib/analysis/types";
import { scamExplanationSchema } from "@/lib/analysis/validation";
import type { UrlScanResult } from "@/lib/browser/types";

const SYSTEM_PROMPT =
  "You are ScamPilot AI, a cybersecurity triage assistant. Explain the scam/phishing risk using ONLY the provided evidence. Never invent facts. If evidence is missing, say it is unknown. Keep explanations simple for non-technical users. Output valid JSON.";

const PLACEHOLDER_API_KEY = "gsk_YOUR_API_KEY_HERE";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const SUPPORTED_FALLBACK_MODEL = "openai/gpt-oss-120b";

let groqClient: Groq | null = null;

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (apiKey === undefined || apiKey.length === 0 || apiKey === PLACEHOLDER_API_KEY) {
    return null;
  }

  if (groqClient === null) {
    groqClient = new Groq({ apiKey });
  }

  return groqClient;
}

function verdictFromScore(score: number): RiskVerdict {
  if (score >= 60) {
    return "HIGH";
  }

  if (score >= 30) {
    return "MEDIUM";
  }

  return "LOW";
}

function buildFallbackExplanation(
  score: number,
  reasons: readonly string[],
): ScamExplanation {
  const verdict = verdictFromScore(score);
  const why =
    reasons.length > 0
      ? [...reasons]
      : ["No strong deterministic scam signals were detected in this message."];

  return {
    summary:
      reasons.length > 0
        ? `Automated triage scored this message ${score}/100 (${verdict.toLowerCase()} risk). ${reasons[0]}`
        : `Automated triage scored this message ${score}/100 (${verdict.toLowerCase()} risk). Always verify unexpected requests through an official channel.`,
    why,
    safeActions: [
      "Do not click any links or download attachments from this message.",
      "Never share OTP codes, passwords, PINs, or account numbers.",
      "Verify the sender through an official channel you find yourself.",
      "Report the message to your bank or platform if it impersonates a brand.",
    ],
    replyDraft:
      "Thank you for the message. I will verify this request through the official channel before taking any action. Please do not ask me for passwords, PINs, or OTP codes.",
    reportDraft: `Suspected phishing message reported. Automated risk score: ${score}/100 (${verdict}). Signals: ${
      reasons.length > 0
        ? reasons.join("; ")
        : "no strong deterministic signals detected"
    }. Please review the original message headers and links.`,
  };
}

function sanitizeIndicatorsForPrompt(
  indicators: readonly Indicator[],
): Indicator[] {
  return indicators.map((indicator) => {
    if (indicator.type === "email") {
      return { ...indicator, value: "[REDACTED_EMAIL]" };
    }

    if (indicator.type === "phone") {
      return { ...indicator, value: "[REDACTED_PHONE]" };
    }

    return indicator;
  });
}

function buildBrowserEvidence(urlScanResult: UrlScanResult | null): string[] {
  if (urlScanResult === null) {
    return ["Browser investigation: not available."];
  }

  return [
    "Browser investigation evidence:",
    `- Status: ${urlScanResult.status}`,
    `- Domain: ${urlScanResult.domain ?? "unknown"}`,
    `- Page title: ${urlScanResult.pageTitle ?? "unknown"}`,
    `- Password field detected: ${urlScanResult.hasPasswordField ? "yes" : "no"}`,
    `- Forms detected: ${urlScanResult.formsCount}`,
    ...(urlScanResult.error !== null
      ? [`- Scan note: ${urlScanResult.error}`]
      : []),
    "If a password field was detected, explicitly mention it in the why array.",
  ];
}

function buildUserPrompt(
  redactedText: string,
  indicators: readonly Indicator[],
  score: number,
  reasons: readonly string[],
  urlScanResult: UrlScanResult | null,
): string {
  return [
    "Explain the risk in the message below using only the supplied evidence.",
    'Return valid JSON with exactly these keys: {"summary":"string","why":["string"],"safeActions":["string"],"replyDraft":"string","reportDraft":"string"}.',
    `Deterministic risk score: ${score}/100`,
    `Deterministic reasons: ${JSON.stringify(reasons)}`,
    `Extracted indicators: ${JSON.stringify(sanitizeIndicatorsForPrompt(indicators))}`,
    ...buildBrowserEvidence(urlScanResult),
    `Redacted message: ${JSON.stringify(redactedText)}`,
    "Do not calculate a new score. The score above is final.",
  ].join("\n");
}

function parseJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const withoutFences = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    const parsed: unknown = JSON.parse(withoutFences);
    return parsed;
  } catch {
    const start = withoutFences.indexOf("{");
    const end = withoutFences.lastIndexOf("}");

    if (start === -1 || end <= start) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(
        withoutFences.slice(start, end + 1),
      );
      return parsed;
    } catch {
      return null;
    }
  }
}

async function requestCompletion(
  client: Groq,
  model: string,
  prompt: string,
): Promise<string | null> {
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    max_tokens: 1200,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  });

  return completion.choices[0]?.message?.content ?? null;
}

function isModelUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /decommissioned|model_not_found|does not exist|not supported/i.test(
    error.message,
  );
}

export async function generateExplanation(
  redactedText: string,
  indicators: readonly Indicator[],
  score: number,
  reasons: readonly string[],
  urlScanResult: UrlScanResult | null = null,
): Promise<ScamExplanation> {
  const fallback = buildFallbackExplanation(score, reasons);
  const client = getGroqClient();

  if (client === null) {
    return fallback;
  }

  const prompt = buildUserPrompt(
    redactedText,
    indicators,
    score,
    reasons,
    urlScanResult,
  );
  const configuredModel = process.env.LLM_MODEL?.trim() || DEFAULT_MODEL;
  let content: string | null = null;

  try {
    try {
      content = await requestCompletion(client, configuredModel, prompt);
    } catch (error) {
      if (
        configuredModel === SUPPORTED_FALLBACK_MODEL ||
        !isModelUnavailable(error)
      ) {
        throw error;
      }

      console.error(
        `[ScamPilot] Model "${configuredModel}" is unavailable. Retrying with "${SUPPORTED_FALLBACK_MODEL}".`,
      );
      content = await requestCompletion(
        client,
        SUPPORTED_FALLBACK_MODEL,
        prompt,
      );
    }
  } catch (error) {
    console.error(
      "[ScamPilot] Groq request failed. Using deterministic fallback.",
      error instanceof Error ? error.message : "Unknown Groq error",
    );
    return fallback;
  }

  if (content === null || content.length === 0) {
    return fallback;
  }

  const parsed = parseJsonObject(content);
  const validation = scamExplanationSchema.safeParse(parsed);

  if (!validation.success) {
    console.error(
      "[ScamPilot] Groq response failed validation.",
      validation.error.issues,
    );
    return fallback;
  }

  return validation.data;
}
