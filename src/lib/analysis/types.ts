import type { UrlScanResult } from "@/lib/browser/types";

export type IndicatorType =
  | "url"
  | "email"
  | "phone"
  | "urgency"
  | "sensitive_request";

export interface Indicator {
  type: IndicatorType;
  value: string;
  confidence: number;
}

export type RiskVerdict = "LOW" | "MEDIUM" | "HIGH";

export interface RiskAssessment {
  score: number;
  verdict: RiskVerdict;
  reasons: string[];
}

export interface ScamExplanation {
  summary: string;
  why: string[];
  safeActions: string[];
  replyDraft: string;
  reportDraft: string;
}

export interface EvidenceItem {
  type: string;
  title: string;
  detail: string;
  source: string | null;
  weight: number;
}

export interface DraftItem {
  type: string;
  content: string;
}

export type UrlScanItem = UrlScanResult;

export interface AnalyzeResult {
  id: string;
  inputText: string;
  redactedText: string | null;
  riskScore: number;
  verdict: RiskVerdict;
  summary: string;
  createdAt: string;
  indicators: Indicator[];
  evidence: EvidenceItem[];
  drafts: DraftItem[];
  explanation: ScamExplanation;
  urlScans: UrlScanItem[];
}

export interface ApiErrorBody {
  error: string;
}
