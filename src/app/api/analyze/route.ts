import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { extractIndicators } from "@/lib/analysis/extractIndicators";
import { redactPII } from "@/lib/analysis/redactPII";
import { calculateRiskScore } from "@/lib/analysis/scoreRisk";
import type {
  AnalyzeResult,
  DraftItem,
  EvidenceItem,
} from "@/lib/analysis/types";
import { generateExplanation } from "@/lib/ai/groq";
import { scanUrl } from "@/lib/browser/safeScan";
import type { UrlScanResult } from "@/lib/browser/types";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const requestSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Message text is required.")
    .max(20000, "Message is too long (maximum 20,000 characters)."),
});

function getMaxUrlScans(): number {
  const parsed = Number.parseInt(process.env.MAX_URL_SCANS ?? "1", 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 1;
  }

  return Math.min(parsed, 5);
}

function buildEvidence(
  reasons: readonly string[],
  urlScanResult: UrlScanResult | null,
): EvidenceItem[] {
  const evidence: EvidenceItem[] =
    reasons.length === 0
      ? [
          {
            type: "baseline",
            title: "No strong risk signals",
            detail:
              "The deterministic scoring engine found no strong scam indicators in this message.",
            source: "scoring-engine",
            weight: 0,
          },
        ]
      : reasons.map((reason, index) => ({
          type: "risk_signal",
          title:
            index === 0 ? "Primary risk signal" : `Risk signal ${index + 1}`,
          detail: reason,
          source: "scoring-engine",
          weight: 1,
        }));

  if (urlScanResult !== null) {
    const detail =
      urlScanResult.status === "SUCCESS"
        ? `Scanned ${urlScanResult.domain ?? "the target page"}${
            urlScanResult.pageTitle !== null
              ? ` ("${urlScanResult.pageTitle}")`
              : ""
          }. Found ${urlScanResult.formsCount} form(s)${
            urlScanResult.hasPasswordField ? " and a password field" : ""
          }.`
        : `The browser scan could not complete: ${
            urlScanResult.error ?? "unknown browser error"
          }. Text-only scoring was used.`;

    evidence.push({
      type: "browser_scan",
      title:
        urlScanResult.hasPasswordField
          ? "Password field detected"
          : urlScanResult.status === "SUCCESS"
            ? "Browser scan completed"
            : "Browser scan unavailable",
      detail,
      source: "playwright",
      weight: urlScanResult.hasPasswordField
        ? 25
        : urlScanResult.formsCount > 0
          ? 10
          : 0,
    });
  }

  return evidence;
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsedBody = requestSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error:
          parsedBody.error.issues[0]?.message ??
          "Invalid analysis request payload.",
      },
      { status: 400 },
    );
  }

  const { text } = parsedBody.data;

  try {
    const analysisId = randomUUID();
    const demoMode = process.env.DEMO_MODE === "true";
    const maxUrlScans = getMaxUrlScans();
    const baseUrl = new URL(request.url).origin;

    const redactedText = redactPII(text);
    const indicators = extractIndicators(text);
    const urlIndicators = indicators.filter(
      (indicator) => indicator.type === "url",
    );
    const scanTarget =
      maxUrlScans > 0 ? urlIndicators[0]?.value : undefined;

    let urlScanResult: UrlScanResult | null = null;

    if (scanTarget !== undefined) {
      try {
        urlScanResult = await scanUrl(scanTarget, demoMode, {
          analysisId,
          baseUrl,
        });
      } catch (error) {
        urlScanResult = {
          originalUrl: scanTarget,
          finalUrl: null,
          domain: null,
          pageTitle: null,
          screenshotPath: null,
          hasPasswordField: false,
          formsCount: 0,
          status: "ERROR",
          error:
            error instanceof Error
              ? `Browser scan crashed: ${error.message}`
              : "Browser scan crashed.",
        };
      }
    }

    const assessment = calculateRiskScore(indicators, urlScanResult);
    const explanation = await generateExplanation(
      redactedText,
      indicators,
      assessment.score,
      assessment.reasons,
      urlScanResult,
    );

    const evidence = buildEvidence(assessment.reasons, urlScanResult);
    const drafts: DraftItem[] = [
      { type: "reply", content: explanation.replyDraft },
      { type: "report", content: explanation.reportDraft },
    ];

    const created = await prisma.$transaction(async (transaction) => {
      const analysis = await transaction.analysis.create({
        data: {
          id: analysisId,
          inputText: text,
          redactedText,
          riskScore: assessment.score,
          verdict: assessment.verdict,
          summary: explanation.summary,
        },
      });

      if (indicators.length > 0) {
        await transaction.indicator.createMany({
          data: indicators.map((indicator) => ({
            analysisId: analysis.id,
            type: indicator.type,
            value: indicator.value,
            confidence: indicator.confidence,
          })),
        });
      }

      await transaction.evidence.createMany({
        data: evidence.map((item) => ({
          analysisId: analysis.id,
          type: item.type,
          title: item.title,
          detail: item.detail,
          source: item.source,
          weight: item.weight,
        })),
      });

      if (urlScanResult !== null) {
        await transaction.urlScan.create({
          data: {
            analysisId: analysis.id,
            originalUrl: urlScanResult.originalUrl,
            finalUrl: urlScanResult.finalUrl,
            domain: urlScanResult.domain,
            pageTitle: urlScanResult.pageTitle,
            screenshotPath: urlScanResult.screenshotPath,
            hasPasswordField: urlScanResult.hasPasswordField,
            formsCount: urlScanResult.formsCount,
            status: urlScanResult.status,
            error: urlScanResult.error,
          },
        });
      }

      await transaction.draft.createMany({
        data: drafts.map((draft) => ({
          analysisId: analysis.id,
          type: draft.type,
          content: draft.content,
        })),
      });

      return analysis;
    });

    const result: AnalyzeResult = {
      id: created.id,
      inputText: created.inputText,
      redactedText: created.redactedText,
      riskScore: created.riskScore,
      verdict: assessment.verdict,
      summary: explanation.summary,
      createdAt: created.createdAt.toISOString(),
      indicators,
      evidence,
      drafts,
      explanation,
      urlScans: urlScanResult !== null ? [urlScanResult] : [],
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(
      "[ScamPilot] Analysis failed.",
      error instanceof Error ? error.message : "Unknown analysis error",
    );

    return NextResponse.json(
      {
        error:
          "Analysis failed. Please try again. If the problem persists, check the server logs.",
      },
      { status: 500 },
    );
  }
}
