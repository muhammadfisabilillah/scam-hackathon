import { z } from "zod";

export const indicatorTypeSchema = z.enum([
  "url",
  "email",
  "phone",
  "urgency",
  "sensitive_request",
]);

export const indicatorSchema = z.object({
  type: indicatorTypeSchema,
  value: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const riskVerdictSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const scamExplanationSchema = z.object({
  summary: z.string().min(1),
  why: z.array(z.string().min(1)).min(1).max(10),
  safeActions: z.array(z.string().min(1)).min(1).max(10),
  replyDraft: z.string().min(1),
  reportDraft: z.string().min(1),
});

export const evidenceSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  detail: z.string().min(1),
  source: z.string().nullable(),
  weight: z.number().min(0),
});

export const draftSchema = z.object({
  type: z.string().min(1),
  content: z.string().min(1),
});

export const urlScanSchema = z.object({
  originalUrl: z.string().min(1),
  finalUrl: z.string().nullable(),
  domain: z.string().nullable(),
  pageTitle: z.string().nullable(),
  screenshotPath: z.string().nullable(),
  hasPasswordField: z.boolean(),
  formsCount: z.number().int().min(0),
  status: z.enum(["SUCCESS", "ERROR"]),
  error: z.string().nullable(),
});

export const analyzeResultSchema = z.object({
  id: z.string().min(1),
  inputText: z.string(),
  redactedText: z.string().nullable(),
  riskScore: z.number().int().min(0).max(100),
  verdict: riskVerdictSchema,
  summary: z.string().min(1),
  createdAt: z.string().min(1),
  indicators: z.array(indicatorSchema),
  evidence: z.array(evidenceSchema),
  drafts: z.array(draftSchema),
  explanation: scamExplanationSchema,
  urlScans: z.array(urlScanSchema),
});

export const apiErrorSchema = z.object({
  error: z.string().min(1),
});
