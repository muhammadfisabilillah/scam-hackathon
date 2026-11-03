export type UrlScanStatus = "SUCCESS" | "ERROR";

export interface UrlScanResult {
  originalUrl: string;
  finalUrl: string | null;
  domain: string | null;
  pageTitle: string | null;
  screenshotPath: string | null;
  hasPasswordField: boolean;
  formsCount: number;
  status: UrlScanStatus;
  error: string | null;
}

export interface ScanUrlOptions {
  analysisId?: string;
  baseUrl?: string;
}
