import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HistoryItem {
  id: string;
  inputText: string;
  riskScore: number;
  verdict: string;
  createdAt: string;
}

function truncateInput(text: string, maxLength = 160): string {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

export async function GET(): Promise<NextResponse> {
  try {
    const analyses = await prisma.analysis.findMany({
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

    const history: HistoryItem[] = analyses.map((analysis) => ({
      id: analysis.id,
      inputText: truncateInput(analysis.inputText),
      riskScore: analysis.riskScore,
      verdict: analysis.verdict,
      createdAt: analysis.createdAt.toISOString(),
    }));

    return NextResponse.json(history);
  } catch (error) {
    console.error(
      "[ScamPilot] Failed to load history.",
      error instanceof Error ? error.message : "Unknown history error",
    );

    return NextResponse.json(
      { error: "Unable to load investigation history." },
      { status: 500 },
    );
  }
}
